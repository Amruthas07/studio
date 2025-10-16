# **App Name**: FaceAttend

## Core Features:

- Secure Admin Authentication: Firebase Authentication restricts admin access to authorized users via email (jsspn324@gmail.com) and password postfix matching.
- Student Registration & Login: Students can register with their Gmail and chosen password, secured by Firebase Authentication. Password reset is available.
- Face Data Tool: Uses AI to create new face embeddings if necessary, as triggered by admin when adding new students. The system will use the most current/correct model in the embeddings. This tool then optionally inserts student data and photo to MongoDB through a call to the Java backend.
- Student Profile & Attendance View: Students can view their profile information and attendance records.
- Admin Student Management: Admin dashboard for adding students with details (photo, name, registerNumber, department, etc.) and managing their records.
- Automated Attendance Marking: A backend-callable function (markAttendanceFromCamera) saves attendance records into Firestore based on face recognition results from the Java/OpenCV server. A tool to mark attendance from a face scan will reject submissions that do not pass checks.
- Attendance Reporting Tool: Admin can export attendance records for a specified date range and department into CSV/PDF format. The exported file is stored in Firebase Storage, and a signed URL is returned. Can filter according to an automated, AI-determined certainty value, of when a match passes or fails a threshold of the face detection score.

## Style Guidelines:

- Primary color: Deep blue (#2962FF), reflecting a sense of security and trustworthiness.
- Background color: Light blue (#E6F0FF), provides a calm and clean backdrop.
- Accent color: Vibrant cyan (#00FFFF), highlighting interactive elements.
- Body font: 'Inter', sans-serif. Headline font: 'Space Grotesk', sans-serif. For longer text, 'Inter' will be used as the body to compliment 'Space Grotesk'.
- Code font: 'Source Code Pro' for displaying code snippets.
- Glassmorphism effect with glass cards and hero collage to create an immersive and visually appealing experience. Responsive design for accessibility across devices.
- Simple, modern icons to represent various attendance statuses and actions within the application.
- Subtle transitions and animations to enhance user interaction, such as loading animations, hover effects, and form validation feedback.