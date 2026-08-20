'use client';

import { useState } from "react";
import { generateId, playAudioFeedback } from "../lib/utils";
import { CommandHistoryItem, Note, PomodoroMode, Task, TaskPriority, Team, TeamMember, TeamRole, ThemeName, UserProfile } from "../types";

interface UseCliProps {
  tasks: Task[];
  notes: Note[];
  teams?: Team[];
  activeTeam?: Team | null;
  isLoggedIn?: boolean;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  currentUserRole?: TeamRole | null;
  isLeaderOrAdmin?: boolean;
  createTeam?: (name: string, description: string) => Team;
  joinTeamByCode?: (code: string) => Promise<{ success: boolean; message: string; team?: Team }>;
  searchProfiles?: (query: string) => Promise<UserProfile[]>;
  syncClerkUsers?: () => Promise<{ success: boolean; count: number; users?: UserProfile[] }>;
  addTeamMember?: (teamId: string, name: string, email: string, role: TeamRole) => TeamMember | null;
  removeTeamMember?: (teamId: string, memberId: string) => boolean;
  switchTeam?: (teamId: string) => void;
  addTask: (
    title: string,
    priority?: TaskPriority,
    tags?: string[],
    estimatedPomodoros?: number,
    assignmentOptions?: {
      teamId?: string;
      assigneeId?: string;
      assigneeName?: string;
      assigneeEmail?: string;
      assigneeAvatar?: string;
      assignedById?: string;
      assignedByName?: string;
    }
  ) => Task;
  assignTask?: (
    taskId: string,
    assignee: { id?: string; name: string; email?: string; avatarUrl?: string } | null,
    assignedBy?: { id: string; name: string }
  ) => Task | null;
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
  userId,
  userName,
  userEmail,
  currentUserRole,
  isLeaderOrAdmin = false,
  createTeam,
  joinTeamByCode,
  searchProfiles,
  syncClerkUsers,
  addTeamMember,
  removeTeamMember,
  switchTeam,
  addTask,
  assignTask,
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

  const findTeamMember = (query: string): TeamMember | null => {
    if (!activeTeam) return null;
    const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');
    return activeTeam.members.find(
      m => m.id.toLowerCase() === cleanQuery ||
           m.name.toLowerCase().includes(cleanQuery) ||
           m.email.toLowerCase().includes(cleanQuery)
    ) || null;
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
          "  add <texto> [@membro] [-p high|med|low] [#tag] [~2] - Adiciona/atribui tarefa",
          "  assign <id|núm> <membro>                  - Atribui tarefa da equipe a um membro",
          "  unassign <id|núm>                          - Remove a atribuição de uma tarefa",
          "  done <id|núm>                              - Marca/desmarca tarefa como concluída",
          "  rm <id|núm>                                - Remove uma tarefa",
          "  list [all|active|done|my|team]             - Lista as tarefas com filtros",
          "  note <título> | <conteúdo>                 - Cria uma anotação",
          "  notes                                      - Lista anotações salvas",
          "  rmnote <id|núm>                            - Remove uma anotação",
          "  team [list|create|join|switch|info|tasks]  - Gerencia equipes, membros e tarefas",
          "  user [search|sync]                         - Pesquisa e sincroniza usuários do Clerk",
          "  pomodoro [start|pause|reset|25|50|5|15]    - Controla o timer Pomodoro",
          "  theme [dark|light|matrix|dracula|...]      - Altera o tema",
          "  sync                                       - Sincroniza com Supabase",
          "  stats                                      - Mostra resumo de produtividade",
          "  clear / cls                                - Limpa o histórico do terminal",
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
          addHistoryEntry(input, ["Erro: Informe o título da tarefa. Ex: `add Finalizar deploy @joao -p high ~2`"], 'error');
          return;
        }

        let priority: TaskPriority = 'medium';
        const tags: string[] = [];
        let pomodoros = 1;
        let assignedMember: TeamMember | null = null;

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

        const memberMatch = rest.match(/@([\w.-]+)/);
        if (memberMatch && activeTeam) {
          assignedMember = findTeamMember(memberMatch[1]);
        }

        const cleanTitle = rest
          .replace(/-p\s+(high|med|medium|low)/gi, '')
          .replace(/#([\w-]+)/g, '')
          .replace(/~(\d+)/g, '')
          .replace(/@([\w.-]+)/g, '')
          .trim();

        if (!cleanTitle) {
          addHistoryEntry(input, ["Erro: Título da tarefa não pode ser vazio."], 'error');
          return;
        }

        const assignmentOptions = assignedMember ? {
          teamId: activeTeam?.id,
          assigneeId: assignedMember.id,
          assigneeName: assignedMember.name,
          assigneeEmail: assignedMember.email,
          assigneeAvatar: assignedMember.avatarUrl,
          assignedById: userId || undefined,
          assignedByName: userName || 'Líder',
        } : (activeTeam ? { teamId: activeTeam.id } : undefined);

        const newTask = addTask(cleanTitle, priority, tags, pomodoros, assignmentOptions);
        const assignStr = newTask.assigneeName ? ` | Atribuída a: ${newTask.assigneeName}` : '';

        addHistoryEntry(input, [
          `✓ Tarefa adicionada: [${newTask.id}] ${newTask.title}`,
          `  Prioridade: ${newTask.priority.toUpperCase()} | Tags: ${newTask.tags.join(', ') || 'nenhuma'} | Pomodoros: ${newTask.estimatedPomodoros}${assignStr}`,
        ], 'success');
        break;
      }

      case 'assign': {
        if (!activeTeam) {
          addHistoryEntry(input, ["Erro: Selecione ou crie uma equipe antes de atribuir tarefas."], 'error');
          return;
        }

        if (!isLeaderOrAdmin) {
          addHistoryEntry(input, ["Erro: Apenas o Líder ou Administrador pode atribuir tarefas para a equipe."], 'error');
          return;
        }

        if (args.length < 2) {
          addHistoryEntry(input, ["Uso: assign <id|número> <nome ou email do membro>"], 'error');
          return;
        }

        const taskId = resolveTaskId(args[0]);
        if (!taskId) {
          addHistoryEntry(input, [`Erro: Tarefa não encontrada: '${args[0]}'`], 'error');
          return;
        }

        const memberQuery = args.slice(1).join(' ');
        const member = findTeamMember(memberQuery);
        if (!member) {
          addHistoryEntry(input, [
            `Erro: Membro '${memberQuery}' não encontrado na equipe "${activeTeam.name}".`,
            `Membros disponíveis: ${activeTeam.members.map(m => m.name).join(', ')}`
          ], 'error');
          return;
        }

        if (assignTask) {
          const assigned = assignTask(taskId, member, {
            id: userId || 'leader',
            name: userName || 'Líder',
          });
          if (assigned) {
            addHistoryEntry(input, [
              `✓ Tarefa [${assigned.id}] "${assigned.title}" atribuída para:`,
              `  👤 ${member.name} (${member.email}) [${member.role.toUpperCase()}]`,
            ], 'success');
          }
        }
        break;
      }

      case 'unassign': {
        if (!isLeaderOrAdmin) {
          addHistoryEntry(input, ["Erro: Apenas o Líder ou Administrador pode remover atribuições."], 'error');
          return;
        }

        if (!args[0]) {
          addHistoryEntry(input, ["Uso: unassign <id|número>"], 'error');
          return;
        }

        const taskId = resolveTaskId(args[0]);
        if (!taskId) {
          addHistoryEntry(input, [`Erro: Tarefa não encontrada: '${args[0]}'`], 'error');
          return;
        }

        if (assignTask) {
          const updated = assignTask(taskId, null);
          if (updated) {
            addHistoryEntry(input, [`✓ Atribuição removida da tarefa [${updated.id}] "${updated.title}".`], 'success');
          }
        }
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
        } else if (filterType === 'team') {
          targetList = tasks.filter(t => Boolean(t.assigneeName || t.teamId));
        } else if (filterType === 'my') {
          targetList = tasks.filter(t => (userId && t.assigneeId === userId) || (userEmail && t.assigneeEmail === userEmail) || (!t.assigneeName && !t.assigneeId));
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
          const assignStr = t.assigneeName ? `👤 @${t.assigneeName}` : '';
          lines.push(`${i + 1}. ${check} ${prio} [${t.id}] ${t.title} ${tagsStr} ${pomoStr} ${assignStr}`);
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
        const removed = removeNote(noteId);
        if (removed) {
          addHistoryEntry(input, [`✓ Nota [${noteId}] removida.`], 'success');
        }
        break;
      }

      case 'sync': {
        if (!onSync) {
          addHistoryEntry(input, ["Sincronização em nuvem não disponível."], 'warn');
          return;
        }
        addHistoryEntry(input, ["Iniciando sincronização com o Supabase..."], 'info');
        const ok = await onSync();
        if (ok) {
          addHistoryEntry(input, ["✓ Dados sincronizados com o Supabase com sucesso!"], 'success');
        } else {
          addHistoryEntry(input, ["Erro: Não foi possível sincronizar com o Supabase."], 'error');
        }
        break;
      }

      case 'pomodoro':
      case 'pomo': {
        const sub = args[0]?.toLowerCase();
        if (!sub || sub === 'start') {
          pomodoro.start();
          addHistoryEntry(input, ["Ciclo Pomodoro iniciado."], 'success');
        } else if (sub === 'pause' || sub === 'stop') {
          pomodoro.pause();
          addHistoryEntry(input, ["Ciclo Pomodoro pausado."], 'warn');
        } else if (sub === 'reset') {
          pomodoro.reset();
          addHistoryEntry(input, ["Timer Pomodoro reiniciado."], 'info');
        } else if (sub === 'short' || sub === '5') {
          pomodoro.switchMode('shortBreak');
          addHistoryEntry(input, ["Modo alterado para Pausa Curta (5 min)."], 'info');
        } else if (sub === 'long' || sub === '15') {
          pomodoro.switchMode('longBreak');
          addHistoryEntry(input, ["Modo alterado para Pausa Longa (15 min)."], 'info');
        } else if (sub === 'focus' || sub === '25') {
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
        } else if (sub === 'join') {
          const code = args[1];
          if (!code) {
            addHistoryEntry(input, ["Uso: team join <código>"], 'error');
          } else if (!isLoggedIn) {
            addHistoryEntry(input, [
              "Erro: Você precisa estar autenticado para entrar em uma equipe.",
              "Faça login usando o botão 'Entrar' no canto superior direito.",
            ], 'error');
          } else if (joinTeamByCode) {
            addHistoryEntry(input, [`Buscando equipe com o código "${code.toUpperCase()}"...`], 'info');
            const res = await joinTeamByCode(code);
            if (res.success) {
              addHistoryEntry(input, [`✓ ${res.message}`], 'success');
            } else {
              addHistoryEntry(input, [`Erro: ${res.message}`], 'error');
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
              `Seu papel: ${(currentUserRole || 'member').toUpperCase()}`,
              `Membros (${activeTeam.members.length}):`,
            ];
            activeTeam.members.forEach(m => {
              lines.push(`  - ${m.name} (${m.email}) [${m.role.toUpperCase()}]`);
            });
            addHistoryEntry(input, lines, 'info');
          }
        } else if (sub === 'tasks') {
          if (!activeTeam) {
            addHistoryEntry(input, ["Nenhuma equipe ativa selecionada."], 'warn');
          } else {
            const teamTasks = tasks.filter(t => t.teamId === activeTeam.id || Boolean(t.assigneeName));
            if (teamTasks.length === 0) {
              addHistoryEntry(input, [`Nenhuma tarefa vinculada à equipe "${activeTeam.name}".`], 'info');
            } else {
              const lines = [
                `TAREFAS DA EQUIPE "${activeTeam.name}" (${teamTasks.length}):`,
                "--------------------------------------------------",
              ];
              teamTasks.forEach((t, i) => {
                const check = t.completed ? "[✓]" : "[ ]";
                const prio = `[${t.priority[0].toUpperCase()}]`;
                const assignee = t.assigneeName ? `👤 @${t.assigneeName}` : '(Não atribuída)';
                lines.push(`${i + 1}. ${check} ${prio} [${t.id}] ${t.title} -> ${assignee}`);
              });
              addHistoryEntry(input, lines, 'info');
            }
          }
        } else if (sub === 'mytasks') {
          const myAssigned = tasks.filter(t =>
            (userId && t.assigneeId === userId) ||
            (userEmail && t.assigneeEmail?.toLowerCase() === userEmail.toLowerCase())
          );
          if (myAssigned.length === 0) {
            addHistoryEntry(input, ["Nenhuma tarefa atribuída a você no momento."], 'info');
          } else {
            const lines = [
              `SUAS TAREFAS ATRIBUÍDAS (${myAssigned.length}):`,
              "--------------------------------------------------",
            ];
            myAssigned.forEach((t, i) => {
              const check = t.completed ? "[✓]" : "[ ]";
              const prio = `[${t.priority[0].toUpperCase()}]`;
              const by = t.assignedByName ? `(por ${t.assignedByName})` : '';
              lines.push(`${i + 1}. ${check} ${prio} [${t.id}] ${t.title} ${by}`);
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
            "  team join <código>           - Entra em uma equipe existente",
            "  team switch <nome|código>    - Alterna a equipe ativa",
            "  team info                    - Detalhes da equipe ativa",
            "  team tasks                   - Lista tarefas da equipe",
            "  team mytasks                 - Lista tarefas atribuídas a você",
            "  team member add <nome> <email> [role] - Adiciona membro",
            "  team member rm <email|id>    - Remove membro",
          ], 'info');
        }
        break;
      }

      case 'user': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'search') {
          const term = args.slice(1).join(' ');
          if (searchProfiles) {
            addHistoryEntry(input, [`Pesquisando usuários por "${term || 'todos'}"...`], 'info');
            const profiles = await searchProfiles(term);
            if (profiles.length === 0) {
              addHistoryEntry(input, ["Nenhum usuário cadastrado encontrado."], 'warn');
            } else {
              const lines = [`USUÁRIOS CADASTRADOS (${profiles.length}):`];
              profiles.forEach(p => {
                lines.push(`  • ${p.name} — ${p.email}`);
              });
              addHistoryEntry(input, lines, 'info');
            }
          }
        } else if (sub === 'sync') {
          if (syncClerkUsers) {
            addHistoryEntry(input, ["Puxando usuários já cadastrados no Clerk..."], 'info');
            const res = await syncClerkUsers();
            if (res.success) {
              addHistoryEntry(input, [`✓ ${res.count} usuário(s) sincronizado(s) do Clerk com sucesso!`], 'success');
            } else {
              addHistoryEntry(input, ["Não foi possível sincronizar usuários do Clerk."], 'error');
            }
          }
        } else {
          addHistoryEntry(input, [
            "Opções de user:",
            "  user search [nome ou e-mail] - Pesquisa usuários",
            "  user sync                    - Puxa todos os usuários cadastrados no Clerk",
          ], 'info');
        }
        break;
      }

      case 'stats': {
        const total = tasks.length;
        const done = tasks.filter(t => t.completed).length;
        const pending = total - done;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const assigned = tasks.filter(t => Boolean(t.assigneeName || t.assigneeId)).length;
        addHistoryEntry(input, [
          "ESTATÍSTICAS DO TASKCLI:",
          `  Total de Tarefas: ${total}`,
          `  Concluídas: ${done} (${pct}%)`,
          `  Pendentes: ${pending}`,
          `  Tarefas com Responsável: ${assigned}`,
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
