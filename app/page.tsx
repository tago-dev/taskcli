'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { Header } from "./components/Header";
import { NotesSection } from "./components/NotesSection";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { TaskList } from "./components/TaskList";
import { TeamSection } from "./components/TeamSection";
import { TerminalPrompt } from "./components/TerminalPrompt";
import { useCli } from "./hooks/useCli";
import { useNotes } from "./hooks/useNotes";
import { usePomodoro } from "./hooks/usePomodoro";
import { useTasks } from "./hooks/useTasks";
import { useTeams } from "./hooks/useTeams";
import { useTheme } from "./hooks/useTheme";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { bulkSyncToSupabase, syncUserProfileToSupabase } from "./lib/supabaseDb";
import { ViewTab } from "./types";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<ViewTab>("all");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);

  const { user, isLoaded: userLoaded } = useUser();
  const userId = user?.id || null;
  const userName = user?.fullName || user?.firstName || null;
  const userEmail = user?.primaryEmailAddress?.emailAddress || null;
  const userAvatar = user?.imageUrl || undefined;

  const { theme, changeTheme, cycleTheme, mounted: themeMounted } = useTheme();

  const {
    tasks,
    filteredTasks,
    filter,
    setFilter,
    searchQuery: taskSearch,
    setSearchQuery: setTaskSearch,
    priorityFilter,
    setPriorityFilter,
    selectedTag: taskSelectedTag,
    setSelectedTag: setTaskSelectedTag,
    assignmentFilter,
    setAssignmentFilter,
    selectedAssignee,
    setSelectedAssignee,
    allTags: taskTags,
    stats,
    addTask,
    assignTask,
    toggleTask,
    removeTask,
    updateTask,
    incrementPomodoro,
    clearCompleted,
    clearAll: clearAllTasks,
    loadFromSupabase: loadTasksFromSupabase,
    mounted: tasksMounted,
  } = useTasks(userId, userEmail);

  const {
    notes,
    filteredNotes,
    searchQuery: noteSearch,
    setSearchQuery: setNoteSearch,
    selectedTag: noteSelectedTag,
    setSelectedTag: setNoteSelectedTag,
    allTags: noteTags,
    addNote,
    updateNote,
    removeNote,
    togglePinNote,
    loadFromSupabase: loadNotesFromSupabase,
    mounted: notesMounted,
  } = useNotes(userId);

  const {
    teams,
    activeTeam,
    currentUserRole,
    isLeaderOrAdmin,
    setActiveTeamId,
    createTeam,
    joinTeamByCode,
    searchProfiles,
    syncClerkUsers,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    updateMemberRole,
    loadFromSupabase: loadTeamsFromSupabase,
    mounted: teamsMounted,
  } = useTeams(userId, userName, userEmail);

  useEffect(() => {
    if (userId && isSupabaseConfigured) {
      syncUserProfileToSupabase({
        id: userId,
        name: userName || "Usuário TaskCli",
        email: userEmail || "",
        avatarUrl: userAvatar,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      syncClerkUsers();
      loadTasksFromSupabase(userId, teams.map(t => t.id), userEmail);
      loadNotesFromSupabase(userId);
      loadTeamsFromSupabase(userId, userEmail);
    }
  }, [userId, userName, userEmail, userAvatar, syncClerkUsers, loadTasksFromSupabase, loadNotesFromSupabase, loadTeamsFromSupabase, teams]);

  const handleManualSync = async (): Promise<boolean> => {
    if (!userId || !isSupabaseConfigured) return false;
    return await bulkSyncToSupabase(tasks, notes, userId);
  };

  const pomodoro = usePomodoro(taskId => {
    if (taskId) {
      incrementPomodoro(taskId);
    }
  });

  const {
    history,
    commandHistoryList,
    executeCommand,
    clearTerminal,
  } = useCli({
    tasks,
    notes,
    teams,
    activeTeam,
    isLoggedIn: Boolean(userId),
    userId,
    userName,
    userEmail,
    currentUserRole,
    isLeaderOrAdmin,
    createTeam,
    joinTeamByCode,
    searchProfiles,
    syncClerkUsers,
    addTeamMember: addMember,
    removeTeamMember: removeMember,
    switchTeam: setActiveTeamId,
    addTask,
    assignTask,
    toggleTask,
    removeTask,
    clearCompleted,
    clearAllTasks,
    addNote,
    removeNote,
    onSync: handleManualSync,
    pomodoro: {
      start: pomodoro.start,
      pause: pomodoro.pause,
      reset: pomodoro.reset,
      switchMode: pomodoro.switchMode,
      setCustomMinutes: pomodoro.setCustomMinutes,
      isRunning: pomodoro.isRunning,
      mode: pomodoro.mode,
      timeLeft: pomodoro.timeLeft,
      sessionsCompleted: pomodoro.sessionsCompleted,
    },
    changeTheme,
    cycleTheme,
  });

  const activeTask = tasks.find(t => t.id === pomodoro.activeTaskId) || null;

  const isLoaded = themeMounted && tasksMounted && notesMounted && teamsMounted && pomodoro.mounted && userLoaded;

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[var(--bg-main)] text-[var(--accent)] font-mono text-base">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[var(--accent)] animate-ping" />
          <span>taskcli: inicializando ambiente...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] font-sans antialiased">
      <Header
        currentTab={currentTab}
        setTab={setCurrentTab}
        theme={theme}
        onCycleTheme={cycleTheme}
        completedTasks={stats.completed}
        totalTasks={stats.total}
        pomodoroSessions={pomodoro.sessionsCompleted}
        onOpenHelp={() => setIsCommandPaletteOpen(true)}
        isCloudSyncActive={Boolean(userId && isSupabaseConfigured)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
        {currentTab === "all" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-8">
              <PomodoroTimer
                mode={pomodoro.mode}
                timeLeft={pomodoro.timeLeft}
                totalSeconds={pomodoro.totalSeconds}
                isRunning={pomodoro.isRunning}
                progress={pomodoro.progress}
                sessionsCompleted={pomodoro.sessionsCompleted}
                activeTask={activeTask}
                settings={pomodoro.settings}
                onToggle={pomodoro.toggle}
                onReset={pomodoro.reset}
                onSwitchMode={pomodoro.switchMode}
                onSetCustomMinutes={pomodoro.setCustomMinutes}
                onToggleSound={() =>
                  pomodoro.updateSettings({ soundEnabled: !pomodoro.settings.soundEnabled })
                }
                onClearActiveTask={() => pomodoro.setActiveTaskId(null)}
              />

              <TerminalPrompt
                history={history}
                commandHistoryList={commandHistoryList}
                onExecute={executeCommand}
                onClear={clearTerminal}
                isExpanded={isTerminalExpanded}
                onToggleExpand={() => setIsTerminalExpanded(!isTerminalExpanded)}
              />
            </div>

            <div className="lg:col-span-7 space-y-8">
              <TaskList
                tasks={tasks}
                filteredTasks={filteredTasks}
                filter={filter}
                setFilter={setFilter}
                searchQuery={taskSearch}
                setSearchQuery={setTaskSearch}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                selectedTag={taskSelectedTag}
                setSelectedTag={setTaskSelectedTag}
                allTags={taskTags}
                teamMembers={activeTeam?.members || []}
                isLeaderOrAdmin={isLeaderOrAdmin}
                currentUserId={userId}
                currentUserEmail={userEmail}
                currentUserName={userName}
                activeTeamId={activeTeam?.id || null}
                assignmentFilter={assignmentFilter}
                setAssignmentFilter={setAssignmentFilter}
                selectedAssignee={selectedAssignee}
                setSelectedAssignee={setSelectedAssignee}
                activePomodoroTaskId={pomodoro.activeTaskId}
                onAddTask={(title, priority, tags, pomos, options) =>
                  addTask(title, priority, tags, pomos, options)
                }
                onAssignTask={assignTask}
                onToggleTask={toggleTask}
                onRemoveTask={removeTask}
                onUpdateTask={updateTask}
                onSelectForPomodoro={id =>
                  pomodoro.setActiveTaskId(pomodoro.activeTaskId === id ? null : id)
                }
                onClearCompleted={clearCompleted}
              />

              <NotesSection
                notes={notes}
                filteredNotes={filteredNotes}
                searchQuery={noteSearch}
                setSearchQuery={setNoteSearch}
                selectedTag={noteSelectedTag}
                setSelectedTag={setNoteSelectedTag}
                allTags={noteTags}
                onAddNote={addNote}
                onUpdateNote={updateNote}
                onRemoveNote={removeNote}
                onTogglePin={togglePinNote}
              />
            </div>
          </div>
        )}

        {currentTab === "tasks" && (
          <div className="max-w-4xl mx-auto space-y-8">
            {activeTask && (
              <PomodoroTimer
                mode={pomodoro.mode}
                timeLeft={pomodoro.timeLeft}
                totalSeconds={pomodoro.totalSeconds}
                isRunning={pomodoro.isRunning}
                progress={pomodoro.progress}
                sessionsCompleted={pomodoro.sessionsCompleted}
                activeTask={activeTask}
                settings={pomodoro.settings}
                onToggle={pomodoro.toggle}
                onReset={pomodoro.reset}
                onSwitchMode={pomodoro.switchMode}
                onSetCustomMinutes={pomodoro.setCustomMinutes}
                onToggleSound={() =>
                  pomodoro.updateSettings({ soundEnabled: !pomodoro.settings.soundEnabled })
                }
                onClearActiveTask={() => pomodoro.setActiveTaskId(null)}
                isCompact
              />
            )}

            <TaskList
              tasks={tasks}
              filteredTasks={filteredTasks}
              filter={filter}
              setFilter={setFilter}
              searchQuery={taskSearch}
              setSearchQuery={setTaskSearch}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              selectedTag={taskSelectedTag}
              setSelectedTag={setTaskSelectedTag}
              allTags={taskTags}
              teamMembers={activeTeam?.members || []}
              isLeaderOrAdmin={isLeaderOrAdmin}
              currentUserId={userId}
              currentUserEmail={userEmail}
              currentUserName={userName}
              activeTeamId={activeTeam?.id || null}
              assignmentFilter={assignmentFilter}
              setAssignmentFilter={setAssignmentFilter}
              selectedAssignee={selectedAssignee}
              setSelectedAssignee={setSelectedAssignee}
              activePomodoroTaskId={pomodoro.activeTaskId}
              onAddTask={(title, priority, tags, pomos, options) =>
                addTask(title, priority, tags, pomos, options)
              }
              onAssignTask={assignTask}
              onToggleTask={toggleTask}
              onRemoveTask={removeTask}
              onUpdateTask={updateTask}
              onSelectForPomodoro={id =>
                pomodoro.setActiveTaskId(pomodoro.activeTaskId === id ? null : id)
              }
              onClearCompleted={clearCompleted}
            />
          </div>
        )}

        {currentTab === "notes" && (
          <div className="max-w-4xl mx-auto space-y-8">
            <NotesSection
              notes={notes}
              filteredNotes={filteredNotes}
              searchQuery={noteSearch}
              setSearchQuery={setNoteSearch}
              selectedTag={noteSelectedTag}
              setSelectedTag={setNoteSelectedTag}
              allTags={noteTags}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onRemoveNote={removeNote}
              onTogglePin={togglePinNote}
            />
          </div>
        )}

        {currentTab === "pomodoro" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <PomodoroTimer
              mode={pomodoro.mode}
              timeLeft={pomodoro.timeLeft}
              totalSeconds={pomodoro.totalSeconds}
              isRunning={pomodoro.isRunning}
              progress={pomodoro.progress}
              sessionsCompleted={pomodoro.sessionsCompleted}
              activeTask={activeTask}
              settings={pomodoro.settings}
              onToggle={pomodoro.toggle}
              onReset={pomodoro.reset}
              onSwitchMode={pomodoro.switchMode}
              onSetCustomMinutes={pomodoro.setCustomMinutes}
              onToggleSound={() =>
                pomodoro.updateSettings({ soundEnabled: !pomodoro.settings.soundEnabled })
              }
              onClearActiveTask={() => pomodoro.setActiveTaskId(null)}
            />

            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-mono font-bold text-[var(--text-dim)] uppercase mb-4 tracking-wide">
                Selecione uma tarefa para focar:
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto terminal-scroll">
                {tasks
                  .filter(t => !t.completed)
                  .map(task => (
                    <button
                      key={task.id}
                      onClick={() => pomodoro.setActiveTaskId(task.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left text-sm transition-all shadow-xs ${
                        task.id === pomodoro.activeTaskId
                          ? "bg-[var(--bg-card)] border-[var(--accent)] text-[var(--text-main)] font-semibold ring-1 ring-[var(--accent)]/30"
                          : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
                      }`}
                    >
                      <span className="truncate">{task.title}</span>
                      <span className="text-xs font-mono text-[var(--accent)] font-bold shrink-0 ml-3">
                        🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === "team" && (
          <div className="max-w-5xl mx-auto space-y-8">
            <TeamSection
              teams={teams}
              activeTeam={activeTeam}
              tasks={tasks}
              isLoggedIn={Boolean(userId)}
              currentUserRole={currentUserRole}
              isLeaderOrAdmin={isLeaderOrAdmin}
              currentUserId={userId}
              currentUserName={userName}
              onSelectTeam={setActiveTeamId}
              onCreateTeam={createTeam}
              onUpdateTeam={updateTeam}
              onDeleteTeam={deleteTeam}
              onAddMember={addMember}
              onRemoveMember={removeMember}
              onUpdateMemberRole={updateMemberRole}
              onAssignTask={assignTask}
              onAddTask={(title, priority, tags, pomos, options) =>
                addTask(title, priority, tags, pomos, options)
              }
              onToggleTask={toggleTask}
              onSearchProfiles={searchProfiles}
              onSyncClerkUsers={syncClerkUsers}
              onJoinTeamByCode={joinTeamByCode}
            />
          </div>
        )}

        {currentTab === "terminal" && (
          <div className="max-w-5xl mx-auto space-y-8">
            <TerminalPrompt
              history={history}
              commandHistoryList={commandHistoryList}
              onExecute={executeCommand}
              onClear={clearTerminal}
              isExpanded
            />
          </div>
        )}
      </main>

      <footer className="w-full border-t border-[var(--border-color)] bg-[var(--bg-surface)] py-4 px-6 text-center text-xs font-mono text-[var(--text-dim)] transition-colors mt-8">
        <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>TaskCli • Minimalist Productivity Terminal</span>
          <div className="flex items-center gap-4">
            <span>Pressione <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-xs">Ctrl+K</kbd> para comandos</span>
            <span>Tema: <strong className="text-[var(--text-main)] uppercase">{theme}</strong></span>
          </div>
        </div>
      </footer>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        currentTheme={theme}
        onSelectTheme={changeTheme}
        onRunCommand={executeCommand}
      />
    </div>
  );
}
