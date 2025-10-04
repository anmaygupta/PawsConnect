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

// Dog reports table
export const dogReports = pgTable("dog_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'lost' or 'found'
  
  // Dog information
  dogName: varchar("dog_name"),
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

// Schema validation
export const insertDogReportSchema = createInsertSchema(dogReports).omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDogReport = z.infer<typeof insertDogReportSchema>;
export type DogReport = typeof dogReports.$inferSelect;
export type InsertDogReportImage = z.infer<typeof insertDogReportImageSchema>;
export type DogReportImage = typeof dogReportImages.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;

// Extended types with relations
export type DogReportWithImages = DogReport & {
  images: DogReportImage[];
  user: User;
};
