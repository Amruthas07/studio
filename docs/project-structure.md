# Project Structure

This document provides a high-level overview of the SmartAttend application's folder structure.

## Main Directories

### `src/`
This is the "source" directory and contains all of the application's code.

- **`src/app/`**: The core of the application, built with the Next.js App Router.
    - **`(admin)` / `(student)`**: These contain the different pages for the Admin and Student dashboards respectively. Each folder inside represents a route (e.g., `/admin/students`).
    - **`layout.tsx`**: The main root layout that wraps the entire application.
    - **`page.tsx`**: The main landing page with the administrator login form.
    - **`globals.css`**: Global styles and Tailwind CSS/ShadCN theme variables are defined here.

- **`src/components/`**: Contains all reusable React components.
    - **`ui/`**: Core UI elements from the ShadCN library (e.g., `Button`, `Card`, `Input`).
    - **`admin/`**: Components used exclusively in the Admin dashboard.
    - **`student/`**: Components used exclusively in the Student dashboard.
    - **`auth/`**: Authentication-related components like the login form.
    - **`dashboard/`**: Components that build the main dashboard layout, such as the sidebar and header.

- **`src/contexts/`**: Holds React Context providers for managing application-wide state.
    - **`auth-context.tsx`**: Manages the current logged-in user's state.
    - **`students-context.tsx`**: Manages the list of students.
    - **`attendance-context.tsx`**: Manages all attendance records.

- **`src/hooks/`**: Contains custom React Hooks to provide easy access to shared logic and context.
    - `useAuth.ts`, `useStudents.ts`, `useAttendance.ts`: Simple hooks to access the data from their respective contexts.
    - `use-firebase.ts`: Hooks for accessing the core Firebase services.

- **`src/firebase/`**: All Firebase-related setup and configuration.
    - **`config.ts`**: Contains your Firebase project's connection details.
    - **`client-provider.tsx`**: Initializes Firebase on the client-side and makes it available to the entire app.

- **`src/ai/`**: This is where the Artificial Intelligence functionality lives, powered by Genkit.
    - **`flows/`**: Contains different "flows" that orchestrate calls to generative models to perform tasks, like generating reports.

- **`src/lib/`**: A place for shared utility functions, type definitions, and other helper code.
    - **`types.ts`**: Defines the core data structures for the app, like `Student` and `AttendanceRecord`.
    - **`utils.ts`**: General helper functions.

### `docs/`
Contains documentation and configuration files for the backend.
- **`backend.json`**: Defines the data models (entities) and the structure of your Firestore database.

### Root Files
- **`next.config.ts`**: Configuration file for the Next.js framework.
- **`tailwind.config.ts`**: Configuration file for the Tailwind CSS styling framework.
- **`package.json`**: Lists all of the project's dependencies and scripts (e.g., `npm run dev`).
