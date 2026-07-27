# Nitro Bot - AI-Powered Interview Preparation Platform

## Overview
Nitro Bot is a comprehensive platform designed to assist candidates in their interview preparation process using advanced artificial intelligence. The platform provides a realistic simulation of technical and behavioral interviews, offering real-time feedback and structured learning paths based on specific job roles and experience levels.

## Key Features

### AI-Driven Question Generation
Leveraging advanced language models, Nitro Bot generates role-specific interview questions tailored to the user's experience and focus areas. The system supports a wide range of technical stacks and professional domains.

### Interactive Live Interview Simulation
A real-time interview experience featuring a dynamic interface and voice interaction capabilities. The system simulates an actual interview environment, allowing users to practice their verbal communication and technical articulation.

### Structured Concept Explanations
For every question generated, users can access deep-dive explanations that break down complex technical concepts into easy-to-understand modules, complete with code examples where applicable.

### Performance Analytics and Feedback
After conducting simulated interviews, users receive detailed performance reports. These reports include scoring, confidence level assessments, and qualitative feedback based on different interviewer personas.

### Personalized Dashboard
A central hub for users to manage their preparation history, view saved sessions, and track their progress over time.

### Secure Authentication
A robust user management system featuring JWT-based authentication and Google OAuth integration to ensure secure access to personalized data.

## Technology Stack

### Frontend
- React for building a dynamic and responsive user interface.
- Vite for an optimized development and build process.
- Tailwind CSS for modern and efficient styling.
- Framer Motion for interactive animations and transitions.
- React Router for seamless navigation.

### Backend
- Node.js and Express for a scalable server-side architecture.
- MongoDB with Mongoose for reliable data storage.
- AI Integration (Groq & Gemini) for powering the core simulation and evaluation engines.
- Multer for handling file and profile image uploads.

### Services and Communication
- JWT for secure session management.
- Axios for consistent API communication.
- React Markdown for rendering structured educational content.

## Architecture

The project follows a decoupled client-server architecture:
- **Backend:** Houses the Express server, database models, controller logic, and AI prompt engineering.
- **Frontend:** Contains the React application, component library, and state management logic.

## Getting Started

### Prerequisites
- Node.js environment.
- MongoDB instance.
- API Keys for relevant AI services (Groq, Gemini).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AvinashGuleria0/Nitro-Bot
   cd nitro-bot
   ```

2. Configure the Backend:
   ```bash
   cd backend
   npm install
   ```
   Create a .env file and define the necessary environment variables (MONGO_URI, JWT_SECRET, API_KEYS).

3. Configure the Frontend:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Project

1. Start the Backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the Frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

## License
This project is licensed under the ISC License.

cd frontend && npm install

# Run backend
cd server && nodemon server

# Run frontend
cd client && npm run dev
```

Create a `.env` in the **server** folder:

```env
MONGO_URI=abc
JWT_SECRET=TOP_G_TOP_SECRET
GROQ_API_KEY=xyz
PORT=9000
```

---

## 📊 Impact

✅ Simplified prep for peers & students
✅ Positive feedback on **save & pin features**
✅ Boosted focus & efficiency in interview readiness
