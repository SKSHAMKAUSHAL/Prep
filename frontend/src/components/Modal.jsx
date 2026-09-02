import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuX } from "react-icons/lu";

const Modal = ({ children, isOpen, onClose, title, hideHeader }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 dark:bg-black/60"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="relative w-full max-w-md bg-[var(--color-surface)] rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {!hideHeader && (
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
            </div>
          )}
          <button
            type="button"
            className="absolute top-3 right-3 z-10 w-7 h-7 flex justify-center items-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <LuX className="w-4 h-4" />
          </button>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Modal;
