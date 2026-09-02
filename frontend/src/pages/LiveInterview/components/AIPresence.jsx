import React from 'react';
import { motion } from 'framer-motion';

export const AIPresence = ({ status }) => {
  const ringColor =
    status === 'speaking' ? 'var(--color-accent)' :
    status === 'listening' ? 'var(--color-success)' :
    status === 'thinking' ? 'var(--color-warning)' :
    'var(--color-border)';

  const statusLabel =
    status === 'idle' ? 'Ready' :
    status === 'listening' ? 'Listening' :
    status === 'speaking' ? 'Speaking' :
    status === 'thinking' ? 'Analyzing' :
    status === 'finished' ? 'Complete' : status;

  const shouldAnimate = status === 'speaking' || status === 'listening' || status === 'thinking';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: ringColor }}
          animate={shouldAnimate ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={shouldAnimate ? { repeat: Infinity, duration: status === 'thinking' ? 1.5 : 2, ease: 'easeInOut' } : {}}
        >
          {/* Inner dot */}
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: ringColor }}
            animate={status === 'speaking' ? { scale: [1, 1.4, 1] } : status === 'listening' ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium tracking-wide uppercase text-[var(--color-text-muted)]">
          AI Interviewer
        </span>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{
            color: ringColor,
            backgroundColor: `color-mix(in srgb, ${ringColor} 10%, transparent)`,
          }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
};

export default AIPresence;
