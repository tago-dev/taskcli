'use client';

import {
  Check,
  Command,
  CornerDownLeft,
  Keyboard,
  Palette,
  Terminal as TerminalIcon,
  X,
} from "lucide-react";
import React, { useEffect } from "react";
import { ThemeName } from "../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeName;
  onSelectTheme: (theme: ThemeName) => void;
  onRunCommand: (cmd: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  onRunCommand,
}: CommandPaletteProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themes: { name: ThemeName; label: string; bg: string; text: string }[] = [
    { name: "dark", label: "Dark (Padrão)", bg: "#09090b", text: "#fafafa" },
    { name: "light", label: "Light", bg: "#f8fafc", text: "#0f172a" },
    { name: "matrix", label: "Matrix Terminal", bg: "#020804", text: "#00ff66" },
    { name: "dracula", label: "Dracula", bg: "#1e1f29", text: "#bd93f9" },
    { name: "cyberpunk", label: "Cyberpunk", bg: "#0c0814", text: "#ffe600" },
    { name: "nord", label: "Nord Frost", bg: "#242933", text: "#88c0d0" },
  ];

  const commands = [
    { cmd: "add Estudar Next.js -p high #dev ~2", desc: "Cria tarefa com prioridade alta, tag e 2 pomodoros" },
    { cmd: "done 1", desc: "Conclui a tarefa pelo ID ou número na lista" },
    { cmd: "rm 1", desc: "Remove a tarefa indicada" },
    { cmd: "list active", desc: "Lista apenas tarefas não concluídas" },
    { cmd: "note Dicas | Usar Tailwind 4", desc: "Cria uma anotação com título e conteúdo" },
    { cmd: "pomodoro start", desc: "Inicia o temporizador Pomodoro" },
    { cmd: "pomodoro 50", desc: "Configura o ciclo para 50 minutos" },
    { cmd: "theme dracula", desc: "Muda o visual do app instantaneamente" },
    { cmd: "stats", desc: "Exibe resumo de produtividade e taxas" },
    { cmd: "clear completed", desc: "Limpa tarefas concluídas" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--terminal-bar)] border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs sm:text-sm font-bold font-mono text-[var(--text-main)] uppercase">
              Ajuda &amp; Paleta de Comandos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-5 terminal-scroll">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-dim)] uppercase">
              <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Temas da Interface</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {themes.map(t => (
                <button
                  key={t.name}
                  onClick={() => onSelectTheme(t.name)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-left text-xs font-mono transition-all ${
                    currentTheme === t.name
                      ? "border-[var(--accent)] bg-[var(--bg-card)] shadow-xs"
                      : "border-[var(--border-color)] hover:border-[var(--border-focus)] bg-[var(--bg-main)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 inline-block"
                      style={{ backgroundColor: t.bg }}
                    />
                    <span className="text-[var(--text-main)]">{t.label}</span>
                  </div>
                  {currentTheme === t.name && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-dim)] uppercase">
              <Keyboard className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Atalhos de Teclado</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Paleta / Ajuda</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] text-[10px]">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Autocomplete CLI</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] text-[10px]">
                  Tab
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Histórico de Comandos</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] text-[10px]">
                  ↑ / ↓
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Fechar Modal</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] text-[10px]">
                  Esc
                </kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-dim)] uppercase">
              <TerminalIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Exemplos de Comandos (Clique para executar)</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {commands.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onRunCommand(c.cmd);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2 rounded bg-[var(--bg-main)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent)] text-left group transition-all"
                >
                  <div className="space-y-0.5">
                    <code className="text-xs font-mono text-[var(--accent)] font-semibold">
                      {c.cmd}
                    </code>
                    <p className="text-[11px] text-[var(--text-dim)]">{c.desc}</p>
                  </div>
                  <CornerDownLeft className="w-3.5 h-3.5 text-[var(--text-dim)] group-hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
