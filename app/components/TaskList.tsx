'use client';

import {
  CheckCircle2,
  Plus,
  Search,
  Tag,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { Task, TaskPriority } from "../types";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  filteredTasks: Task[];
  filter: "all" | "active" | "completed";
  setFilter: (filter: "all" | "active" | "completed") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  priorityFilter: TaskPriority | "all";
  setPriorityFilter: (prio: TaskPriority | "all") => void;
  selectedTag: string | "all";
  setSelectedTag: (tag: string | "all") => void;
  allTags: string[];
  activePomodoroTaskId: string | null;
  onAddTask: (title: string, priority: TaskPriority, tags: string[], pomodoros: number) => void;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSelectForPomodoro: (id: string) => void;
  onClearCompleted: () => void;
}

export function TaskList({
  tasks,
  filteredTasks,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  selectedTag,
  setSelectedTag,
  allTags,
  activePomodoroTaskId,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onUpdateTask,
  onSelectForPomodoro,
  onClearCompleted,
}: TaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newTagInput, setNewTagInput] = useState("");
  const [newPomodoros, setNewPomodoros] = useState<number>(1);
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let parsedTitle = newTitle.trim();
    let priority = newPriority;
    let pomodoros = newPomodoros;
    const tags: string[] = [];

    if (newTagInput.trim()) {
      newTagInput
        .split(/[\s,]+/)
        .map(t => t.replace("#", "").trim())
        .filter(Boolean)
        .forEach(t => tags.push(t));
    }

    const prioMatch = parsedTitle.match(/-p\s+(high|med|medium|low)/i);
    if (prioMatch) {
      const p = prioMatch[1].toLowerCase();
      if (p === "high") priority = "high";
      else if (p === "low") priority = "low";
      else priority = "medium";
      parsedTitle = parsedTitle.replace(/-p\s+(high|med|medium|low)/gi, "");
    }

    const tagMatches = parsedTitle.match(/#([\w-]+)/g);
    if (tagMatches) {
      tagMatches.forEach(tag => tags.push(tag.replace("#", "")));
      parsedTitle = parsedTitle.replace(/#([\w-]+)/g, "");
    }

    const pomoMatch = parsedTitle.match(/~(\d+)/);
    if (pomoMatch) {
      pomodoros = parseInt(pomoMatch[1], 10) || 1;
      parsedTitle = parsedTitle.replace(/~(\d+)/g, "");
    }

    onAddTask(parsedTitle.trim(), priority, tags, pomodoros);
    setNewTitle("");
    setNewTagInput("");
    setNewPomodoros(1);
    setNewPriority("medium");
    setShowAdvancedAdd(false);
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="flex flex-col gap-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-sm">
      <form onSubmit={handleQuickAdd} className="flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-[var(--bg-input)] border border-[var(--border-color)] focus-within:border-[var(--border-focus)] rounded-xl px-4 py-3 sm:py-3.5 transition-colors shadow-xs">
          <Plus className="w-5 h-5 text-[var(--accent)] shrink-0" />
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Adicionar nova tarefa... (Ex: Revisar PR -p high #dev ~2)"
            className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-dim)] font-sans min-w-0"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvancedAdd(!showAdvancedAdd)}
              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] px-3 py-1.5 rounded-lg bg-[var(--bg-card)] transition-colors whitespace-nowrap"
            >
              {showAdvancedAdd ? "Menos" : "Opções"}
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-1.5 bg-[var(--accent)] text-[var(--accent-text)] text-xs sm:text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs whitespace-nowrap"
            >
              Adicionar
            </button>
          </div>
        </div>

        {showAdvancedAdd && (
          <div className="flex flex-wrap items-center gap-4 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-dim)] font-mono">Prioridade:</span>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as TaskPriority)}
                className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs sm:text-sm text-[var(--text-main)] outline-none font-mono"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[var(--text-dim)] font-mono">Pomodoros:</span>
              <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5">
                <Timer className="w-4 h-4 text-[var(--warning)]" />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newPomodoros}
                  onChange={e => setNewPomodoros(parseInt(e.target.value, 10) || 1)}
                  className="w-10 bg-transparent text-xs sm:text-sm text-[var(--text-main)] outline-none text-center font-mono font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <Tag className="w-4 h-4 text-[var(--text-dim)]" />
              <input
                type="text"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                placeholder="Tags separadas por espaço (ex: frontend urgente)"
                className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs sm:text-sm text-[var(--text-main)] outline-none font-mono"
              />
            </div>
          </div>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)] text-xs sm:text-sm font-mono overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filter === "all"
                ? "bg-[var(--bg-card)] text-[var(--text-main)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Todas ({tasks.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filter === "active"
                ? "bg-[var(--bg-card)] text-[var(--text-main)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Pendentes ({tasks.length - completedCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filter === "completed"
                ? "bg-[var(--bg-card)] text-[var(--text-main)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Concluídas ({completedCount})
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs sm:text-sm">
            <Search className="w-4 h-4 text-[var(--text-dim)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar tarefas..."
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-dim)] w-28 sm:w-40"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3.5 h-3.5 text-[var(--text-dim)]" />
              </button>
            )}
          </div>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as TaskPriority | "all")}
            className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs sm:text-sm text-[var(--text-main)] outline-none font-mono"
          >
            <option value="all">Prioridades (Todas)</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs sm:text-sm text-[var(--text-main)] outline-none font-mono"
            >
              <option value="all">Tags (Todas)</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}

          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-dim)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              title="Remover todas as tarefas concluídas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar concluídas</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--text-dim)] font-mono text-sm border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-main)]/40 p-6">
            <CheckCircle2 className="w-10 h-10 text-[var(--text-dim)] mb-3 stroke-[1.5]" />
            <p className="font-semibold text-[var(--text-muted)]">Nenhuma tarefa encontrada.</p>
            <p className="text-xs text-[var(--text-dim)] mt-1.5">
              Use a barra acima ou digite <code className="text-[var(--accent)] font-bold">add [tarefa]</code> no terminal.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isActiveForPomodoro={task.id === activePomodoroTaskId}
              onToggle={onToggleTask}
              onRemove={onRemoveTask}
              onUpdate={onUpdateTask}
              onSelectForPomodoro={onSelectForPomodoro}
            />
          ))
        )}
      </div>
    </div>
  );
}
