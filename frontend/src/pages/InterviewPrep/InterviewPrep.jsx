import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { AnimatePresence, motion } from "framer-motion";
import { LuCircleAlert, LuListCollapse } from "react-icons/lu";
import SpinnerLoader from "../../components/loaders/SpinnerLoader";
import { toast } from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import RoleInfoHeader from "./components/RoleInfoHeader";
import axiosInstance from "../../utils/axioInstance";
import { API_PATHS } from "../../utils/apiPaths";
import QuestionCard from "../../components/cards/QuestionCard";
import Drawer from "../../components/Drawer";
import SkeletonLoader from "../../components/loaders/SkeletonLoader";
import AIResponsePreview from "./components/AIResponsePreview";
import SetupInterviewModal from "./components/SetupInterviewModal";

const InterviewPrep = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [openLeanMoreDrawer, setOpenLeanMoreDrawer] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdateLoader, setIsUpdateLoader] = useState(false);
  const [openSetupModal, setOpenSetupModal] = useState(false);

  const fetchSessionDetailsById = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.SESSION.GET_ONE(sessionId)
      );
      if (response.data && response.data.session) {
        setSessionData(response.data.session);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const generateConceptExplanation = async (question) => {
    try {
      setErrorMsg("");
      setExplanation(null);
      setIsLoading(true);
      setOpenLeanMoreDrawer(true);

      const response = await axiosInstance.post(
        API_PATHS.AI.GENERATE_EXPLANATION,
        { question }
      );

      if (response.data && response.data.explanation) {
        setExplanation(response.data);
      } else {
        setErrorMsg("No explanation received");
      }
    } catch (error) {
      setExplanation(null);
      setErrorMsg("Failed to generate explanation, Try again later");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestionPinStatus = async (questionId) => {
    try {
      await axiosInstance.post(API_PATHS.QUESTION.PIN(questionId));
      fetchSessionDetailsById();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const uploadMoreQuestions = async () => {
    try {
      setIsUpdateLoader(true);
      setOpenLeanMoreDrawer(false);
      setExplanation(null);
      setErrorMsg("");

      const payload = {
        role: sessionData?.role,
        experience:
          sessionData?.experience && sessionData.experience > 0
            ? sessionData.experience
            : 1,
        topicsToFocus: Array.isArray(sessionData?.topicsToFocus)
          ? sessionData.topicsToFocus.join(", ")
          : sessionData?.topicsToFocus || "",
        numberOfQuestions: 10,
      };

      const aiResponse = await axiosInstance.post(
        API_PATHS.AI.GENERATE_QUESTIONS,
        payload
      );

      const generatedQuestions = aiResponse.data;

      await axiosInstance.post(API_PATHS.QUESTION.ADD_TO_SESSION, {
        sessionId,
        questions: generatedQuestions,
      });

      toast.success("Added more questions");
      fetchSessionDetailsById();
    } catch (error) {
      if (error.response && error.response.data.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    } finally {
      setIsUpdateLoader(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetailsById();
    }
  }, [sessionId]);

  return (
    <DashboardLayout>
      <RoleInfoHeader
        role={sessionData?.role || ""}
        topicsToFocus={sessionData?.topicsToFocus || ""}
        experience={sessionData?.experience || ""}
        questions={sessionData?.questions || "_ _"}
        description={sessionData?.description || ""}
        lastUpdated={
          sessionData?.updatedAt
            ? moment(sessionData.updatedAt).format("Do MMM YYYY")
            : ""
        }
        onStartInterview={() => setOpenSetupModal(true)}
      />

      <div className="container mx-auto px-6 pt-6 pb-10 max-w-6xl">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-5">
          Questions ({sessionData?.questions?.length || 0})
        </h2>

        <div className="flex flex-col md:flex-row gap-4">
          <motion.div
            className={`w-full transition-all duration-300 ${openLeanMoreDrawer ? "md:w-7/12" : "md:w-full"}`}
          >
            <AnimatePresence>
              {sessionData?.questions?.map((data, index) => (
                <motion.div
                  key={data._id || index}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    type: "spring",
                    stiffness: 100,
                    delay: index * 0.05,
                    damping: 15,
                  }}
                  layout
                  layoutId={`question-${data._id || index}`}
                >
                  <QuestionCard
                    index={index}
                    question={data?.question}
                    answer={data?.answer}
                    onLearnMore={() =>
                      generateConceptExplanation(data.question)
                    }
                    isPinned={data?.isPinned}
                    onTogglePin={() => toggleQuestionPinStatus(data._id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex items-center justify-center mt-6">
              <button
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] px-4 py-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
                disabled={isLoading || isUpdateLoader}
                onClick={uploadMoreQuestions}
              >
                {isUpdateLoader ? (
                  <SpinnerLoader />
                ) : (
                  <LuListCollapse className="w-4 h-4" />
                )}
                Load More
              </button>
            </div>
          </motion.div>
        </div>

        <Drawer
          isOpen={openLeanMoreDrawer}
          onClose={() => setOpenLeanMoreDrawer(false)}
          title={!isLoading && explanation ? explanation?.title : ""}
        >
          {errorMsg && (
            <p className="flex gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
              <LuCircleAlert className="mt-1" /> {errorMsg}
            </p>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SkeletonLoader />
            </motion.div>
          )}

          {!isLoading && explanation && (
            <AIResponsePreview
              content={explanation?.explanation}
              summary={explanation?.summary}
              keyPoints={explanation?.keyPoints}
              questionTitle={explanation?.title}
            />
          )}
        </Drawer>

        {/* Past Attempts */}
        {sessionData?.attempts && sessionData.attempts.length > 0 && (
          <div className="mt-16 mb-8">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
              Past Interviews
            </h2>
            <div className="space-y-2">
              {sessionData.attempts.map((attempt, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/interview/${sessionId}/feedback`, { state: { interviewHistory: attempt.history, persona: attempt.persona, duration: attempt.duration } })}
                  className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)]/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-[var(--color-text-muted)] tabular-nums w-6">
                      #{index + 1}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)] capitalize">{attempt.persona}</span>
                      <span className="text-xs text-[var(--color-text-muted)] ml-2">{moment(attempt.createdAt).fromNow()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">{attempt.avgScore}<span className="text-xs text-[var(--color-text-muted)] font-normal">/10</span></span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">{attempt.avgConfidence}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <SetupInterviewModal
          isOpen={openSetupModal}
          onClose={() => setOpenSetupModal(false)}
          sessionId={sessionId}
        />
      </div>
    </DashboardLayout>
  );
};

export default InterviewPrep;
