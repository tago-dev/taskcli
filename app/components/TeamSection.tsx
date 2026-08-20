'use client';

import {
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import {
  Building2,
  Check,
  ChevronDown,
  Copy,
  Crown,
  KeyRound,
  ListTodo,
  Lock,
  LogIn,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Task, TaskPriority, Team, TeamMember, TeamRole, UserProfile } from "../types";

interface TeamSectionProps {
  teams: Team[];
  activeTeam: Team | null;
  tasks?: Task[];
  isLoggedIn: boolean;
  currentUserRole?: TeamRole | null;
  isLeaderOrAdmin?: boolean;
  currentUserId?: string | null;
  currentUserName?: string | null;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (name: string, description: string) => void;
  onUpdateTeam: (teamId: string, updates: Partial<Pick<Team, "name" | "description">>) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddMember: (teamId: string, name: string, email: string, role: TeamRole, avatarUrl?: string) => void;
  onRemoveMember: (teamId: string, memberId: string) => void;
  onUpdateMemberRole: (teamId: string, memberId: string, role: TeamRole) => void;
  onAssignTask?: (taskId: string, member: TeamMember | null) => void;
  onAddTask?: (
    title: string,
    priority: TaskPriority,
    tags: string[],
    pomodoros: number,
    assignmentOptions?: {
      teamId?: string;
      assigneeId?: string;
      assigneeName?: string;
      assigneeEmail?: string;
      assigneeAvatar?: string;
      assignedById?: string;
      assignedByName?: string;
    }
  ) => void;
  onToggleTask?: (taskId: string) => void;
  onSearchProfiles?: (query: string) => Promise<UserProfile[]>;
  onSyncClerkUsers?: () => Promise<{ success: boolean; count: number; users?: UserProfile[] }>;
  onJoinTeamByCode?: (code: string) => Promise<{ success: boolean; message: string }>;
}

export function TeamSection({
  teams,
  activeTeam,
  tasks = [],
  isLoggedIn,
  currentUserRole,
  isLeaderOrAdmin = false,
  currentUserId,
  currentUserName,
  onSelectTeam,
  onCreateTeam,
  onDeleteTeam,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onAssignTask,
  onAddTask,
  onToggleTask,
  onSearchProfiles,
  onSyncClerkUsers,
  onJoinTeamByCode,
}: TeamSectionProps) {
  const [teamTab, setTeamTab] = useState<"members" | "board">("members");

  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>("member");
  const [newMemberAvatar, setNewMemberAvatar] = useState<string | undefined>(undefined);

  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSyncingClerk, setIsSyncingClerk] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [joinFeedback, setJoinFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const [delegatingMember, setDelegatingMember] = useState<TeamMember | null>(null);
  const [delegationMode, setDelegationMode] = useState<"new" | "existing">("new");
  const [delegatedTaskTitle, setDelegatedTaskTitle] = useState("");
  const [delegatedTaskPriority, setDelegatedTaskPriority] = useState<TaskPriority>("medium");
  const [delegatedTaskPomodoros, setDelegatedTaskPomodoros] = useState<number>(1);
  const [delegatedTaskTags, setDelegatedTaskTags] = useState("");
  const [selectedExistingTaskId, setSelectedExistingTaskId] = useState("");

  const [copiedCode, setCopiedCode] = useState(false);
  const [searchMember, setSearchMember] = useState("");

  useEffect(() => {
    if (!isInvitingMember || !onSearchProfiles) return;

    let isCurrent = true;

    const timer = setTimeout(() => {
      setIsSearchingUsers(true);
      onSearchProfiles(searchUserQuery)
        .then(results => {
          if (isCurrent) {
            setSearchResults(results);
            setIsSearchingUsers(false);
          }
        })
        .catch(() => {
          if (isCurrent) {
            setSearchResults([]);
            setIsSearchingUsers(false);
          }
        });
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [isInvitingMember, searchUserQuery, onSearchProfiles]);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !isLoggedIn) return;

    onCreateTeam(newTeamName.trim(), newTeamDescription.trim());
    setNewTeamName("");
    setNewTeamDescription("");
    setIsCreatingTeam(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !newMemberName.trim() || !newMemberEmail.trim() || !isLoggedIn) return;

    onAddMember(activeTeam.id, newMemberName.trim(), newMemberEmail.trim(), newMemberRole, newMemberAvatar);
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("member");
    setNewMemberAvatar(undefined);
    setSearchUserQuery("");
    setIsInvitingMember(false);
  };

  const handleSelectProfile = (profile: UserProfile) => {
    setNewMemberName(profile.name);
    setNewMemberEmail(profile.email);
    setNewMemberAvatar(profile.avatarUrl);
  };

  const handleSyncClerk = async () => {
    if (!onSyncClerkUsers) return;
    setIsSyncingClerk(true);
    setSyncFeedback(null);

    const res = await onSyncClerkUsers();
    setIsSyncingClerk(false);
    if (res.success) {
      if (res.users) {
        setSearchResults(res.users);
      }
      setSyncFeedback(`${res.count} usuário(s) sincronizado(s) do Clerk!`);
      setTimeout(() => setSyncFeedback(null), 3000);
    } else {
      setSyncFeedback("Erro ao sincronizar do Clerk.");
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCodeInput.trim() || !onJoinTeamByCode) return;

    setJoinFeedback(null);
    const result = await onJoinTeamByCode(teamCodeInput.trim());
    if (result.success) {
      setJoinFeedback({ text: result.message, isError: false });
      setTimeout(() => {
        setIsJoiningByCode(false);
        setTeamCodeInput("");
        setJoinFeedback(null);
      }, 1200);
    } else {
      setJoinFeedback({ text: result.message, isError: true });
    }
  };

  const handleCopyCode = () => {
    if (!activeTeam) return;
    navigator.clipboard.writeText(activeTeam.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDelegateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegatingMember || !activeTeam) return;

    if (delegationMode === "new") {
      if (!delegatedTaskTitle.trim() || !onAddTask) return;

      const tags = delegatedTaskTags
        .split(/[\s,]+/)
        .map(t => t.replace("#", "").trim())
        .filter(Boolean);

      onAddTask(
        delegatedTaskTitle.trim(),
        delegatedTaskPriority,
        tags,
        delegatedTaskPomodoros,
        {
          teamId: activeTeam.id,
          assigneeId: delegatingMember.id,
          assigneeName: delegatingMember.name,
          assigneeEmail: delegatingMember.email,
          assigneeAvatar: delegatingMember.avatarUrl,
          assignedById: currentUserId || undefined,
          assignedByName: currentUserName || "Líder",
        }
      );
    } else {
      if (!selectedExistingTaskId || !onAssignTask) return;
      onAssignTask(selectedExistingTaskId, delegatingMember);
    }

    setDelegatedTaskTitle("");
    setDelegatedTaskTags("");
    setDelegatedTaskPomodoros(1);
    setDelegatedTaskPriority("medium");
    setSelectedExistingTaskId("");
    setDelegatingMember(null);
  };

  const filteredMembers = activeTeam?.members.filter(m => {
    if (!searchMember.trim()) return true;
    const q = searchMember.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  }) || [];

  const teamTasks = tasks.filter(t => t.teamId === activeTeam?.id || Boolean(t.assigneeName));
  const unassignedTasks = teamTasks.filter(t => !t.assigneeName && !t.assigneeId);

  const getMemberTasks = (member: TeamMember) => {
    return teamTasks.filter(
      t => t.assigneeId === member.id ||
           (t.assigneeEmail && t.assigneeEmail.toLowerCase() === member.email.toLowerCase())
    );
  };

  const getRoleBadge = (role: TeamRole) => {
    switch (role) {
      case "owner":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-mono font-bold">
            <Crown className="w-3 h-3" />
            Líder
          </span>
        );
      case "admin":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[11px] font-mono font-semibold">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case "member":
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-dim)] text-[11px] font-mono">
            Membro
          </span>
        );
    }
  };

  const getStatusBadge = (status?: TeamMember["status"]) => {
    switch (status) {
      case "focusing":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--warning)]">
            <span className="w-2 h-2 rounded-full bg-[var(--warning)] animate-ping" />
            Em Pomodoro
          </span>
        );
      case "offline":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-dim)]">
            <span className="w-2 h-2 rounded-full bg-[var(--border-color)]" />
            Ausente
          </span>
        );
      case "active":
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--accent)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            Online
          </span>
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-8 sm:p-16 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold font-mono text-[var(--text-main)]">
            Autenticação Necessária
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Para criar uma equipe, convidar membros, delegar tarefas e acompanhar o progresso em tempo real, faça login na sua conta.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SignInButton mode="modal">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] font-mono font-bold text-sm hover:opacity-90 transition-all shadow-md">
              <LogIn className="w-4 h-4" />
              <span>Entrar com Google / GitHub</span>
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-main)] font-mono font-semibold text-sm transition-all shadow-xs">
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta</span>
            </button>
          </SignUpButton>
        </div>
      </div>
    );
  }

  if (teams.length === 0 && !isCreatingTeam && !isJoiningByCode) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-10 sm:p-16 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
          <Users className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold font-mono text-[var(--text-main)]">
            Nenhuma Equipe Cadastrada
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Crie sua primeira equipe ou entre em uma equipe existente através do código de convite para delegar e gerenciar tarefas.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsCreatingTeam(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] font-mono font-bold text-sm hover:opacity-90 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Equipe</span>
          </button>
          <button
            onClick={() => setIsJoiningByCode(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-main)] font-mono font-semibold text-sm transition-all shadow-xs"
          >
            <KeyRound className="w-4 h-4 text-[var(--accent)]" />
            <span>Entrar com Código</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-[var(--text-dim)] font-bold">
                  Equipe Ativa
                </span>
                {currentUserRole && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-main)] text-[var(--accent)] font-bold">
                    Seu Cargo: {currentUserRole === "owner" ? "Líder" : currentUserRole === "admin" ? "Admin" : "Membro"}
                  </span>
                )}
              </div>
              <div className="relative inline-block mt-0.5">
                <select
                  value={activeTeam?.id || ""}
                  onChange={e => onSelectTeam(e.target.value)}
                  className="appearance-none bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] font-mono font-bold text-base px-3 py-1.5 pr-8 rounded-xl focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {activeTeam && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="Copiar código de convite da equipe"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="text-[var(--accent)] font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Código: <strong className="text-[var(--text-main)]">{activeTeam.code}</strong></span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTeam && isLeaderOrAdmin && (
            <button
              onClick={() => {
                setIsInvitingMember(true);
                setSearchUserQuery("");
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs sm:text-sm font-mono font-semibold text-[var(--text-main)] transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-[var(--accent)]" />
              <span>Convidar Membro</span>
            </button>
          )}

          <button
            onClick={() => setIsJoiningByCode(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs sm:text-sm font-mono font-semibold text-[var(--text-main)] transition-all shadow-xs"
          >
            <KeyRound className="w-4 h-4 text-[var(--accent)]" />
            <span>Entrar com Código</span>
          </button>

          <button
            onClick={() => setIsCreatingTeam(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs sm:text-sm font-mono font-bold hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Equipe</span>
          </button>
        </div>
      </div>

      {activeTeam && (
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border-color)] font-mono text-xs sm:text-sm">
          <button
            onClick={() => setTeamTab("members")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              teamTab === "members"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-bold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Membros e Funções ({activeTeam.members.length})</span>
          </button>

          <button
            onClick={() => setTeamTab("board")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              teamTab === "board"
                ? "bg-[var(--accent)] text-[var(--accent-text)] font-bold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Quadro de Tarefas da Equipe ({teamTasks.length})</span>
          </button>
        </div>
      )}

      {isJoiningByCode && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded-2xl p-6 sm:p-8 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="text-base font-bold font-mono text-[var(--text-main)] uppercase">
                Entrar em Equipe via Código
              </h3>
            </div>
            <button
              onClick={() => {
                setIsJoiningByCode(false);
                setJoinFeedback(null);
              }}
              className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleJoinByCode} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                Código de Convite da Equipe *
              </label>
              <input
                type="text"
                placeholder="Ex: TASK-DEV-77..."
                value={teamCodeInput}
                onChange={e => setTeamCodeInput(e.target.value.toUpperCase())}
                required
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {joinFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-mono border ${
                  joinFeedback.isError
                    ? "bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/30"
                    : "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30"
                }`}
              >
                {joinFeedback.text}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => {
                  setIsJoiningByCode(false);
                  setJoinFeedback(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-mono font-bold hover:opacity-90 transition-all shadow-xs"
              >
                Entrar na Equipe
              </button>
            </div>
          </form>
        </div>
      )}

      {isCreatingTeam && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded-2xl p-6 sm:p-8 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2.5">
              <Plus className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="text-base font-bold font-mono text-[var(--text-main)] uppercase">
                Criar Nova Equipe
              </h3>
            </div>
            <button
              onClick={() => setIsCreatingTeam(false)}
              className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                Nome da Equipe *
              </label>
              <input
                type="text"
                placeholder="Ex: Squad Frontend, Time Produto..."
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                required
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                Descrição (Opcional)
              </label>
              <textarea
                placeholder="Objetivo do time, projetos ou escopo..."
                value={newTeamDescription}
                onChange={e => setNewTeamDescription(e.target.value)}
                rows={3}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsCreatingTeam(false)}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-mono font-bold hover:opacity-90 transition-all shadow-xs"
              >
                Criar Equipe
              </button>
            </div>
          </form>
        </div>
      )}

      {delegatingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-[var(--accent)]" />
                <div>
                  <h3 className="text-base font-bold font-mono text-[var(--text-main)] uppercase">
                    Atribuir Tarefa
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-dim)]">
                    Para: <strong className="text-[var(--text-main)]">{delegatingMember.name}</strong> ({delegatingMember.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDelegatingMember(null)}
                className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)] text-xs font-mono">
              <button
                type="button"
                onClick={() => setDelegationMode("new")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                  delegationMode === "new"
                    ? "bg-[var(--accent)] text-[var(--accent-text)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                Criar Nova Tarefa
              </button>
              <button
                type="button"
                onClick={() => setDelegationMode("existing")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                  delegationMode === "existing"
                    ? "bg-[var(--accent)] text-[var(--accent-text)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                Vincular Tarefa Existente
              </button>
            </div>

            <form onSubmit={handleDelegateSubmit} className="space-y-4">
              {delegationMode === "new" ? (
                <>
                  <div>
                    <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                      Título da Tarefa *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Implementar endpoint de autenticação..."
                      value={delegatedTaskTitle}
                      onChange={e => setDelegatedTaskTitle(e.target.value)}
                      required
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                        Prioridade
                      </label>
                      <select
                        value={delegatedTaskPriority}
                        onChange={e => setDelegatedTaskPriority(e.target.value as TaskPriority)}
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                        Pomodoros Estimados
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={delegatedTaskPomodoros}
                        onChange={e => setDelegatedTaskPomodoros(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                      Tags (separadas por espaço)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: backend feature urgente"
                      value={delegatedTaskTags}
                      onChange={e => setDelegatedTaskTags(e.target.value)}
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                    Selecione a Tarefa da Equipe *
                  </label>
                  {unassignedTasks.length === 0 ? (
                    <p className="text-xs font-mono text-[var(--text-dim)] py-3">
                      Nenhuma tarefa pendente não atribuída encontrada. Escolha a opção &quot;Criar Nova Tarefa&quot; acima.
                    </p>
                  ) : (
                    <select
                      value={selectedExistingTaskId}
                      onChange={e => setSelectedExistingTaskId(e.target.value)}
                      required
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="">Selecione uma tarefa...</option>
                      {unassignedTasks.map(t => (
                        <option key={t.id} value={t.id}>
                          [{t.priority.toUpperCase()}] {t.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setDelegatingMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-mono font-bold hover:opacity-90 transition-all shadow-xs"
                >
                  Confirmar Atribuição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInvitingMember && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded-2xl p-6 sm:p-8 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="text-base font-bold font-mono text-[var(--text-main)] uppercase">
                Convidar Membro para a Equipe
              </h3>
            </div>
            <button
              onClick={() => setIsInvitingMember(false)}
              className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 pb-6 border-b border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-[var(--text-dim)] font-semibold">
                Buscar usuários cadastrados no Clerk:
              </span>
              <button
                type="button"
                onClick={handleSyncClerk}
                disabled={isSyncingClerk}
                className="flex items-center gap-1.5 text-xs font-mono text-[var(--accent)] hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingClerk ? "animate-spin" : ""}`} />
                <span>{isSyncingClerk ? "Sincronizando..." : "Puxar do Clerk"}</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={searchUserQuery}
                onChange={e => setSearchUserQuery(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {isSearchingUsers && (
              <div className="text-xs font-mono text-[var(--text-dim)] animate-pulse">
                Buscando usuários...
              </div>
            )}

            {syncFeedback && (
              <div className="p-2.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-mono border border-[var(--accent)]/30">
                {syncFeedback}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-xl bg-[var(--bg-main)]">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProfile(p)}
                    className="w-full flex items-center justify-between p-2.5 text-left text-xs font-mono hover:bg-[var(--bg-card)] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-[var(--text-main)]">{p.name}</div>
                      <div className="text-[var(--text-dim)]">{p.email}</div>
                    </div>
                    <span className="text-[var(--accent)] font-semibold">Selecionar</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                  Nome do Membro *
                </label>
                <input
                  type="text"
                  placeholder="Nome completo..."
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  required
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                  E-mail do Membro *
                </label>
                <input
                  type="email"
                  placeholder="membro@exemplo.com"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  required
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                Papel na Equipe
              </label>
              <select
                value={newMemberRole}
                onChange={e => setNewMemberRole(e.target.value as TeamRole)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="member">Membro (Pode ver tarefas e focar em ciclos)</option>
                <option value="admin">Administrador (Pode convidar, gerenciar e delegar tarefas)</option>
                <option value="owner">Líder (Acesso total)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsInvitingMember(false)}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-mono font-bold hover:opacity-90 transition-all shadow-xs"
              >
                Adicionar Membro
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTeam && teamTab === "members" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-[var(--text-dim)] font-semibold">
                  Membros
                </span>
                <Users className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
                {activeTeam.members.length}
              </div>
              <div className="text-xs text-[var(--text-dim)] font-mono mt-1">
                Colaboradores no workspace
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-[var(--text-dim)] font-semibold">
                  Tarefas Delegadas
                </span>
                <ListTodo className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
                {teamTasks.filter(t => t.assigneeName).length} tarefas
              </div>
              <div className="text-xs text-[var(--text-dim)] font-mono mt-1">
                {teamTasks.filter(t => t.assigneeName && !t.completed).length} pendentes de entrega
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-[var(--text-dim)] font-semibold">
                  Status de Foco
                </span>
                <UserCheck className="w-4 h-4 text-[var(--warning)]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
                {activeTeam.members.filter(m => m.status === "focusing").length} em foco
              </div>
              <div className="text-xs text-[var(--text-dim)] font-mono mt-1">
                {activeTeam.members.filter(m => m.status === "active").length} disponíveis agora
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="text-base font-bold font-mono text-[var(--text-main)] uppercase">
                  Membros da Equipe ({filteredMembers.length})
                </h3>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar membro..."
                  value={searchMember}
                  onChange={e => setSearchMember(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-xl overflow-hidden">
              {filteredMembers.map(member => {
                const initials = member.name
                  .split(/\s+/)
                  .map(n => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const mTasks = getMemberTasks(member);
                const pendingTasks = mTasks.filter(t => !t.completed).length;

                return (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--bg-main)] hover:bg-[var(--bg-card)] transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center font-mono font-bold text-sm text-[var(--accent)] shadow-xs">
                        {initials}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-[var(--text-main)]">
                            {member.name}
                          </span>
                          {getRoleBadge(member.role)}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-dim)]">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {member.email}
                          </span>
                          <span>•</span>
                          <span className="text-[var(--text-muted)] font-semibold">
                            {pendingTasks} tarefa{pendingTasks === 1 ? "" : "s"} ativa{pendingTasks === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(member.status)}

                      {isLeaderOrAdmin && (
                        <button
                          onClick={() => {
                            setDelegatingMember(member);
                            setDelegationMode("new");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-[var(--accent-text)] border border-[var(--accent)]/30 text-xs font-mono font-semibold transition-all shadow-xs"
                          title={`Atribuir nova tarefa para ${member.name}`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Atribuir Tarefa</span>
                        </button>
                      )}

                      <div className="relative">
                        {member.role !== "owner" && isLeaderOrAdmin && (
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={e => onUpdateMemberRole(activeTeam.id, member.id, e.target.value as TeamRole)}
                              className="bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-mono px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                            >
                              <option value="member">Membro</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Líder</option>
                            </select>

                            <button
                              onClick={() => onRemoveMember(activeTeam.id, member.id)}
                              className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                              title="Remover membro da equipe"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredMembers.length === 0 && (
                <div className="p-8 text-center text-xs font-mono text-[var(--text-dim)]">
                  Nenhum membro encontrado com esse termo de busca.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)] text-xs font-mono text-[var(--text-dim)]">
              <span>ID da Equipe: <code className="text-[var(--text-main)]">{activeTeam.id}</code></span>
              {isLeaderOrAdmin && (
                <button
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja excluir a equipe "${activeTeam.name}"?`)) {
                      onDeleteTeam(activeTeam.id);
                    }
                  }}
                  className="flex items-center gap-1.5 text-[var(--danger)] hover:opacity-80 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Equipe</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {activeTeam && teamTab === "board" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTeam.members.map(member => {
              const mTasks = getMemberTasks(member);
              const done = mTasks.filter(t => t.completed);

              return (
                <div
                  key={member.id}
                  className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[var(--text-main)]">
                            {member.name}
                          </span>
                          {getRoleBadge(member.role)}
                        </div>
                        <span className="text-xs font-mono text-[var(--text-dim)]">{member.email}</span>
                      </div>
                      {isLeaderOrAdmin && (
                        <button
                          onClick={() => {
                            setDelegatingMember(member);
                            setDelegationMode("new");
                          }}
                          className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-text)] transition-colors"
                          title="Atribuir tarefa"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase text-[var(--text-dim)] font-bold flex items-center justify-between">
                        <span>Tarefas ({mTasks.length})</span>
                        <span>{done.length}/{mTasks.length} concluídas</span>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {mTasks.map(t => (
                          <div
                            key={t.id}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-mono"
                          >
                            {onToggleTask && (
                              <button
                                onClick={() => onToggleTask(t.id)}
                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  t.completed
                                    ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)]"
                                    : "border-[var(--border-focus)] text-transparent"
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </button>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className={`truncate ${t.completed ? "line-through text-[var(--text-dim)]" : "text-[var(--text-main)] font-semibold"}`}>
                                {t.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-dim)]">
                                <span>🍅 {t.completedPomodoros}/{t.estimatedPomodoros}</span>
                                {t.assignedByName && <span>(por {t.assignedByName})</span>}
                              </div>
                            </div>

                            {isLeaderOrAdmin && onAssignTask && (
                              <button
                                onClick={() => onAssignTask(t.id, null)}
                                className="p-1 text-[var(--text-dim)] hover:text-[var(--danger)] transition-colors shrink-0"
                                title="Desatribuir tarefa"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}

                        {mTasks.length === 0 && (
                          <div className="p-4 text-center text-xs font-mono text-[var(--text-dim)] border border-dashed border-[var(--border-color)] rounded-xl">
                            Nenhuma tarefa atribuída a este membro.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isLeaderOrAdmin && (
                    <button
                      onClick={() => {
                        setDelegatingMember(member);
                        setDelegationMode("new");
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Atribuir Tarefa</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {unassignedTasks.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-[var(--warning)]" />
                  <h3 className="text-sm font-bold font-mono text-[var(--text-main)] uppercase">
                    Tarefas Não Atribuídas ({unassignedTasks.length})
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedTasks.map(t => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-[var(--text-main)]">{t.title}</div>
                      <div className="text-[var(--text-dim)] text-[10px]">
                        Prioridade: {t.priority.toUpperCase()} | Pomodoros: {t.estimatedPomodoros}
                      </div>
                    </div>

                    {isLeaderOrAdmin && onAssignTask && activeTeam.members.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                        <span className="text-[10px] text-[var(--text-dim)]">Delegar:</span>
                        <select
                          onChange={e => {
                            const m = activeTeam.members.find(mem => mem.id === e.target.value);
                            if (m) onAssignTask(t.id, m);
                          }}
                          defaultValue=""
                          className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-[11px] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                        >
                          <option value="" disabled>Escolher membro...</option>
                          {activeTeam.members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
