# MedStudy - Intelligent Medical Study Assistant

## Overview
MedStudy is an intelligent web application designed for 4th-year medical students. Its primary purpose is to streamline the study process by automatically processing educational materials (PDFs, Word, CSVs, and ZIP archives), extracting key medical topics, definitions, images, and clinical cases, and organizing them by medical subject. It also provides an adaptive AI-powered study assistant, visual summaries, and progress tracking, all within a single-user design focused on personal study workflows. The project aims to enhance medical education through AI-driven content organization and interactive learning.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the `shared/schema.ts` file.
Do not make changes to the `client/src/index.css` file.
Do not use emojis in the codebase; use `lucide-react` icons instead.
All interactive elements must have `data-testid` attributes for automated testing.

## System Architecture
### UI/UX Decisions
The application features a clean, professional interface suitable for medical education, inspired by Linear/Notion aesthetics. It prioritizes information density, efficient content layouts, and accessibility with WCAG-compliant color contrast and keyboard navigation. The design is responsive across desktop, tablet, and mobile devices, supporting a dark mode. The primary language is Catalan, with Spanish support.

### Technical Implementations
**Frontend**: Built with React, TypeScript, Tailwind CSS, and Shadcn UI components. Wouter handles routing, and TanStack Query manages data fetching.
**Backend**: Developed using Node.js with Express, connecting to a PostgreSQL database (Neon) via Drizzle ORM. OpenAI API (GPT-5) powers AI functionalities, and Multer handles file uploads.
**File Processing**: Utilizes `pdf-parse` for PDFs, `Mammoth.js` for Word documents, `Papa Parse` for CSVs, and `adm-zip` for ZIP archives.
**AI Features**: Leverages GPT-5 for content extraction (topics, definitions, clinical cases, terminology), subject classification, adaptive Q&A, and generation of visual summaries (flowcharts, concept maps, comparative tables) and MCQ tests. It incorporates Retrieval-Augmented Generation (RAG) for the AI study assistant, enhancing responses with document-specific context through text normalization, medical term stemming, keyword expansion, and cross-language matching.
**Content Review System**: Includes a modal for reviewing AI-extracted topics, allowing users to edit titles, content, mark as included/excluded, set deep focus, and track confidence scores.

### Feature Specifications
- **Multi-format Document Processing**: Supports PDF, Word (.docx), CSV, and ZIP files for content ingestion.
- **AI-Powered Content Extraction & Organization**: Automatically identifies and categorizes medical content by specialty.
- **Adaptive Study Assistant**: Offers interactive Q&A in Catalan/Spanish, providing contextual explanations.
- **Visual Summaries**: Generates flowcharts, concept maps, and comparison tables from study materials.
- **Progress Tracking**: Monitors study completion by topic and subject with analytics.
- **MCQ Test System**: Creates topic-based multiple-choice questions with real-time feedback and score tracking.
- **Content Review System**: Allows users to review, edit, and manage AI-extracted topics with confidence scoring.

### System Design Choices
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations.
- **File Storage**: Uploaded files are stored in the `/uploads` directory.
- **Scalability**: Designed as a single-user application but built with a modular structure that could support future multi-user authentication.
- **Environment Management**: Utilizes environment variables for sensitive data like `DATABASE_URL` and `OPENAI_API_KEY`.

## External Dependencies
- **OpenAI API (GPT-5)**: For all AI-powered features, including content extraction, subject classification, Q&A, visual summary generation, and MCQ creation.
- **PostgreSQL (Neon)**: The primary database for persistent storage of user data, documents, topics, and study progress.
- **pdf-parse**: Library for extracting text content from PDF documents.
- **Mammoth.js**: Library for processing and extracting text from Word (.docx) documents.
- **Papa Parse**: Library for parsing CSV files.
- **adm-zip**: Library for extracting and processing content from ZIP archives.
- **Mermaid.js**: For rendering AI-generated flowcharts and concept maps on the frontend.
- **react-markdown** and **remark-gfm**: For rendering Markdown content, including comparison tables, on the frontend.