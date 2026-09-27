import React, { useState, useEffect } from "react";
import { LuClock, LuUser, LuInfo, LuArrowRight, LuSparkles } from "react-icons/lu";
import Modal from "../../../components/Modal";
import { useNavigate } from "react-router-dom";

const SetupInterviewModal = ({ isOpen, onClose, sessionId, sessionData }) => {
  const navigate = useNavigate();

  const isHrTrack =
    sessionData?.trackType === "hr" ||
    /hr|human resource|behavioral|culture|leadership|recruiter|people/i.test(
      `${sessionData?.role || ""} ${sessionData?.topicsToFocus || ""}`
    );

  const [duration, setDuration] = useState("10");
  const [persona, setPersona] = useState(isHrTrack ? "behavioral" : "standard");

  useEffect(() => {
    setPersona(isHrTrack ? "behavioral" : "standard");
  }, [isHrTrack]);

  const handleStartInterview = () => {
    navigate(`/interview/${sessionId}/live?duration=${duration}&persona=${persona}`);
    onClose();
  };

  // Technical Track Personas (No HR options inside technical subject tracks!)
  const techPersonas = [
    {
      id: "standard",
      label: "Balanced Technical",
      desc: "Core fundamentals, best practices, and architecture trade-offs",
    },
    {
      id: "strict",
      label: "System Design & Edge Cases",
      desc: "Deep dive into scale, concurrency, bottlenecks, and failure modes",
    },
    {
      id: "coding",
      label: "Algorithms & Code Quality",
      desc: "Data structures, algorithmic complexity, and clean code principles",
    },
  ];

  // Dedicated HR / Behavioral Track Personas
  const hrPersonas = [
    {
      id: "behavioral",
      label: "STAR Method & Behavioral",
      desc: "Past project experiences, conflict resolution, and extreme ownership",
    },
    {
      id: "culture",
      label: "Culture & Values Alignment",
      desc: "Team collaboration, adaptability, work ethic, and culture fit",
    },
    {
      id: "leadership",
      label: "Leadership & Impact",
      desc: "Decision making under ambiguity, mentorship, and vision",
    },
  ];

  const availablePersonas = isHrTrack ? hrPersonas : techPersonas;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Live Mock Round">
      <div className="p-5 space-y-6">
        {/* Track Category Indicator */}
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded-xl flex gap-2.5 items-start">
          <LuSparkles className="text-[var(--color-accent)] w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
                {isHrTrack ? "HR & Behavioral Assessment Round" : "Technical Domain Round"}
              </h4>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                isHrTrack
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              }`}>
                {isHrTrack ? "HR Track" : "Tech Track"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {isHrTrack
                ? "This track conducts a dedicated behavioral assessment tailored to situational and culture fit interviews."
                : "This track focuses purely on technical and architectural proficiency with zero non-technical noise."}
            </p>
          </div>
        </div>

        {/* Duration Selection */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            <LuClock className="w-3.5 h-3.5" />
            Interview Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["5", "10", "15"].map((time) => (
              <button
                key={time}
                onClick={() => setDuration(time)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  duration === time
                    ? "bg-[var(--color-accent-subtle)] border-[var(--color-accent)]/30 text-[var(--color-accent)] font-semibold"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/20"
                }`}
              >
                {time} min
              </button>
            ))}
          </div>
        </div>

        {/* Persona / Style Selection */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            <LuUser className="w-3.5 h-3.5" />
            {isHrTrack ? "HR Interview Style" : "Technical Interview Style"}
          </label>
          <div className="space-y-2">
            {availablePersonas.map((p) => (
              <div
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  persona === p.id
                    ? "bg-[var(--color-accent-subtle)] border-[var(--color-accent)]/40 shadow-xs"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/20"
                }`}
              >
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      persona === p.id
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {p.label}
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {p.desc}
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    persona === p.id
                      ? "border-[var(--color-accent)]"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  {persona === p.id && (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Interview CTA */}
        <button
          onClick={handleStartInterview}
          className="premium-btn py-3 w-full flex items-center justify-center gap-2"
        >
          <span>Launch AI Voice Interview</span>
          <LuArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Modal>
  );
};

export default SetupInterviewModal;
