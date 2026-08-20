'use client';

import { useEffect, useRef } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { NotificationType, ViewTab } from "../types";

interface RealtimeTaskRecord {
  id?: string;
  user_id?: string;
  title?: string;
  completed?: boolean;
  status?: string;
  team_id?: string;
  assignee_id?: string;
  assignee_name?: string;
  assignee_email?: string;
  assigned_by_id?: string;
  assigned_by_name?: string;
}

interface RealtimeMemberRecord {
  id?: string;
  team_id?: string;
  user_id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface UseRealtimeSyncProps {
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  activeTeamId?: string | null;
  teamIds?: string[];
  onReloadTasks?: () => void;
  onReloadTeams?: () => void;
  onReloadNotes?: () => void;
  onNotify?: (
    title: string,
    message: string,
    type: NotificationType,
    options?: { linkTab?: ViewTab; showToast?: boolean }
  ) => void;
}

export function useRealtimeSync({
  userId,
  userEmail,
  userName,
  activeTeamId,
  teamIds = [],
  onReloadTasks,
  onReloadTeams,
  onReloadNotes,
  onNotify,
}: UseRealtimeSyncProps) {
  const onReloadTasksRef = useRef(onReloadTasks);
  const onReloadTeamsRef = useRef(onReloadTeams);
  const onReloadNotesRef = useRef(onReloadNotes);
  const onNotifyRef = useRef(onNotify);

  useEffect(() => {
    onReloadTasksRef.current = onReloadTasks;
    onReloadTeamsRef.current = onReloadTeams;
    onReloadNotesRef.current = onReloadNotes;
    onNotifyRef.current = onNotify;
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !userId) return;

    const channel = supabase
      .channel(`db_realtime_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        payload => {
          const newRow = payload.new as RealtimeTaskRecord | undefined;
          const oldRow = payload.old as RealtimeTaskRecord | undefined;

          if (payload.eventType === "INSERT" && newRow) {
            const isAssignedToMe =
              (userId && newRow.assignee_id === userId) ||
              (userEmail &&
                newRow.assignee_email &&
                newRow.assignee_email.toLowerCase() === userEmail.toLowerCase());

            if (isAssignedToMe && newRow.assigned_by_id !== userId) {
              onNotifyRef.current?.(
                "Nova Tarefa Atribuída",
                `${newRow.assigned_by_name || "Líder"} atribuiu a você: "${newRow.title || "Nova tarefa"}"`,
                "task",
                { linkTab: "tasks" }
              );
            } else if (newRow.team_id && teamIds.includes(newRow.team_id) && newRow.user_id !== userId) {
              onNotifyRef.current?.(
                "Nova Tarefa na Equipe",
                `Nova tarefa adicionada: "${newRow.title || "Nova tarefa"}"`,
                "task",
                { linkTab: "kanban" }
              );
            }
          } else if (payload.eventType === "UPDATE" && newRow && oldRow) {
            const wasJustCompleted = newRow.completed && !oldRow.completed;
            const wasJustAssignedToMe =
              (userId && newRow.assignee_id === userId && oldRow.assignee_id !== userId) ||
              (userEmail &&
                newRow.assignee_email &&
                newRow.assignee_email.toLowerCase() === userEmail.toLowerCase() &&
                oldRow.assignee_email?.toLowerCase() !== userEmail.toLowerCase());

            if (wasJustAssignedToMe && newRow.assigned_by_id !== userId) {
              onNotifyRef.current?.(
                "Tarefa Delegada a Você",
                `${newRow.assigned_by_name || "Líder"} atribuiu a você: "${newRow.title || "Tarefa"}"`,
                "task",
                { linkTab: "tasks" }
              );
            } else if (wasJustCompleted && newRow.user_id !== userId) {
              onNotifyRef.current?.(
                "Tarefa Concluída",
                `A tarefa "${newRow.title || "Tarefa"}" foi concluída por @${newRow.assignee_name || "colaborador"}.`,
                "success",
                { linkTab: "kanban" }
              );
            }
          }

          onReloadTasksRef.current?.();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members" },
        payload => {
          const newRow = payload.new as RealtimeMemberRecord | undefined;
          if (payload.eventType === "INSERT" && newRow) {
            if (activeTeamId && newRow.team_id === activeTeamId && newRow.user_id !== userId) {
              onNotifyRef.current?.(
                "Novo Membro na Equipe",
                `${newRow.name || "Novo membro"} entrou na equipe!`,
                "team",
                { linkTab: "team" }
              );
            }
          }
          onReloadTeamsRef.current?.();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => {
          onReloadTeamsRef.current?.();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        () => {
          onReloadNotesRef.current?.();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, userEmail, userName, activeTeamId, teamIds]);
}
