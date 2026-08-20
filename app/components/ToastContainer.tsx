'use client';

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  Timer,
  Users,
  X,
} from "lucide-react";
import React, { useEffect } from "react";
import { ActiveToast } from "../hooks/useNotifications";
import { NotificationType, ViewTab } from "../types";

interface ToastContainerProps {
  toasts: ActiveToast[];
  onDismiss: (id: string) => void;
  onNavigate?: (tab: ViewTab) => void;
}

function ToastItem({
  toast,
  onDismiss,
  onNavigate,
}: {
  toast: ActiveToast;
  onDismiss: (id: string) => void;
  onNavigate?: (tab: ViewTab) => void;
}) {
  useEffect(() => {
    const duration = toast.duration || 4500;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "team":
        return <Users className="w-4 h-4 text-blue-400" />;
      case "task":
        return <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />;
      case "pomodoro":
        return <Timer className="w-4 h-4 text-[var(--warning)]" />;
      case "success":
        return <Check className="w-4 h-4 text-[var(--accent)]" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-[var(--danger)]" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-[var(--text-dim)]" />;
    }
  };

  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case "team":
        return "border-blue-500/40 bg-[var(--bg-card)] shadow-blue-500/5";
      case "task":
      case "success":
        return "border-[var(--accent)]/40 bg-[var(--bg-card)] shadow-[var(--accent)]/5";
      case "pomodoro":
        return "border-[var(--warning)]/40 bg-[var(--bg-card)] shadow-[var(--warning)]/5";
      case "warning":
        return "border-[var(--danger)]/40 bg-[var(--bg-card)] shadow-[var(--danger)]/5";
      case "info":
      default:
        return "border-[var(--border-color)] bg-[var(--bg-card)]";
    }
  };

  return (
    <div
      className={`relative w-80 sm:w-96 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5 duration-200 font-mono ${getBorderColor(
        toast.type
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] shrink-0">
          {getIcon(toast.type)}
        </div>

        <div className="flex-1 space-y-1 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-[var(--text-main)] truncate uppercase tracking-wide">
              {toast.title}
            </h4>
            <span className="text-[10px] text-[var(--text-dim)] shrink-0">Agora</span>
          </div>

          <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            {toast.message}
          </p>

          {toast.linkTab && onNavigate && (
            <button
              onClick={() => {
                onNavigate(toast.linkTab!);
                onDismiss(toast.id);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] font-semibold hover:underline pt-1"
            >
              <span>Ver detalhes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss, onNavigate }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-auto max-w-[calc(100vw-2.5rem)]">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
