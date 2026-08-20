'use client';

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import {
  CheckCircle2,
  Clock,
  Cloud,
  Columns3,
  Command,
  FileText,
  HardDrive,
  Layers,
  LogIn,
  Palette,
  Terminal as TerminalIcon,
  UserPlus,
  Users,
} from "lucide-react";
import { ThemeName, ViewTab } from "../types";

interface HeaderProps {
  currentTab: ViewTab;
  setTab: (tab: ViewTab) => void;
  theme: ThemeName;
  onCycleTheme: () => void;
  completedTasks: number;
  totalTasks: number;
  pomodoroSessions: number;
  onOpenHelp: () => void;
  isCloudSyncActive?: boolean;
}

export function Header({
  currentTab,
  setTab,
  theme,
  onCycleTheme,
  completedTasks,
  totalTasks,
  pomodoroSessions,
  onOpenHelp,
  isCloudSyncActive = false,
}: HeaderProps) {
  const themeColors: Record<ThemeName, string> = {
    dark: "#10b981",
    light: "#0f766e",
    matrix: "#00ff66",
    dracula: "#ff79c6",
    cyberpunk: "#ffe600",
    nord: "#88c0d0",
  };

  return (
    <header className="w-full border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-4 sm:px-8 py-4 sticky top-0 z-30 transition-colors shadow-xs">
      <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] px-3.5 py-2 rounded-xl shadow-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
            <h1 className="text-lg font-bold tracking-wider uppercase text-[var(--text-main)] font-mono">
              Task<span className="text-[var(--accent)]">Cli</span>
            </h1>
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-bold">
              v1.0
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2.5 text-xs font-mono">
            <span className="flex items-center gap-2 bg-[var(--bg-main)] px-3.5 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
              <span>{completedTasks}/{totalTasks} concluídas</span>
            </span>
            <span className="flex items-center gap-2 bg-[var(--bg-main)] px-3.5 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)]">
              <Clock className="w-4 h-4 text-[var(--warning)]" />
              <span>{pomodoroSessions} ciclos</span>
            </span>
            <span
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors ${
                isCloudSyncActive
                  ? "bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)] font-semibold"
                  : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-dim)]"
              }`}
              title={isCloudSyncActive ? "Sincronização em nuvem com Supabase ativa" : "Armazenamento local"}
            >
              {isCloudSyncActive ? (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Supabase</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  <span>Local</span>
                </>
              )}
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 bg-[var(--bg-main)] p-1.5 rounded-xl border border-[var(--border-color)] text-xs sm:text-sm font-mono overflow-x-auto">
          <button
            onClick={() => setTab("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentTab === "all"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Geral</span>
          </button>
          <button
            onClick={() => setTab("tasks")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentTab === "tasks"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tarefas</span>
          </button>
          <button
            onClick={() => setTab("kanban")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentTab === "kanban"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <Columns3 className="w-4 h-4" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setTab("notes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentTab === "notes"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notas</span>
          </button>
          <button
            onClick={() => setTab("pomodoro")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentTab === "pomodoro"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pomodoro</span>
          </button>
          <button
            onClick={() => setTab("team")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentTab === "team"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Equipe</span>
          </button>
          <button
            onClick={() => setTab("terminal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentTab === "terminal"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <TerminalIcon className="w-4 h-4" />
            <span>Terminal</span>
          </button>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCycleTheme}
            className="flex items-center gap-2 text-xs sm:text-sm font-mono px-3.5 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-main)] transition-colors shadow-xs"
            title="Alternar tema"
          >
            <Palette className="w-4 h-4 text-[var(--accent)]" />
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: themeColors[theme] }}
            />
            <span className="uppercase font-bold">{theme}</span>
          </button>

          <button
            onClick={onOpenHelp}
            className="p-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shadow-xs"
            title="Atalhos e Ajuda (?)"
          >
            <Command className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pl-1 border-l border-[var(--border-color)]">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-mono font-semibold text-[var(--text-main)] transition-colors shadow-xs">
                  <LogIn className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Entrar</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-mono font-bold hover:opacity-90 transition-opacity shadow-xs">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Criar Conta</span>
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8 rounded-lg",
                      userButtonPopoverCard: "bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] shadow-2xl",
                      userButtonPopoverActionButton: "hover:bg-[var(--bg-card)] text-[var(--text-main)] font-mono text-xs",
                      userButtonPopoverActionButtonText: "text-[var(--text-main)] font-mono",
                      userButtonPopoverFooter: "border-t border-[var(--border-color)]",
                    },
                  }}
                />
              </div>
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}
