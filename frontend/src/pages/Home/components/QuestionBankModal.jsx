import React, { useState } from "react";
import Modal from "../../../components/Modal";
import { LuSearch, LuBookOpen, LuCopy, LuCheck, LuSparkles, LuBrain, LuUsers } from "react-icons/lu";
import toast from "react-hot-toast";

const QuestionBankModal = ({ isOpen, onClose, sessions = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrackFilter, setSelectedTrackFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  // Extract all questions with track context
  const allQuestions = sessions.flatMap((session) => {
    return (session.questions || []).map((q, idx) => ({
      ...q,
      trackId: session._id,
      trackRole: session.role,
      trackType: session.trackType || "technical",
      topicsToFocus: session.topicsToFocus,
      uniqueId: `${session._id}-${q._id || idx}`,
    }));
  });

  const filteredQuestions = allQuestions.filter((item) => {
    const matchesSearch =
      (item.question && item.question.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.answer && item.answer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.trackRole && item.trackRole.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTrack =
      selectedTrackFilter === "all" ||
      (selectedTrackFilter === "hr" && item.trackType === "hr") ||
      (selectedTrackFilter === "tech" && item.trackType !== "hr");

    return matchesSearch && matchesTrack;
  });

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Question & answer copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Q&A Bank" size="xl">
      <div className="p-5 space-y-4 max-h-[80vh] flex flex-col">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search concepts, questions, or answers across tracks..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Track Filter Pills */}
          <div className="flex items-center gap-1 bg-[var(--color-bg)] p-1 rounded-xl border border-[var(--color-border)] text-xs">
            <button
              onClick={() => setSelectedTrackFilter("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedTrackFilter === "all"
                  ? "bg-[var(--color-surface)] text-[var(--color-accent)] font-semibold shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              All ({allQuestions.length})
            </button>
            <button
              onClick={() => setSelectedTrackFilter("tech")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedTrackFilter === "tech"
                  ? "bg-[var(--color-surface)] text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              Technical
            </button>
            <button
              onClick={() => setSelectedTrackFilter("hr")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedTrackFilter === "hr"
                  ? "bg-[var(--color-surface)] text-purple-600 dark:text-purple-400 font-semibold shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              HR & Behavioral
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[550px]">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-xl">
              <LuBookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No questions matched your filter or search query.</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isHr = q.trackType === "hr";
              return (
                <div
                  key={q.uniqueId}
                  className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30 transition-all space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          isHr
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {isHr ? "HR / Behavioral" : "Technical"}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        {q.trackRole}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        handleCopy(`Q: ${q.question}\n\nA: ${q.answer}`, q.uniqueId)
                      }
                      className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] transition-colors flex items-center gap-1 text-[11px]"
                      title="Copy Q&A"
                    >
                      {copiedId === q.uniqueId ? (
                        <>
                          <LuCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 text-[10px]">Copied</span>
                        </>
                      ) : (
                        <LuCopy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <h4 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
                    {q.question}
                  </h4>

                  {q.answer && (
                    <div className="p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      <span className="font-semibold text-[var(--color-text-primary)] block mb-1">
                        Model Answer:
                      </span>
                      <p>{q.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default QuestionBankModal;
