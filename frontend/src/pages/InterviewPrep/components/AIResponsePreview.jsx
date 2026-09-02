import React, { useState } from "react";
import {
  LuCopy,
  LuCheck,
  LuCode,
  LuSparkles,
  LuListChecks,
  LuBookOpen,
  LuLightbulb,
  LuLayers,
  LuFlame,
} from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const AIResponsePreview = ({ content, summary, keyPoints, questionTitle }) => {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'cheat' | 'deep'
  const [copiedSection, setCopiedSection] = useState(false);

  if (!content && !summary && (!keyPoints || keyPoints.length === 0)) {
    return null;
  }

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

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
        {/* Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs font-medium">
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
        </div>

        {/* Copy All Button */}
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
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
      </div>

      {/* 1. EXECUTIVE SUMMARY CARD (TL;DR) */}
      {(activeTab === "all" || activeTab === "cheat") && summary && (
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
      {(activeTab === "all" || activeTab === "cheat") &&
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
      {(activeTab === "all" || activeTab === "deep") && content && (
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
