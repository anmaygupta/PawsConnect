import {
  users,
  dogReports,
  dogReportImages,
  emailNotifications,
  stories,
  storyLikes,
  storyComments,
  type User,
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
  type StoryLike,
  type InsertStoryLike,
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
  getStories(): Promise<StoryWithDetails[]>;
  getStory(id: string): Promise<StoryWithDetails | undefined>;
  
  // Story like operations
  toggleStoryLike(storyId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
  
  // Story comment operations
  addStoryComment(comment: InsertStoryComment, userId: string): Promise<StoryComment>;
  getStoryComments(storyId: string): Promise<(StoryComment & { user: User })[]>;
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
    const [createdReport] = await db
      .insert(dogReports)
      .values({ ...report, userId })
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
    const [user] = await db
      .select()
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
        const [user] = await db
          .select()
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
        const [user] = await db
          .select()
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
        const [user] = await db
          .select()
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

  async getStories(): Promise<StoryWithDetails[]> {
    const storiesData = await db
      .select()
      .from(stories)
      .orderBy(desc(stories.createdAt));

    const storiesWithDetails = await Promise.all(
      storiesData.map(async (story) => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, story.userId));

        const comments = await this.getStoryComments(story.id);

        return {
          ...story,
          user: user!,
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

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, story.userId));

    const comments = await this.getStoryComments(id);

    return {
      ...story,
      user: user!,
      comments,
    };
  }

  // Story like operations
  async toggleStoryLike(storyId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    // Check if user already liked this story
    const [existingLike] = await db
      .select()
      .from(storyLikes)
      .where(and(
        eq(storyLikes.storyId, storyId),
        eq(storyLikes.userId, userId)
      ));

    if (existingLike) {
      // Unlike the story
      await db
        .delete(storyLikes)
        .where(and(
          eq(storyLikes.storyId, storyId),
          eq(storyLikes.userId, userId)
        ));

      // Decrement likes count
      await db
        .update(stories)
        .set({ 
          likesCount: sql`${stories.likesCount} - 1`,
          updatedAt: new Date()
        })
        .where(eq(stories.id, storyId));

      // Get updated count
      const [story] = await db
        .select({ likesCount: stories.likesCount })
        .from(stories)
        .where(eq(stories.id, storyId));

      return { liked: false, likesCount: story?.likesCount || 0 };
    } else {
      // Like the story
      await db
        .insert(storyLikes)
        .values({ storyId, userId });

      // Increment likes count
      await db
        .update(stories)
        .set({ 
          likesCount: sql`${stories.likesCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(stories.id, storyId));

      // Get updated count
      const [story] = await db
        .select({ likesCount: stories.likesCount })
        .from(stories)
        .where(eq(stories.id, storyId));

      return { liked: true, likesCount: story?.likesCount || 0 };
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

  async getStoryComments(storyId: string): Promise<(StoryComment & { user: User })[]> {
    const commentsData = await db
      .select()
      .from(storyComments)
      .where(eq(storyComments.storyId, storyId))
      .orderBy(desc(storyComments.createdAt));

    const commentsWithUsers = await Promise.all(
      commentsData.map(async (comment) => {
        const [user] = await db
          .select()
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
