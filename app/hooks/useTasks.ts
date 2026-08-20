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

export type AssignmentFilter = 'all' | 'my' | 'assigned_to_me' | 'team';

export function useTasks(userId?: string | null, userEmail?: string | null) {
  const tasks = useSyncExternalStore(
    subscribeToTasks,
    getTasksSnapshot,
    () => defaultInitialTasks
  );

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string | 'all'>('all');

  const saveTasks = useCallback((newTasks: Task[]) => {
    tasksCache = newTasks;
    setStoredTasks(newTasks);
    emitTasksChange();
  }, []);

  const loadFromSupabase = useCallback(async (uid: string, teamIds: string[] = [], uemail?: string | null) => {
    const remoteTasks = await fetchTasksFromSupabase(uid, teamIds, uemail || userEmail);
    if (remoteTasks !== null && remoteTasks.length > 0) {
      saveTasks(remoteTasks);
    }
  }, [saveTasks, userEmail]);

  const addTask = (
    title: string,
    priority: TaskPriority = 'medium',
    tags: string[] = [],
    estimatedPomodoros: number = 1,
    assignmentOptions?: {
      teamId?: string;
      assigneeId?: string;
      assigneeName?: string;
      assigneeEmail?: string;
      assigneeAvatar?: string;
      assignedById?: string;
      assignedByName?: string;
    }
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
      teamId: assignmentOptions?.teamId,
      assigneeId: assignmentOptions?.assigneeId,
      assigneeName: assignmentOptions?.assigneeName,
      assigneeEmail: assignmentOptions?.assigneeEmail,
      assigneeAvatar: assignmentOptions?.assigneeAvatar,
      assignedById: assignmentOptions?.assignedById,
      assignedByName: assignmentOptions?.assignedByName,
      assignedAt: assignmentOptions?.assigneeName || assignmentOptions?.assigneeId ? Date.now() : undefined,
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    playAudioFeedback('click');

    if (userId) {
      createTaskInSupabase(newTask, userId);
    }

    return newTask;
  };

  const assignTask = (
    taskId: string,
    assignee: { id?: string; name: string; email?: string; avatarUrl?: string } | null,
    assignedBy?: { id: string; name: string }
  ): Task | null => {
    let assignedTask: Task | null = null;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        if (assignee) {
          assignedTask = {
            ...t,
            assigneeId: assignee.id,
            assigneeName: assignee.name,
            assigneeEmail: assignee.email,
            assigneeAvatar: assignee.avatarUrl,
            assignedById: assignedBy?.id,
            assignedByName: assignedBy?.name,
            assignedAt: Date.now(),
          };
        } else {
          assignedTask = {
            ...t,
            assigneeId: undefined,
            assigneeName: undefined,
            assigneeEmail: undefined,
            assigneeAvatar: undefined,
            assignedById: undefined,
            assignedByName: undefined,
            assignedAt: undefined,
          };
        }
        return assignedTask;
      }
      return t;
    });

    if (assignedTask) {
      saveTasks(updated);
      playAudioFeedback('success');
      if (userId) {
        updateTaskInSupabase(taskId, {
          assigneeId: (assignedTask as Task).assigneeId,
          assigneeName: (assignedTask as Task).assigneeName,
          assigneeEmail: (assignedTask as Task).assigneeEmail,
          assigneeAvatar: (assignedTask as Task).assigneeAvatar,
          assignedById: (assignedTask as Task).assignedById,
          assignedByName: (assignedTask as Task).assignedByName,
          assignedAt: (assignedTask as Task).assignedAt,
        }, userId);
      }
    }

    return assignedTask;
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

  const allAssignees = useMemo(() => {
    const map = new Map<string, { id?: string; name: string; email?: string }>();
    tasks.forEach(t => {
      if (t.assigneeName) {
        const key = t.assigneeId || t.assigneeEmail || t.assigneeName;
        map.set(key, {
          id: t.assigneeId,
          name: t.assigneeName,
          email: t.assigneeEmail,
        });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'active' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (selectedTag !== 'all' && !task.tags.includes(selectedTag)) return false;

      if (assignmentFilter === 'my') {
        const isAssignedToMe = (userId && task.assigneeId === userId) ||
          (userEmail && task.assigneeEmail && task.assigneeEmail.toLowerCase() === userEmail.toLowerCase());
        const isNotAssigned = !task.assigneeId && !task.assigneeName;
        if (!isAssignedToMe && !isNotAssigned) return false;
      } else if (assignmentFilter === 'assigned_to_me') {
        const isAssignedToMe = (userId && task.assigneeId === userId) ||
          (userEmail && task.assigneeEmail && task.assigneeEmail.toLowerCase() === userEmail.toLowerCase());
        if (!isAssignedToMe) return false;
      } else if (assignmentFilter === 'team') {
        if (!task.assigneeName && !task.teamId) return false;
      }

      if (selectedAssignee !== 'all') {
        const matchesAssignee = task.assigneeId === selectedAssignee ||
          task.assigneeEmail === selectedAssignee ||
          task.assigneeName === selectedAssignee;
        if (!matchesAssignee) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesTag = task.tags.some(tag => tag.toLowerCase().includes(q));
        const matchesAssigneeName = task.assigneeName?.toLowerCase().includes(q) || false;
        const matchesAssignedByName = task.assignedByName?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesTag && !matchesAssigneeName && !matchesAssignedByName) return false;
      }
      return true;
    });
  }, [tasks, filter, priorityFilter, selectedTag, assignmentFilter, selectedAssignee, searchQuery, userId, userEmail]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const estimatedPomodoros = tasks.reduce((sum, t) => sum + (t.estimatedPomodoros || 0), 0);
    const completedPomodoros = tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const assignedCount = tasks.filter(t => Boolean(t.assigneeName || t.assigneeId)).length;

    return {
      total,
      completed,
      active,
      estimatedPomodoros,
      completedPomodoros,
      completionRate,
      assignedCount,
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
    assignmentFilter,
    setAssignmentFilter,
    selectedAssignee,
    setSelectedAssignee,
    allTags,
    allAssignees,
    stats,
    addTask,
    assignTask,
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
