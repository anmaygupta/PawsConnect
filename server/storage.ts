import {
  users,
  dogReports,
  dogReportImages,
  emailNotifications,
  stories,
  storyImages,
  storyReactions,
  storyComments,
  type User,
  type PublicUser,
  type UpsertUser,
  type DogReport,
  type InsertDogReport,
  type DogReportImage,
  type InsertDogReportImage,
  type EmailNotification,
  type InsertEmailNotification,
  type DogReportWithImages,
  type Story,
  type InsertStory,
  type StoryImage,
  type InsertStoryImage,
  type StoryReaction,
  type InsertStoryReaction,
  type StoryComment,
  type InsertStoryComment,
  type StoryWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Dog report operations
  createDogReport(report: InsertDogReport, userId: string): Promise<DogReport>;
  getDogReport(id: string): Promise<DogReportWithImages | undefined>;
  getDogReportsByZipCode(zipCode: string, animalType?: string): Promise<DogReportWithImages[]>;
  getUserDogReports(userId: string): Promise<DogReportWithImages[]>;
  updateDogReportStatus(id: string, status: string): Promise<void>;
  updateDogReport(id: string, updates: Partial<InsertDogReport>): Promise<DogReport | undefined>;
  deleteDogReport(id: string): Promise<void>;
  getRecentReports(limit?: number): Promise<DogReportWithImages[]>;
  
  // Image operations
  addReportImage(image: InsertDogReportImage): Promise<DogReportImage>;
  getReportImages(reportId: string): Promise<DogReportImage[]>;
  
  // Email notification operations
  createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification>;
  markEmailAsSent(id: string): Promise<void>;
  
  // Statistics operations
  getStats(): Promise<{
    dogsReunited: number;
    activeUsers: number;
    citiesCovered: number;
  }>;

  // Story operations
  createStory(story: InsertStory, userId: string): Promise<Story>;
  getStories(limit?: number): Promise<StoryWithDetails[]>;
  getStory(id: string): Promise<StoryWithDetails | undefined>;
  updateStory(id: string, updates: { title?: string; content?: string; rating?: number }): Promise<Story | undefined>;
  deleteStory(id: string): Promise<void>;
  
  // Story image operations
  addStoryImage(image: InsertStoryImage): Promise<StoryImage>;
  getStoryImages(storyId: string): Promise<StoryImage[]>;
  
  // Story reaction operations
  toggleStoryReaction(storyId: string, userId: string, reactionType: 'like' | 'love'): Promise<{ 
    reacted: boolean; 
    reaction: 'like' | 'love' | null; 
    likesCount: number; 
    lovesCount: number; 
  }>;
  
  // Story comment operations
  addStoryComment(comment: InsertStoryComment, userId: string): Promise<StoryComment>;
  getStoryComments(storyId: string): Promise<(StoryComment & { user: PublicUser })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Dog report operations
  async createDogReport(report: InsertDogReport, userId: string): Promise<DogReport> {
    // Normalize rewardAmount: convert number to string, keep null/undefined as is
    // Database expects string | null for decimal column
    let normalizedRewardAmount: string | null | undefined;
    if (typeof report.rewardAmount === 'number') {
      normalizedRewardAmount = String(report.rewardAmount);
    } else {
      normalizedRewardAmount = report.rewardAmount;
    }
    
    // Merge validated input with userId for database insertion
    const reportData: typeof dogReports.$inferInsert = {
      ...report,
      userId,
      rewardAmount: normalizedRewardAmount,
    };
    
    const [createdReport] = await db
      .insert(dogReports)
      .values(reportData)
      .returning();
    return createdReport;
  }

  async getDogReport(id: string): Promise<DogReportWithImages | undefined> {
    const [report] = await db
      .select()
      .from(dogReports)
      .where(eq(dogReports.id, id));
    
    if (!report) return undefined;

    const images = await this.getReportImages(id);
    // Select only public user fields (exclude email for privacy)
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, report.userId));

    return {
      ...report,
      images,
      user: user!,
    };
  }

  async getDogReportsByZipCode(zipCode: string, animalType?: string): Promise<DogReportWithImages[]> {
    const conditions = [
      eq(dogReports.zipCode, zipCode),
      eq(dogReports.status, 'active')
    ];
    
    if (animalType) {
      conditions.push(eq(dogReports.animalType, animalType));
    }
    
    const reports = await db
      .select()
      .from(dogReports)
      .where(and(...conditions))
      .orderBy(desc(dogReports.createdAt));

    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const images = await this.getReportImages(report.id);
        // Select only public user fields (exclude email for privacy)
        const [user] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.id, report.userId));

        return {
          ...report,
          images,
          user: user!,
        };
      })
    );

    return reportsWithDetails;
  }

  async getUserDogReports(userId: string): Promise<DogReportWithImages[]> {
    const reports = await db
      .select()
      .from(dogReports)
      .where(eq(dogReports.userId, userId))
      .orderBy(desc(dogReports.createdAt));

    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const images = await this.getReportImages(report.id);
        // Select only public user fields (exclude email for privacy)
        const [user] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.id, report.userId));

        return {
          ...report,
          images,
          user: user!,
        };
      })
    );

    return reportsWithDetails;
  }

  async updateDogReportStatus(id: string, status: string): Promise<void> {
    await db
      .update(dogReports)
      .set({ status, updatedAt: new Date() })
      .where(eq(dogReports.id, id));
  }

  async updateDogReport(id: string, updates: Partial<InsertDogReport>): Promise<DogReport | undefined> {
    // Normalize rewardAmount if provided
    let normalizedUpdates = { ...updates };
    if (updates.rewardAmount !== undefined) {
      if (typeof updates.rewardAmount === 'number') {
        normalizedUpdates.rewardAmount = String(updates.rewardAmount);
      }
    }
    
    const [updatedReport] = await db
      .update(dogReports)
      .set({ ...normalizedUpdates, updatedAt: new Date() })
      .where(eq(dogReports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteDogReport(id: string): Promise<void> {
    // Delete associated images first (they have foreign key constraint)
    await db.delete(dogReportImages).where(eq(dogReportImages.reportId, id));
    // Delete the report
    await db.delete(dogReports).where(eq(dogReports.id, id));
  }

  async getRecentReports(limit: number = 6): Promise<DogReportWithImages[]> {
    const reports = await db
      .select()
      .from(dogReports)
      .where(eq(dogReports.status, 'active'))
      .orderBy(desc(dogReports.createdAt))
      .limit(limit);

    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const images = await this.getReportImages(report.id);
        // Select only public user fields (exclude email for privacy)
        const [user] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.id, report.userId));

        return {
          ...report,
          images,
          user: user!,
        };
      })
    );

    return reportsWithDetails;
  }

  // Image operations
  async addReportImage(image: InsertDogReportImage): Promise<DogReportImage> {
    const [createdImage] = await db
      .insert(dogReportImages)
      .values(image)
      .returning();
    return createdImage;
  }

  async getReportImages(reportId: string): Promise<DogReportImage[]> {
    return await db
      .select()
      .from(dogReportImages)
      .where(eq(dogReportImages.reportId, reportId));
  }

  // Email notification operations
  async createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification> {
    const [createdNotification] = await db
      .insert(emailNotifications)
      .values(notification)
      .returning();
    return createdNotification;
  }

  async markEmailAsSent(id: string): Promise<void> {
    await db
      .update(emailNotifications)
      .set({ sent: true, sentAt: new Date() })
      .where(eq(emailNotifications.id, id));
  }

  // Statistics operations
  async getStats(): Promise<{
    dogsReunited: number;
    activeUsers: number;
    citiesCovered: number;
  }> {
    // Count resolved reports (dogs reunited)
    const [resolvedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dogReports)
      .where(eq(dogReports.status, 'resolved'));

    // Count unique users who have created reports
    const [activeUsersCount] = await db
      .select({ count: sql<number>`count(distinct ${dogReports.userId})` })
      .from(dogReports);

    // Count unique ZIP codes (cities covered)
    const [citiesCoveredCount] = await db
      .select({ count: sql<number>`count(distinct ${dogReports.zipCode})` })
      .from(dogReports);

    return {
      dogsReunited: resolvedCount.count || 0,
      activeUsers: activeUsersCount.count || 0,
      citiesCovered: citiesCoveredCount.count || 0,
    };
  }

  // Story operations
  async createStory(story: InsertStory, userId: string): Promise<Story> {
    const [createdStory] = await db
      .insert(stories)
      .values({ ...story, userId })
      .returning();
    return createdStory;
  }

  async getStories(limit?: number): Promise<StoryWithDetails[]> {
    let query = db
      .select()
      .from(stories)
      .orderBy(desc(stories.createdAt));

    if (limit) {
      query = query.limit(limit) as any;
    }

    const storiesData = await query;

    const storiesWithDetails = await Promise.all(
      storiesData.map(async (story) => {
        // Select only public user fields (exclude email for privacy)
        const [user] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.id, story.userId));

        const images = await this.getStoryImages(story.id);
        const comments = await this.getStoryComments(story.id);

        return {
          ...story,
          user: user!,
          images,
          comments,
        };
      })
    );

    return storiesWithDetails;
  }

  async getStory(id: string): Promise<StoryWithDetails | undefined> {
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, id));
    
    if (!story) return undefined;

    // Select only public user fields (exclude email for privacy)
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, story.userId));

    const images = await this.getStoryImages(id);
    const comments = await this.getStoryComments(id);

    return {
      ...story,
      user: user!,
      images,
      comments,
    };
  }

  async updateStory(id: string, updates: { title?: string; content?: string; rating?: number }): Promise<Story | undefined> {
    const [updatedStory] = await db
      .update(stories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(stories.id, id))
      .returning();
    return updatedStory;
  }

  async deleteStory(id: string): Promise<void> {
    // Delete related data first (cascade should handle this, but being explicit)
    await db.delete(storyImages).where(eq(storyImages.storyId, id));
    await db.delete(storyReactions).where(eq(storyReactions.storyId, id));
    await db.delete(storyComments).where(eq(storyComments.storyId, id));
    // Delete the story
    await db.delete(stories).where(eq(stories.id, id));
  }

  // Story image operations
  async addStoryImage(image: InsertStoryImage): Promise<StoryImage> {
    const [createdImage] = await db
      .insert(storyImages)
      .values(image)
      .returning();
    return createdImage;
  }

  async getStoryImages(storyId: string): Promise<StoryImage[]> {
    return await db
      .select()
      .from(storyImages)
      .where(eq(storyImages.storyId, storyId));
  }

  // Story reaction operations
  async toggleStoryReaction(storyId: string, userId: string, reactionType: 'like' | 'love'): Promise<{ 
    reacted: boolean; 
    reaction: 'like' | 'love' | null; 
    likesCount: number; 
    lovesCount: number; 
  }> {
    // Check if user already reacted to this story
    const [existingReaction] = await db
      .select()
      .from(storyReactions)
      .where(and(
        eq(storyReactions.storyId, storyId),
        eq(storyReactions.userId, userId)
      ));

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        // Remove reaction if clicking the same type
        await db
          .delete(storyReactions)
          .where(and(
            eq(storyReactions.storyId, storyId),
            eq(storyReactions.userId, userId)
          ));

        // Decrement appropriate count
        if (reactionType === 'like') {
          await db
            .update(stories)
            .set({ 
              likesCount: sql`GREATEST(0, ${stories.likesCount} - 1)`,
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));
        } else {
          await db
            .update(stories)
            .set({ 
              lovesCount: sql`GREATEST(0, ${stories.lovesCount} - 1)`,
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));
        }

        // Get updated counts
        const [story] = await db
          .select({ likesCount: stories.likesCount, lovesCount: stories.lovesCount })
          .from(stories)
          .where(eq(stories.id, storyId));

        return { 
          reacted: false, 
          reaction: null,
          likesCount: story?.likesCount || 0,
          lovesCount: story?.lovesCount || 0
        };
      } else {
        // Change reaction type
        const oldType = existingReaction.reactionType as 'like' | 'love';

        // Update reaction type
        await db
          .update(storyReactions)
          .set({ reactionType })
          .where(and(
            eq(storyReactions.storyId, storyId),
            eq(storyReactions.userId, userId)
          ));

        // Update counts: decrement old, increment new
        if (oldType === 'like' && reactionType === 'love') {
          await db
            .update(stories)
            .set({
              likesCount: sql`GREATEST(0, ${stories.likesCount} - 1)`,
              lovesCount: sql`${stories.lovesCount} + 1`,
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));
        } else {
          await db
            .update(stories)
            .set({
              likesCount: sql`${stories.likesCount} + 1`,
              lovesCount: sql`GREATEST(0, ${stories.lovesCount} - 1)`,
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));
        }

        // Get updated counts
        const [story] = await db
          .select({ likesCount: stories.likesCount, lovesCount: stories.lovesCount })
          .from(stories)
          .where(eq(stories.id, storyId));

        return { 
          reacted: true, 
          reaction: reactionType,
          likesCount: story?.likesCount || 0,
          lovesCount: story?.lovesCount || 0
        };
      }
    } else {
      // Add new reaction
      await db
        .insert(storyReactions)
        .values({ storyId, userId, reactionType });

      // Increment appropriate count
      if (reactionType === 'like') {
        await db
          .update(stories)
          .set({ 
            likesCount: sql`${stories.likesCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(stories.id, storyId));
      } else {
        await db
          .update(stories)
          .set({ 
            lovesCount: sql`${stories.lovesCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(stories.id, storyId));
      }

      // Get updated counts
      const [story] = await db
        .select({ likesCount: stories.likesCount, lovesCount: stories.lovesCount })
        .from(stories)
        .where(eq(stories.id, storyId));

      return { 
        reacted: true, 
        reaction: reactionType,
        likesCount: story?.likesCount || 0,
        lovesCount: story?.lovesCount || 0
      };
    }
  }

  // Story comment operations
  async addStoryComment(comment: InsertStoryComment, userId: string): Promise<StoryComment> {
    const [createdComment] = await db
      .insert(storyComments)
      .values({ ...comment, userId })
      .returning();

    // Increment comments count
    await db
      .update(stories)
      .set({ 
        commentsCount: sql`${stories.commentsCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(stories.id, comment.storyId));

    return createdComment;
  }

  async getStoryComments(storyId: string): Promise<(StoryComment & { user: PublicUser })[]> {
    const commentsData = await db
      .select()
      .from(storyComments)
      .where(eq(storyComments.storyId, storyId))
      .orderBy(desc(storyComments.createdAt));

    const commentsWithUsers = await Promise.all(
      commentsData.map(async (comment) => {
        // Select only public user fields (exclude email for privacy)
        const [user] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.id, comment.userId));

        return {
          ...comment,
          user: user!,
        };
      })
    );

    return commentsWithUsers;
  }
}

export const storage = new DatabaseStorage();
