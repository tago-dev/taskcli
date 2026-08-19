'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { setStoredNotes } from "../lib/storage";
import {
  createNoteInSupabase,
  deleteNoteInSupabase,
  fetchNotesFromSupabase,
  updateNoteInSupabase,
} from "../lib/supabaseDb";
import { generateId, playAudioFeedback } from "../lib/utils";
import { Note } from "../types";

const defaultInitialNotes: Note[] = [
  {
    id: "n1",
    title: "Ideias e Atalhos do TaskCli",
    content: "- Pressione Ctrl + K para abrir a paleta de comandos rápida.\n- Digite `pomodoro 25` no terminal para foco imediato.\n- Use `add Estudar React -p high #frontend` para criar tarefas estruturadas.",
    tags: ["dicas", "atalhos"],
    pinned: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: "n2",
    title: "Scratchpad de Estudos",
    content: "Anotações rápidas durante a sessão de foco. Lembre-se de fazer pausas ativas a cada ciclo de 25 minutos.",
    tags: ["estudos"],
    pinned: false,
    createdAt: 1700000001000,
    updatedAt: 1700000001000,
  }
];

let notesCache: Note[] | null = null;
let notesListeners: Array<() => void> = [];

function emitNotesChange() {
  notesListeners.forEach(listener => listener());
}

function subscribeToNotes(listener: () => void) {
  notesListeners.push(listener);
  return () => {
    notesListeners = notesListeners.filter(l => l !== listener);
  };
}

function getNotesSnapshot(): Note[] {
  if (typeof window === "undefined") return defaultInitialNotes;
  if (notesCache === null) {
    try {
      const data = localStorage.getItem("taskcli_notes");
      if (data) {
        notesCache = JSON.parse(data);
      } else {
        notesCache = defaultInitialNotes;
        setStoredNotes(defaultInitialNotes);
      }
    } catch {
      notesCache = defaultInitialNotes;
    }
  }
  return notesCache || defaultInitialNotes;
}

export function useNotes(userId?: string | null) {
  const notes = useSyncExternalStore(
    subscribeToNotes,
    getNotesSnapshot,
    () => defaultInitialNotes
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');

  const saveNotes = useCallback((newNotes: Note[]) => {
    notesCache = newNotes;
    setStoredNotes(newNotes);
    emitNotesChange();
  }, []);

  const loadFromSupabase = useCallback(async (uid: string) => {
    const remoteNotes = await fetchNotesFromSupabase(uid);
    if (remoteNotes !== null && remoteNotes.length > 0) {
      saveNotes(remoteNotes);
    }
  }, [saveNotes]);

  const addNote = (title: string, content: string, tags: string[] = [], pinned: boolean = false): Note => {
    const newNote: Note = {
      id: generateId(),
      title: title.trim() || "Sem título",
      content: content.trim(),
      tags: tags.map(t => t.toLowerCase().trim()).filter(Boolean),
      pinned,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newNote, ...notes];
    saveNotes(updated);
    playAudioFeedback('click');

    if (userId) {
      createNoteInSupabase(newNote, userId);
    }

    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Note | null => {
    let updatedNote: Note | null = null;
    const updated = notes.map(n => {
      if (n.id === id) {
        updatedNote = {
          ...n,
          ...updates,
          updatedAt: Date.now(),
        };
        return updatedNote;
      }
      return n;
    });

    if (updatedNote) {
      saveNotes(updated);
      playAudioFeedback('click');

      if (userId) {
        updateNoteInSupabase(id, updates, userId);
      }
    }
    return updatedNote;
  };

  const removeNote = (id: string): boolean => {
    const exists = notes.some(n => n.id === id);
    if (!exists) return false;
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
    playAudioFeedback('click');

    if (userId) {
      deleteNoteInSupabase(id, userId);
    }

    return true;
  };

  const togglePinNote = (id: string): Note | null => {
    let toggled: Note | null = null;
    const updated = notes.map(n => {
      if (n.id === id) {
        toggled = { ...n, pinned: !n.pinned, updatedAt: Date.now() };
        return toggled;
      }
      return n;
    });

    if (toggled) {
      saveNotes(updated);
      playAudioFeedback('click');

      if (userId) {
        updateNoteInSupabase(id, { pinned: (toggled as Note).pinned }, userId);
      }
    }
    return toggled;
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        if (selectedTag !== 'all' && !note.tags.includes(selectedTag)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchTag = note.tags.some(t => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTag) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, selectedTag, searchQuery]);

  return {
    notes,
    filteredNotes,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    addNote,
    updateNote,
    removeNote,
    togglePinNote,
    saveNotes,
    loadFromSupabase,
    mounted: true,
  };
}
