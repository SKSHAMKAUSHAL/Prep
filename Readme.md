<div align="center">
  
# 🎯 Prep
  
**The Ultimate AI-Powered Interview Preparation Platform**

[![React](https://img.shields.io/badge/React-19.0-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-success.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![AI](https://img.shields.io/badge/AI-Groq%20%7C%20Gemini-orange.svg?style=for-the-badge&logo=openai)](https://groq.com)

[Explore Features](#-key-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Environment Variables](#-environment-variables)

</div>

---

## 💡 Overview

**Prep** transforms interview anxiety into confidence. It provides a highly realistic, voice-interactive interview simulator that dynamically adapts to your target role and experience level. By leveraging advanced language models, Prep offers real-time AI feedback, structured learning paths, and actionable insights to help you secure your next offer.

---

## 🚀 Key Features

* 🎙️ **Voice-Interactive Simulator:** Practice your verbal articulation in a high-fidelity, real-time environment. Speak naturally, and the AI will listen, evaluate, and respond.
* 🧠 **AI-Driven Question Engine:** Dynamic, role-specific questions generated on-the-fly using advanced LLMs (Groq & Gemini), ensuring no two interviews are exactly the same.
* 📊 **Deep Diagnostics:** Receive comprehensive performance reports, confidence scoring, and qualitative feedback tailored by distinct interviewer personas.
* 📚 **Centralized Knowledge Hub:** Pin tough questions, organize mock sessions into personalized folders, and access "Understand the Why" deep-dive explanations for complex concepts.
* 🔒 **Secure & Seamless Authentication:** Robust JWT-based authentication paired with one-click Google OAuth 2.0 integration.

---

## 🏗️ Tech Stack

### Frontend
* **Core:** React, Vite
* **Styling & UI:** Tailwind CSS, Framer Motion
* **Routing & State:** React Router DOM, Context API
* **Other Tools:** React Markdown, React Icons

### Backend
* **Core:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Authentication:** JSON Web Tokens (JWT), Google Auth Library
* **AI Integration:** Groq SDK, Google Gemini

---

## ⚡ Quick Start

Follow these steps to set up the project locally on your machine.

### 1. Prerequisites
* [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or Atlas URI)
* API Keys for **Groq** and a **Google OAuth Client ID**

### 2. Clone the Repository
```bash
git clone https://github.com/SKSHAMKAUSHAL/Prep.git
cd Prep
```

### 3. Install Dependencies
You need to install dependencies for both the frontend and the backend.

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in **both** the `frontend` and `backend` directories.

### `backend/.env`
```env
PORT=9000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GROQ_API_KEY=your_groq_api_key
```

### `frontend/.env`
```env
VITE_BACKEND_URL=http://localhost:9000
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```
> **Note:** Ensure `VITE_GOOGLE_CLIENT_ID` exactly matches the `GOOGLE_CLIENT_ID` in your backend.

---

## 🏃‍♂️ Running the Platform

Once your environment variables are configured, start the development servers.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will be available at **`http://localhost:5173`**.

---

## 📂 Project Structure

```text
Prep/
├── backend/                  # Express server & API routes
│   ├── config/               # Database and configuration files
│   ├── controllers/          # API endpoint logic (Auth, AI, Sessions)
│   ├── middlewares/          # Custom middlewares (JWT verification)
│   ├── models/               # Mongoose schemas
│   └── routes/               # API route definitions
│
└── frontend/                 # React frontend application
    ├── public/               # Static assets
    └── src/
        ├── components/       # Reusable UI components
        ├── context/          # React Context (Theme, User State)
        ├── pages/            # Application pages (Landing, Dashboard, Prep)
        └── utils/            # Helper functions and Axios config
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <i>Built to help you land the job you deserve.</i>
</div>
