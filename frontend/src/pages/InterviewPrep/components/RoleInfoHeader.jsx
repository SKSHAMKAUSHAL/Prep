import React from "react";
import { LuPlay } from "react-icons/lu";

const RoleInfoHeader = ({
  role,
  topicsToFocus,
  experience,
  questions,
  description,
  lastUpdated,
  onStartInterview
}) => {
  return (
    <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] transition-colors duration-200">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Left: Info */}
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">{role}</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl leading-relaxed">{topicsToFocus}</p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-0.5 rounded-md">
                {experience} {experience == 1 ? "yr" : "yrs"} exp
              </span>
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-0.5 rounded-md">
                {questions.length} Q&A
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Updated {lastUpdated}
              </span>
            </div>
          </div>

          {/* Right: CTA */}
          <button
            onClick={onStartInterview}
            className="flex items-center gap-2 bg-[var(--color-accent)] text-white font-medium px-5 py-2.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors active:scale-[0.98] text-sm"
          >
            <LuPlay className="w-3.5 h-3.5" />
            Take Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleInfoHeader;
