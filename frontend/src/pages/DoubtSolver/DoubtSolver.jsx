import React, { useState, useContext, useRef, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/UserContext";
import axiosInstance from "../../utils/axioInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuSparkles,
  LuCoins,
  LuSend,
  LuBot,
  LuUser,
  LuTrash2,
  LuCode,
  LuCopy,
  LuCheck,
  LuLightbulb,
  LuBug,
  LuLayers,
  LuArrowRight,
} from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import SpinnerLoader from "../../components/loaders/SpinnerLoader";

const QUICK_STARTERS = [
  {
    icon: LuBug,
    title: "Debug & Fix Code",
    desc: "Paste an error stack trace or explain buggy code behavior",
    prompt: "I have a bug in my code where async state updates in React are causing an infinite loop. Here is the scenario: ",
  },
  {
    icon: LuLayers,
    title: "System Design Trade-off",
    desc: "Compare architectures, database indexing, or caching strategies",
    prompt: "Compare Redis vs Memcached for session storage and caching. When should I strictly choose Redis over Memcached in a high-concurrency distributed system?",
  },
  {
    icon: LuCode,
    title: "Optimize Algorithm Complexity",
    desc: "Transform quadratic O(N²) solutions into optimal O(N) or O(N log N)",
    prompt: "How can I optimize the Two-Sum problem from O(N²) brute force to O(N) linear time using a hash map? Explain the memory vs runtime trade-off.",
  },
  {
    icon: LuLightbulb,
    title: "STAR Behavioral Formulation",
    desc: "Structure tough questions like 'Tell me about a time you failed'",
    prompt: "How should I structure my answer to the interview question: 'Tell me about a time a production release failed under your watch' using the STAR technique?",
  },
];

const DoubtSolver = () => {
  const { user, updateTokens } = useContext(UserContext);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `### 👋 Welcome to your 24/7 AI Doubt Solver!
I am your Principal Engineer and Technical Interview Mentor. You can ask me:
- **Architecture & System Design** (distributed caches, CAP theorem, database sharding, microservices)
- **Code Debugging & Optimization** (React hooks, Node.js event loop, Go concurrency, SQL indexing)
- **Algorithmic Edge Cases** (dynamic programming, graphs, trees, two-pointers)
- **Behavioral / STAR Frameworks** (leadership principles, conflict resolution, project narratives)

*Each query utilizes **10 tokens** from your monthly 1,000 token allocation.*`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const tokenBalance = user?.tokens !== undefined ? user.tokens : 1000;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim()) return;

    if (tokenBalance < 10) {
      toast.error("Insufficient token balance. You need at least 10 tokens to ask a doubt.");
      return;
    }

    const newHistory = [...messages, { role: "user", content: textToSend }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AI.DOUBT_SOLVER, {
        userQuery: textToSend,
        chatHistory: newHistory.slice(-6), // Pass recent context
        userRole: user?.name ? `${user.name} - Software Engineer` : "Software Engineer",
      });

      if (response.data?.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.data.reply },
        ]);

        if (response.data.tokensRemaining !== undefined) {
          updateTokens(response.data.tokensRemaining);
        }
      }
    } catch (err) {
      console.error("Doubt solver error:", err);
      const msg = err.response?.data?.message || "Failed to resolve doubt. Please try again.";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ **Unable to complete request:** ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. What technical or interview doubt can I solve for you next?",
      },
    ]);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--color-bg)] transition-colors duration-200">
        <div className="container mx-auto pt-6 pb-20 px-4 sm:px-6 max-w-5xl">
          
          {/* Header Banner */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Principal Mentor
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  Unlimited Topics & Code
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
                <span>Doubt Solver</span>
                <LuSparkles className="w-5 h-5 text-purple-500" />
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                Get instant, production-grade breakdowns of any technical challenge, code bug, or interview doubt.
              </p>
            </div>

            {/* Token Quota Status Card */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <LuCoins className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider">
                    Monthly Quota
                  </div>
                  <div className="text-base font-bold text-[var(--color-text-primary)] tabular-nums">
                    {tokenBalance} <span className="text-xs font-normal text-[var(--color-text-muted)]">/ 1,000</span>
                  </div>
                </div>
              </div>

              {messages.length > 1 && (
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors text-[var(--color-text-secondary)]"
                >
                  <LuTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Starter Templates (visible when messages length <= 1) */}
          {messages.length <= 1 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Quick Starters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_STARTERS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSend(item.prompt)}
                      className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-purple-500/40 hover:bg-[var(--color-bg)] transition-all cursor-pointer group flex items-start gap-3 shadow-xs"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {item.title}
                          </h4>
                          <LuArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Chat Thread Window */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs overflow-hidden flex flex-col min-h-[500px]">
            {/* Messages Area */}
            <div className="flex-1 p-5 space-y-5 overflow-y-auto max-h-[650px]">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 items-start ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-xs ${
                      msg.role === "user"
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <LuUser className="w-4 h-4" />
                    ) : (
                      <LuBot className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "bg-[var(--color-accent)] text-white font-medium"
                        : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-base font-bold text-[var(--color-text-primary)] mt-3 mb-2 border-b border-[var(--color-border)] pb-1">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-sm font-bold text-[var(--color-text-primary)] mt-3 mb-1.5">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-2.5 mb-1 uppercase tracking-wide">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-2.5 leading-relaxed">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="space-y-1.5 my-2.5 pl-3">{children}</ul>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start gap-2 before:content-['•'] before:text-purple-500 before:font-bold">
                                <span>{children}</span>
                              </li>
                            ),
                            code({ inline, className, children }) {
                              const match = /language-(\w+)/.exec(className || "");
                              const language = match ? match[1] : "";
                              if (!inline && match) {
                                return (
                                  <DoubtCodeBlock
                                    code={String(children).replace(/\n$/, "")}
                                    language={language}
                                  />
                                );
                              }
                              return (
                                <code className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-purple-600 dark:text-purple-400 font-mono text-xs">
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 items-center text-xs text-[var(--color-text-muted)] pl-2 py-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center">
                    <SpinnerLoader />
                  </div>
                  <span className="font-medium animate-pulse">
                    Principal Mentor is analyzing and drafting solution...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-[var(--color-bg)]/60 border-t border-[var(--color-border)]">
              {tokenBalance < 10 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                  <LuCoins className="w-4 h-4 flex-shrink-0" />
                  <span>
                    You have exhausted your 1,000 tokens for this monthly period. Your quota will automatically reset in 30 days.
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask any technical doubt, system trade-off, or code issue... (10 tokens)"
                    disabled={loading}
                    className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-purple-500 transition-colors shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95 flex-shrink-0"
                  >
                    <span>Send</span>
                    <LuSend className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
              <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[var(--color-text-muted)]">
                <span>Deducts 10 tokens per question</span>
                <span>Press Enter to send</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

function DoubtCodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#1e1e1e] shadow-md group">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#252526] border-b border-[#333333]">
        <div className="flex items-center space-x-2">
          <LuCode size={13} className="text-gray-400" />
          <span className="text-[11px] font-mono font-medium text-gray-300 lowercase">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-[#333333]/50 hover:bg-[#333333] transition-colors"
        >
          {copied ? (
            <>
              <LuCheck size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <LuCopy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={language || "javascript"}
        style={vscDarkPlus}
        customStyle={{
          fontSize: 12,
          lineHeight: "1.6",
          margin: 0,
          padding: "0.85rem 1rem",
          background: "transparent",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default DoubtSolver;
