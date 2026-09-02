import React, { useState, useEffect, useContext } from "react";
import { LuPlus, LuSparkles, LuBrain, LuFlame, LuTarget, LuClock, LuTrendingUp } from "react-icons/lu";
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

const QUICK_TEMPLATES = [
  {
    role: "Senior Frontend Engineer",
    experience: "3",
    topicsToFocus: "React Fiber, Performance, TypeScript, SSR & State Management",
    description: "Targeting Staff/Senior Web Architecture & System Design",
    badge: "Popular"
  },
  {
    role: "Backend & Distributed Systems",
    experience: "4",
    topicsToFocus: "Microservices, PostgreSQL Indexing, Redis, gRPC, Kafka",
    description: "High concurrency backend services & databases",
    badge: "High Demand"
  },
  {
    role: "System Design & Architecture",
    experience: "5",
    topicsToFocus: "Distributed Caching, Sharding, CAP, Load Balancing, Rate Limiters",
    description: "Scalable architecture & trade-off evaluations",
    badge: "Senior Loop"
  },
  {
    role: "Full-Stack Software Engineer",
    experience: "2",
    topicsToFocus: "Node.js, React, REST API, Auth, MongoDB, Docker",
    description: "End-to-end web engineering & deployment",
    badge: "Starter"
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    open: false,
    data: null,
  });

  const fetchAllSessions = async () => {
    try {
      const response = await axioInstance.get(API_PATHS.SESSION.GET_ALL);
      setSessions(response.data || []);
    } catch (error) {
      console.error("Error fetching session data:", error);
    }
  };

  const deleteSession = async (sessionData) => {
    try {
      await axioInstance.delete(
        API_PATHS.SESSION.DELETE(sessionData._id)
      );
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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--color-bg)] transition-colors duration-200">
        <div className="container mx-auto pt-8 pb-20 px-6 max-w-6xl">
          
          {/* Header & Greeting */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                  Workspace
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {moment().format("dddd, MMM D")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {sessions.length > 0
                  ? `You have ${sessions.length} active interview prep session${sessions.length !== 1 ? "s" : ""}. Ready for your next mock round?`
                  : "Start preparing for your upcoming tech interviews with AI."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 bg-[var(--color-accent)] text-white font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--color-accent-hover)] transition-all text-sm shadow-sm active:scale-[0.98]"
                onClick={() => {
                  setTemplateData(null);
                  setOpenCreateModal(true);
                }}
              >
                <LuPlus className="w-4 h-4" />
                <span>Create New Track</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar (if sessions exist) */}
          {sessions.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1">
                  <LuBrain className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Interview Tracks</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">{sessions.length}</div>
              </div>

              <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1">
                  <LuTarget className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Total Q&A Bank</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">{totalQuestions}</div>
              </div>

              <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1">
                  <LuTrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mocks Completed</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">{totalAttempts}</div>
              </div>
            </div>
          )}

          {/* Quick Start Tracks Strip */}
          <div className="mb-8 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LuSparkles className="text-[var(--color-accent)] w-4 h-4" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Quick Start Popular Tracks
                </h3>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">
                Click any role to generate questions instantly
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {QUICK_TEMPLATES.map((tpl, i) => (
                <div
                  key={i}
                  onClick={() => handleLaunchTemplate(tpl)}
                  className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                        {tpl.badge}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{tpl.experience} yrs</span>
                    </div>
                    <h4 className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                      {tpl.role}
                    </h4>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--color-accent)] font-medium">
                    <span>Generate Track</span>
                    <LuPlus className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sessions Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Your Active Tracks ({sessions.length})
            </h2>
          </div>

          {/* Sessions Grid or Empty State */}
          {sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions?.map((data, index) => (
                <SummaryCard
                  key={data?.id || data?._id || index}
                  role={data?.role || ""}
                  topicsToFocus={data?.topicsToFocus || ""}
                  experience={data?.experience || ""}
                  questions={data?.questions?.length || ""}
                  description={data?.description || ""}
                  lastUpdated={
                    data?.updatedAt
                      ? moment(data.updatedAt).format("MMM Do, YYYY")
                      : ""
                  }
                  onSelect={() => navigate(`/interview-prep/${data?._id}`)}
                  onDelete={() => setOpenDeleteAlert({ open: true, data })}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/50 mt-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center mb-3">
                <LuBrain className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                No Interview Tracks Yet
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mb-6 leading-relaxed">
                Choose one of the quick start tracks above or configure your own custom role to start preparing with voice AI.
              </p>
              <button
                className="bg-[var(--color-accent)] text-white font-medium px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[var(--color-accent-hover)] transition-all text-sm active:scale-[0.98] shadow-sm"
                onClick={() => {
                  setTemplateData(null);
                  setOpenCreateModal(true);
                }}
              >
                <LuPlus className="w-4 h-4" />
                Configure First Track
              </button>
            </div>
          )}

          {/* Mobile FAB */}
          {sessions.length > 0 && (
            <button
              className="md:hidden fixed bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-[var(--color-accent)] text-white rounded-full shadow-lg z-20 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all"
              onClick={() => {
                setTemplateData(null);
                setOpenCreateModal(true);
              }}
            >
              <LuPlus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={openCreateModal}
        onClose={() => {
          setOpenCreateModal(false);
          setTemplateData(null);
        }}
        hideHeader
      >
        <CreateSessionForm initialData={templateData} />
      </Modal>

      {openDeleteAlert.open && (
        <Modal
          isOpen={openDeleteAlert?.open}
          onClose={() => setOpenDeleteAlert({ open: false, data: null })}
          title="Delete Session"
        >
          <DeleteAlertContent
            content="Are you sure you want to delete this session? This action cannot be undone."
            onDelete={() => deleteSession(openDeleteAlert.data)}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
