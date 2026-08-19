'use client';

import {
  Check,
  Edit2,
  Radio,
  Tag,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { Task, TaskPriority } from "../types";

interface TaskItemProps {
  task: Task;
  isActiveForPomodoro: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onSelectForPomodoro: (id: string) => void;
}

export function TaskItem({
  task,
  isActiveForPomodoro,
  onToggle,
  onRemove,
  onUpdate,
  onSelectForPomodoro,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTitle.trim()) return;
    onUpdate(task.id, { title: editedTitle.trim() });
    setIsEditing(false);
  };

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

      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
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
