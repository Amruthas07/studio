
# Project Structure & Technology Stack (Smart Attendance)

This document provides a comprehensive overview of the architecture, technologies, and directory hierarchy of the Smart Attendance system for JSS Polytechnic Nanjangud.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Frontend Library**: [React 18](https://reactjs.org/)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/) (based on Radix UI)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit) (powered by Google Gemini)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📂 Directory Hierarchy

### `src/app/` (Next.js App Router)
- **`/(auth)`**: Login pages for Admins, Teachers, and Students.
- **`/admin`**: Dashboard and management interfaces for staff and institution profiles.
- **`/teacher`**: Attendance marking, student directory, and departmental reports.
- **`/student`**: Personal profile and detailed attendance analytics.
- **`actions.ts`**: Server Actions for handling AI flow triggers and data sanitization.

### `src/components/` (UI & Logic)
- **`ui/`**: Reusable primitive components (Buttons, Cards, Dialogs, Tables).
- **`dashboard/`**: Layout elements including the sidebar, header, and user navigation.
- **`admin/` / `teacher/` / `student/`**: Feature-specific components for each user role.
- **`shared/`**: Common elements like the AI Chatbot and Profile cards.

### `src/firebase/` (Database Core)
- **`provider.tsx`**: Initializes the Firebase SDKs and provides global access to services.
- **`firestore/`**: Custom hooks (`useCollection`, `useDoc`) for real-time database synchronization.
- **`non-blocking-updates.tsx`**: Optimized write functions that provide instant UI feedback (Optimistic UI).

### `src/contexts/` (State Management)
- **`auth-context.tsx`**: Manages user sessions, role-based permissions, and profile lookups.
- **`attendance-context.tsx`**: Core logic for marking attendance using composite keys.
- **`students-context.tsx`**: Handles enrollment and bulk semester promotion logic.

### `src/ai/` (Generative AI)
- **`flows/`**: Genkit logic for transforming live database snapshots into CSV reports and handling chatbot conversations.

### `src/lib/` (Utilities)
- **`subjects.ts`**: The curriculum registry for JSS Polytechnic (Semesters 1-6).
- **`types.ts`**: Global TypeScript interface definitions for data consistency.

## 🔐 Security Architecture
The application enforces security at the **Database Level** using Firestore Security Rules. This ensures that even if the frontend is modified, a student can never access a teacher's marking tools, and a teacher can only see students within their specific department.
