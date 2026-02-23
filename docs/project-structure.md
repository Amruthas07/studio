
# Project Structure (Smart Institute)

This document provides a high-level overview of the Smart Institute application's backend and frontend architecture.

## Architecture Overview

- **Frontend**: Next.js 15 (App Router) with React 18 and ShadCN UI.
- **Backend-as-a-Service**: Firebase (Auth, Firestore).
- **AI Integration**: Genkit for chatbot and reporting flows.
- **State Management**: React Context API for localized real-time data streams.

## Core Directories

### `src/firebase/`
- **`provider.tsx`**: The heart of the app. Initializes Firebase SDKs and provides `auth`, `firestore`, and the `user` object to the entire application.
- **`firestore/`**: Custom hooks (`useCollection`, `useDoc`) for real-time Firestore synchronization with automated error handling for permissions.
- **`errors.ts`**: A debugging system that mirrors Firestore Security Rule requests to help developers fix permission issues quickly.

### `src/contexts/`
- **`auth-context.tsx`**: Manages user profiles and role-based redirection.
- **`students-context.tsx`**: Handles student enrollment (Auth + Firestore atomic transactions) and bulk semester promotion.
- **`attendance-context.tsx`**: Manages daily attendance logs using composite keys to prevent data collisions.

### `src/ai/`
- **`flows/`**: Contains Genkit logic for generating CSV reports from live Firestore data and the 'Smarty' assistant chatbot.

### `firestore.rules`
- Defines the **Security Perimeter**. It enforces that teachers only see students in their department and students only see their own records.

## Key Performance Design Decisions
1. **No-Photo Architecture**: Removed image processing to ensure sub-2-second enrollment and zero storage costs.
2. **Atomic Registration**: Student accounts are created in a single batch (Auth + Profile), ensuring no "orphaned" users.
3. **Initials-based Avatars**: Reduces dashboard load times by eliminating external image requests.
