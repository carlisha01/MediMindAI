# MedStudy - Intelligent Medical Study Assistant

## Project Overview
An intelligent SaaS web application for 4th-year medical students that automatically processes educational materials (PDFs, Word, PowerPoint, CSV files), detects key topics, definitions, images, and clinical cases, and organizes them by medical subject.

## Core Features
- **Multi-format Document Processing**: Upload and process PDF, Word (.docx), PowerPoint (.pptx), and CSV files
- **AI-Powered Content Extraction**: Automatically detect and extract topics, definitions, clinical cases, and medical terminology using OpenAI GPT-5
- **Subject Organization**: Automatically classify content by medical specialty (Cardiology, Neurology, Pediatrics, etc.)
- **Adaptive Study Assistant**: Interactive Q&A in Catalan (or Spanish) with contextual explanations powered by AI
- **Visual Summaries**: Auto-generated flowcharts, concept maps, and comparative tables
- **Progress Tracking**: Track study completion by topic and subject with detailed analytics
- **Persistent Storage**: PostgreSQL database for all user data, documents, and progress

## Technology Stack
### Frontend
- React with TypeScript
- Tailwind CSS + Shadcn UI components
- Wouter for routing
- TanStack Query for data fetching
- Responsive design with dark mode support

### Backend
- Node.js with Express
- PostgreSQL (Neon) database
- Drizzle ORM for type-safe database operations
- OpenAI API (GPT-5) for AI-powered features
- Multer for file uploads

### File Processing Libraries
- PDF.js for PDF text extraction
- Mammoth.js for Word document processing
- PptxGenJS or similar for PowerPoint processing
- Papa Parse for CSV handling
- Sharp for image processing

## Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # Shadcn UI primitives
│   │   │   ├── app-sidebar.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── pages/        # Page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── documents.tsx
│   │   │   ├── subjects.tsx
│   │   │   ├── study.tsx
│   │   │   ├── progress.tsx
│   │   │   └── not-found.tsx
│   │   ├── lib/          # Utilities and helpers
│   │   ├── App.tsx       # Main app with routing
│   │   └── index.css     # Global styles
├── server/                # Backend Node.js application
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database storage interface
│   ├── db.ts            # Database connection
│   └── services/        # Business logic (AI, file processing)
├── shared/               # Shared code between frontend and backend
│   └── schema.ts        # Database schema and TypeScript types
└── design_guidelines.md  # UI/UX design specifications
```

## Database Schema
The application uses PostgreSQL with the following main tables:
- **users**: User accounts
- **documents**: Uploaded files with metadata and processing status
- **subjects**: Medical specialties (Cardiology, Neurology, etc.)
- **topics**: Extracted key topics from documents
- **extractedContent**: Images, tables, and diagrams from documents
- **visualSummaries**: AI-generated flowcharts, concept maps, and tables
- **studySessions**: Track study time per topic/subject
- **progress**: Topic completion tracking
- **qaHistory**: Q&A conversation history with the AI assistant

## Key User Journeys
1. **Document Upload → Processing → Content Extraction**
   - Upload PDF/Word/PowerPoint/CSV files
   - AI processes and extracts topics, definitions, clinical cases
   - Automatic subject classification
   
2. **Study with AI Assistant**
   - Ask questions in Catalan about study materials
   - Receive detailed, contextual explanations
   - View suggested questions based on content

3. **Progress Tracking**
   - View overall completion percentage
   - Track progress by subject and topic
   - Monitor study streaks and total time

4. **Visual Summaries**
   - Access auto-generated flowcharts for processes
   - Review concept maps for relationships
   - Compare information in structured tables

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `SESSION_SECRET`: Session encryption key

## Design Philosophy
- **Clinical Precision**: Clean, professional interface suitable for medical education
- **Information Density**: Efficient layouts for content-heavy materials
- **Accessibility**: WCAG-compliant color contrast and keyboard navigation
- **Responsive**: Optimized for desktop, tablet, and mobile devices
- **Catalan-First**: Primary language is Catalan, with Spanish support

## Recent Changes
- Initial project setup with complete schema definition
- Created all frontend pages with professional medical UI
- Implemented sidebar navigation with subject-based organization
- Added dark mode support with theme toggle
- Built dashboard with statistics and subject progress
- Created document management page with upload interface
- Implemented AI study assistant chat interface
- Added comprehensive progress tracking views

## Next Steps (Backend Implementation)
1. Implement API endpoints for document upload and processing
2. Set up file storage and processing pipeline
3. Integrate OpenAI for content extraction and Q&A
4. Create visual summary generation logic
5. Implement progress tracking calculations
6. Connect frontend to backend with real data
