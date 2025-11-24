import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pet reports table (cats and dogs)
export const dogReports = pgTable("dog_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'lost' or 'found'
  
  // Animal information
  animalType: varchar("animal_type").notNull(), // 'dog' or 'cat'
  petName: varchar("pet_name"),
  breed: varchar("breed").notNull(),
  size: varchar("size").notNull(), // 'small', 'medium', 'large', 'extra-large'
  age: varchar("age").notNull(),
  primaryColor: varchar("primary_color").notNull(),
  gender: varchar("gender").notNull(), // 'male' or 'female'
  description: text("description").notNull(),
  
  // Location information
  lastSeenLocation: varchar("last_seen_location").notNull(),
  zipCode: varchar("zip_code").notNull(),
  lastSeenDate: timestamp("last_seen_date").notNull(),
  lastSeenTime: varchar("last_seen_time"),
  
  // Contact information
  contactName: varchar("contact_name").notNull(),
  contactPhone: varchar("contact_phone").notNull(),
  contactEmail: varchar("contact_email").notNull(),
  
  // Optional reward
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }),
  
  // Status
  status: varchar("status").notNull().default('active'), // 'active', 'resolved', 'closed'
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dog report images table
export const dogReportImages = pgTable("dog_report_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => dogReports.id, { onDelete: 'cascade' }),
  imageUrl: varchar("image_url").notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Email notifications table
export const emailNotifications = pgTable("email_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => dogReports.id),
  recipientEmail: varchar("recipient_email").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  sent: boolean("sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stories table
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull(), // 1-5 paws rating of the service
  likesCount: integer("likes_count").notNull().default(0),
  lovesCount: integer("loves_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Story images table
export const storyImages = pgTable("story_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: 'cascade' }),
  imageUrl: varchar("image_url").notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Story reactions table (likes and loves)
export const storyReactions = pgTable("story_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  reactionType: varchar("reaction_type").notNull(), // 'like' or 'love'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("story_reactions_user_story_unique").on(table.storyId, table.userId),
]);

// Story comments table
export const storyComments = pgTable("story_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema validation
// Enhanced validation schema with security measures
export const insertDogReportSchema = createInsertSchema(dogReports).omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Enhanced ZIP code validation
  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be in format 12345 or 12345-6789")
    .min(5, "ZIP code is required"),
  
  // Enhanced text field validation with security checks
  animalType: z.enum(['dog', 'cat'], { required_error: "Animal type is required" }),
  petName: z.string().max(100, "Pet name too long").optional(),
  breed: z.string().max(100, "Breed name too long").optional(),
  size: z.enum(['small', 'medium', 'large', 'extra-large'], { required_error: "Size is required" }),
  age: z.string().max(50, "Age description too long").optional(),
  primaryColor: z.string().min(1, "Primary color is required").max(50, "Color description too long"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description is too long (max 2000 characters)")
    .refine(val => !/<script|javascript:|data:|vbscript:/i.test(val), "Invalid characters detected"),
  lastSeenLocation: z.string()
    .min(1, "Location is required")
    .max(200, "Location description too long"),
  
  // Enhanced contact validation - all required
  contactName: z.string()
    .min(1, "Your name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "Name contains invalid characters"),
  contactPhone: z.string()
    .min(1, "Phone number is required")
    .regex(/^(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, "Please enter a valid US phone number"),
  contactEmail: z.string()
    .min(1, "Email address is required")
    .email("Valid email address is required")
    .max(254, "Email address too long"),
  
  // Date validation with coercion from string
  lastSeenDate: z.coerce.date({
    required_error: "Last seen date is required",
    invalid_type_error: "Please provide a valid date"
  }),
  
  // Reward amount validation with string coercion
  rewardAmount: z.union([
    z.string().regex(/^\d*\.?\d{0,2}$/, "Invalid reward amount format").transform(val => val === "" ? null : val),
    z.number().nonnegative("Reward amount must be positive"),
    z.null()
  ]).optional(),
  
  // Anti-bot honeypot field
  website: z.string().max(0, "Spam detected").optional(),
}).transform((data) => {
  // For found pets, ensure breed and age have "Unknown" if not provided
  if (data.type === 'found') {
    if (!data.breed || data.breed.trim() === '') {
      data.breed = 'Unknown';
    }
    if (!data.age || data.age.trim() === '') {
      data.age = 'Unknown';
    }
    if (!data.petName || data.petName.trim() === '') {
      data.petName = 'Unknown';
    }
  }
  return data;
}).superRefine((data, ctx) => {
  // For lost pets, enforce required fields that cannot be "Unknown"
  if (data.type === 'lost') {
    if (!data.petName || data.petName.trim() === '' || data.petName === 'Unknown') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pet name is required for lost pet reports",
        path: ['petName'],
      });
    }
    if (!data.breed || data.breed.trim() === '' || data.breed === 'Unknown') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Breed is required for lost pet reports",
        path: ['breed'],
      });
    }
    if (!data.age || data.age.trim() === '' || data.age === 'Unknown') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Age is required for lost pet reports",
        path: ['age'],
      });
    }
  }
});

export const insertDogReportImageSchema = createInsertSchema(dogReportImages).omit({
  id: true,
  uploadedAt: true,
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  sent: true,
  sentAt: true,
  createdAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  userId: true,
  likesCount: true,
  lovesCount: true,
  commentsCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
});

export const insertStoryReactionSchema = createInsertSchema(storyReactions).omit({
  id: true,
  createdAt: true,
}).extend({
  reactionType: z.enum(['like', 'love'], { required_error: "Reaction type is required" }),
});

export const insertStoryCommentSchema = createInsertSchema(storyComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// PublicUser type - excludes email for security (only display name shown publicly)
export type PublicUser = Omit<User, 'email'>;

export type InsertDogReport = z.infer<typeof insertDogReportSchema>;
export type DogReport = typeof dogReports.$inferSelect;
export type InsertDogReportImage = z.infer<typeof insertDogReportImageSchema>;
export type DogReportImage = typeof dogReportImages.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type StoryImage = typeof storyImages.$inferSelect;
export type InsertStoryImage = typeof storyImages.$inferInsert;
export type InsertStoryReaction = z.infer<typeof insertStoryReactionSchema>;
export type StoryReaction = typeof storyReactions.$inferSelect;
export type InsertStoryComment = z.infer<typeof insertStoryCommentSchema>;
export type StoryComment = typeof storyComments.$inferSelect;

// Extended types with relations
export type DogReportWithImages = DogReport & {
  images: DogReportImage[];
  user: PublicUser;
};

export type StoryWithDetails = Story & {
  user: PublicUser;
  images: StoryImage[];
  comments: (StoryComment & { user: PublicUser })[];
  userReaction?: 'like' | 'love' | null;
};
