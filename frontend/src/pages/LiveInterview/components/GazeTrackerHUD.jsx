import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuCamera, LuCameraOff, LuEye, LuShieldCheck, LuChevronDown, LuChevronUp } from 'react-icons/lu';

const GazeTrackerHUD = ({
  videoRef,
  isCameraActive,
  faceDetected,
  gazeDirection,
  eyeContactScore,
  isLookingAway,
  attentionPercentage,
  distractionCount,
  startCamera,
  stopCamera,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const getStatusColor = () => {
    if (!isCameraActive) return 'text-slate-400 bg-slate-800/60 border-slate-700/50';
    if (isLookingAway) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (attentionPercentage >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-auto select-none">
      <motion.div
        layout
        className="w-72 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/50 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isCameraActive && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isLookingAway ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isCameraActive
                    ? isLookingAway
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                    : 'bg-slate-500'
                }`}
              />
            </span>
            <span className="text-xs font-semibold tracking-wide text-slate-200">
              MediaPipe Vision
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => (isCameraActive ? stopCamera() : startCamera())}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isCameraActive
                  ? 'text-rose-400 hover:bg-rose-500/20'
                  : 'text-emerald-400 hover:bg-emerald-500/20'
              }`}
              title={isCameraActive ? 'Turn off camera' : 'Turn on camera for behavioral analysis'}
            >
              {isCameraActive ? <LuCameraOff size={15} /> : <LuCamera size={15} />}
            </button>

            <button
              onClick={() => setIsMinimized((prev) => !prev)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            >
              {isMinimized ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 space-y-3"
            >
              {/* Video Camera Preview with Face Landmark Reticle */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800 flex items-center justify-center">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* Landmark Target Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div
                        className={`w-28 h-36 border-2 border-dashed rounded-3xl transition-colors duration-300 ${
                          isLookingAway
                            ? 'border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                            : 'border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                        }`}
                      />
                      {/* Ocular reticle dots */}
                      <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4 text-slate-500">
                    <LuCamera size={26} className="mb-1.5 opacity-60" />
                    <span className="text-[11px] leading-tight">Camera is inactive</span>
                    <button
                      onClick={startCamera}
                      className="mt-2 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 underline"
                    >
                      Enable Gaze Analysis
                    </button>
                  </div>
                )}
              </div>

              {/* Real-Time Metrics Strip */}
              {isCameraActive && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded-lg border flex flex-col ${getStatusColor()}`}>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      Focus Score
                    </span>
                    <span className="text-sm font-bold mt-0.5">{attentionPercentage}%</span>
                  </div>

                  <div className={`p-2 rounded-lg border flex flex-col ${getStatusColor()}`}>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      Gaze Vector
                    </span>
                    <span className="text-xs font-semibold capitalize mt-0.5 truncate">
                      {isLookingAway ? 'Looking Away' : gazeDirection}
                    </span>
                  </div>
                </div>
              )}

              {/* Privacy Guarantee Footer */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <LuShieldCheck size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate">100% In-Browser • Zero Video Sent to Server</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GazeTrackerHUD;
