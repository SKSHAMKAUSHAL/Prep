import React from "react";
import Modal from "../../../components/Modal";
import { LuTrendingUp, LuCalendar, LuClock, LuArrowRight, LuAward } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import moment from "moment";

const PastMocksModal = ({ isOpen, onClose, sessions = [] }) => {
  const navigate = useNavigate();

  // Aggregate all attempts across sessions
  const allAttempts = sessions.flatMap((s) => {
    return (s.attempts || []).map((att) => ({
      ...att,
      trackId: s._id,
      trackRole: s.role,
      trackType: s.trackType || "technical",
    }));
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleViewReport = (attempt) => {
    onClose();
    navigate(`/interview/${attempt.trackId}/feedback`, {
      state: {
        interviewHistory: attempt.history,
        persona: attempt.persona,
        duration: attempt.duration,
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Completed Mock Interviews & Feedback">
      <div className="p-5 space-y-4 max-h-[75vh] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-muted)]">
            Total Completed Rounds: <strong className="text-[var(--color-text-primary)]">{allAttempts.length}</strong>
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            Click any round to view detailed AI feedback
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px]">
          {allAttempts.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-xl">
              <LuTrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
              <p className="text-xs">No mock interview attempts completed yet.</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Launch any track and start your first voice interview to get instant scoring and analytics.
              </p>
            </div>
          ) : (
            allAttempts.map((attempt, index) => {
              const isHr = attempt.trackType === "hr";
              return (
                <div
                  key={index}
                  onClick={() => handleViewReport(attempt)}
                  className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] hover:shadow-xs transition-all cursor-pointer group flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          isHr
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {isHr ? "HR Round" : "Technical"}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                        {attempt.trackRole}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                      <span className="capitalize">{attempt.persona} style</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <LuClock className="w-3 h-3" />
                        {attempt.duration || "10"} min
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <LuCalendar className="w-3 h-3" />
                        {moment(attempt.createdAt).fromNow()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
                        {attempt.avgScore !== undefined ? `${attempt.avgScore}/10` : "Evaluated"}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">
                        {attempt.avgConfidence !== undefined ? `${attempt.avgConfidence}% confidence` : "Score"}
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
                      <LuArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PastMocksModal;
