import React, { useState, useEffect, useContext, useRef } from "react";
import {
  LuPlus,
  LuSparkles,
  LuBrain,
  LuTarget,
  LuTrendingUp,
  LuCode,
  LuUsers,
  LuSearch,
  LuPlay,
  LuFilter,
  LuArrowRight,
  LuFlame,
  LuClock,
  LuLightbulb,
} from "react-icons/lu";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "../../utils/apiPaths";
import axioInstance from "../../utils/axioInstance";
import SummaryCard from "../../components/cards/SummaryCard";
import moment from "moment";
import Modal from "../../components/Modal";
import CreateSessionForm from "./CreateSessionForm";
import DeleteAlertContent from "../../components/DeleteAlertContent";
import { UserContext } from "../../context/UserContext";

import QuestionBankModal from "./components/QuestionBankModal";
import PastMocksModal from "./components/PastMocksModal";
import QuickMockInterviewModal from "./components/QuickMockInterviewModal";

const TECH_TEMPLATES = [
  {
    role: "Senior Frontend Engineer",
    experience: "3",
    topicsToFocus: "React Fiber, Performance, TypeScript, SSR & State Management",
    description: "Targeting Staff/Senior Web Architecture & Component Architecture",
    badge: "Popular",
    trackType: "technical",
  },
  {
    role: "Backend & Distributed Systems",
    experience: "4",
    topicsToFocus: "Microservices, PostgreSQL Indexing, Redis, gRPC, Kafka",
    description: "High-concurrency backend services, caching topologies & databases",
    badge: "High Demand",
    trackType: "technical",
  },
  {
    role: "System Design & Architecture",
    experience: "5",
    topicsToFocus: "Distributed Caching, Sharding, CAP, Load Balancing, Rate Limiters",
    description: "Scalable enterprise architecture & trade-off evaluations",
    badge: "Senior Loop",
    trackType: "technical",
  },
  {
    role: "Full-Stack Software Engineer",
    experience: "2",
    topicsToFocus: "Node.js, React, REST API, Auth, MongoDB, Docker",
    description: "End-to-end full stack development, deployment & security",
    badge: "Starter",
    trackType: "technical",
  },
];

const HR_TEMPLATES = [
  {
    role: "Behavioral & STAR Mastery",
    experience: "3",
    topicsToFocus: "Conflict Resolution, Ownership, Handling Production Incidents, Project Pride",
    description: "Comprehensive behavioral interview preparation with STAR structuring",
    badge: "Essential",
    trackType: "hr",
  },
  {
    role: "Engineering Leadership & Influence",
    experience: "5",
    topicsToFocus: "Mentorship, Cross-Functional Alignment, Handling Disagreements, Technical Vision",
    description: "Senior & Staff leadership behavior, technical vision, and organizational impact",
    badge: "Staff / Lead",
    trackType: "hr",
  },
  {
    role: "Culture Fit & Team Collaboration",
    experience: "2",
    topicsToFocus: "Team Communication, Adaptability, Feedback Reception, Company Values",
    description: "Culture fit, collaboration style, and interpersonal dynamics",
    badge: "High Impact",
    trackType: "hr",
  },
  {
    role: "HR Screening & Career Trajectory",
    experience: "3",
    topicsToFocus: "Tell Me About Yourself, Career Transitions, Salary & Motivation, Strengths",
    description: "First-round HR recruiter screening and elevator pitch mastery",
    badge: "Screening",
    trackType: "hr",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // Active dashboard view mode: "technical" | "hr"
  const [activeDashboardTab, setActiveDashboardTab] = useState("technical");

  // Track filter: "all" | "technical" | "hr"
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal dialog states
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ open: false, data: null });
  const [openQuestionBankModal, setOpenQuestionBankModal] = useState(false);
  const [openPastMocksModal, setOpenPastMocksModal] = useState(false);
  const [openQuickInterviewModal, setOpenQuickInterviewModal] = useState(false);

  const tracksSectionRef = useRef(null);

  const fetchAllSessions = async () => {
    try {
      setIsLoading(true);
      const response = await axioInstance.get(API_PATHS.SESSION.GET_ALL);
      setSessions(response.data || []);
    } catch (error) {
      console.error("Error fetching session data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionData) => {
    try {
      await axioInstance.delete(API_PATHS.SESSION.DELETE(sessionData._id));
      setSessions((prev) => prev.filter((s) => s._id !== sessionData._id));
      setOpenDeleteAlert({ open: false, data: null });
      toast.success("Session deleted successfully");
    } catch (error) {
      toast.error("Failed to delete session");
      console.error("Delete error:", error);
    }
  };

  useEffect(() => {
    fetchAllSessions();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  const totalQuestions = sessions.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
  const totalAttempts = sessions.reduce((acc, s) => acc + (s.attempts?.length || 0), 0);

  const handleLaunchTemplate = (tpl) => {
    setTemplateData(tpl);
    setOpenCreateModal(true);
  };

  const scrollToTracks = () => {
    setFilterType("all");
    setSearchQuery("");
    tracksSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filtered tracks based on search and category
  const filteredSessions = sessions.filter((s) => {
    const isHrTrack =
      s.trackType === "hr" ||
      /hr|human resource|behavioral|culture|leadership|recruiter/i.test(
        `${s.role || ""} ${s.topicsToFocus || ""}`
      );

    const matchesCategory =
      filterType === "all" ||
      (filterType === "technical" && !isHrTrack) ||
      (filterType === "hr" && isHrTrack);

    const matchesSearch =
      (s.role && s.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.topicsToFocus &&
        (Array.isArray(s.topicsToFocus) ? s.topicsToFocus.join(" ") : s.topicsToFocus)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const isHrMode = activeDashboardTab === "hr";
  const activeTemplates = isHrMode ? HR_TEMPLATES : TECH_TEMPLATES;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--color-bg)] transition-colors duration-200">
        <div className="container mx-auto pt-6 pb-20 px-4 sm:px-6 max-w-6xl">
          
          {/* Top Header Bar */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                  Prep Workspace
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {moment().format("dddd, MMM D")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                {sessions.length > 0
                  ? `You have ${sessions.length} interview track${sessions.length !== 1 ? "s" : ""} configured. Ready for your next mock simulation?`
                  : "Welcome! Choose a track below or start an instant mock round to begin."}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <button
                className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-primary)] font-medium px-4 py-2.5 rounded-xl transition-all text-xs sm:text-sm shadow-xs hover:shadow active:scale-[0.98] cursor-pointer"
                onClick={() => setOpenQuickInterviewModal(true)}
                title="Launch a mock round directly without creating a track"
              >
                <LuPlay className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Quick Mock Round</span>
              </button>

              <button
                className={`flex items-center gap-2 text-white font-medium px-4 py-2.5 rounded-xl transition-all text-xs sm:text-sm shadow-xs hover:shadow active:scale-[0.98] cursor-pointer ${
                  isHrMode
                    ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                    : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                }`}
                onClick={() => {
                  setTemplateData(null);
                  setOpenCreateModal(true);
                }}
              >
                <LuPlus className="w-4 h-4" />
                <span>Create {isHrMode ? "HR Track" : "Tech Track"}</span>
              </button>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-7">
            {/* 1. Interview Tracks */}
            <div
              onClick={scrollToTracks}
              className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
              title="Click to view all active interview tracks"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <div className="w-6 h-6 rounded-md bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center">
                    <LuBrain className="w-3.5 h-3.5" />
                  </div>
                  <span>Interview Tracks</span>
                </div>
                <span className="text-[10px] font-semibold text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  View <LuArrowRight className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {sessions.length}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Active prep curricula
              </p>
            </div>

            {/* 2. Total Q&A Bank */}
            <div
              onClick={() => setOpenQuestionBankModal(true)}
              className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-emerald-500/50 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
              title="Click to open the complete Question Bank view"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <LuTarget className="w-3.5 h-3.5" />
                  </div>
                  <span>Total Q&A Bank</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Open <LuArrowRight className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {totalQuestions}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Curated technical & behavioral questions
              </p>
            </div>

            {/* 3. Mocks Completed */}
            <div
              onClick={() => setOpenPastMocksModal(true)}
              className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-amber-500/50 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
              title="Click to view all past completed mock interviews and feedback"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <LuTrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span>Mocks Completed</span>
                </div>
                <span className="text-[10px] font-semibold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Reports <LuArrowRight className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {totalAttempts}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Full-length simulated rounds assessed
              </p>
            </div>
          </div>

          {/* Domain Selection Tabs (Technical vs HR/Behavioral) */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-surface)] p-2 rounded-2xl border border-[var(--color-border)] shadow-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setActiveDashboardTab("technical");
                  setFilterType("all");
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeDashboardTab === "technical"
                    ? "bg-[var(--color-accent)] text-white shadow-xs"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
                }`}
              >
                <LuCode className="w-4 h-4" />
                <span>Technical Tracks</span>
              </button>

              <button
                onClick={() => {
                  setActiveDashboardTab("hr");
                  setFilterType("hr");
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeDashboardTab === "hr"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
                }`}
              >
                <LuUsers className="w-4 h-4" />
                <span>HR & Behavioral</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20">
                  STAR Method
                </span>
              </button>
            </div>

            <div className="text-xs text-[var(--color-text-muted)] px-2 flex items-center gap-1.5">
              <LuLightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isHrMode
                  ? "Evaluates communication, ownership, and STAR story structure."
                  : "Evaluates algorithms, architecture trade-offs, and scalability."}
              </span>
            </div>
          </div>

          {/* Quick Start Templates Strip */}
          <div className="mb-8 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <LuSparkles
                  className={`w-4 h-4 ${
                    isHrMode ? "text-purple-500" : "text-[var(--color-accent)]"
                  }`}
                />
                <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                  {isHrMode
                    ? "Curated HR & Behavioral Templates"
                    : "Quick Start Technical Templates"}
                </h3>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">
                Instant 1-click tailored Q&A setup
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {activeTemplates.map((tpl, i) => (
                <div
                  key={i}
                  onClick={() => handleLaunchTemplate(tpl)}
                  className={`p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] transition-all cursor-pointer group flex flex-col justify-between hover:shadow-xs ${
                    isHrMode
                      ? "hover:border-purple-500/60 hover:bg-[var(--color-surface)]"
                      : "hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          isHrMode
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                        }`}
                      >
                        {tpl.badge}
                      </span>
                      <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                        {tpl.experience} yrs exp
                      </span>
                    </div>
                    <h4
                      className={`text-xs font-bold text-[var(--color-text-primary)] transition-colors leading-tight ${
                        isHrMode
                          ? "group-hover:text-purple-600 dark:group-hover:text-purple-400"
                          : "group-hover:text-[var(--color-accent)]"
                      }`}
                    >
                      {tpl.role}
                    </h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                  <div
                    className={`mt-3 pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[11px] font-semibold ${
                      isHrMode ? "text-purple-600 dark:text-purple-400" : "text-[var(--color-accent)]"
                    }`}
                  >
                    <span>Launch Track</span>
                    <LuArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks Section Header & Search/Filter */}
          <div ref={tracksSectionRef} className="pt-1 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Configured Tracks ({filteredSessions.length})
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Continue practice or start mock rounds from your tracks
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-64">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by role or topic..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 p-0.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      filterType === "all"
                        ? "bg-[var(--color-accent)] text-white font-semibold"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType("technical")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      filterType === "technical"
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    Tech
                  </button>
                  <button
                    onClick={() => setFilterType("hr")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      filterType === "hr"
                        ? "bg-purple-600 text-white font-semibold"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    HR
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tracks Grid or Clean Empty State */}
          {filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((data, index) => {
                const isHr =
                  data.trackType === "hr" ||
                  /hr|human resource|behavioral|culture|leadership|recruiter/i.test(
                    `${data.role || ""} ${data.topicsToFocus || ""}`
                  );
                return (
                  <div key={data._id || index} className="relative group">
                    {isHr && (
                      <span className="absolute top-3.5 right-12 z-10 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        HR Round
                      </span>
                    )}
                    <SummaryCard
                      role={data?.role || ""}
                      topicsToFocus={data?.topicsToFocus || ""}
                      experience={data?.experience || ""}
                      questions={data?.questions?.length || 0}
                      description={data?.description || ""}
                      lastUpdated={
                        data?.updatedAt
                          ? moment(data.updatedAt).format("MMM Do, YYYY")
                          : ""
                      }
                      onSelect={() => navigate(`/interview-prep/${data?._id}`)}
                      onDelete={() => setOpenDeleteAlert({ open: true, data })}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* Clean Empty State */
            <div className="flex flex-col items-center justify-center py-14 px-4 border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/50 mt-2 text-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-xs ${
                  isHrMode
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                }`}
              >
                {isHrMode ? <LuUsers className="w-6 h-6" /> : <LuBrain className="w-6 h-6" />}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">
                {searchQuery || filterType !== "all"
                  ? "No matching interview tracks found"
                  : isHrMode
                  ? "No HR & Behavioral Tracks Yet"
                  : "No Technical Interview Tracks Yet"}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mb-5 leading-relaxed">
                {searchQuery
                  ? "Try adjusting your search terms or reset the filters to see all tracks."
                  : isHrMode
                  ? "Select one of the curated behavioral templates above or create a custom track with your own target role."
                  : "Pick a quick start template above or create a custom target track to generate tailored interview questions."}
              </p>
              <button
                className={`text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all text-xs sm:text-sm active:scale-[0.98] shadow-xs cursor-pointer ${
                  isHrMode
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                }`}
                onClick={() => {
                  setTemplateData(null);
                  setOpenCreateModal(true);
                }}
              >
                <LuPlus className="w-4 h-4" />
                <span>Configure {isHrMode ? "First HR Track" : "First Tech Track"}</span>
              </button>
            </div>
          )}

          {/* Mobile Floating Action Button */}
          {sessions.length > 0 && (
            <button
              className="md:hidden fixed bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-[var(--color-accent)] text-white rounded-full shadow-lg z-20 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all cursor-pointer"
              onClick={() => {
                setTemplateData(null);
                setOpenCreateModal(true);
              }}
              aria-label="Create new track"
            >
              <LuPlus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Create Track Modal */}
      <Modal
        isOpen={openCreateModal}
        onClose={() => {
          setOpenCreateModal(false);
          setTemplateData(null);
        }}
        hideHeader
      >
        <CreateSessionForm
          initialData={templateData}
          defaultTrackType={activeDashboardTab}
        />
      </Modal>

      {/* Direct Quick Mock Interview Modal */}
      <QuickMockInterviewModal
        isOpen={openQuickInterviewModal}
        onClose={() => setOpenQuickInterviewModal(false)}
        sessions={sessions}
      />

      {/* Complete Q&A Bank Modal */}
      <QuestionBankModal
        isOpen={openQuestionBankModal}
        onClose={() => setOpenQuestionBankModal(false)}
        sessions={sessions}
      />

      {/* Past Mocks History Modal */}
      <PastMocksModal
        isOpen={openPastMocksModal}
        onClose={() => setOpenPastMocksModal(false)}
        sessions={sessions}
      />

      {/* Delete Track Confirmation Modal */}
      {openDeleteAlert.open && (
        <Modal
          isOpen={openDeleteAlert?.open}
          onClose={() => setOpenDeleteAlert({ open: false, data: null })}
          title="Delete Track"
        >
          <DeleteAlertContent
            content="Are you sure you want to delete this track? All questions, notes, and past interview attempt reports in this track will be permanently removed."
            onDelete={() => deleteSession(openDeleteAlert.data)}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
