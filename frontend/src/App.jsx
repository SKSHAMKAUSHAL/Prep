import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Home/Dashboard";
import InterviewPrep from "./pages/InterviewPrep/InterviewPrep";
import LiveInterview from "./pages/LiveInterview/LiveInterview";
import FeedbackReport from "./pages/LiveInterview/FeedbackReport";
import DoubtSolver from "./pages/DoubtSolver/DoubtSolver";
import AskQuery from "./pages/Query/AskQuery";
import NotFound from "./pages/NotFound/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const AuthWrapper = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-lg max-h-[92vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            <AuthWrapper>
              <Login />
            </AuthWrapper>
          } />
          <Route path="/signup" element={
            <AuthWrapper>
              <SignUp />
            </AuthWrapper>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route
            path="/interview-prep/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewPrep />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/interview/:sessionId/live" 
            element={
              <ProtectedRoute>
                <LiveInterview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/interview/:sessionId/feedback" 
            element={
              <ProtectedRoute>
                <FeedbackReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doubt-solver" 
            element={
              <ProtectedRoute>
                <DoubtSolver />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ask-query" 
            element={
              <ProtectedRoute>
                <AskQuery />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/query" 
            element={
              <ProtectedRoute>
                <AskQuery />
              </ProtectedRoute>
            } 
          />
          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>

      <Toaster
        toastOptions={{
          style: {
            fontSize: "13px",
            borderRadius: "8px",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
          },
        }}
      />
    </div>
  );
};

export default App;
