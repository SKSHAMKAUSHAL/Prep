import React from "react";
import { LuTrash2, LuClock, LuMessageSquare, LuBriefcase } from "react-icons/lu";
import { getInitials } from "../../utils/helper";

const SummaryCard = ({
  role,
  topicsToFocus,
  experience,
  questions,
  description,
  lastUpdated,
  onSelect,
  onDelete,
}) => {
  return (
    <div 
      className="group cursor-pointer bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-accent)]/30 transition-colors duration-200 flex flex-col h-full"
      onClick={onSelect}
    >
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold">
                {getInitials(role)}
              </span>
            </div>
            
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5 truncate">
                {role}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                {topicsToFocus || "General preparation"}
              </p>
            </div>
          </div>

          <button
            className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete session"
          >
            <LuTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg)] px-2 py-1 rounded-md">
            <LuBriefcase className="w-3 h-3" />
            <span>{experience} {experience === 1 ? "yr" : "yrs"}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg)] px-2 py-1 rounded-md">
            <LuMessageSquare className="w-3 h-3" />
            <span>{questions} Q&A</span>
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 border-t border-[var(--color-border)] flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <LuClock className="w-3 h-3" />
        <span>Updated {lastUpdated}</span>
      </div>
    </div>
  );
};

export default SummaryCard;