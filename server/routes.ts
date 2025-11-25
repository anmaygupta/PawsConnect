import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import rateLimit from "express-rate-limit";
import sanitizeHtml from "sanitize-html";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getUserId, csrfProtection } from "./auth";
import { upload } from "./middleware/upload";
import { EmailService } from "./services/emailService";
import { insertDogReportSchema, insertStorySchema, insertStoryCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware - Rate limiting
  const reportRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 report submissions per 15 minutes
    message: { message: "Too many report submissions. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 200, // Limit each IP to 200 requests per 15 minutes
    message: { message: "Too many requests from this IP. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general rate limiting to all routes
  app.use('/api', generalRateLimit);

  // Apply CSRF protection to all state-changing API routes
  app.use('/api', csrfProtection);

  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth routes are handled in server/auth.ts

  // Statistics route
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });


  // Dog report routes
  app.get('/api/reports/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const reports = await storage.getRecentReports(limit);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching recent reports:", error);
      res.status(500).json({ message: "Failed to fetch recent reports" });
    }
  });

  app.get('/api/reports/search/:zipCode', async (req, res) => {
    try {
      const { zipCode } = req.params;
      const { animalType } = req.query;
      const reports = await storage.getDogReportsByZipCode(zipCode, animalType as string);
      res.json(reports);
    } catch (error) {
      console.error("Error searching reports:", error);
      res.status(500).json({ message: "Failed to search reports" });
    }
  });

  app.get('/api/reports/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getDogReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const reports = await storage.getUserDogReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching user reports:", error);
      res.status(500).json({ message: "Failed to fetch user reports" });
    }
  });

  app.post('/api/reports', reportRateLimit, isAuthenticated, upload.array('images', 25), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Anti-bot security check - reject if honeypot field is filled
      if (req.body.website && req.body.website.trim() !== '') {
        console.warn(`Potential bot detected from IP ${req.ip}: honeypot field filled`);
        return res.status(400).json({ message: "Invalid form submission detected" });
      }

      // Validate total file size (max 200MB total to prevent resource exhaustion)
      if (req.files && Array.isArray(req.files)) {
        const totalFileSize = req.files.reduce((sum: number, file: Express.Multer.File) => sum + file.size, 0);
        const maxTotalSize = 200 * 1024 * 1024; // 200MB
        if (totalFileSize > maxTotalSize) {
          // Clean up uploaded files since we're rejecting the request
          const fs = await import('fs/promises');
          for (const file of req.files) {
            try {
              await fs.unlink(file.path);
            } catch (unlinkError) {
              console.error(`Failed to delete file ${file.path}:`, unlinkError);
            }
          }
          return res.status(400).json({ 
            message: `Total file size (${(totalFileSize / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed (200MB). Please reduce the number or size of images.` 
          });
        }
      }

      // Sanitize text inputs to prevent XSS
      const sanitizeOptions = {
        allowedTags: [], // No HTML tags allowed
        allowedAttributes: {},
        textFilter: function(text: string) {
          // Additional cleaning
          return text.trim();
        }
      };

      const sanitizedBody = {
        ...req.body,
        // Core text fields
        description: sanitizeHtml(req.body.description || '', sanitizeOptions),
        petName: req.body.petName ? sanitizeHtml(req.body.petName, sanitizeOptions) : req.body.petName,
        breed: sanitizeHtml(req.body.breed || '', sanitizeOptions),
        age: sanitizeHtml(req.body.age || '', sanitizeOptions),
        primaryColor: sanitizeHtml(req.body.primaryColor || '', sanitizeOptions),
        lastSeenLocation: sanitizeHtml(req.body.lastSeenLocation || '', sanitizeOptions),
        
        // Contact and location fields
        contactName: sanitizeHtml(req.body.contactName || '', sanitizeOptions),
        contactPhone: req.body.contactPhone ? sanitizeHtml(req.body.contactPhone, sanitizeOptions) : req.body.contactPhone,
        contactEmail: req.body.contactEmail ? sanitizeHtml(req.body.contactEmail, sanitizeOptions) : req.body.contactEmail,
        lastSeenTime: req.body.lastSeenTime ? sanitizeHtml(req.body.lastSeenTime, sanitizeOptions) : req.body.lastSeenTime,
        zipCode: req.body.zipCode ? sanitizeHtml(req.body.zipCode, sanitizeOptions) : req.body.zipCode,
      };

      // Validate request body (after sanitization)
      const reportData = insertDogReportSchema.parse({
        ...sanitizedBody,
        lastSeenDate: new Date(req.body.lastSeenDate),
        rewardAmount: req.body.rewardAmount ? parseFloat(req.body.rewardAmount) : null,
      });

      // Create the report
      const report = await storage.createDogReport(reportData, userId);

      // Handle image uploads
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await storage.addReportImage({
            reportId: report.id,
            imageUrl: `/uploads/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
          });
        }
      }

      // Send confirmation email
      try {
        await EmailService.sendReportConfirmation(report, user);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the request if email fails
      }

      // Check for potential matches if this is a found pet report
      if (report.type === 'found') {
        try {
          const lostPets = await storage.getDogReportsByZipCode(report.zipCode);
          const potentialMatches = lostPets.filter(lostPet => 
            lostPet.type === 'lost' && 
            lostPet.animalType === report.animalType && // Match same animal type
            lostPet.breed.toLowerCase().includes(report.breed.toLowerCase()) &&
            lostPet.status === 'active'
          );

          // Send notifications to owners of potentially matching lost pets
          for (const lostPet of potentialMatches) {
            try {
              const owner = await storage.getUser(lostPet.userId);
              if (owner) {
                await EmailService.sendFoundDogNotification(lostPet, report, owner, user);
              }
            } catch (notificationError) {
              console.error("Failed to send match notification:", notificationError);
            }
          }
        } catch (matchError) {
          console.error("Failed to check for matches:", matchError);
        }
      }

      // Get the complete report with images
      const completeReport = await storage.getDogReport(report.id);
      res.status(201).json(completeReport);
    } catch (error) {
      console.error("Error creating report:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create report" });
      }
    }
  });

  app.patch('/api/reports/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      // Validate status value
      const validStatuses = ['active', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status. Must be one of: active, resolved, closed" 
        });
      }

      // Verify the report belongs to the user
      const report = await storage.getDogReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      if (report.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this report" });
      }

      await storage.updateDogReportStatus(id, status);
      res.json({ message: "Report status updated successfully" });
    } catch (error) {
      console.error("Error updating report status:", error);
      res.status(500).json({ message: "Failed to update report status" });
    }
  });

  // Update a report
  app.put('/api/reports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      // Verify the report belongs to the user
      const report = await storage.getDogReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      if (report.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this report" });
      }

      // Sanitize text inputs
      const sanitizeOptions = {
        allowedTags: [],
        allowedAttributes: {},
        textFilter: function(text: string) {
          return text.trim();
        }
      };

      const updates: any = {};
      
      // Only include fields that were provided
      if (req.body.petName !== undefined) updates.petName = sanitizeHtml(req.body.petName || '', sanitizeOptions);
      if (req.body.breed !== undefined) updates.breed = sanitizeHtml(req.body.breed || '', sanitizeOptions);
      if (req.body.age !== undefined) updates.age = sanitizeHtml(req.body.age || '', sanitizeOptions);
      if (req.body.primaryColor !== undefined) updates.primaryColor = sanitizeHtml(req.body.primaryColor || '', sanitizeOptions);
      if (req.body.size !== undefined) updates.size = req.body.size;
      if (req.body.gender !== undefined) updates.gender = req.body.gender;
      if (req.body.description !== undefined) updates.description = sanitizeHtml(req.body.description || '', sanitizeOptions);
      if (req.body.lastSeenLocation !== undefined) updates.lastSeenLocation = sanitizeHtml(req.body.lastSeenLocation || '', sanitizeOptions);
      if (req.body.lastSeenDate !== undefined) updates.lastSeenDate = new Date(req.body.lastSeenDate);
      if (req.body.lastSeenTime !== undefined) updates.lastSeenTime = sanitizeHtml(req.body.lastSeenTime || '', sanitizeOptions);
      if (req.body.zipCode !== undefined) updates.zipCode = sanitizeHtml(req.body.zipCode || '', sanitizeOptions);
      if (req.body.contactName !== undefined) updates.contactName = sanitizeHtml(req.body.contactName || '', sanitizeOptions);
      if (req.body.contactPhone !== undefined) updates.contactPhone = sanitizeHtml(req.body.contactPhone || '', sanitizeOptions);
      if (req.body.contactEmail !== undefined) updates.contactEmail = sanitizeHtml(req.body.contactEmail || '', sanitizeOptions);
      if (req.body.rewardAmount !== undefined) updates.rewardAmount = req.body.rewardAmount ? parseFloat(req.body.rewardAmount) : null;

      // Validate size if provided
      if (updates.size && !['small', 'medium', 'large', 'extra-large'].includes(updates.size)) {
        return res.status(400).json({ message: "Invalid size value" });
      }

      // Validate gender if provided
      if (updates.gender && !['male', 'female', 'unknown'].includes(updates.gender)) {
        return res.status(400).json({ message: "Invalid gender value" });
      }

      // Validate rewardAmount if provided (must be a valid number or empty)
      if (updates.rewardAmount !== undefined && updates.rewardAmount !== null) {
        if (typeof updates.rewardAmount === 'number' && isNaN(updates.rewardAmount)) {
          return res.status(400).json({ message: "Invalid reward amount format" });
        }
      }

      // Validate all required fields won't be emptied
      const finalDescription = updates.description !== undefined ? updates.description : report.description;
      const finalPrimaryColor = updates.primaryColor !== undefined ? updates.primaryColor : report.primaryColor;
      const finalLastSeenLocation = updates.lastSeenLocation !== undefined ? updates.lastSeenLocation : report.lastSeenLocation;
      const finalZipCode = updates.zipCode !== undefined ? updates.zipCode : report.zipCode;
      const finalSize = updates.size !== undefined ? updates.size : report.size;

      if (!finalDescription || finalDescription.trim().length < 10) {
        return res.status(400).json({ message: "Description must be at least 10 characters" });
      }
      if (!finalPrimaryColor || finalPrimaryColor.trim() === '') {
        return res.status(400).json({ message: "Primary color is required" });
      }
      if (!finalLastSeenLocation || finalLastSeenLocation.trim() === '') {
        return res.status(400).json({ message: "Location is required" });
      }
      if (!finalZipCode || !/^\d{5}(-\d{4})?$/.test(finalZipCode)) {
        return res.status(400).json({ message: "Valid ZIP code is required" });
      }
      if (!finalSize) {
        return res.status(400).json({ message: "Size is required" });
      }

      // For lost reports, validate additional required fields
      if (report.type === 'lost') {
        const finalPetName = updates.petName !== undefined ? updates.petName : report.petName;
        const finalBreed = updates.breed !== undefined ? updates.breed : report.breed;
        const finalAge = updates.age !== undefined ? updates.age : report.age;
        
        if (!finalPetName || finalPetName.trim() === '' || finalPetName === 'Unknown') {
          return res.status(400).json({ message: "Pet name is required for lost pet reports" });
        }
        if (!finalBreed || finalBreed.trim() === '' || finalBreed === 'Unknown') {
          return res.status(400).json({ message: "Breed is required for lost pet reports" });
        }
        if (!finalAge || finalAge.trim() === '' || finalAge === 'Unknown') {
          return res.status(400).json({ message: "Age is required for lost pet reports" });
        }
      }

      // Email is always required
      const finalEmail = updates.contactEmail !== undefined ? updates.contactEmail : report.contactEmail;
      if (!finalEmail || finalEmail.trim() === '') {
        return res.status(400).json({ message: "Email address is required" });
      }

      const updatedReport = await storage.updateDogReport(id, updates);
      
      // Get the complete report with images
      const completeReport = await storage.getDogReport(id);
      res.json(completeReport);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Delete a report
  app.delete('/api/reports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      // Verify the report belongs to the user
      const report = await storage.getDogReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      if (report.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this report" });
      }

      await storage.deleteDogReport(id);
      res.json({ message: "Report deleted successfully" });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // Story routes
  app.get('/api/stories', async (req, res) => {
    try {
      const stories = await storage.getStories();
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.post('/api/stories', isAuthenticated, upload.array('images', 5), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Parse story data from multipart form
      const storyData = insertStorySchema.parse(JSON.parse(req.body.storyData || '{}'));
      
      // Create story
      const story = await storage.createStory(storyData, userId);
      
      // Handle image uploads (max 5 images)
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files.slice(0, 5)) { // Ensure max 5 images
          await storage.addStoryImage({
            storyId: story.id,
            imageUrl: `/uploads/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
          });
        }
      }
      
      // Get complete story with all relations
      const completeStory = await storage.getStory(story.id);
      
      res.status(201).json(completeStory);
    } catch (error) {
      console.error("Error creating story:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid story data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create story" });
      }
    }
  });

  app.post('/api/stories/:id/react', isAuthenticated, async (req: any, res) => {
    try {
      const storyId = req.params.id;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { reactionType } = req.body;
      if (reactionType !== 'like' && reactionType !== 'love') {
        return res.status(400).json({ message: "Invalid reaction type. Must be 'like' or 'love'" });
      }
      
      const result = await storage.toggleStoryReaction(storyId, userId, reactionType);
      res.json(result);
    } catch (error) {
      console.error("Error toggling story reaction:", error);
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  app.post('/api/stories/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const storyId = req.params.id;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const commentData = insertStoryCommentSchema.parse({
        ...req.body,
        storyId
      });
      
      const comment = await storage.addStoryComment(commentData, userId);
      
      // Get the comment with user data by fetching the complete story
      const completeStory = await storage.getStory(storyId);
      const commentWithUser = completeStory?.comments.find(c => c.id === comment.id);
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error("Error adding comment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add comment" });
      }
    }
  });

  // Update story (only by owner)
  app.put('/api/stories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const storyId = req.params.id;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      // Get the story and verify ownership
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      if (story.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this story" });
      }

      const { title, content, rating } = req.body;
      const updates: { title?: string; content?: string; rating?: number } = {};
      
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (rating !== undefined) updates.rating = rating;

      const updatedStory = await storage.updateStory(storyId, updates);
      if (!updatedStory) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Return the complete story with user data
      const completeStory = await storage.getStory(storyId);
      res.json(completeStory);
    } catch (error) {
      console.error("Error updating story:", error);
      res.status(500).json({ message: "Failed to update story" });
    }
  });

  // Delete story (only by owner)
  app.delete('/api/stories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const storyId = req.params.id;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      // Get the story and verify ownership
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      if (story.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this story" });
      }

      await storage.deleteStory(storyId);
      res.json({ message: "Story deleted successfully" });
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
