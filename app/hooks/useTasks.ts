'use client';

import confetti from "canvas-confetti";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { setStoredTasks } from "../lib/storage";
import {
  createTaskInSupabase,
  deleteTaskInSupabase,
  fetchTasksFromSupabase,
  updateTaskInSupabase,
} from "../lib/supabaseDb";
import { generateId, playAudioFeedback } from "../lib/utils";
import { Task, TaskPriority } from "../types";

const defaultInitialTasks: Task[] = [
  {
    id: "t1",
    title: "Explorar comandos do TaskCli (digite `help` no terminal)",
    completed: false,
    priority: "high",
    tags: ["taskcli", "guia"],
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    createdAt: 1700000000000,
  },
  {
    id: "t2",
    title: "Iniciar um ciclo Pomodoro para manter o foco",
    completed: false,
    priority: "medium",
    tags: ["foco", "pomodoro"],
    estimatedPomodoros: 2,
    completedPomodoros: 0,
    createdAt: 1700000001000,
  },
  {
    id: "t3",
    title: "Personalizar o tema da interface (digite `theme matrix`)",
    completed: false,
    priority: "low",
    tags: ["customizacao"],
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    createdAt: 1700000002000,
  },
];

let tasksCache: Task[] | null = null;
let taskListeners: Array<() => void> = [];

function emitTasksChange() {
  taskListeners.forEach(listener => listener());
}

function subscribeToTasks(listener: () => void) {
  taskListeners.push(listener);
  return () => {
    taskListeners = taskListeners.filter(l => l !== listener);
  };
}

function getTasksSnapshot(): Task[] {
  if (typeof window === "undefined") return defaultInitialTasks;
  if (tasksCache === null) {
    try {
      const data = localStorage.getItem("taskcli_tasks");
      if (data) {
        tasksCache = JSON.parse(data);
      } else {
        tasksCache = defaultInitialTasks;
        setStoredTasks(defaultInitialTasks);
      }
    } catch {
      tasksCache = defaultInitialTasks;
    }
  }
  return tasksCache || defaultInitialTasks;
}

export function useTasks(userId?: string | null) {
  const tasks = useSyncExternalStore(
    subscribeToTasks,
    getTasksSnapshot,
    () => defaultInitialTasks
  );

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');

  const saveTasks = useCallback((newTasks: Task[]) => {
    tasksCache = newTasks;
    setStoredTasks(newTasks);
    emitTasksChange();
  }, []);

  const loadFromSupabase = useCallback(async (uid: string) => {
    const remoteTasks = await fetchTasksFromSupabase(uid);
    if (remoteTasks !== null && remoteTasks.length > 0) {
      saveTasks(remoteTasks);
    }
  }, [saveTasks]);

  const addTask = (
    title: string,
    priority: TaskPriority = 'medium',
    tags: string[] = [],
    estimatedPomodoros: number = 1
  ): Task => {
    const newTask: Task = {
      id: generateId(),
      title: title.trim(),
      completed: false,
      priority,
      tags: tags.map(t => t.toLowerCase().trim()).filter(Boolean),
      estimatedPomodoros: Math.max(1, estimatedPomodoros),
      completedPomodoros: 0,
      createdAt: Date.now(),
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    playAudioFeedback('click');

    if (userId) {
      createTaskInSupabase(newTask, userId);
    }

    return newTask;
  };

  const toggleTask = (id: string): Task | null => {
    let toggledTask: Task | null = null;
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        toggledTask = {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
        };
        return toggledTask;
      }
      return t;
    });

    if (toggledTask && (toggledTask as Task).completed) {
      playAudioFeedback('success');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#00ff66', '#ff79c6', '#88c0d0', '#ffe600']
        });
      } catch {
        // Safe fallback
      }
    } else {
      playAudioFeedback('click');
    }

    saveTasks(updated);

    if (userId && toggledTask) {
      const t = toggledTask as Task;
      updateTaskInSupabase(id, { completed: t.completed, completedAt: t.completedAt }, userId);
    }

    return toggledTask;
  };

  const removeTask = (id: string): boolean => {
    const taskExists = tasks.some(t => t.id === id);
    if (!taskExists) return false;
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
    playAudioFeedback('click');

    if (userId) {
      deleteTaskInSupabase(id, userId);
    }

    return true;
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | null => {
    let updatedTask: Task | null = null;
    const updated = tasks.map(t => {
      if (t.id === id) {
        updatedTask = { ...t, ...updates };
        return updatedTask;
      }
      return t;
    });
    if (updatedTask) {
      saveTasks(updated);
      playAudioFeedback('click');

      if (userId) {
        updateTaskInSupabase(id, updates, userId);
      }
    }
    return updatedTask;
  };

  const incrementPomodoro = (id: string): void => {
    let currentPomos = 0;
    const updated = tasks.map(t => {
      if (t.id === id) {
        currentPomos = t.completedPomodoros + 1;
        return { ...t, completedPomodoros: currentPomos };
      }
      return t;
    });
    saveTasks(updated);

    if (userId) {
      updateTaskInSupabase(id, { completedPomodoros: currentPomos }, userId);
    }
  };

  const clearCompleted = (): number => {
    const completedList = tasks.filter(t => t.completed);
    const completedCount = completedList.length;
    const updated = tasks.filter(t => !t.completed);
    saveTasks(updated);
    playAudioFeedback('click');

    if (userId) {
      completedList.forEach(t => deleteTaskInSupabase(t.id, userId));
    }

    return completedCount;
  };

  const clearAll = (): void => {
    const previous = [...tasks];
    saveTasks([]);
    playAudioFeedback('click');

    if (userId) {
      previous.forEach(t => deleteTaskInSupabase(t.id, userId));
    }
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => t.tags.forEach(tag => set.add(tag)));
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'active' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (selectedTag !== 'all' && !task.tags.includes(selectedTag)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesTag = task.tags.some(tag => tag.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTag) return false;
      }
      return true;
    });
  }, [tasks, filter, priorityFilter, selectedTag, searchQuery]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const estimatedPomodoros = tasks.reduce((sum, t) => sum + (t.estimatedPomodoros || 0), 0);
    const completedPomodoros = tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      active,
      estimatedPomodoros,
      completedPomodoros,
      completionRate,
    };
  }, [tasks]);

  return {
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
    stats,
    addTask,
    toggleTask,
    removeTask,
    updateTask,
    incrementPomodoro,
    clearCompleted,
    clearAll,
    saveTasks,
    loadFromSupabase,
    mounted: true,
  };
}
