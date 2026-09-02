import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import { LuChevronDown, LuPin, LuPinOff, LuSparkles } from "react-icons/lu";
import AIResponsePreview from "../../pages/InterviewPrep/components/AIResponsePreview";

const QuestionCard = ({
  index,
  question,
  answer,
  onLearnMore,
  isPinned,
  onTogglePin,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isExpanded) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight + 20);
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div className="group border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] mb-4 overflow-hidden transition-colors duration-200 hover:border-[var(--color-accent)]/30">
        <div className="p-5">
          <div className="flex items-start justify-between cursor-pointer">
            <div className="flex items-start gap-3 flex-1" onClick={toggleExpand}>
              <span className="flex-shrink-0 text-xs font-semibold text-[var(--color-text-muted)] tabular-nums mt-0.5 w-6">
                {index !== undefined ? String(index + 1).padStart(2, '0') : ""}
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] leading-relaxed cursor-pointer">
                  {question}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-3">
              <div
                className={`flex items-center gap-1.5 transition-opacity duration-200 ${
                  isExpanded
                    ? "opacity-100"
                    : "opacity-0 md:group-hover:opacity-100"
                }`}
              >
                <button
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors duration-200 ${
                    isPinned
                      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/30"
                  }`}
                  onClick={onTogglePin}
                  title={isPinned ? "Unpin question" : "Pin question"}
                >
                  {isPinned ? (
                    <LuPinOff className="text-xs" />
                  ) : (
                    <LuPin className="text-xs" />
                  )}
                  <span className="hidden sm:block">
                    {isPinned ? "Pinned" : "Pin"}
                  </span>
                </button>

                <button
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-2.5 py-1.5 rounded-md border border-transparent hover:border-[var(--color-accent)]/20 transition-colors duration-200"
                  onClick={() => {
                    setIsExpanded(true);
                    onLearnMore();
                  }}
                  title="Get AI insights"
                >
                  <LuSparkles className="text-xs" />
                  <span className="hidden sm:block">Learn More</span>
                </button>
              </div>

              <button
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] rounded-md hover:bg-[var(--color-bg)] transition-colors duration-200"
                onClick={toggleExpand}
                title={isExpanded ? "Collapse answer" : "Expand answer"}
              >
                <LuChevronDown
                  size={16}
                  className={`transform transition-transform duration-300 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div
            className="overflow-hidden transition-all duration-400 ease-out"
            style={{ maxHeight: `${height}px` }}
          >
            <div
              ref={contentRef}
              className="mt-4 pt-4 border-t border-[var(--color-border)]"
            >
              <div className="bg-[var(--color-bg)] rounded-lg p-4 border border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">
                    AI Response
                  </span>
                </div>
                <div className="text-[var(--color-text-secondary)] leading-relaxed">
                  <AIResponsePreview content={answer} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuestionCard;
