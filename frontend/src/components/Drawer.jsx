import React, { useEffect } from "react";
import { LuX, LuSparkles, LuBookOpen } from "react-icons/lu";

const Drawer = ({ isOpen, onClose, title, children }) => {
  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Dimmed Overlay for mobile/tablet */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        className={`fixed top-14 right-0 z-40 h-[calc(100dvh-56px)] overflow-y-auto custom-scrollbar
        transition-all duration-300 ease-out bg-[var(--color-surface)]/95 backdrop-blur-md w-full sm:w-[520px] md:w-[50vw] lg:w-[45vw] xl:w-[40vw] border-l border-[var(--color-border)] shadow-2xl flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        tabIndex="-1"
        aria-labelledby="drawer-title"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 px-5 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
          <div className="flex flex-col gap-1 pr-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              <LuSparkles className="w-3.5 h-3.5" />
              <span>AI Cheat Sheet & Concept Notes</span>
            </div>
            {title && (
              <h5
                id="drawer-title"
                className="text-base font-bold text-[var(--color-text-primary)] line-clamp-1 leading-snug"
                title={title}
              >
                {title}
              </h5>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] rounded-lg w-8 h-8 inline-flex items-center justify-center transition-colors border border-[var(--color-border)]"
            aria-label="Close drawer"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          {isOpen && children}
        </div>
      </aside>
    </>
  );
};

export default Drawer;
