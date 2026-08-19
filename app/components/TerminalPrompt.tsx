'use client';

import {
  ChevronRight,
  CornerDownLeft,
  Maximize2,
  Minimize2,
  Terminal as TerminalIcon,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { CommandHistoryItem } from "../types";

interface TerminalPromptProps {
  history: CommandHistoryItem[];
  commandHistoryList: string[];
  onExecute: (command: string) => void;
  onClear: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const AUTOCOMPLETE_SUGGESTIONS = [
  "help",
  "add ",
  "done ",
  "rm ",
  "list",
  "list active",
  "list done",
  "note ",
  "notes",
  "pomodoro start",
  "pomodoro pause",
  "pomodoro 25",
  "pomodoro 50",
  "theme dark",
  "theme light",
  "theme matrix",
  "theme dracula",
  "theme cyberpunk",
  "theme nord",
  "stats",
  "clear",
];

export function TerminalPrompt({
  history,
  commandHistoryList,
  onExecute,
  onClear,
  isExpanded = false,
  onToggleExpand,
}: TerminalPromptProps) {
  const [input, setInput] = useState("");
  const [historyNavIndex, setHistoryNavIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onExecute(input);
    setInput("");
    setHistoryNavIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistoryList.length === 0) return;
      const nextIndex = Math.min(historyNavIndex + 1, commandHistoryList.length - 1);
      setHistoryNavIndex(nextIndex);
      setInput(commandHistoryList[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyNavIndex > 0) {
        const nextIndex = historyNavIndex - 1;
        setHistoryNavIndex(nextIndex);
        setInput(commandHistoryList[nextIndex]);
      } else if (historyNavIndex === 0) {
        setHistoryNavIndex(-1);
        setInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (!input.trim()) return;
      const match = AUTOCOMPLETE_SUGGESTIONS.find(s =>
        s.toLowerCase().startsWith(input.toLowerCase())
      );
      if (match) {
        setInput(match);
      }
    }
  };

  const getOutputClass = (type: CommandHistoryItem["type"]) => {
    switch (type) {
      case "success":
        return "text-[var(--accent)]";
      case "error":
        return "text-[var(--danger)]";
      case "warn":
        return "text-[var(--warning)]";
      case "info":
      default:
        return "text-[var(--text-main)]";
    }
  };

  return (
    <div
      className={`flex flex-col bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-lg transition-all ${
        isExpanded ? "h-[80vh]" : "h-[380px] sm:h-[420px]"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--terminal-bar)] border-b border-[var(--border-color)] select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
          </div>
          <span className="text-xs sm:text-sm font-mono text-[var(--text-dim)] flex items-center gap-1.5 ml-2 font-medium">
            <TerminalIcon className="w-4 h-4 text-[var(--accent)]" />
            taskcli@shell:~$
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors text-xs"
            title="Limpar terminal (clear)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors text-xs"
              title={isExpanded ? "Reduzir terminal" : "Expandir terminal"}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-4 sm:p-5 font-mono text-xs sm:text-sm overflow-y-auto space-y-3.5 terminal-scroll bg-[var(--bg-main)]"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map(item => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center gap-2 text-[var(--text-dim)]">
              <span className="text-[var(--accent)] font-bold">taskcli</span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-[var(--text-muted)] font-semibold">{item.command}</span>
            </div>
            <div className={`pl-5 space-y-1 whitespace-pre-wrap ${getOutputClass(item.type)}`}>
              {item.output.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex items-center gap-2 overflow-x-auto text-xs font-mono text-[var(--text-dim)]">
        <span className="text-[var(--text-dim)] font-bold shrink-0">Sugestões:</span>
        <button
          onClick={() => {
            setInput("help");
            inputRef.current?.focus();
          }}
          className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0 transition-colors shadow-2xs"
        >
          help
        </button>
        <button
          onClick={() => {
            setInput("list");
            inputRef.current?.focus();
          }}
          className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0 transition-colors shadow-2xs"
        >
          list
        </button>
        <button
          onClick={() => {
            setInput("pomodoro 25");
            inputRef.current?.focus();
          }}
          className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0 transition-colors shadow-2xs"
        >
          pomodoro 25
        </button>
        <button
          onClick={() => {
            setInput("theme matrix");
            inputRef.current?.focus();
          }}
          className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0 transition-colors shadow-2xs"
        >
          theme matrix
        </button>
        <button
          onClick={() => {
            setInput("stats");
            inputRef.current?.focus();
          }}
          className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0 transition-colors shadow-2xs"
        >
          stats
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 p-3 sm:p-4 bg-[var(--bg-surface)] border-t border-[var(--border-color)]"
      >
        <div className="flex items-center gap-1 text-[var(--accent)] font-mono text-sm pl-1 font-bold select-none">
          <span>&gt;</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite um comando (ex: add Desenvolver tela de login -p high #frontend)"
          className="flex-1 bg-transparent border-none outline-none font-mono text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-dim)]"
          autoComplete="off"
          spellCheck="false"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-3.5 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold shadow-xs"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
