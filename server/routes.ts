import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./services/ai-service";
import { documentProcessor } from "./services/document-processor";
import { eq, sql, count } from "drizzle-orm";
import { db } from "./db";
import { documents, subjects, topics, progress, studySessions, qaHistory } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import AdmZip from "adm-zip";

// Mock user ID for demo purposes (in production, use proper authentication)
const DEMO_USER_ID = "demo-user-001";

// File upload configuration
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
const MAX_FILE_SIZE_MB = Math.round(MAX_FILE_SIZE / (1024 * 1024)); // Convert to MB for display

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (error) {
        console.error("Error creating upload directory:", error);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/zip",
      "application/x-zip-compressed",
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      // Return false to reject file (multer will not save it)
      // The upload route will handle the error response
      cb(null, false);
    }
  },
});

// Middleware to handle file upload errors
const handleUploadError = (req: any, res: any, next: any) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ 
          error: `El fitxer és massa gran. La mida màxima és de ${MAX_FILE_SIZE_MB} MB.`,
          errorCode: "FILE_TOO_LARGE",
          maxSize: `${MAX_FILE_SIZE_MB} MB`
        });
      }
      return res.status(400).json({ 
        error: "Error en pujar el fitxer. Si us plau, torna-ho a provar.",
        errorCode: "UPLOAD_ERROR"
      });
    }
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;

      // Get total documents
      const userDocs = await storage.getDocuments(userId);
      const totalDocuments = userDocs.length;

      // Get total topics from all documents
      let totalTopics = 0;
      for (const doc of userDocs) {
        const docTopics = await storage.getTopicsByDocument(doc.id);
        totalTopics += docTopics.length;
      }

      // Get study time
      const sessions = await storage.getStudySessions(userId);
      const studyTimeMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      // Calculate overall progress
      const userProgress = await storage.getProgress(userId);
      const completedTopics = userProgress.filter(p => p.completed).length;
      const overallProgress = totalTopics > 0
        ? Math.round((completedTopics / totalTopics) * 100)
        : 0;

      res.json({
        totalDocuments,
        totalTopics,
        studyTimeMinutes,
        overallProgress,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/subjects", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const allSubjects = await storage.getSubjects();
      const userDocs = await storage.getDocuments(userId);

      const subjectProgress = await Promise.all(
        allSubjects.map(async (subject) => {
          // Count documents for this subject
          const subjectDocs = userDocs.filter(d => d.subjectId === subject.id);
          const documentCount = subjectDocs.length;

          // Count topics for this subject
          const subjectTopics = await storage.getTopicsBySubject(subject.id);
          const topicCount = subjectTopics.length;

          // Get completed topics
          const subjectProgress = await storage.getProgressBySubject(userId, subject.id);
          const completedTopics = subjectProgress.filter(p => p.completed).length;

          // Calculate progress percentage
          const progress = topicCount > 0
            ? Math.round((completedTopics / topicCount) * 100)
            : 0;

          return {
            id: subject.id,
            name: subject.name,
            icon: subject.icon || "",
            color: subject.color || "#3b82f6",
            documentCount,
            topicCount,
            completedTopics,
            progress,
          };
        })
      );

      // Filter out subjects with no documents
      const activeSubjects = subjectProgress.filter(s => s.documentCount > 0 || s.topicCount > 0);

      res.json(activeSubjects);
    } catch (error) {
      console.error("Error fetching subject progress:", error);
      res.status(500).json({ error: "Failed to fetch subject progress" });
    }
  });

  app.get("/api/dashboard/activities", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const activities: any[] = [];

      // Get recent document uploads
      const recentDocs = await storage.getDocuments(userId);
      recentDocs.slice(0, 3).forEach(doc => {
        activities.push({
          id: `upload-${doc.id}`,
          type: "upload",
          description: `Document pujat: ${doc.filename}`,
          timestamp: doc.uploadedAt,
        });
      });

      // Get recent study sessions
      const recentSessions = await storage.getStudySessions(userId);
      recentSessions.slice(0, 2).forEach(session => {
        activities.push({
          id: `session-${session.id}`,
          type: "study_session",
          description: `Sessió d'estudi completada (${session.durationMinutes || 0} min)`,
          timestamp: session.startedAt,
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Documents endpoints
  app.get("/api/documents", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const docs = await storage.getDocuments(userId);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", handleUploadError, async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      
      if (!req.file) {
        return res.status(400).json({ 
          error: "Tipus d'arxiu no vàlid. Només s'accepten PDF, Word (.docx), CSV i ZIP.",
          errorCode: "INVALID_FILE_TYPE",
          allowedTypes: ["PDF", "Word (.docx)", "CSV", "ZIP"]
        });
      }

      const file = req.file;
      
      // Extract file extension and normalize it
      const getFileExtension = (filename: string, mimetype: string): string => {
        const ext = path.extname(filename).toLowerCase().slice(1);
        if (ext) return ext;
        
        // Fallback to MIME type mapping
        const mimeToExt: Record<string, string> = {
          "application/pdf": "pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
          "text/csv": "csv",
          "application/zip": "zip",
          "application/x-zip-compressed": "zip",
        };
        return mimeToExt[mimetype] || "unknown";
      };

      const fileExtension = getFileExtension(file.originalname, file.mimetype);

      // Handle ZIP files by extracting and processing each file
      if (fileExtension === "zip") {
        try {
          const zip = new AdmZip(file.path);
          const zipEntries = zip.getEntries();
          const processedFiles: any[] = [];
          
          // Helper to get proper MIME type from extension
          const getMimeTypeFromExtension = (ext: string): string => {
            const extToMime: Record<string, string> = {
              "pdf": "application/pdf",
              "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "csv": "text/csv",
            };
            return extToMime[ext] || "application/octet-stream";
          };

          for (const entry of zipEntries) {
            if (entry.isDirectory) continue;
            
            // Get file extension
            const entryExt = path.extname(entry.entryName).toLowerCase().slice(1);
            const allowedExtensions = ["pdf", "docx", "csv"];
            
            if (!allowedExtensions.includes(entryExt)) {
              console.log(`Skipping unsupported file in ZIP: ${entry.entryName}`);
              continue;
            }

            // Extract file to temp location
            const extractDir = path.join(process.cwd(), "uploads", "extracted");
            await fs.mkdir(extractDir, { recursive: true });
            
            const extractedPath = path.join(extractDir, `${Date.now()}-${path.basename(entry.entryName)}`);
            await fs.writeFile(extractedPath, entry.getData());

            // Get proper MIME type
            const mimeType = getMimeTypeFromExtension(entryExt);

            // Create document record for each file
            const document = await storage.createDocument({
              userId,
              filename: path.basename(entry.entryName),
              fileType: entryExt,
              fileSize: entry.header.size,
              filePath: extractedPath,
              processingStatus: "pending",
              subjectId: null,
            });

            // Process document asynchronously with correct MIME type
            processDocumentAsync(document.id, extractedPath, path.basename(entry.entryName), mimeType);
            
            processedFiles.push(document);
          }

          // Clean up ZIP file
          await fs.unlink(file.path);

          res.json({ 
            message: `ZIP file processed. Extracted ${processedFiles.length} documents.`,
            documents: processedFiles 
          });
        } catch (zipError) {
          console.error("Error processing ZIP file:", zipError);
          return res.status(500).json({ error: "Failed to process ZIP file" });
        }
      } else {
        // Handle regular file upload
        const document = await storage.createDocument({
          userId,
          filename: file.originalname,
          fileType: fileExtension,
          fileSize: file.size,
          filePath: file.path,
          processingStatus: "pending",
          subjectId: null,
        });

        // Process document asynchronously (in background)
        processDocumentAsync(document.id, file.path, file.originalname, file.mimetype);

        res.json(document);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Get topics for a document (for review modal)
  app.get("/api/documents/:id/topics", async (req, res) => {
    try {
      const documentId = req.params.id;
      const topicsData = await storage.getTopicsByDocument(documentId);
      res.json(topicsData);
    } catch (error) {
      console.error("Error fetching document topics:", error);
      res.status(500).json({ error: "Failed to fetch document topics" });
    }
  });

  // Confirm and update topics after user review
  app.post("/api/documents/:id/confirm", async (req, res) => {
    try {
      const documentId = req.params.id;
      const { topics } = req.body;

      if (!topics || !Array.isArray(topics)) {
        return res.status(400).json({ error: "Invalid topics data" });
      }

      // Update each topic with user corrections and inclusion decision
      const updatedTopics = [];
      for (const topic of topics) {
        if (topic.id) {
          // Update existing topic
          const updated = await storage.updateTopic(topic.id, {
            title: topic.title,
            content: topic.content,
            confidence: topic.confidence,
            correctedByUser: topic.correctedByUser,
            deepFocus: topic.deepFocus,
            included: topic.include, // Save user's inclusion/exclusion decision
          });
          updatedTopics.push(updated);
        }
      }

      res.json({ 
        message: "Topics confirmed and updated",
        topics: updatedTopics 
      });
    } catch (error) {
      console.error("Error confirming document topics:", error);
      res.status(500).json({ error: "Failed to confirm document topics" });
    }
  });

  // Subjects endpoints
  app.get("/api/subjects", async (req, res) => {
    try {
      const allSubjects = await storage.getSubjects();
      res.json(allSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/stats", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const allSubjects = await storage.getSubjects();
      const userDocs = await storage.getDocuments(userId);

      const subjectStats = await Promise.all(
        allSubjects.map(async (subject) => {
          const subjectDocs = userDocs.filter(d => d.subjectId === subject.id);
          const subjectTopics = await storage.getTopicsBySubject(subject.id);
          const subjectProgress = await storage.getProgressBySubject(userId, subject.id);
          const completedTopics = subjectProgress.filter(p => p.completed).length;

          return {
            ...subject,
            documentCount: subjectDocs.length,
            topicCount: subjectTopics.length,
            completedTopics,
            progress: subjectTopics.length > 0
              ? Math.round((completedTopics / subjectTopics.length) * 100)
              : 0,
          };
        })
      );

      // Filter active subjects
      const activeSubjects = subjectStats.filter(s => s.documentCount > 0 || s.topicCount > 0);

      res.json(activeSubjects);
    } catch (error) {
      console.error("Error fetching subject stats:", error);
      res.status(500).json({ error: "Failed to fetch subject stats" });
    }
  });

  // Q&A endpoints
  app.get("/api/qa/history", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const history = await storage.getQaHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching QA history:", error);
      res.status(500).json({ error: "Failed to fetch QA history" });
    }
  });

  app.post("/api/qa/ask", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const { question, language } = req.body;

      if (!question || !language) {
        return res.status(400).json({ error: "Missing question or language" });
      }

      // Get all user's topics for RAG context
      const userTopics = await storage.getAllTopicsByUser(userId);

      // Get AI answer with document context
      const response = await aiService.answerQuestion(question, language, userTopics);

      // Determine topic/subject IDs from related topics if available
      let topicId: string | null = null;
      let subjectId: string | null = null;
      if (response.relatedTopics && response.relatedTopics.length > 0) {
        topicId = response.relatedTopics[0]; // Use first related topic
        const firstTopic = userTopics.find(t => t.id === topicId);
        if (firstTopic?.subjectId) {
          subjectId = firstTopic.subjectId;
        }
      }

      // Save to history
      const qaRecord = await storage.createQaHistory({
        userId,
        question,
        answer: response.answer,
        language,
        topicId,
        subjectId,
      });

      res.json(qaRecord);
    } catch (error) {
      console.error("Error processing question:", error);
      res.status(500).json({ error: "Failed to process question" });
    }
  });

  // Get dynamic suggested questions based on user's topics
  app.get("/api/qa/suggested-questions", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const userTopics = await storage.getAllTopicsByUser(userId);
      const suggestedQuestions = await aiService.generateSuggestedQuestions(userTopics, 4);
      res.json({ questions: suggestedQuestions });
    } catch (error) {
      console.error("Error generating suggested questions:", error);
      res.status(500).json({ error: "Failed to generate suggested questions" });
    }
  });

  // MCQ endpoints
  app.get("/api/mcq/questions/:subjectId", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const { subjectId } = req.params;
      const questions = await storage.getMcqQuestionsBySubject(userId, subjectId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching MCQ questions:", error);
      res.status(500).json({ error: "Failed to fetch MCQ questions" });
    }
  });

  app.post("/api/mcq/generate", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const { subjectId, count = 5 } = req.body;

      if (!subjectId) {
        return res.status(400).json({ error: "Missing subjectId" });
      }

      // Get subject info
      const subject = await storage.getSubject(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      // Get topics for the subject (may be empty)
      const subjectTopics = await storage.getTopicsBySubject(subjectId);

      // Generate MCQ questions using AI (works with or without topics)
      const generatedQuestions = await aiService.generateMCQQuestions(
        subjectTopics, 
        count, 
        subject.name
      );

      console.log(`Generated ${generatedQuestions.length} MCQ questions for subject ${subject.name}`);

      // Save questions to database
      const savedQuestions = await Promise.all(
        generatedQuestions.map(q => {
          console.log("Saving MCQ question:", { question: q.question.substring(0, 50), optionsCount: q.options.length });
          return storage.createMcqQuestion({
            userId,
            subjectId,
            topicId: q.topicId || null,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
          });
        })
      );

      console.log(`Saved ${savedQuestions.length} MCQ questions to database`);
      res.json(savedQuestions);
    } catch (error) {
      console.error("Error generating MCQ questions:", error);
      res.status(500).json({ error: "Failed to generate MCQ questions" });
    }
  });

  app.post("/api/mcq/attempt", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const { questionId, selectedAnswer } = req.body;

      if (!questionId || selectedAnswer === undefined) {
        return res.status(400).json({ error: "Missing questionId or selectedAnswer" });
      }

      // Get the question to check correctness
      const questions = await storage.getMcqQuestions(userId);
      const question = questions.find(q => q.id === questionId);

      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      const isCorrect = question.correctAnswer === selectedAnswer;

      // Save attempt
      const attempt = await storage.createMcqAttempt({
        userId,
        questionId,
        selectedAnswer,
        isCorrect,
      });

      res.json({
        ...attempt,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    } catch (error) {
      console.error("Error recording MCQ attempt:", error);
      res.status(500).json({ error: "Failed to record MCQ attempt" });
    }
  });

  // Visual summaries endpoints
  app.post("/api/visual-summaries/generate", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const { subjectId, summaryType } = req.body;

      if (!subjectId || !summaryType) {
        return res.status(400).json({ error: "Missing subjectId or summaryType" });
      }

      if (!["flowchart", "concept_map", "comparison_table"].includes(summaryType)) {
        return res.status(400).json({ error: "Invalid summaryType. Must be flowchart, concept_map, or comparison_table" });
      }

      // Get subject
      const subject = await storage.getSubject(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      // Get topics for the subject
      const subjectTopics = await storage.getTopicsBySubject(subjectId);
      
      console.log(`Visual summary generation: Found ${subjectTopics.length} topics for subject ${subject.name} (${subjectId})`);
      
      if (subjectTopics.length === 0) {
        console.log(`No topics found for subject ${subject.name}. Checking all documents...`);
        const allDocs = await storage.getDocuments(userId);
        console.log(`User has ${allDocs.length} documents total`);
        return res.status(400).json({ error: "No topics found for this subject. Upload documents first." });
      }

      // Generate visual summary using AI
      const { title, content } = await aiService.generateVisualSummary(
        subjectTopics,
        summaryType as "flowchart" | "concept_map" | "comparison_table",
        subject.name
      );

      // Save to database
      const summary = await storage.createVisualSummary({
        userId,
        subjectId,
        summaryType,
        title,
        content,
      });

      res.json(summary);
    } catch (error) {
      console.error("Error generating visual summary:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate visual summary" });
    }
  });

  app.get("/api/visual-summaries/subject/:subjectId", async (req, res) => {
    try {
      const { subjectId } = req.params;

      if (!subjectId) {
        return res.status(400).json({ error: "Missing subjectId" });
      }

      const summaries = await storage.getVisualSummariesBySubject(subjectId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching visual summaries:", error);
      res.status(500).json({ error: "Failed to fetch visual summaries" });
    }
  });

  app.get("/api/visual-summaries", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const summaries = await storage.getVisualSummaries(userId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching visual summaries:", error);
      res.status(500).json({ error: "Failed to fetch visual summaries" });
    }
  });

  // Progress endpoints
  app.get("/api/progress/stats", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;

      // Get all progress
      const userProgress = await storage.getProgress(userId);
      const completedTopics = userProgress.filter(p => p.completed).length;
      const totalTopics = userProgress.length;

      // Calculate overall progress
      const overallProgress = totalTopics > 0
        ? Math.round((completedTopics / totalTopics) * 100)
        : 0;

      // Get study time
      const sessions = await storage.getStudySessions(userId);
      const totalStudyTime = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      // Calculate study streak (mock for now)
      const studyStreak = sessions.length > 0 ? 5 : 0;

      res.json({
        overallProgress,
        totalTopics,
        completedTopics,
        studyStreak,
        totalStudyTime,
      });
    } catch (error) {
      console.error("Error fetching progress stats:", error);
      res.status(500).json({ error: "Failed to fetch progress stats" });
    }
  });

  app.get("/api/progress/subjects", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const allSubjects = await storage.getSubjects();

      const subjectProgress = await Promise.all(
        allSubjects.map(async (subject) => {
          const subjectTopics = await storage.getTopicsBySubject(subject.id);
          const subjectProgressItems = await storage.getProgressBySubject(userId, subject.id);

          const topicsWithProgress = await Promise.all(
            subjectTopics.map(async (topic) => {
              const progressItem = subjectProgressItems.find(p => p.topicId === topic.id);
              return {
                topic,
                completed: progressItem?.completed || false,
                reviewCount: progressItem?.reviewCount || 0,
              };
            })
          );

          const completedTopics = topicsWithProgress.filter(t => t.completed).length;
          const progress = subjectTopics.length > 0
            ? Math.round((completedTopics / subjectTopics.length) * 100)
            : 0;

          return {
            subject,
            totalTopics: subjectTopics.length,
            completedTopics,
            progress,
            topics: topicsWithProgress,
          };
        })
      );

      // Filter subjects with topics
      const activeSubjects = subjectProgress.filter(s => s.totalTopics > 0);

      res.json(activeSubjects);
    } catch (error) {
      console.error("Error fetching subject progress:", error);
      res.status(500).json({ error: "Failed to fetch subject progress" });
    }
  });

  // Helper function to process documents asynchronously
  async function processDocumentAsync(documentId: string, filePath: string, filename: string, fileType: string) {
    try {
      // Update status to processing
      await storage.updateDocumentStatus(documentId, "processing");

      // Process the document file to extract text
      const processed = await documentProcessor.processDocument(filePath, fileType);
      
      // Extract topics using AI from the processed text
      const extracted = await aiService.extractTopicsFromText(processed.text, filename);

      // Find or create subject
      let subject = (await storage.getSubjects()).find(
        s => s.name.toLowerCase() === extracted.suggestedSubject.toLowerCase()
      );

      if (!subject) {
        // Create new subject with default colors
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
        subject = await storage.createSubject({
          name: extracted.suggestedSubject,
          description: `Materials relacionats amb ${extracted.suggestedSubject}`,
          icon: "BookOpen",
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      // Update document with subject
      await storage.updateDocumentSubject(documentId, subject.id);

      // Create topics
      for (const topicData of extracted.topics) {
        await storage.createTopic({
          documentId,
          subjectId: subject.id,
          title: topicData.title,
          content: topicData.content,
          topicType: topicData.topicType,
          confidence: topicData.confidence || 100,
        });
      }

      // Update status to completed
      await storage.updateDocumentStatus(documentId, "completed");
      
      console.log(`Document ${documentId} processed successfully. Extracted ${extracted.topics.length} topics.`);
    } catch (error) {
      console.error("Error processing document:", error);
      await storage.updateDocumentStatus(documentId, "failed");
    }
  }

  const httpServer = createServer(app);

  return httpServer;
}
