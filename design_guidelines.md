# Design Guidelines: Medical Study Assistant SaaS

## Design Approach

**Selected Framework**: Design System Approach with Linear/Notion-inspired aesthetic
**Justification**: Medical education software requires clarity, efficiency, and information density. Students need a distraction-free, professional environment that prioritizes usability and content organization over visual flair.

**Core Principles**:
- Clinical precision in information hierarchy
- Efficient task completion flows
- Professional, trustworthy aesthetic
- Content-first layouts with minimal decoration
- Scannable interfaces for quick reference

---

## Typography System

**Font Families**:
- **Primary (UI)**: Inter via Google Fonts - exceptional readability for interfaces and data
- **Accent (Headings)**: Inter Medium/Semibold for hierarchy
- **Monospace (Code/Data)**: JetBrains Mono for CSV data, technical content

**Type Scale**:
- Hero/Page Titles: text-4xl to text-5xl (36-48px), font-semibold
- Section Headers: text-2xl to text-3xl (24-30px), font-semibold
- Card Titles: text-lg to text-xl (18-20px), font-medium
- Body Text: text-base (16px), font-normal
- Small Text/Labels: text-sm (14px), font-normal
- Tiny/Metadata: text-xs (12px), font-normal

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Tight spacing: p-2, gap-2 (component internals)
- Standard spacing: p-4, gap-4 (cards, list items)
- Generous spacing: p-6 to p-8 (section padding)
- Large separations: py-12 to py-16 (page sections)

**Grid System**:
- Container: max-w-7xl mx-auto px-4 to px-8
- Dashboard Layout: Sidebar (w-64) + Main Content (flex-1)
- Content Grid: 2-3 column layouts for cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Document List: Single column with max-w-4xl for optimal reading

---

## Component Library

### Navigation & Structure

**Top Navigation Bar**:
- Fixed header (h-16) with logo, search bar, and user profile
- Search bar: Prominent, centered, w-96 max with rounded-lg
- Profile dropdown: Avatar + name display

**Sidebar Navigation**:
- Fixed left sidebar (w-64) with icon + label navigation items
- Sections: Dashboard, Documents, Subjects, Study, Progress, Settings
- Active state: Subtle background treatment
- Collapsible on mobile (transform into bottom nav or hamburger)

### Dashboard Components

**Statistics Cards**:
- 4-column grid on desktop (grid-cols-4), 2-column on tablet, 1-column mobile
- Card structure: Icon + number + label + trend indicator
- Metrics: Total documents, Topics studied, Study time, Progress percentage
- Rounded corners (rounded-xl), shadow-sm

**Subject Overview Grid**:
- 3-column grid of subject cards (Cardiology, Neurology, etc.)
- Each card: Subject icon, name, document count, progress bar, "Continue studying" link
- Hover elevation effect (shadow transition)

**Recent Activity Feed**:
- Timeline-style list with timestamps
- Activity types: Document uploaded, Topic completed, Study session
- Compact spacing (gap-3)

### Document Management

**Upload Zone**:
- Large drag-and-drop area (min-h-64) with dashed border
- Multi-file support indicator
- Supported formats clearly listed (PDF, DOCX, CSV, ZIP)
- Upload button as fallback

**Document Library**:
- List view with sortable columns: Name, Type, Subject, Upload date, Processing status
- Table-based layout with hover states on rows
- Action dropdown per document (View, Edit tags, Delete)
- Filter sidebar (left): Subject, File type, Date range
- Processing status badges with appropriate visual indicators

**Document Viewer**:
- Full-width layout with sticky header
- Left sidebar: Table of contents / extracted topics (w-72)
- Main content: Document preview + extracted content tabs
- Right sidebar: Quick study actions (w-80)

### Study Interface

**Q&A Component**:
- Chat-like interface with user questions + AI responses
- Input field: Sticky bottom, rounded-full, with send button
- Messages: Left-aligned (user), right-aligned (AI assistant)
- "Ask in Catalan" toggle prominently displayed
- Suggested questions chips below input

**Visual Summaries Display**:
- Tab navigation: Flowcharts, Concept Maps, Comparison Tables
- Each summary: Full-width card with export/print options
- Flowcharts: Mermaid-style diagrams with clear node connections
- Concept Maps: Hierarchical tree layouts
- Comparison Tables: Striped rows, sortable columns

**Study Session Panel**:
- Timer display (large, prominent)
- Topic selector dropdown
- "Start Session" / "End Session" button
- Session notes textarea

### Progress Tracking

**Progress Dashboard**:
- Overall completion ring chart (large, centered)
- Subject breakdown: Horizontal bar charts
- Calendar heatmap showing daily study activity
- Milestone badges earned section

**Topic List with Progress**:
- Expandable accordion for subjects
- Each topic: Name, progress percentage, circular progress indicator, "Study" button
- Completion checkmarks for finished topics

### Forms & Inputs

**Text Inputs**:
- Rounded corners (rounded-lg)
- Clear labels above inputs
- Placeholder text for guidance
- Focus ring treatment

**Buttons**:
- Primary: Solid, rounded-lg, px-6 py-3, font-medium
- Secondary: Outline variant
- Icon buttons: Square (w-10 h-10), rounded-lg

**File Upload Buttons**:
- Prominent with upload icon
- "Browse files" alternative to drag-drop

---

## Page-Specific Layouts

### Dashboard (Home)
- Statistics cards row at top
- 2-column layout: Subject grid (2/3 width) + Recent activity (1/3 width)
- Quick actions floating action button (bottom-right)

### Documents Page
- Filter sidebar (left, w-64)
- Main content: Upload zone + document table
- Breadcrumb navigation above content

### Study Page
- 3-panel layout: Topics sidebar (left), Main study area (center), Q&A panel (right, collapsible)
- Tabs in main area: Content, Summaries, Notes

### Progress Page
- Hero statistics section
- Visualization grid below
- Achievement/milestone section at bottom

---

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (single column, bottom nav)
- Tablet: 768px - 1024px (2-column grids, collapsible sidebar)
- Desktop: > 1024px (full layout with sidebar)

**Mobile Adaptations**:
- Sidebar transforms to bottom navigation or hamburger menu
- Statistics cards: 2-column then 1-column
- Tables transform to card-based lists
- Multi-panel layouts stack vertically

---

## Visual Enhancements

**Micro-interactions** (minimal, purposeful):
- Hover states on cards (subtle elevation)
- Progress bar fill animations on load
- Smooth transitions on accordion expansion
- Loading states for AI processing

**Icons**: Heroicons (outline style for navigation, solid for actions)

**Borders & Dividers**: Minimal use, prefer spacing to create separation

**Shadows**: Subtle depth (shadow-sm on cards, shadow-md on modals)

---

## Images

**Hero Section**: None - This is a productivity tool, not a marketing site. Jump directly into functional dashboard.

**Subject Icons**: Use medical-themed icons or illustrations for each subject (heart for Cardiology, brain for Neurology, etc.) - can be simple line icons with subtle background shapes

**Empty States**: Friendly illustrations for "No documents yet" and "No study sessions" states with clear call-to-action

**User Avatars**: Circular profile images in navigation and activity feeds