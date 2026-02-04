# Project Structure

This document provides a high-level overview of the SmartAttend application's folder structure.

## Main Directories

### `src/`
This is the "source" directory and contains all of the application's code.

- **`src/app/`**: The core of the application, built with the Next.js App Router.
    - **`(admin)` / `(student)` / `(teacher)`**: These contain the different pages for each user role. Each folder inside represents a route (e.g., `/admin/students`).
    - **`layout.tsx`**: The main root layout that wraps the entire application.
    - **`page.tsx`**: The main landing page with links to the different login portals.
    - **`globals.css`**: Global styles and Tailwind CSS/ShadCN theme variables are defined here.

- **`src/components/`**: Contains all reusable React components.
    - **`ui/`**: Core UI elements from the ShadCN library (e.g., `Button`, `Card`, `Input`).
    - **`admin/` / `student/` / `teacher/`**: Components used exclusively in a specific user's dashboard.
    - **`auth/`**: Authentication-related components like the login and password change forms.
    - **`dashboard/`**: Components that build the main dashboard layout, such as the sidebar and header.
    - **`shared/`**: Components that are used across multiple dashboards (e.g., `StudentProfileCard`).

- **`src/contexts/`**: Holds React Context providers for managing application-wide state.
    - **`auth-context.tsx`**: Manages the current logged-in user's state.
    - **`students-context.tsx`**: Manages the list of students.
    - **`attendance-context.tsx`**: Manages all attendance records.
    - **`teachers-context.tsx`**: Manages the list of teachers.
    - **`institution-profile-context.tsx`**: Manages the institution's profile data.

- **`src/hooks/`**: Contains custom React Hooks to provide easy access to shared logic and context.
    - `useAuth.ts`, `useStudents.ts`, `useAttendance.ts`, `useTeachers.ts`, `useInstitutionProfile.ts`: Simple hooks to access the data from their respective contexts.

- **`src/firebase/`**: All Firebase-related setup and configuration.
    - **`config.ts`**: Contains your Firebase project's connection details.
    - **`client-provider.tsx`**: Initializes Firebase on the client-side.
    - **`provider.tsx`**: Provides the core Firebase services (App, Auth, Firestore) and user state to the application via React Context.
    - **`errors.ts` & `error-emitter.ts`**: A system for handling and propagating Firestore permission errors.

- **`src/ai/`**: This is where the Artificial Intelligence functionality lives, powered by Genkit.
    - **`flows/`**: Contains different "flows" that orchestrate calls to generative models to perform tasks, like generating reports or handling chatbot conversations.
    - **`genkit.ts`**: The main Genkit configuration file.

- **`src/lib/`**: A place for shared utility functions, type definitions, and other helper code.
    - **`types.ts`**: Defines the core data structures for the app, like `Student`, `Teacher`, and `AttendanceRecord`.
    - **`utils.ts`**: General helper functions (e.g., `cn` for classnames, image processing).
    - **`subjects.ts`**: Defines the subjects available for each department and semester.

### `docs/`
Contains documentation and configuration files for the backend.
- **`backend.json`**: Defines the data models (entities) and the structure of your Firestore database.
- **`project-structure.md`**: This file.

### Root Files
- **`next.config.ts`**: Configuration file for the Next.js framework.
- **`tailwind.config.ts`**: Configuration file for the Tailwind CSS styling framework.
- **`package.json`**: Lists all of the project's dependencies and scripts (e.g., `npm run dev`).
- **`firestore.rules`**: Security rules that protect your Firestore database.
