import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Input from "../../components/inputs/Input";
import {
  LuBriefcase,
  LuClock,
  LuTarget,
  LuFileText,
  LuSparkles,
  LuUsers,
  LuCode,
} from "react-icons/lu";
import SpinnerLoader from "../../components/loaders/SpinnerLoader";
import axiosInstance from "../../utils/axioInstance";
import { API_PATHS } from "../../utils/apiPaths";

const CreateSessionForm = ({ initialData, defaultTrackType = "technical" }) => {
  const [trackType, setTrackType] = useState(
    initialData?.trackType || defaultTrackType || "technical"
  );
  const [formData, setFormData] = useState({
    role: initialData?.role || "",
    experience: initialData?.experience || "",
    topicsToFocus: initialData?.topicsToFocus || "",
    description: initialData?.description || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialData) {
      setTrackType(initialData.trackType || defaultTrackType || "technical");
      setFormData({
        role: initialData.role || "",
        experience: initialData.experience || "",
        topicsToFocus: initialData.topicsToFocus || "",
        description: initialData.description || "",
      });
    } else {
      setTrackType(defaultTrackType || "technical");
    }
  }, [initialData, defaultTrackType]);

  const handleChange = (key, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    const { role, experience, topicsToFocus } = formData;

    if (!role || !experience || !topicsToFocus) {
      setError("Please fill all the required fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const aiResponse = await axiosInstance.post(
        API_PATHS.AI.GENERATE_QUESTIONS,
        {
          role,
          experience,
          topicsToFocus,
          numberOfQuestions: 11,
          trackType,
        }
      );

      const generatedQuestions = aiResponse.data;

      const response = await axiosInstance.post(API_PATHS.SESSION.CREATE, {
        ...formData,
        trackType,
        questions: generatedQuestions,
      });

      if (response.data?.session?._id) {
        navigate(`/interview-prep/${response.data?.session?._id}`);
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isHr = trackType === "hr";

  return (
    <div className="w-full p-5">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <LuSparkles className="text-[var(--color-accent)] w-4 h-4" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Configure {isHr ? "HR & Behavioral" : "Technical"} Track
          </h3>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {isHr
            ? "Generate behavioral, situational, and culture-fit questions evaluated on the STAR framework."
            : "Generate production-grade technical interview questions focused on deep engineering fundamentals."}
        </p>
      </div>

      {/* Track Type Selector Pill */}
      <div className="mb-4 flex items-center gap-2 p-1 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setTrackType("technical")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            trackType === "technical"
              ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-xs border border-[var(--color-border)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <LuCode className="w-3.5 h-3.5" />
          <span>Technical Track</span>
        </button>

        <button
          type="button"
          onClick={() => setTrackType("hr")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            trackType === "hr"
              ? "bg-[var(--color-surface)] text-purple-600 dark:text-purple-400 shadow-xs border border-[var(--color-border)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <LuUsers className="w-3.5 h-3.5" />
          <span>HR & Behavioral</span>
        </button>
      </div>

      <form onSubmit={handleCreateSession} className="flex flex-col gap-1">
        <Input
          value={formData.role}
          onChange={({ target }) => handleChange("role", target.value)}
          label={isHr ? "Target Role / Leadership Level" : "Target Role"}
          placeholder={
            isHr
              ? "e.g., Engineering Manager / Senior Staff Lead"
              : "e.g., Senior Frontend Engineer"
          }
          type="text"
          icon={LuBriefcase}
        />

        <Input
          value={formData.experience}
          onChange={({ target }) => handleChange("experience", target.value)}
          label="Years of Experience"
          placeholder="e.g., 4"
          type="number"
          icon={LuClock}
        />

        <Input
          value={formData.topicsToFocus}
          onChange={({ target }) => handleChange("topicsToFocus", target.value)}
          label={isHr ? "Behavioral & Culture Focus Themes" : "Topics to Focus On"}
          placeholder={
            isHr
              ? "e.g., Conflict Resolution, STAR Stories, Mentorship, High-Pressure Deadlines"
              : "e.g., React Fiber, Distributed Caching, PostgreSQL Indexing, Kafka"
          }
          type="text"
          icon={LuTarget}
        />

        <Input
          value={formData.description}
          onChange={({ target }) => handleChange("description", target.value)}
          label="Description / Focus Notes (Optional)"
          placeholder={
            isHr
              ? "e.g., Preparing for Tier-1 behavioral and leadership rounds"
              : "e.g., Preparing for staff-level architecture and system design rounds"
          }
          type="text"
          icon={LuFileText}
        />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-[var(--color-error)] bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 text-center">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          className={`premium-btn mt-4 py-3 ${
            isHr ? "!bg-purple-600 hover:!bg-purple-700 !shadow-purple-500/20" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <SpinnerLoader />
              Generating {isHr ? "HR & Behavioral" : "Technical"} Q&A Bank...
            </span>
          ) : (
            `Generate & Start ${isHr ? "HR" : "Technical"} Track`
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateSessionForm;
