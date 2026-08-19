import { Note, Task, TaskPriority } from "../types";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

interface SupabaseTaskRow {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  tags: string[];
  estimated_pomodoros: number;
  completed_pomodoros: number;
  created_at: number;
  completed_at: number | null;
}

interface SupabaseNoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_at: number;
  updated_at: number;
}

export async function fetchTasksFromSupabase(userId: string): Promise<Task[] | null> {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return null;

    return (data as SupabaseTaskRow[]).map(row => ({
      id: row.id,
      title: row.title,
      completed: row.completed,
      priority: row.priority,
      tags: row.tags || [],
      estimatedPomodoros: row.estimated_pomodoros,
      completedPomodoros: row.completed_pomodoros,
      createdAt: Number(row.created_at),
      completedAt: row.completed_at ? Number(row.completed_at) : undefined,
    }));
  } catch {
    return null;
  }
}

export async function createTaskInSupabase(task: Task, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const { error } = await supabase.from("tasks").insert({
      id: task.id,
      user_id: userId,
      title: task.title,
      completed: task.completed,
      priority: task.priority,
      tags: task.tags,
      estimated_pomodoros: task.estimatedPomodoros,
      completed_pomodoros: task.completedPomodoros,
      created_at: task.createdAt,
      completed_at: task.completedAt || null,
    });

    return !error;
  } catch {
    return false;
  }
}

export async function updateTaskInSupabase(
  taskId: string,
  updates: Partial<Task>,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const payload: Partial<SupabaseTaskRow> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.completed !== undefined) payload.completed = updates.completed;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.estimatedPomodoros !== undefined) payload.estimated_pomodoros = updates.estimatedPomodoros;
    if (updates.completedPomodoros !== undefined) payload.completed_pomodoros = updates.completedPomodoros;
    if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt || null;

    const { error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", taskId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

export async function deleteTaskInSupabase(taskId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

export async function fetchNotesFromSupabase(userId: string): Promise<Note[] | null> {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) return null;

    return (data as SupabaseNoteRow[]).map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: row.tags || [],
      pinned: row.pinned,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    }));
  } catch {
    return null;
  }
}

export async function createNoteInSupabase(note: Note, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const { error } = await supabase.from("notes").insert({
      id: note.id,
      user_id: userId,
      title: note.title,
      content: note.content,
      tags: note.tags,
      pinned: note.pinned,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    });

    return !error;
  } catch {
    return false;
  }
}

export async function updateNoteInSupabase(
  noteId: string,
  updates: Partial<Note>,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const payload: Partial<SupabaseNoteRow> = {
      updated_at: Date.now(),
    };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.pinned !== undefined) payload.pinned = updates.pinned;

    const { error } = await supabase
      .from("notes")
      .update(payload)
      .eq("id", noteId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

export async function deleteNoteInSupabase(noteId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

export async function bulkSyncToSupabase(
  tasks: Task[],
  notes: Note[],
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    if (tasks.length > 0) {
      const taskRows: SupabaseTaskRow[] = tasks.map(t => ({
        id: t.id,
        user_id: userId,
        title: t.title,
        completed: t.completed,
        priority: t.priority,
        tags: t.tags,
        estimated_pomodoros: t.estimatedPomodoros,
        completed_pomodoros: t.completedPomodoros,
        created_at: t.createdAt,
        completed_at: t.completedAt || null,
      }));

      await supabase.from("tasks").upsert(taskRows, { onConflict: "id" });
    }

    if (notes.length > 0) {
      const noteRows: SupabaseNoteRow[] = notes.map(n => ({
        id: n.id,
        user_id: userId,
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
        created_at: n.createdAt,
        updated_at: n.updatedAt,
      }));

      await supabase.from("notes").upsert(noteRows, { onConflict: "id" });
    }

    return true;
  } catch {
    return false;
  }
}
