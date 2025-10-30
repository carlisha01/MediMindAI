import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping existing structure)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Documents table - uploaded files (PDF, Word, PowerPoint, CSV)
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(), // pdf, docx, pptx, csv
  fileSize: integer("file_size").notNull(), // in bytes
  filePath: text("file_path").notNull(), // storage path
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  subjectId: varchar("subject_id").references(() => subjects.id, { onDelete: "set null" }),
});

// Subjects table - medical specialties (Cardiology, Neurology, etc.)
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // icon name for UI
  color: text("color"), // hex color for UI
});

// Topics table - extracted key topics from documents
export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  topicType: text("topic_type").notNull(), // definition, clinical_case, concept, procedure
  extractedAt: timestamp("extracted_at").notNull().defaultNow(),
});

// Extracted content - images, tables, diagrams from documents
export const extractedContent = pgTable("extracted_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(), // image, table, diagram
  content: text("content").notNull(), // base64 for images, JSON for tables
  pageNumber: integer("page_number"),
  caption: text("caption"),
  extractedAt: timestamp("extracted_at").notNull().defaultNow(),
});

// Visual summaries - AI-generated flowcharts, concept maps, comparison tables
export const visualSummaries = pgTable("visual_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").references(() => subjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  summaryType: text("summary_type").notNull(), // flowchart, concept_map, comparison_table
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // structured data for rendering
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Study sessions - track when users study specific topics
export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topicId: varchar("topic_id").references(() => topics.id, { onDelete: "set null" }),
  subjectId: varchar("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
});

// Progress tracking - topic completion status
export const progress = pgTable("progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topicId: varchar("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  reviewCount: integer("review_count").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at"),
});

// Q&A history - conversations with AI study assistant
export const qaHistory = pgTable("qa_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  topicId: varchar("topic_id").references(() => topics.id, { onDelete: "set null" }),
  subjectId: varchar("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  language: text("language").notNull().default("ca"), // ca for Catalan, es for Spanish, etc.
  askedAt: timestamp("asked_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  studySessions: many(studySessions),
  progress: many(progress),
  qaHistory: many(qaHistory),
  visualSummaries: many(visualSummaries),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [documents.subjectId],
    references: [subjects.id],
  }),
  topics: many(topics),
  extractedContent: many(extractedContent),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  documents: many(documents),
  topics: many(topics),
  studySessions: many(studySessions),
  progress: many(progress),
  qaHistory: many(qaHistory),
  visualSummaries: many(visualSummaries),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  document: one(documents, {
    fields: [topics.documentId],
    references: [documents.id],
  }),
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
  progress: many(progress),
  qaHistory: many(qaHistory),
  studySessions: many(studySessions),
}));

export const extractedContentRelations = relations(extractedContent, ({ one }) => ({
  document: one(documents, {
    fields: [extractedContent.documentId],
    references: [documents.id],
  }),
}));

export const visualSummariesRelations = relations(visualSummaries, ({ one }) => ({
  subject: one(subjects, {
    fields: [visualSummaries.subjectId],
    references: [subjects.id],
  }),
  user: one(users, {
    fields: [visualSummaries.userId],
    references: [users.id],
  }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [studySessions.topicId],
    references: [topics.id],
  }),
  subject: one(subjects, {
    fields: [studySessions.subjectId],
    references: [subjects.id],
  }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [progress.topicId],
    references: [topics.id],
  }),
  subject: one(subjects, {
    fields: [progress.subjectId],
    references: [subjects.id],
  }),
}));

export const qaHistoryRelations = relations(qaHistory, ({ one }) => ({
  user: one(users, {
    fields: [qaHistory.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [qaHistory.topicId],
    references: [topics.id],
  }),
  subject: one(subjects, {
    fields: [qaHistory.subjectId],
    references: [subjects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadedAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, extractedAt: true });
export const insertExtractedContentSchema = createInsertSchema(extractedContent).omit({ id: true, extractedAt: true });
export const insertVisualSummarySchema = createInsertSchema(visualSummaries).omit({ id: true, createdAt: true });
export const insertStudySessionSchema = createInsertSchema(studySessions).omit({ id: true, startedAt: true });
export const insertProgressSchema = createInsertSchema(progress).omit({ id: true });
export const insertQaHistorySchema = createInsertSchema(qaHistory).omit({ id: true, askedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type ExtractedContent = typeof extractedContent.$inferSelect;
export type InsertExtractedContent = z.infer<typeof insertExtractedContentSchema>;

export type VisualSummary = typeof visualSummaries.$inferSelect;
export type InsertVisualSummary = z.infer<typeof insertVisualSummarySchema>;

export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;

export type Progress = typeof progress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;

export type QaHistory = typeof qaHistory.$inferSelect;
export type InsertQaHistory = z.infer<typeof insertQaHistorySchema>;
