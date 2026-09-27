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
  LuFileText,
  LuDownload,
  LuRefreshCw,
  LuTerminal,
  LuLayers,
} from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import SpinnerLoader from "../../components/loaders/SpinnerLoader";

const TARGET_ROLES = [
  "General Software Engineering",
  "System Design & Distributed Systems",
  "Frontend & React Architecture",
  "Backend & Database Optimization",
  "Behavioral & STAR Framework",
  "Algorithms & Data Structures",
];

const SUGGESTED_QUERIES = [
  {
    category: "System Design",
    title: "Distributed Caching Topologies",
    prompt:
      "Explain the trade-offs between Cache-Aside, Write-Through, and Write-Behind caching topologies. How do we mitigate cache stampedes (thundering herd) at scale?",
  },
  {
    category: "System Design",
    title: "Sharding vs Partitioning",
    prompt:
      "What is the difference between horizontal database sharding and partitioning? How does consistent hashing help with dynamic node addition?",
  },
  {
    category: "Algorithms",
    title: "Graph Cycle Detection",
    prompt:
      "How do you detect cycles in directed versus undirected graphs? Provide optimal algorithms (Tarjan's/Kahn's vs BFS/DFS) with time complexity.",
  },
  {
    category: "Algorithms",
    title: "Dynamic Programming Memoization",
    prompt:
      "Explain the step-by-step methodology to transition from an exponential recursive solution to top-down memoization and bottom-up tabulation.",
  },
  {
    category: "Behavioral",
    title: "STAR Technique for Failures",
    prompt:
      "How do I formulate a compelling STAR response for: 'Tell me about a time you made a major architectural mistake in production' without sounding reckless?",
  },
  {
    category: "Frontend",
    title: "React Fiber & Reconciliation",
    prompt:
      "How does the React Fiber reconciler achieve time-slicing and interruptible rendering compared to the legacy stack reconciler?",
  },
];

const AskQuery = () => {
  const { user, updateTokens } = useContext(UserContext);
  const [selectedRole, setSelectedRole] = useState(TARGET_ROLES[0]);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `### 💡 Ask Query — Dedicated Technical AI Advisor

Welcome! Ask any technical interview question, system design challenge, debugging roadblock, or behavioral scenario.

- **Custom Context:** Switch target roles in the header to calibrate the AI persona.
- **Code Attachment:** Toggle the **Code Snippet** drawer to attach code for review.
- **Exporting:** Download your entire discussion as a Markdown note for offline study.

*Each technical query deducts **10 tokens** from your monthly 1,000 token balance.*`,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const tokenBalance = user?.tokens !== undefined ? user.tokens : 1000;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (overridePrompt) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() && !codeSnippet.trim()) return;

    if (tokenBalance < 10) {
      toast.error("Insufficient tokens. You need at least 10 tokens to query the AI.");
      return;
    }

    let compiledQuery = textToSend.trim();
    if (codeSnippet.trim()) {
      compiledQuery += `\n\n\`\`\`${codeLanguage}\n${codeSnippet.trim()}\n\`\`\``;
    }

    const newHistory = [...messages, { role: "user", content: compiledQuery }];
    setMessages(newHistory);
    setInput("");
    setCodeSnippet("");
    setShowCodeInput(false);
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AI.DOUBT_SOLVER, {
        userQuery: compiledQuery,
        userRole: selectedRole,
        chatHistory: messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const { reply, tokensRemaining } = response.data;

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      if (tokensRemaining !== undefined && updateTokens) {
        updateTokens(tokensRemaining);
      }
      toast.success("Response generated (10 tokens used)", { icon: "⚡" });
    } catch (error) {
      console.error("Ask Query Error:", error);
      const msg =
        error.response?.data?.message ||
        "Failed to generate answer. Please verify your connection and try again.";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Error:** ${msg}\n\nPlease try asking again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear this query session?")) {
      setMessages([
        {
          role: "assistant",
          content: "Chat cleared. What technical topic or interview problem would you like to explore next?",
        },
      ]);
      toast.success("Chat history cleared");
    }
  };

  const exportChat = () => {
    const text = messages
      .map((m) => `### ${m.role === "assistant" ? "AI Advisor" : "Candidate"}\n\n${m.content}\n\n---`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prep-query-session-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript exported as Markdown!");
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--color-bg)] transition-colors duration-200">
        <div className="container mx-auto pt-6 pb-24 px-4 sm:px-6 max-w-5xl">
          
          {/* Top Header Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 mb-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center font-bold">
                  <LuSparkles className="w-4 h-4" />
                </div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                  Ask Query
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/20">
                  AI Technical Copilot
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Ask deep technical questions, explore system design trade-offs, and receive code-level feedback.
              </p>
            </div>

            {/* Role Persona & Actions */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 bg-[var(--color-bg)] px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs">
                <span className="text-[var(--color-text-muted)] text-[11px] font-medium hidden sm:inline">
                  Persona:
                </span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-transparent text-[var(--color-text-primary)] font-semibold text-xs focus:outline-none cursor-pointer"
                >
                  {TARGET_ROLES.map((role) => (
                    <option key={role} value={role} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={exportChat}
                  title="Export conversation as Markdown"
                  className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <LuDownload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--color-text-muted)] hover:text-red-500 transition-colors cursor-pointer text-xs"
                >
                  <LuTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Query Ideas (Chips) */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1 flex-shrink-0">
              <LuLightbulb className="w-3.5 h-3.5 text-amber-500" />
              Suggested:
            </span>
            {SUGGESTED_QUERIES.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                disabled={loading}
                className="flex-shrink-0 px-3 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer text-[11px] font-medium"
              >
                {item.title}
              </button>
            ))}
          </div>

          {/* Chat Messages Container */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-6 mb-4 min-h-[460px] max-h-[600px] overflow-y-auto space-y-4 shadow-xs">
            <AnimatePresence>
              {messages.map((msg, index) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isAssistant
                          ? "bg-[var(--color-accent)] text-white shadow-xs"
                          : "bg-purple-600 text-white shadow-xs"
                      }`}
                    >
                      {isAssistant ? <LuBot className="w-4 h-4" /> : <LuUser className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`relative max-w-[85%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                          : "bg-[var(--color-accent)] text-white"
                      }`}
                    >
                      {isAssistant ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
                                return !inline && match ? (
                                  <div className="relative group my-2">
                                    <div className="flex items-center justify-between bg-zinc-900 text-zinc-400 text-[10px] px-3 py-1 rounded-t-lg border-b border-zinc-800">
                                      <span>{match[1]}</span>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(String(children), `code-${index}`)}
                                        className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                                      >
                                        {copiedIndex === `code-${index}` ? (
                                          <LuCheck className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <LuCopy className="w-3 h-3" />
                                        )}
                                        <span>{copiedIndex === `code-${index}` ? "Copied" : "Copy"}</span>
                                      </button>
                                    </div>
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      customStyle={{
                                        margin: 0,
                                        borderTopLeftRadius: 0,
                                        borderTopRightRadius: 0,
                                        borderBottomLeftRadius: "0.5rem",
                                        borderBottomRightRadius: "0.5rem",
                                        fontSize: "12px",
                                      }}
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code
                                    className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}

                      {/* Copy Message Action for Assistant */}
                      {isAssistant && (
                        <div className="mt-2.5 pt-2 border-t border-[var(--color-border)]/50 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                          <span>Prep AI</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, index)}
                            className="flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                          >
                            {copiedIndex === index ? (
                              <LuCheck className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <LuCopy className="w-3 h-3" />
                            )}
                            <span>{copiedIndex === index ? "Copied" : "Copy reply"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)] text-white flex items-center justify-center">
                  <LuBot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-4 py-3 flex items-center gap-2">
                  <SpinnerLoader size="sm" />
                  <span className="text-xs text-[var(--color-text-muted)] font-medium">
                    Analyzing technical query with {selectedRole} perspective...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Optional Code Snippet Input Drawer */}
          {showCodeInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 mb-3 shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                  <LuTerminal className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Attach Code Snippet</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)]"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="sql">SQL</option>
                    <option value="go">Go</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(false)}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    Close
                  </button>
                </div>
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste the code you'd like reviewed, debugged, or optimized here..."
                rows={5}
                className="w-full font-mono text-xs p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </motion.div>
          )}

          {/* Input & Action Bar */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setShowCodeInput((prev) => !prev)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showCodeInput
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent)]/30 font-semibold"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <LuCode className="w-3.5 h-3.5" />
                <span>{showCodeInput ? "Hide Code Attachment" : "Attach Code"}</span>
              </button>

              <div className="ml-auto text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                <LuCoins className="w-3.5 h-3.5 text-amber-500" />
                <span>{tokenBalance} tokens remaining</span>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your technical question or describe your coding roadblock... (Ctrl+Enter to send)"
                rows={2}
                disabled={loading}
                className="flex-1 text-xs sm:text-sm p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && !codeSnippet.trim())}
                className="h-10 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs hover:shadow active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              >
                <LuSend className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AskQuery;
