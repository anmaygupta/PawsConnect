import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { upload } from "./middleware/upload";
import { EmailService } from "./services/emailService";
import { insertDogReportSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      const reports = await storage.getDogReportsByZipCode(zipCode);
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
      const userId = req.user.claims.sub;
      const reports = await storage.getUserDogReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching user reports:", error);
      res.status(500).json({ message: "Failed to fetch user reports" });
    }
  });

  app.post('/api/reports', isAuthenticated, upload.array('images', 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate request body
      const reportData = insertDogReportSchema.parse({
        ...req.body,
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

      // Check for potential matches if this is a found dog report
      if (report.type === 'found') {
        try {
          const lostDogs = await storage.getDogReportsByZipCode(report.zipCode);
          const potentialMatches = lostDogs.filter(lostDog => 
            lostDog.type === 'lost' && 
            lostDog.breed.toLowerCase().includes(report.breed.toLowerCase()) &&
            lostDog.status === 'active'
          );

          // Send notifications to owners of potentially matching lost dogs
          for (const lostDog of potentialMatches) {
            try {
              const owner = await storage.getUser(lostDog.userId);
              if (owner) {
                await EmailService.sendFoundDogNotification(lostDog, report, owner, user);
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
      const userId = req.user.claims.sub;

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

  const httpServer = createServer(app);
  return httpServer;
}
