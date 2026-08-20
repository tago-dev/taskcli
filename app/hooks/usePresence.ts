'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { TeamMember } from "../types";

export interface PresenceUser {
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  avatarUrl?: string;
  status: 'active' | 'focusing';
  lastSeenAt: number;
}

interface UsePresenceProps {
  activeTeamId?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userAvatar?: string;
  isPomodoroRunning?: boolean;
}

export function usePresence({
  activeTeamId,
  userId,
  userName,
  userEmail,
  userAvatar,
  isPomodoroRunning = false,
}: UsePresenceProps) {
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceUser>>({});

  const currentUserStatus = useMemo<'active' | 'focusing'>(() => {
    return isPomodoroRunning ? 'focusing' : 'active';
  }, [isPomodoroRunning]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !activeTeamId || !userId) {
      return;
    }

    const channelName = `presence:team:${activeTeamId}`;
    const presenceKey = userId || userEmail || 'anonymous';

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    });

    const updatePresenceState = () => {
      const state = channel.presenceState();
      const newMap: Record<string, PresenceUser> = {};

      Object.keys(state).forEach(key => {
        const presences = state[key] as unknown as PresenceUser[];
        if (presences && presences.length > 0) {
          const latest = presences[presences.length - 1];
          newMap[key] = latest;
          if (latest.userEmail) {
            newMap[latest.userEmail.toLowerCase()] = latest;
          }
          if (latest.userId) {
            newMap[latest.userId] = latest;
          }
        }
      });

      setPresenceMap(newMap);
    };

    channel
      .on("presence", { event: "sync" }, updatePresenceState)
      .on("presence", { event: "join" }, updatePresenceState)
      .on("presence", { event: "leave" }, updatePresenceState)
      .subscribe(async status => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            userEmail,
            userName: userName || "Membro",
            avatarUrl: userAvatar,
            status: currentUserStatus,
            lastSeenAt: Date.now(),
          });
        }
      });

    const trackCurrent = async () => {
      if (channel) {
        await channel.track({
          userId,
          userEmail,
          userName: userName || "Membro",
          avatarUrl: userAvatar,
          status: currentUserStatus,
          lastSeenAt: Date.now(),
        });
      }
    };

    trackCurrent();

    const handleBeforeUnload = () => {
      channel.untrack();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      channel.untrack();
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeTeamId, userId, userName, userEmail, userAvatar, currentUserStatus]);

  const getMemberStatus = useCallback((member: TeamMember): 'active' | 'focusing' | 'offline' => {
    const isCurrent =
      (userId && member.id === userId) ||
      (userEmail && member.email.toLowerCase() === userEmail.toLowerCase()) ||
      (userId && member.userId === userId);

    if (isCurrent) {
      return currentUserStatus;
    }

    const presence =
      presenceMap[member.id] ||
      (member.userId ? presenceMap[member.userId] : undefined) ||
      (member.email ? presenceMap[member.email.toLowerCase()] : undefined);

    if (presence) {
      return presence.status;
    }

    return 'offline';
  }, [userId, userEmail, currentUserStatus, presenceMap]);

  return {
    presenceMap,
    getMemberStatus,
    currentUserStatus,
  };
}
