'use client';

import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  Info,
  Timer,
  Trash2,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { AppNotification, NotificationType, ViewTab } from "../types";

interface NotificationCenterProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemoveNotification: (id: string) => void;
  onClearAll: () => void;
  onNavigateTab?: (tab: ViewTab) => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemoveNotification,
  onClearAll,
  onNavigateTab,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "team":
        return <Users className="w-3.5 h-3.5 text-blue-400" />;
      case "task":
        return <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />;
      case "pomodoro":
        return <Timer className="w-3.5 h-3.5 text-[var(--warning)]" />;
      case "success":
        return <Check className="w-3.5 h-3.5 text-[var(--accent)]" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-[var(--danger)]" />;
      case "info":
      default:
        return <Info className="w-3.5 h-3.5 text-[var(--text-dim)]" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all ${
          isOpen
            ? "bg-[var(--bg-card)] border-[var(--accent)] text-[var(--text-main)] shadow-xs"
            : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]"
        }`}
        title="Notificações"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-mono font-bold flex items-center justify-center animate-pulse shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded-2xl shadow-2xl p-4 z-50 space-y-3 font-mono animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase text-[var(--text-main)] tracking-wider">
                Notificações
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-bold">
                  {unreadCount} novas
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-[10px] text-[var(--text-dim)] hover:text-[var(--accent)] flex items-center gap-1 transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Ler todas</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[10px] text-[var(--text-dim)] hover:text-[var(--danger)] flex items-center gap-1 transition-colors"
                  title="Limpar todas as notificações"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 terminal-scroll">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-dim)] space-y-1">
                <Bell className="w-6 h-6 mx-auto opacity-30 mb-2" />
                <p>Nenhuma notificação por enquanto.</p>
                <p className="text-[10px] text-[var(--text-dim)]">
                  Tarefas delegadas, atualizações de equipe e ciclos de Pomodoro aparecerão aqui.
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) onMarkAsRead(n.id);
                    if (n.linkTab && onNavigateTab) {
                      onNavigateTab(n.linkTab);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    n.read
                      ? "bg-[var(--bg-main)] border-[var(--border-color)] opacity-70 hover:opacity-100"
                      : "bg-[var(--bg-card)] border-[var(--accent)]/40 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <h4 className="text-xs font-bold text-[var(--text-main)] truncate">
                        {n.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-[var(--text-dim)]">
                        {formatTime(n.timestamp)}
                      </span>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    {n.linkTab ? (
                      <span className="inline-flex items-center gap-1 text-[var(--accent)] font-semibold">
                        <span>Acessar {n.linkTab.toUpperCase()}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span />
                    )}

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRemoveNotification(n.id);
                      }}
                      className="text-[var(--text-dim)] hover:text-[var(--danger)] p-0.5 rounded transition-colors"
                      title="Excluir notificação"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
