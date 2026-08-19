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
  Lock,
  LogIn,
  Mail,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { formatDate } from "../lib/utils";
import { Team, TeamMember, TeamRole } from "../types";

interface TeamSectionProps {
  teams: Team[];
  activeTeam: Team | null;
  isLoggedIn: boolean;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (name: string, description: string) => void;
  onUpdateTeam: (teamId: string, updates: Partial<Pick<Team, "name" | "description">>) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddMember: (teamId: string, name: string, email: string, role: TeamRole) => void;
  onRemoveMember: (teamId: string, memberId: string) => void;
  onUpdateMemberRole: (teamId: string, memberId: string, role: TeamRole) => void;
}

export function TeamSection({
  teams,
  activeTeam,
  isLoggedIn,
  onSelectTeam,
  onCreateTeam,
  onDeleteTeam,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
}: TeamSectionProps) {
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>("member");

  const [copiedCode, setCopiedCode] = useState(false);
  const [searchMember, setSearchMember] = useState("");

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

    onAddMember(activeTeam.id, newMemberName.trim(), newMemberEmail.trim(), newMemberRole);
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("member");
    setIsInvitingMember(false);
  };

  const handleCopyCode = () => {
    if (!activeTeam) return;
    navigator.clipboard.writeText(activeTeam.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredMembers = activeTeam?.members.filter(m => {
    if (!searchMember.trim()) return true;
    const q = searchMember.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  }) || [];

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
            Para criar uma equipe, convidar colegas e sincronizar ciclos de foco em tempo real, faça login na sua conta.
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

  if (teams.length === 0 && !isCreatingTeam) {
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
            Crie sua primeira equipe para colaborar em projetos, compartilhar tarefas e sincronizar ciclos de foco Pomodoro com seus colegas.
          </p>
        </div>
        <button
          onClick={() => setIsCreatingTeam(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] font-mono font-bold text-sm hover:opacity-90 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Primeira Equipe</span>
        </button>
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

        <div className="flex items-center gap-2.5">
          {activeTeam && (
            <button
              onClick={() => setIsInvitingMember(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs sm:text-sm font-mono font-semibold text-[var(--text-main)] transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-[var(--accent)]" />
              <span>Convidar Membro</span>
            </button>
          )}

          <button
            onClick={() => setIsCreatingTeam(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs sm:text-sm font-mono font-bold hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Equipe</span>
          </button>
        </div>
      </div>

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
                placeholder="Ex: Engenharia Frontend, Squad Alpha..."
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                required
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                Descrição ou Objetivo (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Foco no desenvolvimento da v2 e sprints semanais"
                value={newTeamDescription}
                onChange={e => setNewTeamDescription(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
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
                className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-mono font-bold hover:opacity-90 transition-opacity shadow-xs"
              >
                Salvar Equipe
              </button>
            </div>
          </form>
        </div>
      )}

      {isInvitingMember && activeTeam && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded-2xl p-6 sm:p-8 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="text-base font-bold font-mono text-[var(--text-main)] uppercase">
                Adicionar Membro à Equipe &quot;{activeTeam.name}&quot;
              </h3>
            </div>
            <button
              onClick={() => setIsInvitingMember(false)}
              className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                  Nome do Membro *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
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
                  placeholder="Ex: carlos@empresa.com"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  required
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-dim)] mb-1.5 font-semibold">
                Função / Permissão
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setNewMemberRole("member")}
                  className={`p-3 rounded-xl border text-left font-mono text-xs transition-all ${
                    newMemberRole === "member"
                      ? "bg-[var(--bg-card)] border-[var(--accent)] text-[var(--text-main)] font-semibold shadow-xs"
                      : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-dim)] hover:border-[var(--border-focus)]"
                  }`}
                >
                  <div className="font-bold text-[var(--text-main)] mb-0.5">Membro</div>
                  <div className="text-[11px] text-[var(--text-dim)]">Visualiza tarefas e participa de sessões</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewMemberRole("admin")}
                  className={`p-3 rounded-xl border text-left font-mono text-xs transition-all ${
                    newMemberRole === "admin"
                      ? "bg-[var(--bg-card)] border-[var(--accent)] text-[var(--text-main)] font-semibold shadow-xs"
                      : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-dim)] hover:border-[var(--border-focus)]"
                  }`}
                >
                  <div className="font-bold text-[var(--text-main)] mb-0.5">Admin</div>
                  <div className="text-[11px] text-[var(--text-dim)]">Gerencia tarefas e convida membros</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewMemberRole("owner")}
                  className={`p-3 rounded-xl border text-left font-mono text-xs transition-all ${
                    newMemberRole === "owner"
                      ? "bg-[var(--bg-card)] border-[var(--accent)] text-[var(--text-main)] font-semibold shadow-xs"
                      : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-dim)] hover:border-[var(--border-focus)]"
                  }`}
                >
                  <div className="font-bold text-[var(--text-main)] mb-0.5">Co-Líder</div>
                  <div className="text-[11px] text-[var(--text-dim)]">Controle total sobre a equipe</div>
                </button>
              </div>
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
                className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-mono font-bold hover:opacity-90 transition-opacity shadow-xs"
              >
                Adicionar Membro
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTeam && (
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
              Colaboradores ativos no workspace
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

          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-[var(--text-dim)] font-semibold">
                Criada Em
              </span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
              {formatDate(activeTeam.createdAt)}
            </div>
            <div className="text-xs text-[var(--text-dim)] font-mono mt-1 truncate">
              {activeTeam.description || "Sem descrição"}
            </div>
          </div>
        </div>
      )}

      {activeTeam && (
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
                      <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-dim)]">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(member.status)}

                    <div className="relative">
                      {member.role !== "owner" && (
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
          </div>
        </div>
      )}
    </div>
  );
}
