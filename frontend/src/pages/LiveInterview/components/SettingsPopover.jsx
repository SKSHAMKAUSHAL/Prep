import React, { useEffect, useRef } from 'react';
import { LuSun, LuMoon } from 'react-icons/lu';

export const SettingsPopover = ({
  isOpen,
  onToggle,
  micDevices,
  selectedMicId,
  setSelectedMicId,
  isMicLoading,
  loadMicDevices,
  sttLanguage,
  setSttLanguage,
  micLevelPercent,
  micEnergyActive,
  theme,
  toggleTheme,
}) => {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onToggle(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full mb-2 right-0 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg p-4 space-y-4 z-30"
    >
      <div>
        <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5 block">
          Microphone
        </label>
        <select
          value={selectedMicId}
          onChange={(e) => setSelectedMicId(e.target.value)}
          className="w-full text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-2 text-[var(--color-text-primary)] focus:outline-none"
          disabled={isMicLoading || micDevices.length === 0}
        >
          {micDevices.length === 0 ? (
            <option value="">No microphones</option>
          ) : (
            micDevices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${index + 1}`}
              </option>
            ))
          )}
        </select>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full transition-all duration-150 rounded-full"
              style={{
                width: `${micLevelPercent}%`,
                backgroundColor: micEnergyActive ? 'var(--color-success)' : 'var(--color-text-muted)',
              }}
            />
          </div>
          <button
            type="button"
            onClick={loadMicDevices}
            className="text-[10px] font-medium text-[var(--color-accent)] hover:underline"
            disabled={isMicLoading}
          >
            {isMicLoading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5 block">
          Language
        </label>
        <select
          value={sttLanguage}
          onChange={(e) => setSttLanguage(e.target.value)}
          className="w-full text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-2 text-[var(--color-text-primary)] focus:outline-none"
        >
          <option value="en-US">English (US)</option>
          <option value="en-IN">English (India)</option>
          <option value="en-GB">English (UK)</option>
          <option value="en-AU">English (AU)</option>
        </select>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">Theme</span>
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded-md border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
        >
          {theme === "dark" ? <LuSun className="text-xs" /> : <LuMoon className="text-xs" />}
        </button>
      </div>
    </div>
  );
};

export default SettingsPopover;
