import React, { useState, useContext, useEffect } from "react";
import { APP_FEATURES } from "../utils/data";
import { useNavigate } from "react-router-dom";
import { 
  LuSparkles, LuBrain, LuTarget, LuZap, LuSun, LuMoon,
  LuMail, LuPhone, LuMapPin, LuSend, LuStar, LuMessageSquare, 
  LuArrowRight, LuCheck, LuTrendingUp, LuCode, 
  LuGithub, LuLinkedin, LuTwitter, LuYoutube, LuExternalLink,
  LuMousePointerClick, LuFolder
} from "react-icons/lu";
import Login from "../pages/Auth/Login";
import SignUp from "../pages/Auth/SignUp";
import Modal from "../components/Modal";
import ProfileInfoCard from "../components/cards/ProfileInfoCard";
import { UserContext } from "../context/UserContext";
import { ThemeContext } from "../context/ThemeContext";
import HERO_IMG from '../assets/hero-image.png'
import { motion, AnimatePresence } from "framer-motion";

const LandingPage = () => {
  const { user } = useContext(UserContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [openAuthModel, setOpenAuthModel] = useState(false);
  const [currentPage, setCurrentPage] = useState("login");
  const [activeFeature, setActiveFeature] = useState(0);

  // 3D Carousel States
  const [currentReview, setCurrentReview] = useState(1);
  const [offset, setOffset] = useState(440);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setOffset(160);
      } else if (window.innerWidth < 1024) {
        setOffset(300);
      } else {
        setOffset(440);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Contact Form State
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error'

  const handleCTA = () => {
    if (!user) {
      setOpenAuthModel(true);
    } else {
      navigate("/dashboard");
    }
  };

  const featureIcons = [LuBrain, LuTarget, LuZap, LuSparkles, LuBrain];

  // Helper to render half-stars dynamically
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);
    return (
      <div className="flex gap-1 mb-4">
        {[...Array(fullStars)].map((_, i) => (
          <LuStar key={`full-${i}`} className="w-5 h-5 text-amber-400 fill-amber-400" />
        ))}
        {hasHalf && (
          <div className="relative w-5 h-5">
            <LuStar className="absolute top-0 left-0 w-5 h-5 text-gray-200 dark:text-slate-800" />
            <div className="absolute top-0 left-0 w-[50%] h-full overflow-hidden">
              <LuStar className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <LuStar key={`empty-${i}`} className="w-5 h-5 text-gray-200 dark:text-slate-800" />
        ))}
      </div>
    );
  };

  // Testimonials Cast (Only Male Names & Avatars, Mix of Stars, No Roles/Work)
  const testimonials = [
    {
      id: 1,
      name: "Ashish Yadav",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ashish&backgroundColor=b6e3f4",
      comment: "NitroBot completely changed my preparation strategy. The real-time AI voice feedback helped me fix my pacing, and the interactive concept maps made answering system design questions intuitive.",
      stars: 5,
    },
    {
      id: 2,
      name: "Saksham Kaushal",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Saksham&backgroundColor=c0aede",
      comment: "I was skeptical about AI interviewing, but the accuracy of the feedback blew me away. The 'Understand the Why' feature broke down complex networking topics in seconds. Got my offer!",
      stars: 4.5,
    },
    {
      id: 3,
      name: "Pratham Mittal",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Pratham&backgroundColor=d1d4f9",
      comment: "The customized behavioral question tracks and the ability to pin my notes and personal STAR method stories made learning highly organized. Absolute life-saver for tech loops.",
      stars: 4,
    },
    {
      id: 4,
      name: "Shivansh Mehta",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Shivansh&backgroundColor=ffdfbf",
      comment: "Highly recommend NitroBot to anyone preping for senior loops. The mock interview folders allowed me to organize and revisit my weaknesses. Crucial tool for tech interviews.",
      stars: 5,
    },
    {
      id: 5,
      name: "Arnav Verma",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Arnav&backgroundColor=ffd5dc",
      comment: "The UI is breathtaking. Creating mock interview collections and adding notes to hard questions made my preparation structured and enjoyable. A masterclass in educational UX.",
      stars: 4.5,
    },
    {
      id: 6,
      name: "Tom Cruise",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Tom&backgroundColor=b6e3f4",
      comment: "As someone who struggles with anxiety, the interactive simulator built my confidence step-by-step. The AI explanations gave me clear, clean models for technical communication.",
      stars: 5,
    },
    {
      id: 7,
      name: "Raftaar",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Raftaar&backgroundColor=c0aede",
      comment: "This is a masterpiece of prep. The interactive flow-charts, quick concept answers, and high-fidelity folders are exactly what real candidates need to land high-performing jobs.",
      stars: 4,
    },
    {
      id: 8,
      name: "Seedhe Maut",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Maut&backgroundColor=d1d4f9",
      comment: "A seamless product that simulates core loops and explains complicated architectures with absolute clarity. Made my learning incredibly rapid and structured.",
      stars: 5,
    },
    {
      id: 9,
      name: "Mayank Sharma",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Mayank&backgroundColor=ffdfbf",
      comment: "NitroBot's adaptive interview engine feels incredibly close to a real senior engineer round. The dynamic feedback is outstanding and really tests your conceptual depth.",
      stars: 4.5,
    }
  ];

  // Contact Form Submission Handler
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen font-sans text-gray-900 dark:text-slate-100 selection:bg-blue-200 dark:selection:bg-blue-800 transition-colors duration-300">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <LuSparkles className="text-white text-lg" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">NitroBot</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all text-gray-600 dark:text-slate-300"
              title="Toggle Theme"
            >
              {theme === "dark" ? (
                <LuSun className="text-lg text-amber-400" />
              ) : (
                <LuMoon className="text-lg text-slate-700" />
              )}
            </button>

            {user ? (
              <ProfileInfoCard />
            ) : (
              <button
                className="bg-gray-900 dark:bg-slate-50 text-white dark:text-slate-950 hover:bg-gray-800 dark:hover:bg-slate-200 transition-colors px-6 py-2.5 rounded-full font-medium text-sm"
                onClick={() => setOpenAuthModel(true)}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 dark:from-blue-600/30 dark:to-purple-600/30 blur-[100px] rounded-full" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="w-full lg:w-1/2 space-y-8 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-2">
                <LuSparkles className="text-blue-500" />
                <span>Next-Gen Interview Prep</span>
              </div>
              
              <h1 className="text-5xl lg:text-7.5xl font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-slate-50">
                Master your next interview with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">AI precision.</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-gray-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Experience real-time voice interviews, get deeply personalized feedback, and track your progress. NitroBot turns anxiety into confidence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <button
                  onClick={handleCTA}
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  Start Practicing Free
                </button>
                <button 
                  onClick={() => document.getElementById("showcase-section")?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 px-8 py-4 rounded-xl font-medium text-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  View Features
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full lg:w-1/2 flex justify-center"
            >
              <div className="relative w-full max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl transform rotate-2 scale-105 opacity-50"></div>
                <img 
                  src={HERO_IMG} 
                  alt="Dashboard Preview" 
                  className="relative z-10 w-full rounded-2xl premium-shadow border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* NEW Interactive Sticky Scroll Showcase Section */}
      <section id="showcase-section" className="py-24 bg-slate-50 dark:bg-slate-900/30 relative overflow-visible transition-colors duration-300">
        <div className="absolute top-1/2 -right-64 w-[800px] h-[800px] bg-blue-50 dark:bg-blue-950/10 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 -left-64 w-[600px] h-[600px] bg-purple-50 dark:bg-purple-950/10 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-4">
              <LuSparkles />
              <span>Interactive Showcase</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-slate-50 mb-6">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-400">
              Powerful tools designed to simulate real-world conditions and dramatically improve your performance. Scroll down to see them in action.
            </p>
          </div>

          {/* Features Column Showcase */}
          <div className="relative flex flex-col lg:flex-row gap-16 items-start max-w-6xl mx-auto">
            {/* Sticky Visualizer Column (Left) - Desktop only */}
            <div className="hidden lg:block lg:w-1/2 sticky top-[calc(50vh-240px)] h-[480px]">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
                {/* Simulator Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800/80 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="px-4 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-[10px] font-bold text-gray-500 dark:text-slate-400 tracking-wider">
                    NITROBOT SIMULATOR V1.0
                  </div>
                </div>

                {/* Dynamic Visualization Screens */}
                <div className="relative h-[340px] w-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {/* FEATURE 0: Tailored Just For You */}
                  {activeFeature === 0 && (
                    <motion.div
                      key="feat0"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full flex flex-col justify-center items-center relative"
                    >
                      <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-gray-200 dark:border-slate-800 w-full max-w-sm shadow-md space-y-4">
                        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-900 pb-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600">
                            <LuBrain className="text-xl animate-pulse" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-400">Target Role</div>
                            <div className="text-sm font-bold text-gray-800 dark:text-slate-100">Senior Frontend Architect</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {["React Fiber", "Next.js", "System Design", "Web Performance", "State Management", "Docker"].map((tag, idx) => (
                            <motion.span
                              key={tag}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full border border-blue-100 dark:border-blue-900/50"
                            >
                              {tag}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      {/* Floating Decorative Tech Elements */}
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-500 animate-float text-lg font-bold">JS</div>
                      <div className="absolute -bottom-2 right-4 w-14 h-14 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 animate-float-delayed text-lg font-bold">TS</div>
                    </motion.div>
                  )}

                  {/* FEATURE 1: Learn at Your Own Pace */}
                  {activeFeature === 1 && (
                    <motion.div
                      key="feat1"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full flex flex-col justify-center items-center"
                    >
                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-gray-200 dark:border-slate-800 w-full max-w-sm shadow-md space-y-4">
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">PRACTICE SET #4</div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                          "Explain OAuth 2.0 Authorization Code Flow."
                        </div>
                        <div className="relative">
                          <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-1">
                            <LuMousePointerClick className="text-sm" />
                            Reveal AI Explainer
                          </button>
                        </div>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          transition={{ delay: 0.5, duration: 0.4 }}
                          className="overflow-hidden bg-slate-900 text-slate-300 p-3 rounded-lg text-[10px] font-mono border border-slate-800 space-y-1"
                        >
                          <div className="text-amber-400">// Step 1: Request auth code</div>
                          <div>window.location.href = authUrl;</div>
                          <div className="text-green-400">// Step 2: Exchange code for Access Token</div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* FEATURE 2: Capture Your Insights */}
                  {activeFeature === 2 && (
                    <motion.div
                      key="feat2"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full flex flex-col justify-center items-center relative"
                    >
                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-gray-200 dark:border-slate-800 w-full max-w-sm shadow-md space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-900">
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span>📓</span> Personal Notes
                          </div>
                          <span className="text-[10px] text-gray-400">Pinned</span>
                        </div>
                        
                        <div className="space-y-3">
                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded text-xs text-gray-700 dark:text-slate-300"
                          >
                            💡 <strong>STAR Method:</strong> For behavioral questions, explain the specific metric boosted (e.g. 24% load time reduction).
                          </motion.div>

                          <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="p-3 bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500 rounded text-xs text-gray-700 dark:text-slate-300"
                          >
                            🔥 <strong>Edge Case:</strong> JWT tokens must be saved in HttpOnly cookie to shield from XSS exploits.
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* FEATURE 3: Understand the 'Why' */}
                  {activeFeature === 3 && (
                    <motion.div
                      key="feat3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full flex flex-col justify-center items-center"
                    >
                      {/* Concept Mind Map SVG */}
                      <div className="relative w-64 h-64 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-full shadow-inner flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full">
                          {/* Laser Pulse Paths */}
                          <line x1="128" y1="128" x2="40" y2="60" className="stroke-blue-500/40 dark:stroke-blue-400/40 stroke-2" />
                          <line x1="128" y1="128" x2="216" y2="60" className="stroke-purple-500/40 dark:stroke-purple-400/40 stroke-2" />
                          <line x1="128" y1="128" x2="40" y2="196" className="stroke-indigo-500/40 dark:stroke-indigo-400/40 stroke-2" />
                          <line x1="128" y1="128" x2="216" y2="196" className="stroke-emerald-500/40 dark:stroke-emerald-400/40 stroke-2" />
                          
                          {/* Animated flow line dashes */}
                          <line x1="128" y1="128" x2="40" y2="60" className="stroke-blue-500 dark:stroke-blue-400 stroke-2 animate-flow-line" />
                          <line x1="128" y1="128" x2="216" y2="60" className="stroke-purple-500 dark:stroke-purple-400 stroke-2 animate-flow-line" />
                        </svg>

                        {/* Center Concept Node */}
                        <div className="relative z-10 w-20 h-20 bg-blue-600 text-white rounded-full flex flex-col items-center justify-center font-bold text-[10px] shadow-lg animate-pulse-glow">
                          <span>JWT Auth</span>
                          <span className="text-[7px] font-normal opacity-85">Concept</span>
                        </div>

                        {/* Connected Subnodes */}
                        <div className="absolute top-8 left-4 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-[9px] font-semibold">CSRF/XSS</div>
                        <div className="absolute top-8 right-4 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-[9px] font-semibold">Stateless</div>
                        <div className="absolute bottom-8 left-4 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-[9px] font-semibold">Payload</div>
                        <div className="absolute bottom-8 right-4 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-[9px] font-semibold">Signature</div>
                      </div>
                    </motion.div>
                  )}

                  {/* FEATURE 4: Save & Organize */}
                  {activeFeature === 4 && (
                    <motion.div
                      key="feat4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full flex flex-col justify-center items-center"
                    >
                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-gray-200 dark:border-slate-800 w-full max-w-sm shadow-md space-y-4">
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400">📂 Collections Storage</div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl text-center space-y-1">
                            <span className="text-2xl">📂</span>
                            <div className="text-[11px] font-bold text-gray-800 dark:text-slate-100">System Design</div>
                            <div className="text-[9px] text-gray-400">8 Practice Sets</div>
                          </div>
                          
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 rounded-xl text-center space-y-1">
                            <span className="text-2xl">📂</span>
                            <div className="text-[11px] font-bold text-gray-800 dark:text-slate-100">FAANG Mock</div>
                            <div className="text-[9px] text-gray-400">12 Practice Sets</div>
                          </div>
                        </div>

                        {/* Card glides into Folder illustration */}
                        <motion.div
                          animate={{ y: [0, -10, 0], scale: [1, 0.95, 1] }}
                          transition={{ repeat: Infinity, duration: 2.5 }}
                          className="mx-auto max-w-[200px] bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-semibold"
                        >
                          <span>📚 Cache Architecture Prep</span>
                          <span className="text-blue-500">→</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Scrolling Content (Right Column) */}
            <div className="w-full lg:w-1/2 space-y-12">
              {APP_FEATURES.map((feature, index) => {
                const Icon = featureIcons[index % featureIcons.length];
                const isActive = activeFeature === index;

                return (
                  <motion.div
                    key={feature.id}
                    onViewportEnter={() => setActiveFeature(index)}
                    initial={{ opacity: 0.3, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px", amount: 0.6 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`p-8 rounded-2xl border transition-all duration-500 ${
                      isActive 
                        ? "bg-white dark:bg-slate-900 border-blue-500/25 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/5" 
                        : "border-gray-100 dark:border-slate-900/50 bg-white/50 dark:bg-slate-900/10 opacity-70"
                    }`}
                  >
                    {/* Feature Card Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                        isActive 
                          ? "bg-blue-600 text-white" 
                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                      }`}>
                        <Icon className="text-xl" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                          Feature 0{index + 1}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50">
                          {feature.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                      {feature.description}
                    </p>

                    {/* Inline mobile visualizer - shown only on mobile */}
                    <div className="block lg:hidden w-full bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 p-4 mb-6 overflow-hidden">
                      {index === 0 && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-xs font-bold text-gray-500">Role Profile Tagging</div>
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {["React Fiber", "Next.js", "System Design", "Web Performance"].map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-medium">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {index === 1 && (
                        <div className="text-xs font-mono bg-slate-900 text-slate-300 p-3 rounded-lg border border-slate-800">
                          <span className="text-amber-400">// Concept explanation code snippet</span>
                          <div className="text-blue-400 mt-1">const debounce = (fn, d) =&gt; ...</div>
                        </div>
                      )}
                      {index === 2 && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border-l-4 border-amber-500 rounded text-xs text-gray-700 dark:text-slate-300">
                          💡 <strong>STAR Method Story:</strong> Detail the action and impact metrics clearly!
                        </div>
                      )}
                      {index === 3 && (
                        <div className="text-center text-xs font-bold text-blue-600">
                          🌐 JWT Auth ➔ CSRF/XSS ➔ Stateless
                        </div>
                      )}
                      {index === 4 && (
                        <div className="flex justify-around text-xs font-bold">
                          <span>📂 System Design</span>
                          <span>📂 FAANG Mock</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleCTA}
                      className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors group"
                    >
                      Get Started with {feature.title.split(" ")[0]}
                      <LuArrowRight className="text-sm transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* NEW Testimonials & Reviews Section - 3D Cylindrical Carousel */}
      <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-50 dark:bg-purple-950/10 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 text-sm font-semibold mb-4">
              <LuStar className="text-purple-500 fill-purple-500" />
              <span>User Success Stories</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-slate-50 mb-6">
              Loved by ambitious professionals
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-400">
              See how NitroBot helps developers, DevOps, and product managers ace their interviews at top-tier companies.
            </p>
          </div>

          {/* 3D Cylindrical Carousel Wrapper */}
          <div className="relative w-full mx-auto px-4 flex flex-col items-center">
            {/* Perspective Container */}
            <div 
              className="relative w-full h-[460px] flex justify-center items-center overflow-visible"
              style={{ perspective: 1200 }}
            >
              {testimonials.map((testi, idx) => {
                let diff = idx - currentReview;
                const total = testimonials.length;
                if (diff < -total / 2) diff += total;
                if (diff > total / 2) diff -= total;

                // Circular styles
                const isCenter = diff === 0;
                const isLeft = diff === -1;
                const isRight = diff === 1;
                const isVisible = isCenter || isLeft || isRight;

                return (
                  <motion.div
                    key={testi.id}
                    animate={{
                      x: diff === 0 ? 0 : diff === -1 ? -offset : diff === 1 ? offset : diff < 0 ? -offset * 1.5 : offset * 1.5,
                      scale: isCenter ? 1.05 : isVisible ? 0.85 : 0.7,
                      rotateY: isCenter ? 0 : isLeft ? -35 : isRight ? 35 : diff < 0 ? -45 : 45,
                      opacity: isCenter ? 1 : isVisible ? 0.35 : 0,
                      zIndex: isCenter ? 10 : isVisible ? 5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    className="absolute w-[300px] sm:w-[480px] md:w-[580px] glass-card p-6 sm:p-10 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-2xl flex flex-col justify-between h-[340px] select-none"
                    style={{ 
                      backfaceVisibility: "hidden",
                      filter: isCenter ? "blur(0px) grayscale(0%)" : "blur(1.5px) grayscale(30%)",
                      pointerEvents: isCenter ? "auto" : "none"
                    }}
                  >
                    <div>
                      {/* Stars */}
                      {renderStars(testi.stars)}
                      <p className="text-gray-600 dark:text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed mb-6 italic">
                        "{testi.comment}"
                      </p>
                    </div>

                    <div className="flex items-center gap-4 border-t border-gray-100 dark:border-slate-800/80 pt-4">
                      <img
                        src={testi.avatar}
                        alt={testi.name}
                        className="w-14 h-14 rounded-full border border-gray-200 dark:border-slate-700 bg-white object-cover"
                      />
                      <div>
                        <h4 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-slate-100">
                          {testi.name}
                        </h4>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-6 mt-8">
              <button
                onClick={() => setCurrentReview((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="w-12 h-12 rounded-full border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-850 hover:scale-105 active:scale-95 transition-all text-gray-600 dark:text-slate-400 cursor-pointer"
                title="Previous Testimonial"
              >
                <span className="text-xl font-bold font-mono">←</span>
              </button>


              <button
                onClick={() => setCurrentReview((prev) => (prev + 1) % testimonials.length)}
                className="w-12 h-12 rounded-full border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-850 hover:scale-105 active:scale-95 transition-all text-gray-600 dark:text-slate-400 cursor-pointer"
                title="Next Testimonial"
              >
                <span className="text-xl font-bold font-mono">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* NEW Contact Me Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden transition-colors duration-300 border-t border-b border-gray-100 dark:border-slate-900/50">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-50 dark:bg-blue-950/10 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 max-w-6xl mx-auto items-center">
            
            {/* Info Column (Left) */}
            <div className="w-full lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-sm font-semibold">
                <LuMessageSquare className="text-blue-500" />
                <span>Get In Touch</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
                Have questions? <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Let's talk.</span>
              </h2>

              <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed">
                We're here to help you get the absolute most out of NitroBot. Send us a message, and our team will get back to you within 24 hours.
              </p>

              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-blue-600">
                    <LuMail className="text-lg" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400">Email us directly</div>
                    <a href="mailto:avinashguleria1009@gmail.com" className="text-sm font-bold hover:underline">avinashguleria1009@gmail.com</a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-blue-600">
                    <LuMapPin className="text-lg" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400">Our headquarters</div>
                    <div className="text-sm font-bold">Mandi, Himachal Pradesh</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Column (Right) */}
            <div className="w-full lg:w-1/2">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl p-8 lg:p-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-6">Send us a Message</h3>
                
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400" htmlFor="name">Your Name</label>
                      <input
                        type="text"
                        id="name"
                        required
                        className="premium-input"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400" htmlFor="email">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        required
                        className="premium-input"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400" htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      className="premium-input"
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400" htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      rows="4"
                      required
                      className="premium-input resize-none"
                      placeholder="Tell us what you need help with..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    ></textarea>
                  </div>

                  {submitStatus === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl text-green-700 dark:text-green-400 text-xs font-bold flex items-center gap-2"
                    >
                      <LuCheck className="text-lg" />
                      <span>Thank you! Your message was sent successfully.</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="premium-btn py-3.5 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <span>Send Message</span>
                        <LuSend className="text-sm" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* NEW Production-grade Footer Section */}
      <footer className="bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-900 py-16 transition-colors duration-300">
        <div className="container mx-auto px-6 max-w-6xl">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            {/* Column 1: Brand details */}
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <LuSparkles className="text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">NitroBot</span>
              </div>
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
                Next-generation interview preparation engine simulating actual industry loops, deep AI diagnostics, and confidence diagnostics.
              </p>
              
              {/* Social Buttons */}
              <div className="flex gap-4 pt-2">
                <a href="https://github.com/Avinashguleria0" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-800 flex items-center justify-center text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95 transition-all">
                  <LuGithub className="text-lg" />
                </a>
                <a href="http://linkedin.com/in/avinash-guleria-a18553324" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-800 flex items-center justify-center text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95 transition-all">
                  <LuLinkedin className="text-lg" />
                </a>
                <a href="https://twitter.com/notavinashg" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-800 flex items-center justify-center text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95 transition-all">
                  <LuTwitter className="text-lg" />
                </a>
                <a href="https://www.youtube.com/@AvinashCodes" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-800 flex items-center justify-center text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:scale-105 active:scale-95 transition-all">
                  <LuYoutube className="text-lg" />
                </a>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-900 dark:text-slate-200 tracking-wider uppercase">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
                <li><a href="#showcase-section" className="hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" onClick={handleCTA} className="hover:text-blue-600 transition-colors">Interactive Prep</a></li>
                <li><a href="#" onClick={handleCTA} className="hover:text-blue-600 transition-colors">Voice Simulator</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-1">Pricing <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-extrabold rounded-full">NEW</span></a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Roadmap</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-900 dark:text-slate-200 tracking-wider uppercase">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-blue-600 transition-colors">AI Concept Docs</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Practice Sets</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Developer Help</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-1">Discord <LuExternalLink className="text-[10px]" /></a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">System Status</a></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-900 dark:text-slate-200 tracking-wider uppercase">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Security Details</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Cookie Settings</a></li>
              </ul>
            </div>
          </div>



        </div>
      </footer>

      {/* Auth Modal */}
      <Modal
        isOpen={openAuthModel}
        onClose={() => {
          setOpenAuthModel(false);
          setCurrentPage("login");
        }}
        hideHeader
      >
        <div className="p-2">
          {currentPage === "login" && <Login setCurrentPage={setCurrentPage} />}
          {currentPage === "signup" && <SignUp setCurrentPage={setCurrentPage} />}
        </div>
      </Modal>

    </div>
  );
};

export default LandingPage;