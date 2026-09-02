import React, { useState } from "react";
import { LuClock, LuUser, LuInfo, LuArrowRight } from "react-icons/lu";
import Modal from "../../../components/Modal";
import { useNavigate } from "react-router-dom";

const SetupInterviewModal = ({ isOpen, onClose, sessionId }) => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState("10");
  const [persona, setPersona] = useState("standard");

  const handleStartInterview = () => {
    navigate(`/interview/${sessionId}/live?duration=${duration}&persona=${persona}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Interview Setup">
      <div className="p-5 space-y-6">
        {/* Info */}
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded-lg flex gap-2.5 items-start">
          <LuInfo className="text-[var(--color-accent)] w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-medium text-[var(--color-text-primary)] mb-1">How it works</h4>
            <ul className="text-xs text-[var(--color-text-muted)] space-y-0.5">
              <li>• Live voice-based mock interview with AI</li>
              <li>• Speak normally — AI listens, evaluates, responds</li>
              <li>• Ask for hints anytime if you're stuck</li>
            </ul>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            <LuClock className="w-3.5 h-3.5" />
            Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["5", "10", "15"].map((time) => (
              <button
                key={time}
                onClick={() => setDuration(time)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  duration === time
                    ? "bg-[var(--color-accent-subtle)] border-[var(--color-accent)]/30 text-[var(--color-accent)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/20"
                }`}
              >
                {time} min
              </button>
            ))}
          </div>
        </div>

        {/* Persona */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            <LuUser className="w-3.5 h-3.5" />
            Interviewer Style
          </label>
          <div className="space-y-2">
            {[
              { id: "standard", label: "Balanced", desc: "Standard behavioral and technical mix" },
              { id: "strict", label: "Strict Technical", desc: "Deep focus on code and edge cases" },
              { id: "friendly", label: "Friendly HR", desc: "Culture fit and communication focus" }
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                  persona === p.id
                    ? "bg-[var(--color-accent-subtle)] border-[var(--color-accent)]/30"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/20"
                }`}
              >
                <div>
                  <h4 className={`text-sm font-medium ${persona === p.id ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
                    {p.label}
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{p.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  persona === p.id ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
                }`}>
                  {persona === p.id && <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleStartInterview}
          className="premium-btn py-3"
        >
          Start Live Interview
          <LuArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Modal>
  );
};

export default SetupInterviewModal;
