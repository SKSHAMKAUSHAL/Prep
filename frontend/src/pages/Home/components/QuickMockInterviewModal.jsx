import React, { useState } from "react";
import Modal from "../../../components/Modal";
import { LuPlay, LuClock, LuUser, LuBriefcase, LuSparkles, LuCode, LuUsers } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axioInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import SpinnerLoader from "../../../components/loaders/SpinnerLoader";
import toast from "react-hot-toast";

const QuickMockInterviewModal = ({ isOpen, onClose, sessions = [] }) => {
  const navigate = useNavigate();
  const [domain, setDomain] = useState("technical"); // 'technical' | 'hr'
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [duration, setDuration] = useState("10");
  const [persona, setPersona] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);

  const POPULAR_TECH_ROLES = [
    "Senior Frontend Engineer",
    "Backend & Distributed Systems",
    "System Design & Architecture",
    "Full-Stack Software Engineer",
  ];

  const POPULAR_HR_ROLES = [
    "Behavioral & STAR Mastery Round",
    "Engineering Leadership & Conflict",
    "Culture Fit & Team Collaboration",
    "HR Screening & Executive Story",
  ];

  const techPersonas = [
    { id: "standard", label: "Balanced Technical", desc: "Core fundamentals & architecture trade-offs" },
    { id: "strict", label: "System Design & Edge Cases", desc: "Scale, bottlenecks, and failure modes" },
    { id: "coding", label: "Algorithms & Code Quality", desc: "Data structures & algorithmic complexity" },
  ];

  const hrPersonas = [
    { id: "behavioral", label: "STAR Method & Behavioral", desc: "Real project stories, ownership, and conflict" },
    { id: "culture", label: "Culture & Values Alignment", desc: "Team collaboration, adaptability, and work ethic" },
    { id: "leadership", label: "Leadership & Impact", desc: "Decision making under ambiguity and vision" },
  ];

  const isHr = domain === "hr";
  const rolesList = isHr ? POPULAR_HR_ROLES : POPULAR_TECH_ROLES;
  const availablePersonas = isHr ? hrPersonas : techPersonas;

  const handleLaunch = async () => {
    const finalRole = customRole.trim() || selectedRole || rolesList[0];
    setIsLoading(true);

    try {
      // 1. Check if user already has an existing track for this role & trackType
      const existing = sessions.find(
        (s) =>
          s.role?.toLowerCase() === finalRole.toLowerCase() &&
          (isHr ? s.trackType === "hr" : s.trackType !== "hr")
      );

      if (existing) {
        onClose();
        navigate(`/interview/${existing._id}/live?duration=${duration}&persona=${persona}`);
        return;
      }

      // 2. Otherwise generate a dedicated quick session
      const topics = isHr
        ? "STAR behavioral examples, leadership principles, conflict management, cross-functional collaboration"
        : "System design, core architecture, edge-cases, performance optimization, best practices";

      const aiResponse = await axiosInstance.post(API_PATHS.AI.GENERATE_QUESTIONS, {
        role: finalRole,
        experience: "3",
        topicsToFocus: topics,
        numberOfQuestions: 6,
        trackType: isHr ? "hr" : "technical",
      });

      const response = await axiosInstance.post(API_PATHS.SESSION.CREATE, {
        role: finalRole,
        experience: 3,
        topicsToFocus: topics,
        description: `Direct mock session created from Dashboard`,
        trackType: isHr ? "hr" : "technical",
        questions: aiResponse.data,
      });

      const newSessionId = response.data?.session?._id;
      if (newSessionId) {
        onClose();
        navigate(`/interview/${newSessionId}/live?duration=${duration}&persona=${persona}`);
      }
    } catch (err) {
      console.error("Direct interview launch error:", err);
      toast.error(err.response?.data?.message || "Failed to start direct interview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Direct Mock Interview">
      <div className="p-5 space-y-5">
        {/* Domain Switcher */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">
            Select Interview Domain
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => {
                setDomain("technical");
                setPersona("standard");
                setSelectedRole(POPULAR_TECH_ROLES[0]);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                domain === "technical"
                  ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-xs border border-[var(--color-border)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <LuCode className="w-3.5 h-3.5" />
              <span>Technical Round</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDomain("hr");
                setPersona("behavioral");
                setSelectedRole(POPULAR_HR_ROLES[0]);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                domain === "hr"
                  ? "bg-[var(--color-surface)] text-purple-600 dark:text-purple-400 shadow-xs border border-[var(--color-border)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <LuUsers className="w-3.5 h-3.5" />
              <span>HR & Behavioral</span>
            </button>
          </div>
        </div>

        {/* Role Preset Chips */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">
            Target Role / Round
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {rolesList.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setSelectedRole(r);
                  setCustomRole("");
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  (selectedRole === r && !customRole)
                    ? isHr
                      ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-semibold"
                      : "bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent)] font-semibold"
                    : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            placeholder="Or type a custom role/specialization..."
            className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Style Selection */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">
            {isHr ? "HR Interviewer Persona" : "Technical Interviewer Persona"}
          </label>
          <div className="space-y-2">
            {availablePersonas.map((p) => (
              <div
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  persona === p.id
                    ? isHr
                      ? "bg-purple-500/10 border-purple-500/40"
                      : "bg-[var(--color-accent-subtle)] border-[var(--color-accent)]/40"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/20"
                }`}
              >
                <div>
                  <h4
                    className={`text-xs font-bold ${
                      persona === p.id
                        ? isHr
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {p.label}
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{p.desc}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    persona === p.id
                      ? isHr
                        ? "border-purple-600"
                        : "border-[var(--color-accent)]"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  {persona === p.id && (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isHr ? "bg-purple-600" : "bg-[var(--color-accent)]"
                      }`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">
            Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["5", "10", "15"].map((time) => (
              <button
                key={time}
                onClick={() => setDuration(time)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  duration === time
                    ? isHr
                      ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-semibold"
                      : "bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent)] font-semibold"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/20"
                }`}
              >
                {time} minutes
              </button>
            ))}
          </div>
        </div>

        {/* Launch CTA */}
        <button
          onClick={handleLaunch}
          disabled={isLoading}
          className={`premium-btn py-3 w-full flex items-center justify-center gap-2 ${
            isHr ? "!bg-purple-600 hover:!bg-purple-700" : ""
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <SpinnerLoader />
              Setting Up Mock Room...
            </span>
          ) : (
            <>
              <LuPlay className="w-4 h-4" />
              <span>Start Direct Voice Interview</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default QuickMockInterviewModal;
