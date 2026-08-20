export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  tags: string[];
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: number;
  completedAt?: number;
  teamId?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeAvatar?: string;
  assignedById?: string;
  assignedByName?: string;
  assignedAt?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  soundEnabled: boolean;
  autoStartBreaks: boolean;
}

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  totalSeconds: number;
  activeTaskId: string | null;
  sessionsCompleted: number;
}

export type ThemeName = 'dark' | 'light' | 'matrix' | 'dracula' | 'cyberpunk' | 'nord';

export type ViewTab = 'all' | 'tasks' | 'notes' | 'pomodoro' | 'terminal' | 'team';

export interface CommandHistoryItem {
  id: string;
  command: string;
  output: string[];
  type: 'success' | 'error' | 'info' | 'warn';
  timestamp: number;
}

export type TeamRole = 'owner' | 'admin' | 'member';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatarUrl?: string;
  joinedAt: number;
  status?: 'active' | 'focusing' | 'offline';
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  code: string;
  members: TeamMember[];
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
}

