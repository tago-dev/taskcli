'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { getStoredActiveTeamId, setStoredActiveTeamId, setStoredTeams } from "../lib/storage";
import {
  addTeamMemberInSupabase,
  createTeamInSupabase,
  deleteTeamInSupabase,
  fetchTeamsFromSupabase,
  joinTeamByCodeInSupabase,
  removeTeamMemberInSupabase,
  searchProfilesInSupabase,
  updateTeamInSupabase,
} from "../lib/supabaseDb";
import { generateId, playAudioFeedback } from "../lib/utils";
import { Team, TeamMember, TeamRole, UserProfile } from "../types";

const defaultInitialTeams: Team[] = [
  {
    id: "team-alpha",
    name: "TaskCli Core Devs",
    description: "Equipe de desenvolvimento e engenharia do TaskCli.",
    ownerId: "user-default",
    code: "TASK-DEV-77",
    members: [
      {
        id: "m-1",
        name: "Dev Lead",
        email: "lead@taskcli.io",
        role: "owner",
        joinedAt: 1700000000000,
        status: "active",
      },
      {
        id: "m-2",
        name: "Frontend Engineer",
        email: "frontend@taskcli.io",
        role: "admin",
        joinedAt: 1700000001000,
        status: "focusing",
      },
      {
        id: "m-3",
        name: "UI/UX Designer",
        email: "design@taskcli.io",
        role: "member",
        joinedAt: 1700000002000,
        status: "offline",
      },
    ],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
];

let teamsCache: Team[] | null = null;
let teamsListeners: Array<() => void> = [];

function emitTeamsChange() {
  teamsListeners.forEach(listener => listener());
}

function subscribeToTeams(listener: () => void) {
  teamsListeners.push(listener);
  return () => {
    teamsListeners = teamsListeners.filter(l => l !== listener);
  };
}

function getTeamsSnapshot(): Team[] {
  if (typeof window === "undefined") return defaultInitialTeams;
  if (teamsCache === null) {
    try {
      const data = localStorage.getItem("taskcli_teams");
      if (data) {
        teamsCache = JSON.parse(data);
      } else {
        teamsCache = defaultInitialTeams;
        setStoredTeams(defaultInitialTeams);
      }
    } catch {
      teamsCache = defaultInitialTeams;
    }
  }
  return teamsCache || defaultInitialTeams;
}

export function useTeams(userId?: string | null, userName?: string | null, userEmail?: string | null) {
  const teams = useSyncExternalStore(
    subscribeToTeams,
    getTeamsSnapshot,
    () => defaultInitialTeams
  );

  const [activeTeamId, setActiveTeamIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = getStoredActiveTeamId();
      if (stored) return stored;
    }
    return defaultInitialTeams[0]?.id || null;
  });

  const [searchQuery, setSearchQuery] = useState("");

  const saveTeams = useCallback((newTeams: Team[]) => {
    teamsCache = newTeams;
    setStoredTeams(newTeams);
    emitTeamsChange();
  }, []);

  const setActiveTeamId = useCallback((id: string | null) => {
    setActiveTeamIdState(id);
    setStoredActiveTeamId(id);
    playAudioFeedback("click");
  }, []);

  const loadFromSupabase = useCallback(async (uid: string, uemail?: string | null) => {
    const remoteTeams = await fetchTeamsFromSupabase(uid, uemail);
    if (remoteTeams !== null && remoteTeams.length > 0) {
      saveTeams(remoteTeams);
      const activeExists = remoteTeams.some(t => t.id === activeTeamId);
      if (!activeExists && remoteTeams[0]) {
        setActiveTeamIdState(remoteTeams[0].id);
        setStoredActiveTeamId(remoteTeams[0].id);
      }
    }
  }, [saveTeams, activeTeamId]);

  const searchProfiles = useCallback(async (query: string): Promise<UserProfile[]> => {
    return await searchProfilesInSupabase(query);
  }, []);

  const createTeam = useCallback((
    name: string,
    description: string = "",
    creatorName?: string,
    creatorEmail?: string
  ): Team => {
    const code = `${name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "X")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const teamId = `team-${generateId()}`;
    const ownerMember: TeamMember = {
      id: generateId(),
      name: creatorName || userName || "Você (Líder)",
      email: creatorEmail || userEmail || "owner@taskcli.io",
      role: "owner",
      joinedAt: Date.now(),
      status: "active",
    };

    const newTeam: Team = {
      id: teamId,
      name: name.trim() || "Nova Equipe",
      description: description.trim(),
      ownerId: userId || "local-user",
      code,
      members: [ownerMember],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newTeam, ...teams];
    saveTeams(updated);
    setActiveTeamId(newTeam.id);
    playAudioFeedback("success");

    if (userId) {
      createTeamInSupabase(newTeam, userId);
    }

    return newTeam;
  }, [teams, saveTeams, setActiveTeamId, userId, userName, userEmail]);

  const joinTeamByCode = useCallback(async (
    code: string
  ): Promise<{ success: boolean; message: string; team?: Team }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: "Código inválido." };
    }

    const localFound = teams.find(t => t.code.toUpperCase() === cleanCode);
    if (localFound) {
      setActiveTeamId(localFound.id);
      playAudioFeedback("success");
      return { success: true, message: `Equipe "${localFound.name}" ativada.`, team: localFound };
    }

    const myMember: TeamMember = {
      id: generateId(),
      name: userName || "Novo Membro",
      email: userEmail || "membro@taskcli.io",
      role: "member",
      joinedAt: Date.now(),
      status: "active",
    };

    const res = await joinTeamByCodeInSupabase(cleanCode, myMember);
    if (res.team) {
      const exists = teams.some(t => t.id === res.team?.id);
      const updated = exists
        ? teams.map(t => (t.id === res.team?.id ? res.team! : t))
        : [res.team, ...teams];
      saveTeams(updated);
      setActiveTeamId(res.team.id);
      playAudioFeedback("success");
      return { success: true, message: `Você entrou na equipe "${res.team.name}".`, team: res.team };
    }

    playAudioFeedback("error");
    return { success: false, message: res.error || "Equipe não encontrada." };
  }, [teams, saveTeams, setActiveTeamId, userName, userEmail]);

  const updateTeam = useCallback((
    teamId: string,
    updates: Partial<Pick<Team, "name" | "description">>
  ): Team | null => {
    let updatedTeam: Team | null = null;
    const updated = teams.map(t => {
      if (t.id === teamId) {
        updatedTeam = {
          ...t,
          ...updates,
          updatedAt: Date.now(),
        };
        return updatedTeam;
      }
      return t;
    });

    if (updatedTeam) {
      saveTeams(updated);
      playAudioFeedback("click");

      if (userId) {
        updateTeamInSupabase(teamId, updates, userId);
      }
    }

    return updatedTeam;
  }, [teams, saveTeams, userId]);

  const deleteTeam = useCallback((teamId: string): boolean => {
    const exists = teams.some(t => t.id === teamId);
    if (!exists) return false;

    const updated = teams.filter(t => t.id !== teamId);
    saveTeams(updated);

    if (activeTeamId === teamId) {
      const nextActive = updated[0]?.id || null;
      setActiveTeamIdState(nextActive);
      setStoredActiveTeamId(nextActive);
    }

    playAudioFeedback("click");

    if (userId) {
      deleteTeamInSupabase(teamId, userId);
    }

    return true;
  }, [teams, saveTeams, activeTeamId, userId]);

  const addMember = useCallback((
    teamId: string,
    name: string,
    email: string,
    role: TeamRole = "member",
    avatarUrl?: string
  ): TeamMember | null => {
    const targetTeam = teams.find(t => t.id === teamId);
    if (!targetTeam) return null;

    const exists = targetTeam.members.some(m => m.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) return null;

    const newMember: TeamMember = {
      id: generateId(),
      name: name.trim() || "Membro da Equipe",
      email: email.trim().toLowerCase(),
      role,
      avatarUrl,
      joinedAt: Date.now(),
      status: "active",
    };

    const updated = teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          members: [...t.members, newMember],
          updatedAt: Date.now(),
        };
      }
      return t;
    });

    saveTeams(updated);
    playAudioFeedback("success");

    if (userId) {
      addTeamMemberInSupabase(teamId, newMember);
    }

    return newMember;
  }, [teams, saveTeams, userId]);

  const removeMember = useCallback((teamId: string, memberId: string): boolean => {
    const targetTeam = teams.find(t => t.id === teamId);
    if (!targetTeam) return false;

    const memberToRemove = targetTeam.members.find(m => m.id === memberId);
    if (!memberToRemove || memberToRemove.role === "owner") return false;

    const updated = teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          members: t.members.filter(m => m.id !== memberId),
          updatedAt: Date.now(),
        };
      }
      return t;
    });

    saveTeams(updated);
    playAudioFeedback("click");

    if (userId) {
      removeTeamMemberInSupabase(teamId, memberId);
    }

    return true;
  }, [teams, saveTeams, userId]);

  const updateMemberRole = useCallback((
    teamId: string,
    memberId: string,
    role: TeamRole
  ): boolean => {
    const targetTeam = teams.find(t => t.id === teamId);
    if (!targetTeam) return false;

    const updated = teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          members: t.members.map(m => {
            if (m.id === memberId) {
              return { ...m, role };
            }
            return m;
          }),
          updatedAt: Date.now(),
        };
      }
      return t;
    });

    saveTeams(updated);
    playAudioFeedback("click");
    return true;
  }, [teams, saveTeams]);

  const activeTeam = useMemo(() => {
    return teams.find(t => t.id === activeTeamId) || teams[0] || null;
  }, [teams, activeTeamId]);

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      t.code.toLowerCase().includes(q)
    );
  }, [teams, searchQuery]);

  return {
    teams,
    filteredTeams,
    activeTeam,
    activeTeamId: activeTeam?.id || null,
    setActiveTeamId,
    searchQuery,
    setSearchQuery,
    createTeam,
    joinTeamByCode,
    searchProfiles,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    updateMemberRole,
    saveTeams,
    loadFromSupabase,
    mounted: true,
  };
}

