import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Input from "../../components/inputs/Input";
import { LuBriefcase, LuClock, LuTarget, LuFileText, LuSparkles } from "react-icons/lu";
import SpinnerLoader from "../../components/loaders/SpinnerLoader";
import axiosInstance from "../../utils/axioInstance";
import { API_PATHS } from "../../utils/apiPaths";

const CreateSessionForm = ({ initialData }) => {
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
      setFormData({
        role: initialData.role || "",
        experience: initialData.experience || "",
        topicsToFocus: initialData.topicsToFocus || "",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

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
        }
      );

      const generatedQuestions = aiResponse.data;

      const response = await axiosInstance.post(API_PATHS.SESSION.CREATE, {
        ...formData,
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

  return (
    <div className="w-full p-5">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <LuSparkles className="text-[var(--color-accent)] w-4 h-4" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Configure Interview Track
          </h3>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          Fill in your target role and focus topics to generate tailored AI questions.
        </p>
      </div>

      <form onSubmit={handleCreateSession} className="flex flex-col gap-1">
        <Input
          value={formData.role}
          onChange={({ target }) => handleChange("role", target.value)}
          label="Target Role"
          placeholder="e.g., Senior Frontend Engineer"
          type="text"
          icon={LuBriefcase}
        />

        <Input
          value={formData.experience}
          onChange={({ target }) => handleChange("experience", target.value)}
          label="Years of Experience"
          placeholder="e.g., 3"
          type="number"
          icon={LuClock}
        />

        <Input
          value={formData.topicsToFocus}
          onChange={({ target }) => handleChange("topicsToFocus", target.value)}
          label="Topics to Focus On"
          placeholder="e.g., React, System Design, TypeScript, Performance"
          type="text"
          icon={LuTarget}
        />

        <Input
          value={formData.description}
          onChange={({ target }) => handleChange("description", target.value)}
          label="Description / Focus Notes (Optional)"
          placeholder="e.g., Preparing for Tier-1 Tech behavioral and system design rounds"
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
          className="premium-btn mt-4 py-3"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <SpinnerLoader />
              Generating Tailored Q&A...
            </span>
          ) : (
            "Generate & Start Preparing"
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateSessionForm;
