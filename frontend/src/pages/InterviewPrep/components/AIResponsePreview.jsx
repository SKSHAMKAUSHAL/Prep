import React, { useState, useContext, useRef, useEffect } from "react";
import {
  LuCopy,
  LuCheck,
  LuCode,
  LuSparkles,
  LuListChecks,
  LuBookOpen,
  LuLightbulb,
  LuMessageSquare,
  LuSend,
  LuCoins,
  LuBot,
  LuUser,
} from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import axiosInstance from "../../../utils/axioInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import { UserContext } from "../../../context/UserContext";
import toast from "react-hot-toast";
import SpinnerLoader from "../../../components/loaders/SpinnerLoader";

const AIResponsePreview = ({
  content,
  summary,
  keyPoints,
  questionTitle,
  questionText,
  questionAnswer,
  sessionData,
}) => {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'cheat' | 'deep' | 'chat'
  const [copiedSection, setCopiedSection] = useState(false);

  // Chat State
  const { user, updateTokens } = useContext(UserContext);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef(null);

  const tokenBalance = user?.tokens !== undefined ? user.tokens : 1000;

  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const handleCopyAll = () => {
    const textToCopy = `${summary ? `SUMMARY:\n${summary}\n\n` : ""}${
      keyPoints && keyPoints.length > 0
        ? `CHEAT SHEET / KEY TAKEAWAYS:\n${keyPoints
            .map((kp) => `• ${kp}`)
            .join("\n")}\n\n`
        : ""
    }DETAILED EXPLANATION:\n${content || ""}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedSection(true);
    setTimeout(() => setCopiedSection(false), 2000);
  };

  const handleSendMessage = async (customMessage) => {
    const messageToSend = customMessage || userInput;
    if (!messageToSend.trim()) return;

    if (tokenBalance < 10) {
      toast.error("Insufficient tokens. You need at least 10 tokens to send a chat message.");
      return;
    }

    const newHistory = [...chatMessages, { role: "user", content: messageToSend }];
    setChatMessages(newHistory);
    setUserInput("");
    setIsSending(true);

    try {
      const res = await axiosInstance.post(API_PATHS.AI.QUESTION_CHAT, {
        question: questionText || questionTitle || "Interview Question",
        answer: questionAnswer || summary || "",
        role: sessionData?.role || "Software Engineer",
        experience: sessionData?.experience || "3",
        topicsToFocus: Array.isArray(sessionData?.topicsToFocus)
          ? sessionData.topicsToFocus.join(", ")
          : sessionData?.topicsToFocus || "",
        chatHistory: newHistory,
        userMessage: messageToSend,
      });

      if (res.data?.reply) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
        if (res.data.tokensRemaining !== undefined) {
          updateTokens(res.data.tokensRemaining);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = err.response?.data?.message || "Failed to get AI response. Please try again.";
      toast.error(errMsg);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ **Error:** ${errMsg}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const QUICK_PROMPTS = [
    "Explain this with a simple analogy",
    "What edge cases would an interviewer ask?",
    "Give me a 60-second elevator pitch answer",
    "What are common mistakes candidates make here?",
  ];

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--color-border)] gap-2">
        {/* Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-[var(--color-accent)] text-white shadow-sm font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            }`}
          >
            <LuSparkles className="w-3.5 h-3.5" />
            Full Guide
          </button>
          <button
            onClick={() => setActiveTab("cheat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "cheat"
                ? "bg-[var(--color-accent)] text-white shadow-sm font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            }`}
          >
            <LuListChecks className="w-3.5 h-3.5" />
            Cheat Sheet
          </button>
          <button
            onClick={() => setActiveTab("deep")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "deep"
                ? "bg-[var(--color-accent)] text-white shadow-sm font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            }`}
          >
            <LuBookOpen className="w-3.5 h-3.5" />
            Deep Dive
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "chat"
                ? "bg-purple-600 text-white shadow-sm font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            }`}
          >
            <LuMessageSquare className="w-3.5 h-3.5" />
            <span>Ask AI Chat</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">
              -10
            </span>
          </button>
        </div>

        {/* Copy All Button */}
        {activeTab !== "chat" && (
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors self-start sm:self-auto"
            title="Copy Complete Notes"
          >
            {copiedSection ? (
              <>
                <LuCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <LuCopy className="w-3.5 h-3.5" />
                <span>Copy Notes</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ─── TAB 4: INTERACTIVE AI QUESTION CHAT ─── */}
      {activeTab === "chat" && (
        <div className="flex flex-col h-[520px] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
          {/* Chat Header with Token Status */}
          <div className="p-3.5 bg-[var(--color-bg)] border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                <LuBot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Contextual AI Interview Mentor
                </h4>
                <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[260px] sm:max-w-md">
                  Discussing: {questionText || questionTitle || "Current Question"}
                </p>
              </div>
            </div>

            {/* Token Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <LuCoins className="w-3 h-3 text-amber-500" />
              <span className="tabular-nums font-semibold">{tokenBalance}</span>
              <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 hidden sm:inline">
                left
              </span>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[var(--color-text-muted)]">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                  <LuMessageSquare className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                  Have doubts on this concept?
                </h5>
                <p className="text-xs text-[var(--color-text-muted)] max-w-sm mb-4 leading-relaxed">
                  Ask follow-up questions, request real-world code architectures, or ask for simpler analogies. Each message costs 10 tokens.
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-2.5 text-xs text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-purple-500 hover:text-purple-500 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 items-start ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                    msg.role === "user"
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-purple-600 text-white"
                  }`}
                >
                  {msg.role === "user" ? <LuUser className="w-4 h-4" /> : <LuBot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex gap-2.5 items-center text-xs text-[var(--color-text-muted)] pl-2">
                <SpinnerLoader />
                <span>Mentor is formulating answer...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts Strip (when conversation is active) */}
          {chatMessages.length > 0 && (
            <div className="px-3 py-1.5 bg-[var(--color-bg)]/50 border-t border-[var(--color-border)] flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-[var(--color-text-muted)] text-[10px] uppercase font-semibold pl-1">
                Suggested:
              </span>
              {QUICK_PROMPTS.slice(0, 2).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isSending}
                  className="px-2 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-purple-500 hover:border-purple-500 whitespace-nowrap transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 bg-[var(--color-bg)] border-t border-[var(--color-border)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  tokenBalance < 10
                    ? "Monthly token limit reached (resets in 30 days)"
                    : "Ask AI follow-up... (Costs 10 tokens)"
                }
                disabled={isSending || tokenBalance < 10}
                className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSending || !userInput.trim() || tokenBalance < 10}
                className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
              >
                <LuSend className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1. EXECUTIVE SUMMARY CARD (TL;DR) */}
      {activeTab !== "chat" && (activeTab === "all" || activeTab === "cheat") && summary && (
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400">
              <LuLightbulb className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Executive Summary & Mental Model
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-[var(--color-text-primary)]">
            {summary}
          </p>
        </div>
      )}

      {/* 2. CHEAT SHEET BULLETS */}
      {activeTab !== "chat" && (activeTab === "all" || activeTab === "cheat") &&
        keyPoints &&
        keyPoints.length > 0 && (
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500">
                <LuListChecks className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Quick-Recall Cheat Sheet ({keyPoints.length} Key Takeaways)
              </span>
            </div>
            <ul className="space-y-2.5">
              {keyPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)] leading-relaxed group"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-[11px] font-bold text-[var(--color-text-primary)] mt-0.5 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-colors">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* 3. RICH MARKDOWN MASTERCLASS GUIDE */}
      {activeTab !== "chat" && (activeTab === "all" || activeTab === "deep") && content && (
        <div className="prose dark:prose-invert max-w-none text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1({ children }) {
                return (
                  <h1 className="text-lg font-bold text-[var(--color-text-primary)] pb-2 mb-4 border-b border-[var(--color-border)] flex items-center gap-2">
                    {children}
                  </h1>
                );
              },
              h2({ children }) {
                return (
                  <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-6 mb-3 flex items-center gap-2">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mt-5 mb-2.5 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    {children}
                  </h3>
                );
              },
              p({ children }) {
                return <p className="mb-3.5 leading-relaxed">{children}</p>;
              },
              ul({ children }) {
                return <ul className="space-y-2 my-3 pl-2">{children}</ul>;
              },
              li({ children }) {
                return (
                  <li className="flex items-start gap-2 text-sm leading-relaxed before:content-['•'] before:text-[var(--color-accent)] before:font-bold before:text-base before:leading-none before:mt-0.5">
                    <span className="flex-1">{children}</span>
                  </li>
                );
              },
              strong({ children }) {
                return (
                  <strong className="font-semibold text-[var(--color-text-primary)]">
                    {children}
                  </strong>
                );
              },
              blockquote({ children }) {
                return (
                  <div className="my-4 p-4 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 text-sm">
                    {children}
                  </div>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <table className="w-full text-left border-collapse text-xs">
                      {children}
                    </table>
                  </div>
                );
              },
              thead({ children }) {
                return (
                  <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold">
                    {children}
                  </thead>
                );
              },
              th({ children }) {
                return <th className="px-3.5 py-2.5 font-semibold">{children}</th>;
              },
              td({ children }) {
                return (
                  <td className="px-3.5 py-2 border-t border-[var(--color-border)] text-[var(--color-text-secondary)]">
                    {children}
                  </td>
                );
              },
              code({ inline, className, children }) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";

                if (!inline && match) {
                  return (
                    <CodeBlock
                      code={String(children).replace(/\n$/, "")}
                      language={language}
                    />
                  );
                }

                return (
                  <code className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-accent)] text-xs font-mono">
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#1e1e1e] shadow-md group">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333333]">
        <div className="flex items-center space-x-2">
          <LuCode size={14} className="text-gray-400" />
          <span className="text-xs font-mono font-medium text-gray-300 lowercase">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-[#333333]/50 hover:bg-[#333333] transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <LuCheck size={13} className="text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <LuCopy size={13} />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={language || "javascript"}
        style={vscDarkPlus}
        customStyle={{
          fontSize: 13,
          lineHeight: "1.6",
          margin: 0,
          padding: "1rem 1.25rem",
          background: "transparent",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default AIResponsePreview;
