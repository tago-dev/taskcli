import { Note, Task, TaskPriority, Team, TeamMember, TeamRole, UserProfile } from "../types";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

interface SupabaseTaskRow {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  status?: string | null;
  priority: TaskPriority;
  tags: string[];
  estimated_pomodoros: number;
  completed_pomodoros: number;
  created_at: number;
  completed_at: number | null;
  team_id: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  assignee_avatar: string | null;
  assigned_by_id: string | null;
  assigned_by_name: string | null;
  assigned_at: number | null;
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

interface SupabaseTeamRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  code: string;
  created_at: number;
  updated_at: number;
}

interface SupabaseTeamMemberRow {
  id: string;
  team_id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: TeamRole;
  avatar_url: string | null;
  joined_at: number;
}

interface SupabaseProfileRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: number;
  updated_at: number;
}

export async function syncUserProfileToSupabase(profile: UserProfile): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !profile.id) return false;

  try {
    const { error } = await supabase.from("profiles").upsert({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar_url: profile.avatarUrl || null,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    }, { onConflict: "id" });

    if (!error && profile.email) {
      await supabase
        .from("team_members")
        .update({
          user_id: profile.id,
          avatar_url: profile.avatarUrl || null,
        })
        .ilike("email", profile.email)
        .is("user_id", null);
    }

    return !error;
  } catch {
    return false;
  }
}

export async function searchProfilesInSupabase(query: string): Promise<UserProfile[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const cleanQuery = query.trim();
    let req = supabase.from("profiles").select("*");

    if (cleanQuery) {
      req = req.or(`name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`);
    }

    const { data, error } = await req.order("updated_at", { ascending: false }).limit(20);

    if (error || !data) return [];

    return (data as SupabaseProfileRow[]).map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatar_url || undefined,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    }));
  } catch {
    return [];
  }
}

export async function fetchTasksFromSupabase(
  userId: string,
  teamIds: string[] = [],
  userEmail?: string | null
): Promise<Task[] | null> {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const orConditions = [`user_id.eq.${userId}`, `assignee_id.eq.${userId}`];
    if (userEmail && userEmail.trim()) {
      orConditions.push(`assignee_email.ilike.${userEmail.trim()}`);
    }
    if (teamIds.length > 0) {
      orConditions.push(`team_id.in.(${teamIds.join(",")})`);
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .or(orConditions.join(","))
      .order("created_at", { ascending: false });

    if (error) return null;

    return (data as SupabaseTaskRow[]).map(row => ({
      id: row.id,
      title: row.title,
      completed: row.completed,
      status: (row.status as Task["status"]) || (row.completed ? "done" : "todo"),
      priority: row.priority,
      tags: row.tags || [],
      estimatedPomodoros: row.estimated_pomodoros,
      completedPomodoros: row.completed_pomodoros,
      createdAt: Number(row.created_at),
      completedAt: row.completed_at ? Number(row.completed_at) : undefined,
      teamId: row.team_id || undefined,
      assigneeId: row.assignee_id || undefined,
      assigneeName: row.assignee_name || undefined,
      assigneeEmail: row.assignee_email || undefined,
      assigneeAvatar: row.assignee_avatar || undefined,
      assignedById: row.assigned_by_id || undefined,
      assignedByName: row.assigned_by_name || undefined,
      assignedAt: row.assigned_at ? Number(row.assigned_at) : undefined,
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
      status: task.status || (task.completed ? "done" : "todo"),
      priority: task.priority,
      tags: task.tags,
      estimated_pomodoros: task.estimatedPomodoros,
      completed_pomodoros: task.completedPomodoros,
      created_at: task.createdAt,
      completed_at: task.completedAt || null,
      team_id: task.teamId || null,
      assignee_id: task.assigneeId || null,
      assignee_name: task.assigneeName || null,
      assignee_email: task.assigneeEmail || null,
      assignee_avatar: task.assigneeAvatar || null,
      assigned_by_id: task.assignedById || null,
      assigned_by_name: task.assignedByName || null,
      assigned_at: task.assignedAt || null,
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
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.estimatedPomodoros !== undefined) payload.estimated_pomodoros = updates.estimatedPomodoros;
    if (updates.completedPomodoros !== undefined) payload.completed_pomodoros = updates.completedPomodoros;
    if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt || null;
    if (updates.teamId !== undefined) payload.team_id = updates.teamId || null;
    if (updates.assigneeId !== undefined) payload.assignee_id = updates.assigneeId || null;
    if (updates.assigneeName !== undefined) payload.assignee_name = updates.assigneeName || null;
    if (updates.assigneeEmail !== undefined) payload.assignee_email = updates.assigneeEmail || null;
    if (updates.assigneeAvatar !== undefined) payload.assignee_avatar = updates.assigneeAvatar || null;
    if (updates.assignedById !== undefined) payload.assigned_by_id = updates.assignedById || null;
    if (updates.assignedByName !== undefined) payload.assigned_by_name = updates.assignedByName || null;
    if (updates.assignedAt !== undefined) payload.assigned_at = updates.assignedAt || null;

    const { error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", taskId);

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
      .eq("id", taskId);

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

export async function fetchTeamsFromSupabase(userId: string, userEmail?: string | null): Promise<Team[] | null> {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const { data: ownedTeams } = await supabase
      .from("teams")
      .select("*")
      .eq("user_id", userId);

    let memberTeamIds: string[] = [];

    const memberQueries: string[] = [];
    if (userId) {
      memberQueries.push(`user_id.eq.${userId}`);
    }
    if (userEmail && userEmail.trim()) {
      memberQueries.push(`email.ilike.${userEmail.trim()}`);
    }

    if (memberQueries.length > 0) {
      const { data: memberRows } = await supabase
        .from("team_members")
        .select("team_id")
        .or(memberQueries.join(","));

      if (memberRows && memberRows.length > 0) {
        memberTeamIds = memberRows.map(m => m.team_id);
      }
    }

    const allTeamIds = Array.from(
      new Set([...(ownedTeams || []).map(t => t.id), ...memberTeamIds])
    );

    if (allTeamIds.length === 0) return [];

    const { data: teamRows, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .in("id", allTeamIds)
      .order("created_at", { ascending: false });

    if (teamError || !teamRows) return null;

    const { data: mRows } = await supabase
      .from("team_members")
      .select("*")
      .in("team_id", allTeamIds);

    const memberRows = (mRows || []) as SupabaseTeamMemberRow[];

    return (teamRows as SupabaseTeamRow[]).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || "",
      ownerId: t.user_id,
      code: t.code,
      createdAt: Number(t.created_at),
      updatedAt: Number(t.updated_at),
      members: memberRows
        .filter(m => m.team_id === t.id)
        .map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          avatarUrl: m.avatar_url || undefined,
          joinedAt: Number(m.joined_at),
        })),
    }));
  } catch {
    return null;
  }
}

export async function joinTeamByCodeInSupabase(
  code: string,
  member: TeamMember
): Promise<{ team: Team | null; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { team: null, error: "Supabase não configurado" };

  try {
    const cleanCode = code.trim().toUpperCase();
    const { data: teamRow, error: teamErr } = await supabase
      .from("teams")
      .select("*")
      .ilike("code", cleanCode)
      .single();

    if (teamErr || !teamRow) {
      return { team: null, error: "Equipe não encontrada com esse código." };
    }

    const { data: existingMembers } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamRow.id);

    const memberList = (existingMembers || []) as SupabaseTeamMemberRow[];
    const alreadyMember = memberList.some(
      m => (member.email && m.email.toLowerCase() === member.email.toLowerCase()) ||
           (member.id && m.user_id === member.id)
    );

    if (!alreadyMember) {
      await supabase.from("team_members").insert({
        id: member.id,
        team_id: teamRow.id,
        user_id: member.id || null,
        name: member.name,
        email: member.email,
        role: member.role || "member",
        avatar_url: member.avatarUrl || null,
        joined_at: member.joinedAt || Date.now(),
      });
    }

    const { data: updatedMembers } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamRow.id);

    const fullTeam: Team = {
      id: teamRow.id,
      name: teamRow.name,
      description: teamRow.description || "",
      ownerId: teamRow.user_id,
      code: teamRow.code,
      createdAt: Number(teamRow.created_at),
      updatedAt: Number(teamRow.updated_at),
      members: ((updatedMembers || []) as SupabaseTeamMemberRow[]).map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        avatarUrl: m.avatar_url || undefined,
        joinedAt: Number(m.joined_at),
      })),
    };

    return { team: fullTeam };
  } catch {
    return { team: null, error: "Erro ao entrar na equipe." };
  }
}

export async function createTeamInSupabase(team: Team, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const { error: teamErr } = await supabase.from("teams").insert({
      id: team.id,
      user_id: userId,
      name: team.name,
      description: team.description || "",
      code: team.code,
      created_at: team.createdAt,
      updated_at: team.updatedAt,
    });

    if (teamErr) return false;

    if (team.members.length > 0) {
      const memberRows = team.members.map(m => ({
        id: m.id,
        team_id: team.id,
        user_id: userId,
        name: m.name,
        email: m.email,
        role: m.role,
        avatar_url: m.avatarUrl || null,
        joined_at: m.joinedAt,
      }));
      await supabase.from("team_members").insert(memberRows);
    }

    return true;
  } catch {
    return false;
  }
}

export async function updateTeamInSupabase(
  teamId: string,
  updates: Partial<Team>,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const payload: Partial<SupabaseTeamRow> = {
      updated_at: Date.now(),
    };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;

    const { error } = await supabase
      .from("teams")
      .update(payload)
      .eq("id", teamId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

export async function deleteTeamInSupabase(teamId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

export async function addTeamMemberInSupabase(
  teamId: string,
  member: TeamMember
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase.from("team_members").insert({
      id: member.id,
      team_id: teamId,
      user_id: null,
      name: member.name,
      email: member.email,
      role: member.role,
      avatar_url: member.avatarUrl || null,
      joined_at: member.joinedAt,
    });

    return !error;
  } catch {
    return false;
  }
}

export async function removeTeamMemberInSupabase(
  teamId: string,
  memberId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId)
      .eq("team_id", teamId);

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
        status: t.status || (t.completed ? "done" : "todo"),
        priority: t.priority,
        tags: t.tags,
        estimated_pomodoros: t.estimatedPomodoros,
        completed_pomodoros: t.completedPomodoros,
        created_at: t.createdAt,
        completed_at: t.completedAt || null,
        team_id: t.teamId || null,
        assignee_id: t.assigneeId || null,
        assignee_name: t.assigneeName || null,
        assignee_email: t.assigneeEmail || null,
        assignee_avatar: t.assigneeAvatar || null,
        assigned_by_id: t.assignedById || null,
        assigned_by_name: t.assignedByName || null,
        assigned_at: t.assignedAt || null,
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


