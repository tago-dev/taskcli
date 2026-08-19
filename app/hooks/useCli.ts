'use client';

import { useState } from "react";
import { generateId, playAudioFeedback } from "../lib/utils";
import { CommandHistoryItem, Note, PomodoroMode, Task, TaskPriority, Team, TeamMember, TeamRole, ThemeName } from "../types";

interface UseCliProps {
  tasks: Task[];
  notes: Note[];
  teams?: Team[];
  activeTeam?: Team | null;
  isLoggedIn?: boolean;
  createTeam?: (name: string, description: string) => Team;
  addTeamMember?: (teamId: string, name: string, email: string, role: TeamRole) => TeamMember | null;
  removeTeamMember?: (teamId: string, memberId: string) => boolean;
  switchTeam?: (teamId: string) => void;
  addTask: (title: string, priority?: TaskPriority, tags?: string[], estimatedPomodoros?: number) => Task;
  toggleTask: (id: string) => Task | null;
  removeTask: (id: string) => boolean;
  clearCompleted: () => number;
  clearAllTasks: () => void;
  addNote: (title: string, content: string, tags?: string[]) => Note;
  removeNote: (id: string) => boolean;
  onSync?: () => Promise<boolean>;
  pomodoro: {
    start: () => void;
    pause: () => void;
    reset: () => void;
    switchMode: (mode: PomodoroMode) => void;
    setCustomMinutes: (minutes: number) => void;
    isRunning: boolean;
    mode: PomodoroMode;
    timeLeft: number;
    sessionsCompleted: number;
  };
  changeTheme: (theme: ThemeName) => void;
  cycleTheme: () => ThemeName;
}

export function useCli({
  tasks,
  notes,
  teams = [],
  activeTeam,
  isLoggedIn = false,
  createTeam,
  addTeamMember,
  removeTeamMember,
  switchTeam,
  addTask,
  toggleTask,
  removeTask,
  clearCompleted,
  clearAllTasks,
  addNote,
  removeNote,
  onSync,
  pomodoro,
  changeTheme,
  cycleTheme,
}: UseCliProps) {
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: "welcome-banner",
      command: "welcome",
      output: [
        "TaskCli v1.0.0 — Terminal de Tarefas, Notas e Pomodoro",
        "Digite 'help' ou aperte Tab para ver os comandos disponíveis.",
      ],
      type: "info",
      timestamp: 0,
    },
  ]);
  const [commandHistoryList, setCommandHistoryList] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const addHistoryEntry = (command: string, output: string[], type: 'success' | 'error' | 'info' | 'warn' = 'info') => {
    const newItem: CommandHistoryItem = {
      id: generateId(),
      command,
      output,
      type,
      timestamp: Date.now(),
    };
    setHistory(prev => [...prev, newItem]);
    if (command.trim()) {
      setCommandHistoryList(prev => [command, ...prev.filter(c => c !== command)].slice(0, 50));
    }
    setHistoryIndex(-1);
  };

  const clearTerminal = () => {
    setHistory([]);
  };

  const resolveTaskId = (arg: string): string | null => {
    const trimmed = arg.trim().toLowerCase();
    const exact = tasks.find(t => t.id.toLowerCase() === trimmed);
    if (exact) return exact.id;

    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= tasks.length) {
      return tasks[num - 1].id;
    }

    const partial = tasks.find(t => t.title.toLowerCase().includes(trimmed));
    return partial ? partial.id : null;
  };

  const resolveNoteId = (arg: string): string | null => {
    const trimmed = arg.trim().toLowerCase();
    const exact = notes.find(n => n.id.toLowerCase() === trimmed);
    if (exact) return exact.id;

    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= notes.length) {
      return notes[num - 1].id;
    }

    const partial = notes.find(n => n.title.toLowerCase().includes(trimmed));
    return partial ? partial.id : null;
  };

  const executeCommand = async (rawInput: string) => {
    const input = rawInput.trim();
    if (!input) return;

    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const rest = args.join(' ');

    playAudioFeedback('beep');

    switch (cmd) {
      case 'help':
      case '?': {
        addHistoryEntry(input, [
          "COMANDOS DISPONÍVEIS:",
          "  add <texto> [-p high|med|low] [#tag] [~2]  - Adiciona nova tarefa",
          "  done <id|número>                           - Marca/desmarca tarefa como concluída",
          "  rm <id|número>                             - Remove uma tarefa",
          "  list [all|active|done]                     - Lista as tarefas",
          "  note <título> | <conteúdo>                 - Cria uma anotação",
          "  notes                                      - Lista anotações salvas",
          "  rmnote <id|número>                         - Remove uma anotação",
          "  team [list|create|switch|info|member]      - Gerencia equipes e membros",
          "  pomodoro [start|pause|reset|25|50|5|15]    - Controla o timer Pomodoro",
          "  theme [dark|light|matrix|dracula|cyberpunk|nord] - Altera o tema",
          "  sync                                       - Sincroniza com Supabase",
          "  stats                                      - Mostra resumo de produtividade",
          "  clear / cls                                - Limpa o histórico do terminal",
          "  clear tasks / clear completed              - Remove tarefas concluídas ou todas",
        ], 'info');
        break;
      }

      case 'clear':
      case 'cls': {
        if (args[0] === 'completed') {
          const count = clearCompleted();
          addHistoryEntry(input, [`${count} tarefas concluídas foram removidas.`], 'success');
        } else if (args[0] === 'tasks' || args[0] === 'all') {
          clearAllTasks();
          addHistoryEntry(input, ["Todas as tarefas foram removidas."], 'warn');
        } else {
          clearTerminal();
        }
        break;
      }

      case 'add': {
        if (!rest) {
          addHistoryEntry(input, ["Erro: Informe o título da tarefa. Ex: `add Finalizar relatório -p high #trabalho`"], 'error');
          return;
        }

        let priority: TaskPriority = 'medium';
        const tags: string[] = [];
        let pomodoros = 1;

        const priorityMatch = rest.match(/-p\s+(high|med|medium|low)/i);
        if (priorityMatch) {
          const p = priorityMatch[1].toLowerCase();
          if (p === 'high') priority = 'high';
          else if (p === 'low') priority = 'low';
          else priority = 'medium';
        }

        const tagMatches = rest.match(/#([\w-]+)/g);
        if (tagMatches) {
          tagMatches.forEach(tag => tags.push(tag.replace('#', '')));
        }

        const pomoMatch = rest.match(/~(\d+)/);
        if (pomoMatch) {
          pomodoros = parseInt(pomoMatch[1], 10) || 1;
        }

        const cleanTitle = rest
          .replace(/-p\s+(high|med|medium|low)/gi, '')
          .replace(/#([\w-]+)/g, '')
          .replace(/~(\d+)/g, '')
          .trim();

        if (!cleanTitle) {
          addHistoryEntry(input, ["Erro: Título da tarefa não pode ser vazio."], 'error');
          return;
        }

        const newTask = addTask(cleanTitle, priority, tags, pomodoros);
        addHistoryEntry(input, [
          `✓ Tarefa adicionada: [${newTask.id}] ${newTask.title}`,
          `  Prioridade: ${newTask.priority.toUpperCase()} | Tags: ${newTask.tags.join(', ') || 'nenhuma'} | Pomodoros: ${newTask.estimatedPomodoros}`,
        ], 'success');
        break;
      }

      case 'done':
      case 'check':
      case 'toggle': {
        if (!rest) {
          addHistoryEntry(input, ["Erro: Informe o ID ou número da tarefa. Ex: `done 1` ou `done abc1234`"], 'error');
          return;
        }

        const taskId = resolveTaskId(rest);
        if (!taskId) {
          addHistoryEntry(input, [`Erro: Nenhuma tarefa encontrada para '${rest}'`], 'error');
          return;
        }

        const toggled = toggleTask(taskId);
        if (toggled) {
          const status = toggled.completed ? "CONCLUÍDA" : "REABERTA";
          addHistoryEntry(input, [`✓ Tarefa [${toggled.id}] marcada como ${status}: ${toggled.title}`], 'success');
        }
        break;
      }

      case 'rm':
      case 'remove':
      case 'del':
      case 'delete': {
        if (!rest) {
          addHistoryEntry(input, ["Erro: Informe o ID ou número da tarefa. Ex: `rm 1`"], 'error');
          return;
        }

        const taskId = resolveTaskId(rest);
        if (!taskId) {
          addHistoryEntry(input, [`Erro: Tarefa não encontrada: '${rest}'`], 'error');
          return;
        }

        const removed = removeTask(taskId);
        if (removed) {
          addHistoryEntry(input, [`✓ Tarefa [${taskId}] removida com sucesso.`], 'success');
        }
        break;
      }

      case 'list':
      case 'ls': {
        const filterType = args[0]?.toLowerCase();
        let targetList = tasks;
        if (filterType === 'active' || filterType === 'pending') {
          targetList = tasks.filter(t => !t.completed);
        } else if (filterType === 'done' || filterType === 'completed') {
          targetList = tasks.filter(t => t.completed);
        }

        if (targetList.length === 0) {
          addHistoryEntry(input, ["Nenhuma tarefa encontrada."], 'info');
          return;
        }

        const lines = [
          `TAREFAS (${targetList.length}):`,
          "--------------------------------------------------",
        ];
        targetList.forEach((t, i) => {
          const check = t.completed ? "[✓]" : "[ ]";
          const prio = `[${t.priority[0].toUpperCase()}]`;
          const tagsStr = t.tags.length > 0 ? `(${t.tags.map(tag => `#${tag}`).join(' ')})` : '';
          const pomoStr = `🍅 ${t.completedPomodoros}/${t.estimatedPomodoros}`;
          lines.push(`${i + 1}. ${check} ${prio} [${t.id}] ${t.title} ${tagsStr} ${pomoStr}`);
        });
        addHistoryEntry(input, lines, 'info');
        break;
      }

      case 'note': {
        if (!rest) {
          addHistoryEntry(input, ["Erro: Use `note Título | Conteúdo da nota` ou `note Texto rápido`"], 'error');
          return;
        }

        let title = "Nota Rápida";
        let content = rest;
        if (rest.includes('|')) {
          const [t, ...c] = rest.split('|');
          title = t.trim();
          content = c.join('|').trim();
        }

        const tags: string[] = [];
        const tagMatches = content.match(/#([\w-]+)/g);
        if (tagMatches) {
          tagMatches.forEach(tag => tags.push(tag.replace('#', '')));
          content = content.replace(/#([\w-]+)/g, '').trim();
        }

        const newNote = addNote(title, content, tags);
        addHistoryEntry(input, [`✓ Nota [${newNote.id}] salva: "${newNote.title}"`], 'success');
        break;
      }

      case 'notes': {
        if (notes.length === 0) {
          addHistoryEntry(input, ["Nenhuma nota cadastrada."], 'info');
          return;
        }

        const lines = [`NOTAS SALVAS (${notes.length}):`, "--------------------------------------------------"];
        notes.forEach((n, i) => {
          const pin = n.pinned ? "📌 " : "";
          lines.push(`${i + 1}. ${pin}[${n.id}] ${n.title} - ${n.content.slice(0, 40)}${n.content.length > 40 ? '...' : ''}`);
        });
        addHistoryEntry(input, lines, 'info');
        break;
      }

      case 'rmnote': {
        if (!rest) {
          addHistoryEntry(input, ["Erro: Informe o ID ou número da nota. Ex: `rmnote 1`"], 'error');
          return;
        }
        const noteId = resolveNoteId(rest);
        if (!noteId) {
          addHistoryEntry(input, [`Erro: Nota não encontrada: '${rest}'`], 'error');
          return;
        }
        removeNote(noteId);
        addHistoryEntry(input, [`✓ Nota [${noteId}] removida.`], 'success');
        break;
      }

      case 'sync': {
        if (onSync) {
          addHistoryEntry(input, ["Sincronizando tarefas e notas com Supabase..."], 'info');
          const ok = await onSync();
          if (ok) {
            addHistoryEntry(input, ["✓ Sincronização com Supabase concluída com sucesso."], 'success');
          } else {
            addHistoryEntry(input, ["Aviso: Verifique se o usuário está autenticado e as chaves do Supabase configuradas."], 'warn');
          }
        } else {
          addHistoryEntry(input, ["Sincronização indisponível."], 'warn');
        }
        break;
      }

      case 'pomodoro':
      case 'pomo': {
        const sub = args[0]?.toLowerCase();
        if (!sub || sub === 'toggle') {
          if (pomodoro.isRunning) {
            pomodoro.pause();
            addHistoryEntry(input, ["Pomodoro pausado."], 'warn');
          } else {
            pomodoro.start();
            addHistoryEntry(input, ["Pomodoro iniciado! Modo: " + pomodoro.mode.toUpperCase()], 'success');
          }
        } else if (sub === 'start') {
          pomodoro.start();
          addHistoryEntry(input, ["Pomodoro iniciado!"], 'success');
        } else if (sub === 'pause' || sub === 'stop') {
          pomodoro.pause();
          addHistoryEntry(input, ["Pomodoro pausado."], 'warn');
        } else if (sub === 'reset') {
          pomodoro.reset();
          addHistoryEntry(input, ["Pomodoro resetado."], 'info');
        } else if (sub === 'short' || sub === 'shortbreak') {
          pomodoro.switchMode('shortBreak');
          addHistoryEntry(input, ["Modo alterado para Pausa Curta (5 min)."], 'info');
        } else if (sub === 'long' || sub === 'longbreak') {
          pomodoro.switchMode('longBreak');
          addHistoryEntry(input, ["Modo alterado para Pausa Longa (15 min)."], 'info');
        } else if (sub === 'focus') {
          pomodoro.switchMode('focus');
          addHistoryEntry(input, ["Modo alterado para Foco (25 min)."], 'info');
        } else if (!isNaN(parseInt(sub, 10))) {
          const mins = parseInt(sub, 10);
          pomodoro.setCustomMinutes(mins);
          addHistoryEntry(input, [`Pomodoro configurado para ${mins} minutos.`], 'info');
        } else {
          addHistoryEntry(input, ["Opções de pomodoro: start, pause, reset, focus, short, long, ou minutos (ex: `pomodoro 30`)"], 'info');
        }
        break;
      }

      case 'theme': {
        const targetTheme = args[0]?.toLowerCase() as ThemeName;
        const validThemes: ThemeName[] = ["dark", "light", "matrix", "dracula", "cyberpunk", "nord"];
        if (targetTheme && validThemes.includes(targetTheme)) {
          changeTheme(targetTheme);
          addHistoryEntry(input, [`Tema alterado para: ${targetTheme.toUpperCase()}`], 'success');
        } else if (!targetTheme) {
          const next = cycleTheme();
          addHistoryEntry(input, [`Tema alternado para: ${next.toUpperCase()}`], 'success');
        } else {
          addHistoryEntry(input, [`Tema inválido. Escolha: ${validThemes.join(', ')}`], 'error');
        }
        break;
      }

      case 'team': {
        const sub = args[0]?.toLowerCase();
        if (!sub || sub === 'list') {
          if (teams.length === 0) {
            addHistoryEntry(input, ["Nenhuma equipe cadastrada. Crie uma com `team create <nome>`."], 'info');
          } else {
            const lines = ["EQUIPES CADASTRADAS:"];
            teams.forEach(t => {
              const activeMark = activeTeam?.id === t.id ? " (Ativa)" : "";
              lines.push(`  • [${t.code}] ${t.name}${activeMark} — ${t.members.length} membros`);
            });
            addHistoryEntry(input, lines, 'info');
          }
        } else if (sub === 'create') {
          if (!isLoggedIn) {
            addHistoryEntry(input, [
              "Erro: Você precisa estar autenticado para criar uma equipe.",
              "Faça login usando o botão 'Entrar' no canto superior direito.",
            ], 'error');
          } else {
            const name = args[1];
            if (!name) {
              addHistoryEntry(input, ["Uso: team create <nome> [descrição]"], 'error');
            } else if (createTeam) {
              const desc = args.slice(2).join(' ');
              const created = createTeam(name, desc);
              addHistoryEntry(input, [
                `Equipe "${created.name}" criada com sucesso!`,
                `Código de Convite: ${created.code}`,
                `ID: ${created.id}`,
              ], 'success');
            }
          }
        } else if (sub === 'switch') {
          const query = args[1]?.toLowerCase();
          if (!query) {
            addHistoryEntry(input, ["Uso: team switch <id|código|nome>"], 'error');
          } else {
            const target = teams.find(
              t => t.id.toLowerCase() === query ||
                   t.code.toLowerCase() === query ||
                   t.name.toLowerCase().includes(query)
            );
            if (target && switchTeam) {
              switchTeam(target.id);
              addHistoryEntry(input, [`Equipe ativa alterada para: "${target.name}"`], 'success');
            } else {
              addHistoryEntry(input, [`Equipe "${args[1]}" não encontrada.`], 'error');
            }
          }
        } else if (sub === 'info') {
          if (!activeTeam) {
            addHistoryEntry(input, ["Nenhuma equipe ativa selecionada."], 'warn');
          } else {
            const lines = [
              `EQUIPE: ${activeTeam.name}`,
              `Código: ${activeTeam.code}`,
              `Descrição: ${activeTeam.description || 'Sem descrição'}`,
              `Membros (${activeTeam.members.length}):`,
            ];
            activeTeam.members.forEach(m => {
              lines.push(`  - ${m.name} (${m.email}) [${m.role.toUpperCase()}]`);
            });
            addHistoryEntry(input, lines, 'info');
          }
        } else if (sub === 'member') {
          const action = args[1]?.toLowerCase();
          if (action === 'add') {
            if (!isLoggedIn) {
              addHistoryEntry(input, [
                "Erro: Você precisa estar autenticado para adicionar membros a uma equipe.",
                "Faça login usando o botão 'Entrar' no canto superior direito.",
              ], 'error');
            } else {
              const memberName = args[2];
              const memberEmail = args[3];
              const role = (args[4]?.toLowerCase() || 'member') as TeamRole;
              if (!memberName || !memberEmail || !activeTeam || !addTeamMember) {
                addHistoryEntry(input, ["Uso: team member add <nome> <email> [role: member|admin|owner]"], 'error');
              } else {
                const added = addTeamMember(activeTeam.id, memberName, memberEmail, role);
                if (added) {
                  addHistoryEntry(input, [`Membro "${added.name}" adicionado à equipe com sucesso!`], 'success');
                } else {
                  addHistoryEntry(input, ["Não foi possível adicionar o membro (e-mail já cadastrado ou equipe inexistente)."], 'error');
                }
              }
            }
          } else if (action === 'rm' || action === 'remove') {
            const target = args[2]?.toLowerCase();
            if (!target || !activeTeam || !removeTeamMember) {
              addHistoryEntry(input, ["Uso: team member rm <email|id>"], 'error');
            } else {
              const member = activeTeam.members.find(
                m => m.id.toLowerCase() === target || m.email.toLowerCase() === target
              );
              if (member && removeTeamMember(activeTeam.id, member.id)) {
                addHistoryEntry(input, [`Membro "${member.name}" removido da equipe.`], 'success');
              } else {
                addHistoryEntry(input, ["Membro não encontrado ou não pode ser removido."], 'error');
              }
            }
          } else {
            addHistoryEntry(input, ["Uso: team member add <nome> <email> [role] OU team member rm <email|id>"], 'info');
          }
        } else {
          addHistoryEntry(input, [
            "Opções de team:",
            "  team list                    - Lista todas as equipes",
            "  team create <nome> [desc]   - Cria nova equipe",
            "  team switch <nome|código>    - Alterna a equipe ativa",
            "  team info                    - Detalhes da equipe ativa",
            "  team member add <nome> <email> [role] - Adiciona membro",
            "  team member rm <email|id>    - Remove membro",
          ], 'info');
        }
        break;
      }

      case 'stats': {
        const total = tasks.length;
        const done = tasks.filter(t => t.completed).length;
        const pending = total - done;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        addHistoryEntry(input, [
          "ESTATÍSTICAS DO TASKCLI:",
          `  Total de Tarefas: ${total}`,
          `  Concluídas: ${done} (${pct}%)`,
          `  Pendentes: ${pending}`,
          `  Sessões de Pomodoro Concluídas: ${pomodoro.sessionsCompleted}`,
          `  Total de Notas: ${notes.length}`,
        ], 'info');
        break;
      }

      default: {
        addHistoryEntry(input, [`Comando desconhecido: '${cmd}'. Digite 'help' para ajuda.`], 'error');
        break;
      }
    }
  };

  return {
    history,
    commandHistoryList,
    historyIndex,
    setHistoryIndex,
    executeCommand,
    clearTerminal,
  };
}
