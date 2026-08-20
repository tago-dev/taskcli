'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateId, playAudioFeedback } from "../lib/utils";
import { AppNotification, NotificationType, ViewTab } from "../types";

export interface ActiveToast extends AppNotification {
  duration?: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("taskcli_notifications");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem("taskcli_notifications", JSON.stringify(notifications));
    } catch {
      return;
    }
  }, [notifications]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addNotification = useCallback((
    title: string,
    message: string,
    type: NotificationType = "info",
    options?: { linkTab?: ViewTab; showToast?: boolean; duration?: number }
  ) => {
    const showToast = options?.showToast !== false;
    const newNotif: AppNotification = {
      id: generateId(),
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
      linkTab: options?.linkTab,
    };

    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);

    if (showToast) {
      const newToast: ActiveToast = {
        ...newNotif,
        duration: options?.duration || 4500,
      };
      setToasts(prev => [newToast, ...prev.slice(0, 4)]);
      playAudioFeedback("success");
    }

    return newNotif;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return {
    notifications,
    toasts,
    unreadCount,
    addNotification,
    dismissToast,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };
}
