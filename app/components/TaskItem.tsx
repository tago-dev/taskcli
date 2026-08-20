'use client';

import {
  Check,
  Edit2,
  Radio,
  Tag,
  Timer,
  Trash2,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { Task, TaskPriority, TeamMember } from "../types";

interface TaskItemProps {
  task: Task;
  isActiveForPomodoro: boolean;
  teamMembers?: TeamMember[];
  isLeaderOrAdmin?: boolean;
  currentUserId?: string | null;
  currentUserEmail?: string | null;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onAssign?: (taskId: string, member: TeamMember | null) => void;
  onSelectForPomodoro: (id: string) => void;
}

export function TaskItem({
  task,
  isActiveForPomodoro,
  teamMembers = [],
  isLeaderOrAdmin = false,
  currentUserId,
  currentUserEmail,
  onToggle,
  onRemove,
  onUpdate,
  onAssign,
  onSelectForPomodoro,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTitle.trim()) return;
    onUpdate(task.id, { title: editedTitle.trim() });
    setIsEditing(false);
  };

  const isAssignedToMe = Boolean(
    (currentUserId && task.assigneeId === currentUserId) ||
    (currentUserEmail && task.assigneeEmail?.toLowerCase() === currentUserEmail.toLowerCase())
  );

  const getPriorityBadge = (prio: TaskPriority) => {
    switch (prio) {
      case "high":
        return (
          <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-md bg-[var(--danger-soft)] text-[var(--danger)] font-bold">
            Alta
          </span>
        );
      case "medium":
        return (
          <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-md bg-[var(--warning)]/15 text-[var(--warning)] font-bold">
            Média
          </span>
        );
      case "low":
      default:
        return (
          <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-md bg-[var(--info)]/15 text-[var(--info)] font-bold">
            Baixa
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative flex items-start gap-4 p-4 sm:p-5 rounded-xl border transition-all shadow-xs ${
        task.completed
          ? "bg-[var(--bg-main)]/70 border-[var(--border-color)]/60 opacity-60"
          : isActiveForPomodoro
          ? "bg-[var(--bg-card)] border-[var(--accent)] shadow-sm ring-1 ring-[var(--accent)]/30"
          : "bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-card)]"
      }`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
          task.completed
            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)]"
            : "border-[var(--border-focus)] hover:border-[var(--accent)] text-transparent bg-[var(--bg-main)]"
        }`}
      >
        <Check className="w-4 h-4 stroke-[3]" />
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="flex items-center gap-2">
            <input
              type="text"
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              className="flex-1 bg-[var(--bg-input)] border border-[var(--border-focus)] rounded-lg px-3 py-1.5 text-sm sm:text-base text-[var(--text-main)] outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="p-2 text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-lg"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditedTitle(task.title);
                setIsEditing(false);
              }}
              className="p-2 text-[var(--text-dim)] hover:bg-[var(--bg-card)] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2.5">
              <span
                className={`text-sm sm:text-base font-sans break-words leading-snug ${
                  task.completed
                    ? "line-through text-[var(--text-dim)]"
                    : "text-[var(--text-main)] font-medium"
                }`}
              >
                {task.title}
              </span>
              <span className="text-xs font-mono text-[var(--text-dim)] shrink-0">
                #{task.id}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {getPriorityBadge(task.priority)}

              {task.assigneeName && (
                <span
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-xs border ${
                    isAssignedToMe
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30 font-semibold"
                      : "bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)]"
                  }`}
                  title={
                    task.assignedByName
                      ? `Atribuída a ${task.assigneeName} por ${task.assignedByName}`
                      : `Atribuída a ${task.assigneeName}`
                  }
                >
                  <User className="w-3 h-3 text-[var(--accent)]" />
                  <span>
                    {isAssignedToMe ? "Você" : task.assigneeName}
                  </span>
                  {task.assignedByName && (
                    <span className="text-[10px] text-[var(--text-dim)] hidden sm:inline">
                      (por {task.assignedByName})
                    </span>
                  )}
                </span>
              )}

              {task.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}

              <span
                className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-md ${
                  task.completedPomodoros >= task.estimatedPomodoros && task.completedPomodoros > 0
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold"
                    : "bg-[var(--bg-card)] text-[var(--text-dim)]"
                }`}
                title={`Pomodoros: ${task.completedPomodoros} concluídos de ${task.estimatedPomodoros} estimados`}
              >
                <Timer className="w-3 h-3" />
                {task.completedPomodoros}/{task.estimatedPomodoros}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity relative">
        {isLeaderOrAdmin && teamMembers.length > 0 && onAssign && (
          <div className="relative">
            <button
              onClick={() => setShowAssignDropdown(!showAssignDropdown)}
              className={`p-2 rounded-lg transition-colors ${
                task.assigneeName
                  ? "text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
              }`}
              title={task.assigneeName ? `Reatribuir tarefa (atual: ${task.assigneeName})` : "Atribuir a membro da equipe"}
            >
              {task.assigneeName ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </button>

            {showAssignDropdown && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded-xl shadow-xl z-20 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-mono font-bold text-[var(--text-dim)] uppercase px-2 py-1 border-b border-[var(--border-color)]">
                  Atribuir Tarefa
                </div>
                {task.assigneeName && (
                  <button
                    onClick={() => {
                      onAssign(task.id, null);
                      setShowAssignDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-mono text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg text-left transition-colors"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Remover atribuição</span>
                  </button>
                )}
                {teamMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      onAssign(task.id, member);
                      setShowAssignDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-mono rounded-lg text-left transition-colors ${
                      task.assigneeId === member.id || task.assigneeEmail === member.email
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold"
                        : "text-[var(--text-main)] hover:bg-[var(--bg-card)]"
                    }`}
                  >
                    <span className="truncate">{member.name}</span>
                    <span className="text-[10px] text-[var(--text-dim)] uppercase ml-2 shrink-0">
                      {member.role === "owner" ? "Líder" : member.role === "admin" ? "Admin" : "Membro"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => onSelectForPomodoro(task.id)}
          className={`p-2 rounded-lg transition-colors ${
            isActiveForPomodoro
              ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-xs"
              : "text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]"
          }`}
          title={isActiveForPomodoro ? "Tarefa ativa no Pomodoro" : "Focar no Pomodoro"}
        >
          <Radio className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
          title="Editar tarefa"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onRemove(task.id)}
          className="p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
          title="Excluir tarefa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
