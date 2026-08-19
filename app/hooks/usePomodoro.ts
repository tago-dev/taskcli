'use client';

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getStoredPomodoroSettings,
  setStoredPomodoroSettings,
} from "../lib/storage";
import { playAudioFeedback } from "../lib/utils";
import { PomodoroMode, PomodoroSettings } from "../types";

export function usePomodoro(onFocusComplete?: (taskId: string | null) => void) {
  const [settings, setSettings] = useState<PomodoroSettings>(() => getStoredPomodoroSettings());
  const [mode, setModeState] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(() => getStoredPomodoroSettings().focusDuration);
  const [totalSeconds, setTotalSeconds] = useState<number>(() => getStoredPomodoroSettings().focusDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getDurationForMode = useCallback((m: PomodoroMode, currentSettings = settings): number => {
    switch (m) {
      case 'focus':
        return currentSettings.focusDuration;
      case 'shortBreak':
        return currentSettings.shortBreakDuration;
      case 'longBreak':
        return currentSettings.longBreakDuration;
    }
  }, [settings]);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setIsRunning(false);
    setModeState(newMode);
    const duration = getDurationForMode(newMode);
    setTimeLeft(duration);
    setTotalSeconds(duration);
    playAudioFeedback('click');
  }, [getDurationForMode]);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    if (settings.soundEnabled) {
      playAudioFeedback('alarm');
    }

    if (mode === 'focus') {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {
        // Fallback
      }

      setSessionsCompleted(prev => {
        const next = prev + 1;
        if (onFocusComplete) {
          onFocusComplete(activeTaskId);
        }
        const nextMode: PomodoroMode = next % 4 === 0 ? 'longBreak' : 'shortBreak';
        setTimeout(() => switchMode(nextMode), 500);
        return next;
      });
    } else {
      setTimeout(() => switchMode('focus'), 500);
    }
  }, [mode, settings.soundEnabled, onFocusComplete, activeTaskId, switchMode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, handleSessionComplete]);

  const start = () => {
    setIsRunning(true);
    playAudioFeedback('click');
  };

  const pause = () => {
    setIsRunning(false);
    playAudioFeedback('click');
  };

  const toggle = () => {
    if (isRunning) pause();
    else start();
  };

  const reset = () => {
    setIsRunning(false);
    const duration = getDurationForMode(mode);
    setTimeLeft(duration);
    setTotalSeconds(duration);
    playAudioFeedback('click');
  };

  const setCustomMinutes = (minutes: number) => {
    const seconds = Math.max(1, Math.min(180, minutes)) * 60;
    setIsRunning(false);
    setTimeLeft(seconds);
    setTotalSeconds(seconds);
    playAudioFeedback('click');
  };

  const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    setStoredPomodoroSettings(merged);
    if (!isRunning) {
      const duration = getDurationForMode(mode, merged);
      setTimeLeft(duration);
      setTotalSeconds(duration);
    }
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  return {
    mode,
    timeLeft,
    totalSeconds,
    isRunning,
    activeTaskId,
    sessionsCompleted,
    settings,
    progress,
    start,
    pause,
    toggle,
    reset,
    switchMode,
    setCustomMinutes,
    setActiveTaskId,
    updateSettings,
    mounted: true,
  };
}
