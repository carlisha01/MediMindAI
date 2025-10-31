// Following javascript_database blueprint for DatabaseStorage implementation
import {
  users,
  documents,
  subjects,
  topics,
  extractedContent,
  visualSummaries,
  studySessions,
  progress,
  qaHistory,
  type User,
  type InsertUser,
  type Document,
  type InsertDocument,
  type Subject,
  type InsertSubject,
  type Topic,
  type InsertTopic,
  type ExtractedContent,
  type InsertExtractedContent,
  type VisualSummary,
  type InsertVisualSummary,
  type StudySession,
  type InsertStudySession,
  type Progress,
  type InsertProgress,
  type QaHistory,
  type InsertQaHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Document methods
  getDocuments(userId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocumentStatus(id: string, status: string): Promise<void>;
  updateDocumentSubject(id: string, subjectId: string): Promise<void>;

  // Subject methods
  getSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  // Topic methods
  getTopicsByDocument(documentId: string): Promise<Topic[]>;
  getTopicsBySubject(subjectId: string): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, updates: Partial<InsertTopic>): Promise<Topic>;

  // Extracted content methods
  getExtractedContent(documentId: string): Promise<ExtractedContent[]>;
  createExtractedContent(content: InsertExtractedContent): Promise<ExtractedContent>;

  // Visual summary methods
  getVisualSummaries(userId: string): Promise<VisualSummary[]>;
  getVisualSummariesBySubject(subjectId: string): Promise<VisualSummary[]>;
  createVisualSummary(summary: InsertVisualSummary): Promise<VisualSummary>;

  // Study session methods
  getStudySessions(userId: string): Promise<StudySession[]>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  endStudySession(id: string, durationMinutes: number): Promise<void>;

  // Progress methods
  getProgress(userId: string): Promise<Progress[]>;
  getProgressBySubject(userId: string, subjectId: string): Promise<Progress[]>;
  updateProgress(userId: string, topicId: string, completed: boolean): Promise<void>;

  // Q&A History methods
  getQaHistory(userId: string): Promise<QaHistory[]>;
  createQaHistory(qa: InsertQaHistory): Promise<QaHistory>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Document methods
  async getDocuments(userId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.uploadedAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc || undefined;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(doc).returning();
    return document;
  }

  async updateDocumentStatus(id: string, status: string): Promise<void> {
    await db.update(documents).set({ processingStatus: status }).where(eq(documents.id, id));
  }

  async updateDocumentSubject(id: string, subjectId: string): Promise<void> {
    await db.update(documents).set({ subjectId }).where(eq(documents.id, id));
  }

  // Subject methods
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  // Topic methods
  async getTopicsByDocument(documentId: string): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.documentId, documentId));
  }

  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.subjectId, subjectId));
  }

  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  }

  async updateTopic(id: string, updates: Partial<InsertTopic>): Promise<Topic> {
    const [updatedTopic] = await db.update(topics).set(updates).where(eq(topics.id, id)).returning();
    return updatedTopic;
  }

  // Extracted content methods
  async getExtractedContent(documentId: string): Promise<ExtractedContent[]> {
    return await db.select().from(extractedContent).where(eq(extractedContent.documentId, documentId));
  }

  async createExtractedContent(content: InsertExtractedContent): Promise<ExtractedContent> {
    const [newContent] = await db.insert(extractedContent).values(content).returning();
    return newContent;
  }

  // Visual summary methods
  async getVisualSummaries(userId: string): Promise<VisualSummary[]> {
    return await db.select().from(visualSummaries).where(eq(visualSummaries.userId, userId));
  }

  async getVisualSummariesBySubject(subjectId: string): Promise<VisualSummary[]> {
    return await db.select().from(visualSummaries).where(eq(visualSummaries.subjectId, subjectId));
  }

  async createVisualSummary(summary: InsertVisualSummary): Promise<VisualSummary> {
    const [newSummary] = await db.insert(visualSummaries).values(summary).returning();
    return newSummary;
  }

  // Study session methods
  async getStudySessions(userId: string): Promise<StudySession[]> {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId)).orderBy(desc(studySessions.startedAt));
  }

  async createStudySession(session: InsertStudySession): Promise<StudySession> {
    const [newSession] = await db.insert(studySessions).values(session).returning();
    return newSession;
  }

  async endStudySession(id: string, durationMinutes: number): Promise<void> {
    await db.update(studySessions).set({
      endedAt: new Date(),
      durationMinutes,
    }).where(eq(studySessions.id, id));
  }

  // Progress methods
  async getProgress(userId: string): Promise<Progress[]> {
    return await db.select().from(progress).where(eq(progress.userId, userId));
  }

  async getProgressBySubject(userId: string, subjectId: string): Promise<Progress[]> {
    return await db.select().from(progress).where(
      and(eq(progress.userId, userId), eq(progress.subjectId, subjectId))
    );
  }

  async updateProgress(userId: string, topicId: string, completed: boolean): Promise<void> {
    const [existing] = await db.select().from(progress).where(
      and(eq(progress.userId, userId), eq(progress.topicId, topicId))
    );

    if (existing) {
      await db.update(progress).set({
        completed,
        completedAt: completed ? new Date() : null,
        reviewCount: completed ? sql`${progress.reviewCount} + 1` : progress.reviewCount,
        lastReviewedAt: new Date(),
      }).where(eq(progress.id, existing.id));
    } else {
      const topic = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1);
      await db.insert(progress).values({
        userId,
        topicId,
        subjectId: topic[0]?.subjectId || null,
        completed,
        completedAt: completed ? new Date() : null,
        reviewCount: completed ? 1 : 0,
        lastReviewedAt: new Date(),
      });
    }
  }

  // Q&A History methods
  async getQaHistory(userId: string): Promise<QaHistory[]> {
    return await db.select().from(qaHistory).where(eq(qaHistory.userId, userId)).orderBy(desc(qaHistory.askedAt));
  }

  async createQaHistory(qa: InsertQaHistory): Promise<QaHistory> {
    const [newQa] = await db.insert(qaHistory).values(qa).returning();
    return newQa;
  }
}

export const storage = new DatabaseStorage();
