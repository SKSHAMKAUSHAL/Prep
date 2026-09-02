import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/inputs/Input";
import ProfilePhotoSelector from "../../components/inputs/profilePhotoSelector";
import { validateEmail } from "../../utils/helper";
import axioInstance from "../../utils/axioInstance"; 
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";
import uploadImage from "../../utils/uploadImage";
import { motion } from "framer-motion";
import { useGoogleLogin } from '@react-oauth/google';

const SignUp = ({ setCurrentPage }) => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        const tokenToSend = tokenResponse?.access_token || tokenResponse?.credential || tokenResponse?.code;
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
        console.error("Google Login Error:", err);
        setError(err.response?.data?.message || "Google Login failed.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google OAuth Error:", error);
      setError("Google Login failed.");
    }
  });

  const handleSignUp = async (e) => {
    e.preventDefault();

    let profileImageUrl = ""; 

    if (!fullName) {
      setError("Please enter full name.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profileImageUrl = imgUploadRes.imageUrl || "";
      } else {
        profileImageUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
      }

      const response = await axioInstance.post(API_PATHS.AUTH.REGISTER, {
        name: fullName,
        email,
        password,
        profileImageUrl,
      });

      const { token } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full px-5 py-6"
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Create Account</h3>
        <p className="text-xs text-[var(--color-text-muted)]">Start practicing better interviews.</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-1">
        <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

        <div className="space-y-1 mt-3">
          <Input
            value={fullName}
            onChange={({ target }) => setFullName(target.value)}
            label="Full Name"
            placeholder="John Doe"
            type="text"
          />
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="name@example.com"
            type="email"
          />
          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="Min 8 Characters"
            type="password"
          />
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-[var(--color-error)] bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30"
          >
            {error}
          </motion.p>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="premium-btn !mt-4"
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-center space-x-3">
        <div className="flex-1 border-t border-[var(--color-border)]"></div>
        <span className="text-[11px] text-[var(--color-text-muted)]">or</span>
        <div className="flex-1 border-t border-[var(--color-border)]"></div>
      </div>

      <div className="mt-4">
        <button 
          type="button"
          onClick={() => googleLogin()}
          className="premium-btn-secondary"
        >
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] mt-6 text-center">
        Already have an account?{" "}
        <button
          className="font-medium text-[var(--color-accent)] hover:underline transition-colors"
          onClick={handleSwitchToLogin}
        >
          Sign In
        </button>
      </p>
    </motion.div>
  );
};

export default SignUp;
