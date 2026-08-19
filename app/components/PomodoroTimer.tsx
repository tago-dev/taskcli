'use client';

import {
  Play,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { formatTime } from "../lib/utils";
import { PomodoroMode, PomodoroSettings, Task } from "../types";

interface PomodoroTimerProps {
  mode: PomodoroMode;
  timeLeft: number;
  totalSeconds?: number;
  isRunning: boolean;
  progress: number;
  sessionsCompleted: number;
  activeTask: Task | null;
  settings: PomodoroSettings;
  onToggle: () => void;
  onReset: () => void;
  onSwitchMode: (mode: PomodoroMode) => void;
  onSetCustomMinutes: (mins: number) => void;
  onToggleSound: () => void;
  onClearActiveTask: () => void;
  isCompact?: boolean;
}

export function PomodoroTimer({
  mode,
  timeLeft,
  isRunning,
  progress,
  sessionsCompleted,
  activeTask,
  settings,
  onToggle,
  onReset,
  onSwitchMode,
  onSetCustomMinutes,
  onToggleSound,
  onClearActiveTask,
  isCompact = false,
}: PomodoroTimerProps) {
  const getModeLabel = (m: PomodoroMode) => {
    switch (m) {
      case "focus":
        return "Foco";
      case "shortBreak":
        return "Pausa Curta";
      case "longBreak":
        return "Pausa Longa";
    }
  };

  const getModeColor = (m: PomodoroMode) => {
    switch (m) {
      case "focus":
        return "var(--accent)";
      case "shortBreak":
        return "var(--info)";
      case "longBreak":
        return "var(--warning)";
    }
  };

  if (isCompact) {
    return (
      <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            className="w-11 h-11 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs"
          >
            {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <div>
            <div className="text-xl font-mono font-bold text-[var(--text-main)]">
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs font-mono text-[var(--text-dim)] uppercase">
              {getModeLabel(mode)} • {sessionsCompleted} ciclos
            </div>
          </div>
        </div>

        {activeTask && (
          <div className="text-sm text-[var(--text-muted)] truncate max-w-[280px]">
            <span className="text-[var(--accent)] font-mono font-semibold">Foco: </span>
            {activeTask.title}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
      <div
        className="absolute top-0 left-0 h-1.5 transition-all duration-300"
        style={{
          width: `${progress}%`,
          backgroundColor: getModeColor(mode),
        }}
      />

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 bg-[var(--bg-main)] p-1.5 rounded-xl border border-[var(--border-color)] text-xs sm:text-sm font-mono flex-1">
          <button
            onClick={() => onSwitchMode("focus")}
            className={`flex-1 py-2 px-2 text-center rounded-lg whitespace-nowrap transition-all ${
              mode === "focus"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Foco (25m)
          </button>
          <button
            onClick={() => onSwitchMode("shortBreak")}
            className={`flex-1 py-2 px-2 text-center rounded-lg whitespace-nowrap transition-all ${
              mode === "shortBreak"
                ? "bg-[var(--info)] text-white font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Pausa (5m)
          </button>
          <button
            onClick={() => onSwitchMode("longBreak")}
            className={`flex-1 py-2 px-2 text-center rounded-lg whitespace-nowrap transition-all ${
              mode === "longBreak"
                ? "bg-[var(--warning)] text-black font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Longa (15m)
          </button>
        </div>

        <button
          onClick={onToggleSound}
          className="p-3 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shadow-xs shrink-0"
          title={settings.soundEnabled ? "Som ativado" : "Som desativado"}
        >
          {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {activeTask ? (
        <div className="flex items-center justify-between gap-3 p-4 mb-6 bg-[var(--bg-card)] border border-[var(--accent)]/50 rounded-xl shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <Zap className="w-5 h-5 text-[var(--accent)] shrink-0 animate-pulse" />
            <div className="min-w-0">
              <div className="text-xs font-mono text-[var(--accent)] uppercase font-bold tracking-wide">
                Tarefa em Foco
              </div>
              <div className="text-sm sm:text-base text-[var(--text-main)] font-semibold truncate">
                {activeTask.title}
              </div>
            </div>
          </div>
          <button
            onClick={onClearActiveTask}
            className="text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text-main)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-main)] border border-transparent hover:border-[var(--border-color)] transition-colors shrink-0"
          >
            Desvincular
          </button>
        </div>
      ) : (
        <div className="p-3.5 mb-6 bg-[var(--bg-main)]/60 border border-dashed border-[var(--border-color)] rounded-xl text-center text-xs sm:text-sm font-mono text-[var(--text-dim)]">
          Dica: Clique no ícone de mira <span className="text-[var(--accent)] font-bold">◉</span> de uma tarefa para vinculá-la ao Pomodoro.
        </div>
      )}

      <div className="flex flex-col items-center justify-center my-6 select-none">
        <div
          className={`text-6xl sm:text-7xl md:text-8xl font-mono font-bold tracking-tight transition-all duration-300 ${
            isRunning ? "glow-active scale-105" : ""
          }`}
          style={{ color: getModeColor(mode) }}
        >
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs sm:text-sm font-mono text-[var(--text-dim)] mt-3 uppercase tracking-widest font-medium">
          {isRunning ? "Sessão em andamento" : "Pausado"} • Ciclo #{sessionsCompleted + 1}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          onClick={onToggle}
          className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-mono font-bold text-base transition-all shadow-md active:scale-95"
          style={{
            backgroundColor: getModeColor(mode),
            color: mode === "longBreak" ? "#000000" : "var(--accent-text)",
          }}
        >
          {isRunning ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current ml-0.5" />
              <span>Iniciar Foco</span>
            </>
          )}
        </button>

        <button
          onClick={onReset}
          className="p-3.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shadow-xs"
          title="Resetar tempo"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2.5 mt-8 pt-6 border-t border-[var(--border-color)] text-xs sm:text-sm font-mono text-[var(--text-dim)] flex-wrap">
        <span className="font-semibold">Predefinições:</span>
        <button
          onClick={() => onSetCustomMinutes(15)}
          className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)] transition-colors shadow-xs"
        >
          15m
        </button>
        <button
          onClick={() => onSetCustomMinutes(25)}
          className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)] transition-colors shadow-xs"
        >
          25m
        </button>
        <button
          onClick={() => onSetCustomMinutes(45)}
          className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)] transition-colors shadow-xs"
        >
          45m
        </button>
        <button
          onClick={() => onSetCustomMinutes(50)}
          className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)] transition-colors shadow-xs"
        >
          50m
        </button>
      </div>
    </div>
  );
}
