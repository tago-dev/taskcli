'use client';

import {
  Check,
  Columns3,
  Flame,
  LayoutGrid,
  MoreVertical,
  Plus,
  Search,
  Timer,
  Trash2,
  User,
  UserMinus,
  Users,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { KanbanGroupBy, Task, TaskPriority, TaskStatus, Team, TeamMember } from "../types";

interface KanbanBoardProps {
  tasks: Task[];
  teamMembers?: TeamMember[];
  activeTeam?: Team | null;
  isLeaderOrAdmin?: boolean;
  currentUserId?: string | null;
  currentUserEmail?: string | null;
  currentUserName?: string | null;
  activePomodoroTaskId?: string | null;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onAssignTask?: (taskId: string, member: TeamMember | null) => void;
  onAddTask: (
    title: string,
    priority: TaskPriority,
    tags: string[],
    pomodoros: number,
    assignmentOptions?: {
      status?: TaskStatus;
      teamId?: string;
      assigneeId?: string;
      assigneeName?: string;
      assigneeEmail?: string;
      assigneeAvatar?: string;
      assignedById?: string;
      assignedByName?: string;
    }
  ) => void;
  onToggleTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onSelectForPomodoro?: (taskId: string) => void;
}

export function KanbanBoard({
  tasks,
  teamMembers = [],
  activeTeam,
  isLeaderOrAdmin = false,
  currentUserId,
  currentUserEmail,
  currentUserName,
  activePomodoroTaskId,
  onUpdateTaskStatus,
  onAssignTask,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onSelectForPomodoro,
}: KanbanBoardProps) {
  const [groupBy, setGroupBy] = useState<KanbanGroupBy>("status");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [memberFilter, setMemberFilter] = useState<string | "all">("all");

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddPriority, setQuickAddPriority] = useState<TaskPriority>("medium");
  const [quickAddPomodoros, setQuickAddPomodoros] = useState<number>(1);
  const [quickAddTags, setQuickAddTags] = useState("");

  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  const resolveTaskStatus = useCallback((t: Task): TaskStatus => {
    if (t.status) return t.status;
    if (t.completed) return "done";
    if (t.completedPomodoros > 0 || activePomodoroTaskId === t.id) return "in_progress";
    return "todo";
  }, [activePomodoroTaskId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesTag = t.tags.some(tag => tag.toLowerCase().includes(q));
        const matchesAssignee = t.assigneeName?.toLowerCase().includes(q) || t.assigneeEmail?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTag && !matchesAssignee) return false;
      }

      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false;
      }

      if (memberFilter !== "all") {
        if (memberFilter === "unassigned") {
          if (t.assigneeId || t.assigneeName) return false;
        } else if (memberFilter === "my") {
          const isMy =
            (currentUserId && t.assigneeId === currentUserId) ||
            (currentUserEmail && t.assigneeEmail?.toLowerCase() === currentUserEmail.toLowerCase()) ||
            (!t.assigneeId && !t.assigneeName);
          if (!isMy) return false;
        } else {
          const isTarget =
            t.assigneeId === memberFilter ||
            (t.assigneeEmail && t.assigneeEmail.toLowerCase() === memberFilter.toLowerCase());
          if (!isTarget) return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, memberFilter, currentUserId, currentUserEmail]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => resolveTaskStatus(t) === "todo").length;
    const inProgress = tasks.filter(t => resolveTaskStatus(t) === "in_progress").length;
    const done = tasks.filter(t => resolveTaskStatus(t) === "done").length;
    const totalPomodoros = tasks.reduce((sum, t) => sum + (t.estimatedPomodoros || 0), 0);
    const donePomodoros = tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0);

    return { total, todo, inProgress, done, totalPomodoros, donePomodoros };
  }, [tasks, resolveTaskStatus]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (columnId: string) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDropOnStatus = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;

    onUpdateTaskStatus(taskId, targetStatus);
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDropOnMember = (e: React.DragEvent, member: TeamMember | null) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId || !onAssignTask) return;

    onAssignTask(taskId, member);
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleQuickAddSubmit = (e: React.FormEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    const parsedTags = quickAddTags
      .split(/[\s,]+/)
      .map(t => t.replace("#", "").trim())
      .filter(Boolean);

    if (groupBy === "status") {
      const targetStatus = targetColumnId as TaskStatus;
      onAddTask(
        quickAddTitle.trim(),
        quickAddPriority,
        parsedTags,
        quickAddPomodoros,
        {
          status: targetStatus,
          teamId: activeTeam?.id,
          assignedById: currentUserId || undefined,
          assignedByName: currentUserName || undefined,
        }
      );
    } else {
      let assignee: TeamMember | undefined;
      if (targetColumnId !== "unassigned") {
        assignee = teamMembers.find(m => m.id === targetColumnId);
      }

      onAddTask(
        quickAddTitle.trim(),
        quickAddPriority,
        parsedTags,
        quickAddPomodoros,
        {
          status: "todo",
          teamId: activeTeam?.id,
          assigneeId: assignee?.id,
          assigneeName: assignee?.name,
          assigneeEmail: assignee?.email,
          assigneeAvatar: assignee?.avatarUrl,
          assignedById: currentUserId || undefined,
          assignedByName: currentUserName || undefined,
        }
      );
    }

    setQuickAddTitle("");
    setQuickAddTags("");
    setQuickAddPomodoros(1);
    setQuickAddPriority("medium");
    setQuickAddColumn(null);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/30 uppercase">
            Alta
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30 uppercase">
            Média
          </span>
        );
      case "low":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-main)] text-[var(--text-dim)] border border-[var(--border-color)] uppercase">
            Baixa
          </span>
        );
    }
  };

  const renderTaskCard = (task: Task) => {
    const status = resolveTaskStatus(task);
    const isPomodoroActive = activePomodoroTaskId === task.id;
    const isDone = status === "done";
    const initials = task.assigneeName
      ? task.assigneeName
          .split(/\s+/)
          .map(n => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : null;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={e => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
        className={`group relative rounded-xl border p-3.5 bg-[var(--bg-main)] hover:bg-[var(--bg-card)] transition-all cursor-grab active:cursor-grabbing shadow-xs space-y-3 ${
          isPomodoroActive
            ? "border-[var(--accent)] ring-1 ring-[var(--accent)] shadow-md"
            : "border-[var(--border-color)] hover:border-[var(--border-focus)]"
        } ${draggedTaskId === task.id ? "opacity-40 scale-95" : "opacity-100"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {getPriorityBadge(task.priority)}

            {isPomodoroActive && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--accent)] font-bold px-1.5 py-0.5 rounded bg-[var(--accent-soft)] animate-pulse">
                <Flame className="w-3 h-3 fill-current" />
                Focando
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onSelectForPomodoro && (
              <button
                onClick={() => onSelectForPomodoro(task.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPomodoroActive
                    ? "bg-[var(--accent)] text-[var(--accent-text)]"
                    : "text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--bg-surface)]"
                }`}
                title={isPomodoroActive ? "Desativar foco" : "Iniciar Pomodoro nesta tarefa"}
              >
                <Timer className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {activeMenuTaskId === task.id && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded-xl shadow-xl p-1.5 z-40 space-y-1 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] uppercase text-[var(--text-dim)] font-bold">
                    Mover Status
                  </div>
                  <button
                    onClick={() => {
                      onUpdateTaskStatus(task.id, "todo");
                      setActiveMenuTaskId(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                      status === "todo" ? "text-[var(--accent)] font-bold bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-card)]"
                    }`}
                  >
                    <span>A Fazer</span>
                    {status === "todo" && <Check className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => {
                      onUpdateTaskStatus(task.id, "in_progress");
                      setActiveMenuTaskId(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                      status === "in_progress" ? "text-[var(--accent)] font-bold bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-card)]"
                    }`}
                  >
                    <span>Em Progresso</span>
                    {status === "in_progress" && <Check className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => {
                      onUpdateTaskStatus(task.id, "done");
                      setActiveMenuTaskId(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                      status === "done" ? "text-[var(--accent)] font-bold bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-card)]"
                    }`}
                  >
                    <span>Concluído</span>
                    {status === "done" && <Check className="w-3 h-3" />}
                  </button>

                  <div className="border-t border-[var(--border-color)] my-1" />

                  <button
                    onClick={() => {
                      onRemoveTask(task.id);
                      setActiveMenuTaskId(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Excluir</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          onClick={() => onToggleTask(task.id)}
          className={`font-mono text-xs cursor-pointer transition-colors ${
            isDone ? "line-through text-[var(--text-dim)]" : "text-[var(--text-main)] font-semibold"
          }`}
        >
          {task.title}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-dim)] border border-[var(--border-color)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)] text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
            <span>🍅 {task.completedPomodoros}/{task.estimatedPomodoros}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {task.assigneeName ? (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-bold"
                title={`Atribuído para ${task.assigneeName} (${task.assigneeEmail || ""})`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center text-[8px] font-bold">
                  {initials}
                </div>
                <span className="truncate max-w-[80px]">{task.assigneeName}</span>
              </div>
            ) : (
              <span className="text-[10px] text-[var(--text-dim)] flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Sem resp.</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQuickAddForm = (columnId: string) => {
    if (quickAddColumn !== columnId) {
      return (
        <button
          onClick={() => {
            setQuickAddColumn(columnId);
            setQuickAddTitle("");
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all text-xs font-mono font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Adicionar Tarefa</span>
        </button>
      );
    }

    return (
      <form
        onSubmit={e => handleQuickAddSubmit(e, columnId)}
        className="p-3 bg-[var(--bg-main)] border border-[var(--accent)]/50 rounded-xl space-y-2.5 animate-in fade-in duration-150 shadow-md font-mono"
      >
        <input
          type="text"
          placeholder="Título da tarefa..."
          value={quickAddTitle}
          onChange={e => setQuickAddTitle(e.target.value)}
          autoFocus
          required
          className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
        />

        <div className="grid grid-cols-2 gap-2 text-xs">
          <select
            value={quickAddPriority}
            onChange={e => setQuickAddPriority(e.target.value as TaskPriority)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>

          <input
            type="number"
            min="1"
            max="10"
            value={quickAddPomodoros}
            onChange={e => setQuickAddPomodoros(parseInt(e.target.value, 10) || 1)}
            placeholder="Pomodoros"
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <input
          type="text"
          placeholder="Tags (#dev #urgente)..."
          value={quickAddTags}
          onChange={e => setQuickAddTags(e.target.value)}
          className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-3 py-1 text-xs text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setQuickAddColumn(null)}
            className="px-2.5 py-1 rounded-lg text-xs text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Salvar
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
              <Columns3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-[var(--text-main)] uppercase tracking-wide">
                Quadro Kanban
              </h2>
              <p className="text-xs font-mono text-[var(--text-dim)]">
                Acompanhe o fluxo de entrega e veja quem está fazendo o que em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)] font-mono text-xs">
            <button
              onClick={() => setGroupBy("status")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                groupBy === "status"
                  ? "bg-[var(--accent)] text-[var(--accent-text)] font-bold shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Por Status</span>
            </button>

            <button
              onClick={() => setGroupBy("member")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                groupBy === "member"
                  ? "bg-[var(--accent)] text-[var(--accent-text)] font-bold shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Por Responsável</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--border-color)] text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between">
            <span className="text-[var(--text-dim)]">Total:</span>
            <strong className="text-[var(--text-main)]">{stats.total}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between">
            <span className="text-[var(--text-dim)]">A Fazer:</span>
            <strong className="text-[var(--text-main)]">{stats.todo}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between">
            <span className="text-[var(--warning)] font-semibold">Em Progresso:</span>
            <strong className="text-[var(--warning)]">{stats.inProgress}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between">
            <span className="text-[var(--accent)] font-semibold">Concluídas:</span>
            <strong className="text-[var(--accent)]">{stats.done}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-color)]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, tag ou membro..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as TaskPriority | "all")}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>

            {teamMembers.length > 0 && (
              <select
                value={memberFilter}
                onChange={e => setMemberFilter(e.target.value)}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="all">Todos os Membros</option>
                <option value="my">Minhas / Atribuídas a Mim</option>
                <option value="unassigned">Não Atribuídas</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {groupBy === "status" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div
            onDragOver={e => handleDragOver(e, "todo")}
            onDragLeave={() => handleDragLeave("todo")}
            onDrop={e => handleDropOnStatus(e, "todo")}
            className={`bg-[var(--bg-surface)] border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-h-[450px] transition-all shadow-xs ${
              dragOverColumn === "todo"
                ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-[var(--bg-card)]"
                : "border-[var(--border-color)]"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-dim)]" />
                <h3 className="font-mono font-bold text-sm text-[var(--text-main)] uppercase tracking-wide">
                  A Fazer
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-dim)] font-bold">
                {filteredTasks.filter(t => resolveTaskStatus(t) === "todo").length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {filteredTasks
                .filter(t => resolveTaskStatus(t) === "todo")
                .map(task => renderTaskCard(task))}

              {filteredTasks.filter(t => resolveTaskStatus(t) === "todo").length === 0 && (
                <div className="p-6 text-center text-xs font-mono text-[var(--text-dim)] border border-dashed border-[var(--border-color)] rounded-xl">
                  Nenhuma tarefa a fazer. Arraste cards para cá ou crie uma nova.
                </div>
              )}
            </div>

            {renderQuickAddForm("todo")}
          </div>

          <div
            onDragOver={e => handleDragOver(e, "in_progress")}
            onDragLeave={() => handleDragLeave("in_progress")}
            onDrop={e => handleDropOnStatus(e, "in_progress")}
            className={`bg-[var(--bg-surface)] border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-h-[450px] transition-all shadow-xs ${
              dragOverColumn === "in_progress"
                ? "border-[var(--warning)] ring-2 ring-[var(--warning)]/30 bg-[var(--bg-card)]"
                : "border-[var(--border-color)]"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] animate-pulse" />
                <h3 className="font-mono font-bold text-sm text-[var(--warning)] uppercase tracking-wide">
                  Em Progresso
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-xs font-mono text-[var(--warning)] font-bold">
                {filteredTasks.filter(t => resolveTaskStatus(t) === "in_progress").length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {filteredTasks
                .filter(t => resolveTaskStatus(t) === "in_progress")
                .map(task => renderTaskCard(task))}

              {filteredTasks.filter(t => resolveTaskStatus(t) === "in_progress").length === 0 && (
                <div className="p-6 text-center text-xs font-mono text-[var(--text-dim)] border border-dashed border-[var(--border-color)] rounded-xl">
                  Nenhuma tarefa em andamento. Inicie um ciclo ou arraste uma tarefa para focar.
                </div>
              )}
            </div>

            {renderQuickAddForm("in_progress")}
          </div>

          <div
            onDragOver={e => handleDragOver(e, "done")}
            onDragLeave={() => handleDragLeave("done")}
            onDrop={e => handleDropOnStatus(e, "done")}
            className={`bg-[var(--bg-surface)] border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-h-[450px] transition-all shadow-xs ${
              dragOverColumn === "done"
                ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-[var(--bg-card)]"
                : "border-[var(--border-color)]"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                <h3 className="font-mono font-bold text-sm text-[var(--accent)] uppercase tracking-wide">
                  Concluído
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-xs font-mono text-[var(--accent)] font-bold">
                {filteredTasks.filter(t => resolveTaskStatus(t) === "done").length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {filteredTasks
                .filter(t => resolveTaskStatus(t) === "done")
                .map(task => renderTaskCard(task))}

              {filteredTasks.filter(t => resolveTaskStatus(t) === "done").length === 0 && (
                <div className="p-6 text-center text-xs font-mono text-[var(--text-dim)] border border-dashed border-[var(--border-color)] rounded-xl">
                  Nenhuma tarefa concluída ainda.
                </div>
              )}
            </div>

            {renderQuickAddForm("done")}
          </div>
        </div>
      )}

      {groupBy === "member" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
          {teamMembers.map(member => {
            const memberTasks = filteredTasks.filter(
              t => t.assigneeId === member.id ||
                   (t.assigneeEmail && t.assigneeEmail.toLowerCase() === member.email.toLowerCase())
            );
            const initials = member.name
              .split(/\s+/)
              .map(n => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={member.id}
                onDragOver={e => handleDragOver(e, member.id)}
                onDragLeave={() => handleDragLeave(member.id)}
                onDrop={e => handleDropOnMember(e, member)}
                className={`bg-[var(--bg-surface)] border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-h-[450px] transition-all shadow-xs ${
                  dragOverColumn === member.id
                    ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-[var(--bg-card)]"
                    : "border-[var(--border-color)]"
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30 flex items-center justify-center font-mono font-bold text-xs">
                      {initials}
                    </div>
                    <div>
                      <div className="font-mono font-bold text-xs text-[var(--text-main)] truncate max-w-[120px]">
                        {member.name}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase">
                        {member.role}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-dim)] font-bold">
                    {memberTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {memberTasks.map(task => renderTaskCard(task))}

                  {memberTasks.length === 0 && (
                    <div className="p-6 text-center text-xs font-mono text-[var(--text-dim)] border border-dashed border-[var(--border-color)] rounded-xl">
                      Nenhuma tarefa atribuída a este membro. Arraste cards para cá para delegar.
                    </div>
                  )}
                </div>

                {isLeaderOrAdmin && renderQuickAddForm(member.id)}
              </div>
            );
          })}

          <div
            onDragOver={e => handleDragOver(e, "unassigned")}
            onDragLeave={() => handleDragLeave("unassigned")}
            onDrop={e => handleDropOnMember(e, null)}
            className={`bg-[var(--bg-surface)] border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-h-[450px] transition-all shadow-xs ${
              dragOverColumn === "unassigned"
                ? "border-[var(--warning)] ring-2 ring-[var(--warning)]/30 bg-[var(--bg-card)]"
                : "border-[var(--border-color)]"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <UserMinus className="w-4 h-4 text-[var(--text-dim)]" />
                <h3 className="font-mono font-bold text-xs text-[var(--text-main)] uppercase tracking-wide">
                  Não Atribuídas
                </h3>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-dim)] font-bold">
                {filteredTasks.filter(t => !t.assigneeId && !t.assigneeName).length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {filteredTasks
                .filter(t => !t.assigneeId && !t.assigneeName)
                .map(task => renderTaskCard(task))}

              {filteredTasks.filter(t => !t.assigneeId && !t.assigneeName).length === 0 && (
                <div className="p-6 text-center text-xs font-mono text-[var(--text-dim)] border border-dashed border-[var(--border-color)] rounded-xl">
                  Todas as tarefas estão atribuídas aos membros da equipe!
                </div>
              )}
            </div>

            {renderQuickAddForm("unassigned")}
          </div>
        </div>
      )}
    </div>
  );
}
