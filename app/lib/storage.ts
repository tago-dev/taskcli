import { Note, PomodoroSettings, PomodoroState, Task, Team, ThemeName } from "../types";

const STORAGE_KEYS = {
  TASKS: "taskcli_tasks",
  NOTES: "taskcli_notes",
  POMODORO_SETTINGS: "taskcli_pomodoro_settings",
  POMODORO_STATE: "taskcli_pomodoro_state",
  THEME: "taskcli_theme",
  TEAMS: "taskcli_teams",
  ACTIVE_TEAM_ID: "taskcli_active_team_id",
} as const;

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  soundEnabled: true,
  autoStartBreaks: false,
};

export const DEFAULT_POMODORO_STATE: PomodoroState = {
  mode: "focus",
  timeLeft: 25 * 60,
  isRunning: false,
  totalSeconds: 25 * 60,
  activeTaskId: null,
  sessionsCompleted: 0,
};

export function getStoredTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setStoredTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch {
    return;
  }
}

export function getStoredNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setStoredNotes(notes: Note[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch {
    return;
  }
}

export function getStoredTeams(): Team[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setStoredTeams(teams: Team[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  } catch {
    return;
  }
}

export function getStoredActiveTeamId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TEAM_ID);
  } catch {
    return null;
  }
}

export function setStoredActiveTeamId(teamId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (teamId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEAM_ID, teamId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TEAM_ID);
    }
  } catch {
    return;
  }
}

export function getStoredPomodoroSettings(): PomodoroSettings {
  if (typeof window === "undefined") return DEFAULT_POMODORO_SETTINGS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.POMODORO_SETTINGS);
    return data ? { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(data) } : DEFAULT_POMODORO_SETTINGS;
  } catch {
    return DEFAULT_POMODORO_SETTINGS;
  }
}

export function setStoredPomodoroSettings(settings: PomodoroSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(settings));
  } catch {
    return;
  }
}

export function getStoredTheme(): ThemeName {
  if (typeof window === "undefined") return "dark";
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeName;
    if (["dark", "light", "matrix", "dracula", "cyberpunk", "nord"].includes(theme)) {
      return theme;
    }
    return "dark";
  } catch {
    return "dark";
  }
}

export function setStoredTheme(theme: ThemeName): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    return;
  }
}

export function exportData(): string {
  if (typeof window === "undefined") return "{}";
  const tasks = getStoredTasks();
  const notes = getStoredNotes();
  const teams = getStoredTeams();
  const settings = getStoredPomodoroSettings();
  const theme = getStoredTheme();
  return JSON.stringify({ tasks, notes, teams, settings, theme, exportedAt: Date.now() }, null, 2);
}

export function importData(jsonString: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed.tasks)) setStoredTasks(parsed.tasks);
    if (Array.isArray(parsed.notes)) setStoredNotes(parsed.notes);
    if (Array.isArray(parsed.teams)) setStoredTeams(parsed.teams);
    if (parsed.settings) setStoredPomodoroSettings(parsed.settings);
    if (parsed.theme) setStoredTheme(parsed.theme);
    return true;
  } catch {
    return false;
  }
}
