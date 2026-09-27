import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuSparkles, LuBrain, LuTarget, LuZap, LuSun, LuMoon,
         LuMic, LuVolume2, LuCheck, LuStar, LuArrowRight, LuArrowLeft,
         LuCode, LuPlay, LuFileText, LuPin, LuTrendingUp, LuChevronDown,
         LuMousePointerClick, LuFolder, LuAward, LuShieldCheck, LuUsers, LuMessageSquare,
         LuLayers} from "react-icons/lu";
import Login from "../pages/Auth/Login";
import SignUp from "../pages/Auth/SignUp";
import Modal from "../components/Modal";
import ProfileInfoCard from "../components/cards/ProfileInfoCard";
import { UserContext } from "../context/UserContext";
import { ThemeContext } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const LandingPage = () => {
  const { user } = useContext(UserContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [openAuthModel, setOpenAuthModel] = useState(false);
  const [currentPage, setCurrentPage] = useState("login");
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Interactive Simulator Tab state
  const [demoRole, setDemoRole] = useState("Frontend Architect");
  const [demoRevealed, setDemoRevealed] = useState(false);
  const [demoNote, setDemoNote] = useState("Remember to mention React Fiber reconciler & double buffering!");
  const [demoPinned, setDemoPinned] = useState(true);
  const [isDemoSpeaking, setIsDemoSpeaking] = useState(false);

  // 3D Testimonials Carousel
  const [currentReview, setCurrentReview] = useState(1);

  const handleCTA = () => {
    if (!user) {
      setOpenAuthModel(true);
    } else {
      navigate("/dashboard");
    }
  };

  const playDemoAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      setIsDemoSpeaking(true);
      utterance.onend = () => setIsDemoSpeaking(false);
      utterance.onerror = () => setIsDemoSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const testimonials = [
    {
      id: 1,
      name: "Ashish Yadav",
      role: "Frontend Engineer @ Razorpay",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ashish&backgroundColor=b6e3f4",
      comment: "Prep completely changed my preparation strategy. The real-time AI voice feedback helped me fix my pacing, and the interactive concept breakdowns made system design questions click.",
      stars: 5,
    },
    {
      id: 2,
      name: "Sksham Kaushal",
      role: "Full-Stack Developer @ Alphabet Inc.",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Saksham&backgroundColor=c0aede",
      comment: "I was skeptical about AI interviewing, but the accuracy of the feedback blew me away. The 'Understand the Why' feature broke down complex networking topics in seconds. Got my offer!",
      stars: 5,
    },
    {
      id: 3,
      name: "Pratham Mittal",
      role: "Software Engineer",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Pratham&backgroundColor=d1d4f9",
      comment: "The customized behavioral question tracks and the ability to pin my notes and personal STAR method stories made learning structured and super low-stress.",
      stars: 4.5,
    },
    {
      id: 4,
      name: "Shivansh Mehta",
      role: "Backend Architect",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Shivansh&backgroundColor=ffdfbf",
      comment: "Highly recommend Prep to anyone prepping for senior tech loops. The mock interview engine allowed me to practice without stage fright and spot my verbal gaps.",
      stars: 5,
    },
    {
      id: 5,
      name: "Arnav Verma",
      role: "Platform Engineer",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Arnav&backgroundColor=ffd5dc",
      comment: "The UI is clean, intuitive and lightning-fast. Creating mock interview collections and inspecting the industry standard answers gave me immense confidence.",
      stars: 5,
    }
  ];

  const roleTagsMap = {
    "Frontend Architect": ["React Fiber", "State Machines", "Web Vitals", "SSR vs CSR", "Micro-frontends"],
    "Backend Engineer": ["Distributed Systems", "PostgreSQL Indexing", "gRPC", "Redis Caching", "Kafka"],
    "System Design Lead": ["CAP Theorem", "Sharding", "Rate Limiting", "Consistent Hashing", "Message Queues"],
    "DevOps / SRE": ["Kubernetes", "CI/CD Pipelines", "Terraform", "Zero-Downtime Deploy", "Observability"]
  };

  const featureTabs = [
    { id: 0, title: "1. Dedicated Tech & HR Tracks", icon: LuBrain, desc: "Domain-tailored tracks for both deep technical mastery and structured behavioral STAR interviews." },
    { id: 1, title: "2. Interactive Concept Chat", icon: LuCode, desc: "Chat in real-time with your AI Mentor inside any question with full role and architecture context." },
    { id: 2, title: "3. 24/7 AI Doubt Solver", icon: LuSparkles, desc: "Debug code bugs, compare system trade-offs, and master algorithm edge cases with monthly tokens." },
    { id: 3, title: "4. Privacy-First Voice Mocks", icon: LuMic, desc: "High-fidelity AI voice interviews with zero camera or video pressure. Speak naturally and get evaluated." },
    { id: 4, title: "5. Multi-Metric Evaluation", icon: LuTrendingUp, desc: "Granular scoring on technical correctness, speech confidence, and missed edge cases." }
  ];

  const workflowSteps = [
    {
      number: "01",
      badge: "Step 01",
      title: "Prepare & Curate",
      description: "Generate high-impact question banks tailored to your target company level, tech stack, and weak spots.",
      icon: LuLayers,
      highlights: ["Smart Topic Mapping", "Custom Seniority Tracks"],
      gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
    },
    {
      number: "02",
      badge: "Step 02",
      title: "Live Voice Simulation",
      description: "Join an immersive mock room where the AI listens, handles pauses, and asks dynamic clarifying questions.",
      icon: LuMic,
      highlights: ["Real-time Audio Engine", "Dynamic Follow-up Logic"],
      gradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
    },
    {
      number: "03",
      badge: "Step 03",
      title: "Evaluate & Perfect",
      description: "Review your scores, playback your speech, inspect industry standard answers, and track progress over time.",
      icon: LuTrendingUp,
      highlights: ["Multi-Metric Scoring", "Detailed Rubric Breakdown"],
      gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
    },
  ];

  const workflowContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.22,
        delayChildren: 0.1,
      },
    },
  };

  const workflowCardVariants = {
    hidden: { opacity: 0, y: 35, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 18,
        mass: 0.8,
      },
    },
  };
  return (
    <div className="bg-[var(--color-bg)] min-h-screen text-[var(--color-text-primary)] transition-colors duration-200 overflow-x-hidden math-notebook-pattern">

      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-border)] transition-colors duration-200">
        <div className="container mx-auto px-6 h-full flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <img
              src="/Proview-Symbol.png"
              alt="Prep"
              className="w-8 h-8 object-contain rounded-lg border border-[var(--color-border)] shadow-xs"
            />
            <span className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
              Prep
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--color-text-secondary)]">
            <button 
              onClick={() => document.getElementById("simulator-section")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              Interactive Simulator
            </button>
            <button 
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              How It Works
            </button>
            <button 
              onClick={() => document.getElementById("testimonials-section")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              Success Stories
            </button>
          </nav>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text-secondary)]"
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <LuSun className="text-base text-amber-400" />
              ) : (
                <LuMoon className="text-base text-slate-700" />
              )}
            </button>

            {user ? (
              <ProfileInfoCard />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
                  onClick={() => {
                    setCurrentPage("login");
                    setOpenAuthModel(true);
                  }}
                >
                  Log In
                </button>
                <button
                  className="px-4 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all shadow-sm active:scale-95"
                  onClick={() => {
                    setCurrentPage("signup");
                    setOpenAuthModel(true);
                  }}
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section: Clean & Slick ─── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Soft Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-blue-500/15 blur-[130px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-14">
            
            {/* Left Hero Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 space-y-6 text-center lg:text-left"
            >
              
             
           
              
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] tracking-tight text-[var(--color-text-primary)]">
                Master your next interview with{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  AI precision.
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-base lg:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-xl mx-auto lg:mx-0">
                Experience real-time voice interviews, get deeply personalized feedback on speech confidence and technical depth, and master senior engineering loops without the anxiety.
              </p>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
                <button
                  onClick={handleCTA}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-7 py-3.5 rounded-xl font-medium text-base transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  Start Practicing Free
                  <LuArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button 
                  onClick={() => document.getElementById("simulator-section")?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] px-6 py-3.5 rounded-xl font-medium text-base hover:bg-[var(--color-bg)] hover:border-[var(--color-accent)]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs"
                >
                  <LuPlay className="w-4 h-4 text-[var(--color-accent)]" />
                  Try Live Simulator
                </button>
              </div>

            </motion.div>

            {/* Right Hero Visual: Browser Mockup with Real Product Demo Video */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="w-full lg:w-1/2 flex justify-center relative"
            >
              <div className="relative w-full max-w-xl">
                
               

            

                {/* Product Video Browser Frame */}
                <div className="relative z-10 rounded-2xl sm:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-indigo-500/10 overflow-hidden">
                  
                  {/* Minimal Browser Header Bar */}
                  <div className="flex items-center px-4 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                  </div>

                  {/* Video Showcase Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900">
                    
                    {/* Smooth Animated Skeleton & Pulse Loader (Shown while video buffers/renders) */}
                    <div 
                      className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm transition-opacity duration-700 pointer-events-none ${
                        isVideoLoaded ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      {/* Animated Shimmer Wave */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      
                      <div className="relative flex flex-col items-center gap-3">
                        <div className="relative flex items-center justify-center">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                            <LuSparkles className="w-6 h-6 animate-pulse" />
                          </div>
                          <span className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-sm animate-ping pointer-events-none" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-200 tracking-wide">
                            Initializing AI Interview Session
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Loading real-time voice & video stream...
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actual Video with Smooth Fade-In */}
                    <video 
                      src="/subject.mp4" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      preload="auto"
                      onLoadedData={() => setIsVideoLoaded(true)}
                      onCanPlay={() => setIsVideoLoaded(true)}
                      className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-700 ${
                        isVideoLoaded ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    {/* Overlay: Live AI Interview Status Tag */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium pointer-events-none">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                      </span>
                      <span>Live AI Interview</span>
                    </div>

                    {/* Corner gradient scrim to seamlessly blend watermark area */}
                    <div className="absolute bottom-0 right-0 w-64 h-36 bg-gradient-to-tl from-black/50 via-black/10 to-transparent pointer-events-none" />

                    {/* Floating Product Status Card (Precisely covers the Gemini AI watermark) */}
                    <motion.div 
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                      className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 bg-[var(--color-surface)]/95 border border-[var(--color-border)] rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xl backdrop-blur-md flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-indigo-500/10 text-[var(--color-accent)] flex items-center justify-center font-bold text-xs sm:text-sm">
                        9.6
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                          <span>AI Evaluation</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] font-medium">
                          Passed with Distinction
                        </div>
                      </div>
                    </motion.div>

                  </div>

                </div>

               

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── Interactive Sticky Simulator Section (User Favorite) ─── */}
      <section id="simulator-section" className="py-24 border-t border-[var(--color-border)] bg-[var(--color-surface)]/50 relative transition-colors duration-200">
        <div className="container mx-auto px-6 max-w-7xl">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-semibold mb-3">
              <LuMousePointerClick className="text-sm" />
              <span>Interactive Feature Playground</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3">
              Try Prep features right here
            </h2>
            <p className="text-base text-[var(--color-text-secondary)]">
              Click through the tabs below to explore how Prep personalizes questions, reveals deep AI insights, and evaluates your voice answers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Selector Tabs (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {featureTabs.map((tab) => {
                const IconComponent = tab.icon;
                const isSelected = activeFeature === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveFeature(tab.id)}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                      isSelected
                        ? "bg-[var(--color-surface)] border-[var(--color-accent)] shadow-md translate-x-1"
                        : "bg-[var(--color-surface)]/60 border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected 
                          ? "bg-[var(--color-accent)] text-white" 
                          : "bg-[var(--color-bg)] text-[var(--color-text-secondary)]"
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className={`text-sm font-semibold mb-1 ${
                          isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"
                        }`}>
                          {tab.title}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                          {tab.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Interactive Screen (7 cols) */}
            <div className="lg:col-span-7 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-6 min-h-[460px] flex flex-col justify-between">
              
              {/* Simulator Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="px-3 py-1 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[10px] font-semibold text-[var(--color-text-muted)] tracking-wider uppercase">
                  Prep Interactive Simulator
                </div>
              </div>

              {/* Dynamic Content Views */}
              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 0: Tailored Setup */}
                  {activeFeature === 0 && (
                    <motion.div
                      key="tab0"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-5"
                    >
                      <div>
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                          Select Role to Generate Custom Track:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(roleTagsMap).map((r) => (
                            <button
                              key={r}
                              onClick={() => setDemoRole(r)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                demoRole === r
                                  ? "bg-[var(--color-accent)] text-white border-transparent shadow-sm"
                                  : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/30"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--color-accent)]">Generated Core Topics</span>
                          <span className="text-[10px] text-[var(--color-text-muted)]">3 Yrs Experience Target</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {roleTagsMap[demoRole].map((tag) => (
                            <span key={tag} className="text-xs font-medium px-2.5 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)]">
                              ✓ {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-[var(--color-text-muted)] italic">
                        Tip: In the actual app, you can enter any custom role title, duration (5-15 min) and persona style.
                      </p>
                    </motion.div>
                  )}

                  {/* TAB 1: Concept Explainer */}
                  {activeFeature === 1 && (
                    <motion.div
                      key="tab1"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]">
                        <div className="text-[11px] font-bold text-[var(--color-accent)] mb-1">INTERVIEW QUESTION</div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          "How does Node.js handle asynchronous I/O with libuv's Event Loop?"
                        </p>
                      </div>

                      <button
                        onClick={() => setDemoRevealed(!demoRevealed)}
                        className="w-full py-2.5 px-4 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 text-xs font-semibold hover:bg-[var(--color-accent)] hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <LuSparkles />
                        {demoRevealed ? "Hide AI Breakdown" : "Click to Reveal AI Explainer"}
                      </button>

                      {demoRevealed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] space-y-2 overflow-hidden"
                        >
                          <div className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">// 1. Non-blocking System Calls</div>
                          <p>Node delegates I/O tasks to libuv worker threads or OS kernel epoll/kqueue.</p>
                          <div className="font-mono text-amber-600 dark:text-amber-400 font-semibold">// 2. Phases of Execution</div>
                          <p>Timers → Pending Callbacks → Poll → Check (setImmediate) → Close Callbacks.</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 2: Notes & Pinning */}
                  {activeFeature === 2 && (
                    <motion.div
                      key="tab2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-border)]">
                        <div className="text-xs font-medium text-[var(--color-text-primary)]">
                          "Explain React Concurrent Mode"
                        </div>
                        <button
                          onClick={() => setDemoPinned(!demoPinned)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1 transition-colors ${
                            demoPinned
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                          }`}
                        >
                          <LuPin className="w-3 h-3" />
                          {demoPinned ? "Pinned to Top" : "Pin Question"}
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1.5">
                          Personal STAR Story & Insights:
                        </label>
                        <textarea
                          value={demoNote}
                          onChange={(e) => setDemoNote(e.target.value)}
                          className="premium-input text-xs h-24 resize-none"
                          placeholder="Type your notes..."
                        />
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Autosaved to your private preparation workspace.
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: Voice Mock Simulation */}
                  {activeFeature === 3 && (
                    <motion.div
                      key="tab3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-center space-y-5"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full border-2 border-[var(--color-accent)] flex items-center justify-center animate-pulse">
                          <LuMic className="w-6 h-6 text-[var(--color-accent)]" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                          AI Interviewer Voice Active
                        </span>
                      </div>

                      <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          "Tell me about a time you resolved a major production bottleneck under strict SLA limits."
                        </p>
                      </div>

                      <button
                        onClick={() => playDemoAudio("Tell me about a time you resolved a major production bottleneck under strict SLA limits.")}
                        disabled={isDemoSpeaking}
                        className="premium-btn max-w-xs mx-auto py-2.5 text-xs"
                      >
                        <LuVolume2 className="w-4 h-4" />
                        {isDemoSpeaking ? "Playing AI Speech..." : "Hear AI Interviewer Voice"}
                      </button>
                    </motion.div>
                  )}

                  {/* TAB 4: Multi-Metric Evaluation */}
                  {activeFeature === 4 && (
                    <motion.div
                      key="tab4"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)] text-center">
                          <div className="text-2xl font-black text-emerald-500">9.2 / 10</div>
                          <div className="text-xs font-semibold text-[var(--color-text-muted)] mt-1">Accuracy Score</div>
                        </div>
                        <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)] text-center">
                          <div className="text-2xl font-black text-indigo-500">88%</div>
                          <div className="text-xs font-semibold text-[var(--color-text-muted)] mt-1">Speech Confidence</div>
                        </div>
                      </div>

                      <div className="bg-[var(--color-bg)] p-3.5 rounded-xl border border-[var(--color-border)] text-xs space-y-2">
                        <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                          <LuCheck className="text-emerald-500" /> Key Strengths Identified:
                        </div>
                        <p className="text-[var(--color-text-secondary)]">Clear separation of concerns, mentioned circuit breakers & distributed tracing.</p>
                        <div className="font-semibold text-amber-500 flex items-center gap-1.5 pt-1">
                          <LuZap className="text-amber-500" /> Recommended Additions:
                        </div>
                        <p className="text-[var(--color-text-secondary)]">Quantify database load reduction percentage in the result stage.</p>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom Interactive Progress indicator */}
              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>Interactive feature {activeFeature + 1} of 5</span>
                <div className="flex gap-1.5">
                  {featureTabs.map((tab) => (
                    <div 
                      key={tab.id}
                      onClick={() => setActiveFeature(tab.id)}
                      className={`h-1.5 rounded-full cursor-pointer transition-all ${
                        activeFeature === tab.id 
                          ? "w-6 bg-[var(--color-accent)]" 
                          : "w-2 bg-[var(--color-border)]"
                      }`}
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

        {/* ─── How It Works: 3 Step Workflow Pipeline ─── */}
        <section id="how-it-works" className="relative py-28 overflow-hidden border-t border-[var(--color-border)]">
          {/* Ambient background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-20">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-semibold tracking-wide uppercase mb-4"
              >
                <LuSparkles className="text-sm animate-pulse" />
                <span>Structured Progression</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4"
              >
                Three steps to{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  interview mastery
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base text-[var(--color-text-secondary)] leading-relaxed"
              >
                A high-fidelity preparation pipeline engineered around the rigorous hiring loops of premier tech teams.
              </motion.p>
            </div>

            {/* Workflow Cards Grid / Pipeline */}
            <div className="relative">
              
              {/* Animated Connecting Pipeline SVG (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-0 px-12">
                <svg
                  className="w-full h-24 overflow-visible"
                  viewBox="0 0 900 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="pipeline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Base Subtle Track */}
                  <path
                    d="M 50 50 C 250 15, 350 85, 500 50 C 650 15, 750 85, 850 50"
                    stroke="var(--color-border)"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeOpacity="0.8"
                  />

                  {/* Glowing Animated Dash Pipeline */}
                  <path
                    d="M 50 50 C 250 15, 350 85, 500 50 C 650 15, 750 85, 850 50"
                    stroke="url(#pipeline-gradient)"
                    strokeWidth="2"
                    strokeDasharray="8 8"
                    className="animate-dash"
                  />
                </svg>
              </div>

              {/* Cards List */}
              <motion.div
                variants={workflowContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10"
              >
                {workflowSteps.map((step, idx) => {
                  const Icon = step.icon;
                  
                  const staggerOffsetClass =
                    idx === 0
                      ? "md:translate-y-0"
                      : idx === 1
                      ? "md:translate-y-4"
                      : "md:translate-y-8";

                  return (
                    <motion.div
                      key={step.number}
                      variants={workflowCardVariants}
                      className={`group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5 ${staggerOffsetClass}`}
                    >
                      {/* Outer Glow Halo on Hover */}
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-[var(--color-accent)] to-transparent opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-500 pointer-events-none" />

                      {/* Glassmorphic Card Surface */}
                      <div className="relative h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/75 backdrop-blur-xl p-7 shadow-lg shadow-black/5 dark:shadow-black/20 transition-all duration-300 group-hover:border-[var(--color-accent)]/50 group-hover:shadow-[0_12px_30px_-10px_rgba(79,70,229,0.18)] dark:group-hover:shadow-[0_12px_30px_-10px_rgba(129,140,248,0.22)]">
                        
                        {/* Subtle Inner Highlight Border (Top Edge Sheen) */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />
                        
                        {/* Faint Gradient Underlay */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${step.gradient} opacity-50 pointer-events-none transition-opacity duration-300 group-hover:opacity-100`} />

                        {/* Oversized Watermark Step Number */}
                        <span 
                          aria-hidden="true" 
                          className="absolute -top-3 right-3 text-7xl lg:text-8xl font-black tracking-tighter text-[var(--color-text-primary)] opacity-[0.04] dark:opacity-[0.06] select-none pointer-events-none transition-all duration-300 group-hover:scale-105 group-hover:opacity-[0.08] dark:group-hover:opacity-[0.1]"
                        >
                          {step.number}
                        </span>

                        {/* Top Row: Mini Icon Badge & Step Label */}
                        <div className="relative z-10 mb-6">
                          <div className="flex items-center justify-between mb-5">
                            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm flex items-center justify-center text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                              <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:border-[var(--color-accent)]/30 transition-colors">
                              {step.badge}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2.5 tracking-tight flex items-center gap-1.5">
                            {step.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        {/* Feature Highlights Pills */}
                        <div className="relative z-10 pt-5 border-t border-[var(--color-border)]/60 space-y-2">
                          {step.highlights.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                              <LuCheck className="w-3.5 h-3.5 text-[var(--color-accent)] flex-shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>

                        {/* Subtle Bottom Accent Strip on Hover */}
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

          </div>
        </section>

      {/* ─── 3D Testimonials / Candidate Reviews ─── */}
      <section id="testimonials-section" className="py-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-semibold mb-3">
              <LuAward className="text-sm" />
              <span>Proven Results</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3">
              Loved by engineers landing top offers
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              From FAANG loops to high-growth startup rounds, candidates rely on Prep for real confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((item) => (
              <div 
                key={item.id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Stars */}
                  <div className="flex gap-1 mb-4 text-amber-400">
                    {[...Array(Math.floor(item.stars))].map((_, i) => (
                      <LuStar key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6 italic">
                    "{item.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
                  <img 
                    src={item.avatar} 
                    alt={item.name}
                    className="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]" 
                  />
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">{item.name}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Banner ─── */}
      <section className="py-20 border-t border-[var(--color-border)] bg-[var(--color-surface)] relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
            Ready to ace your upcoming interview?
          </h2>
          <p className="text-base text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8">
            Create your custom interview track in 30 seconds and start practicing with voice AI immediately.
          </p>
          <button
            onClick={handleCTA}
            className="bg-[var(--color-accent)] text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-[var(--color-accent-hover)] transition-all shadow-lg active:scale-95 inline-flex items-center gap-2"
          >
            Start Free Practice Now
            <LuArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--color-border)] py-8 bg-[var(--color-bg)]">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/Proview-Symbol.png"
              alt="Proview"
              className="w-5 h-5 object-contain rounded-md"
            />
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Prep</span>
            <span className="text-xs text-[var(--color-text-muted)] ml-2">© 2026 Prep Platform. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            <span>Built for serious software engineering preparation</span>
          </div>
        </div>
      </footer>

      {/* ─── Auth Modal ─── */}
      <Modal
        isOpen={openAuthModel}
        onClose={() => setOpenAuthModel(false)}
        hideHeader
      >
        {currentPage === "login" ? (
          <Login setCurrentPage={setCurrentPage} />
        ) : (
          <SignUp setCurrentPage={setCurrentPage} />
        )}
      </Modal>

    </div>
  );
};

export default LandingPage;