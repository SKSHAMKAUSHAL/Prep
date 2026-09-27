import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axioInstance from "../../utils/axioInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { LuSparkles, LuBrain, LuShieldCheck, LuZap } from "react-icons/lu";

const SignUp = ({ setCurrentPage }) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError(null);
        const tokenToSend =
          tokenResponse?.access_token ||
          tokenResponse?.credential ||
          tokenResponse?.code;
        const response = await axioInstance.post(API_PATHS.AUTH.GOOGLE_LOGIN, {
          token: tokenToSend,
        });

        const { token } = response.data;
        if (token) {
          localStorage.setItem("token", token);
          updateUser(response.data);
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Google Sign-Up Error:", err);
        setError(err.response?.data?.message || "Google Sign-Up failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: (err) => {
      console.error("Google OAuth Error:", err);
      setError("Google Sign-Up was interrupted. Please try again.");
    },
  });

  const handleSwitchToLogin = (e) => {
    e.preventDefault();
    if (setCurrentPage) {
      setCurrentPage("login");
    } else {
      navigate("/login");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full px-6 py-7"
    >
      <div className="text-center mb-6">
        <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center font-bold text-lg border border-[var(--color-accent)]/20 shadow-xs">
          <LuSparkles className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
          Get Started with Prep
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed max-w-xs mx-auto">
          One-click sign up with Google to start practicing AI voice interviews & system design.
        </p>
      </div>

      {/* Feature Highlights Card */}
      <div className="mb-6 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] space-y-2.5">
        <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)]">
          <LuBrain className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
          <span>Real-time voice AI mock interviews with low latency</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)]">
          <LuZap className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Automated STAR behavioral & architecture feedback</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)]">
          <LuShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>1,000 monthly AI practice tokens included free</span>
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-[var(--color-error)] bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 mb-4"
        >
          {error}
        </motion.p>
      )}

      {/* Primary Google Sign-Up Action */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-all flex items-center justify-center gap-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <span>Connecting with Google...</span>
            </div>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-[var(--color-text-muted)] text-center leading-normal">
          By signing up, you agree to our Terms of Service & Privacy Policy.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold text-[var(--color-accent)] hover:underline transition-colors cursor-pointer"
            onClick={handleSwitchToLogin}
          >
            Sign In
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default SignUp;
