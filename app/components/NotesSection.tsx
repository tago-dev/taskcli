'use client';

import {
  FileText,
  Pin,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { formatDate } from "../lib/utils";
import { Note } from "../types";

interface NotesSectionProps {
  notes: Note[];
  filteredNotes: Note[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string | "all";
  setSelectedTag: (tag: string | "all") => void;
  allTags: string[];
  onAddNote: (title: string, content: string, tags: string[], pinned: boolean) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onRemoveNote: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function NotesSection({
  notes,
  filteredNotes,
  searchQuery,
  setSearchQuery,
  selectedTag,
  setSelectedTag,
  allTags,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onTogglePin,
}: NotesSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim()) return;

    const tags = tagsInput
      .split(/[\s,]+/)
      .map(t => t.replace("#", "").trim())
      .filter(Boolean);

    if (editingNoteId) {
      onUpdateNote(editingNoteId, {
        title: title.trim() || "Sem título",
        content: content.trim(),
        tags,
        pinned: isPinned,
      });
      setEditingNoteId(null);
    } else {
      onAddNote(title.trim() || "Nota", content.trim(), tags, isPinned);
    }

    setTitle("");
    setContent("");
    setTagsInput("");
    setIsPinned(false);
    setIsCreating(false);
  };

  const startEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTagsInput(note.tags.join(" "));
    setIsPinned(note.pinned);
    setIsCreating(true);
  };

  return (
    <div className="flex flex-col gap-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-bold font-mono text-[var(--text-main)] uppercase">
            Anotações Rápidas ({notes.length})
          </h2>
        </div>

        {!isCreating && (
          <button
            onClick={() => {
              setEditingNoteId(null);
              setTitle("");
              setContent("");
              setTagsInput("");
              setIsPinned(false);
              setIsCreating(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] text-xs sm:text-sm font-bold rounded-xl hover:opacity-90 transition-all font-mono shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Nota</span>
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-6 bg-[var(--bg-card)] rounded-xl border border-[var(--border-focus)] shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título da anotação..."
              className="flex-1 bg-transparent border-b border-[var(--border-color)] pb-2 text-base sm:text-lg font-bold text-[var(--text-main)] outline-none placeholder-[var(--text-dim)]"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-lg transition-colors ${
                isPinned
                  ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-xs"
                  : "text-[var(--text-dim)] hover:bg-[var(--bg-main)]"
              }`}
              title={isPinned ? "Fixada no topo" : "Fixar nota"}
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Digite o conteúdo ou ideias da nota..."
            rows={5}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3 text-xs sm:text-sm text-[var(--text-main)] outline-none resize-none font-mono placeholder-[var(--text-dim)] leading-relaxed"
          />

          <div className="flex items-center gap-2.5">
            <Tag className="w-4 h-4 text-[var(--text-dim)]" />
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="Tags separadas por espaço (ex: brainstorm projeto)"
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[var(--text-main)] outline-none placeholder-[var(--text-dim)] font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingNoteId(null);
              }}
              className="px-4 py-2 text-xs sm:text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] text-xs sm:text-sm font-bold rounded-lg hover:opacity-90 font-mono shadow-xs"
            >
              {editingNoteId ? "Salvar Alterações" : "Criar Nota"}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs sm:text-sm flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--text-dim)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar nas anotações..."
            className="bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-dim)] w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-4 h-4 text-[var(--text-dim)]" />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[var(--text-main)] outline-none font-mono"
          >
            <option value="all">Todas as Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-1">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[var(--text-dim)] font-mono text-sm border border-dashed border-[var(--border-color)] rounded-xl p-6">
            Nenhuma anotação encontrada. Crie uma nota ou use <code className="text-[var(--accent)] font-bold">note [texto]</code> no terminal.
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => startEdit(note)}
              className={`group flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                note.pinned
                  ? "bg-[var(--bg-card)] border-[var(--accent)]/60 shadow-xs ring-1 ring-[var(--accent)]/20"
                  : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-focus)]"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] leading-snug flex items-center gap-2 min-w-0">
                    {note.pinned && <Pin className="w-4 h-4 text-[var(--accent)] shrink-0 fill-current" />}
                    <span className="truncate">{note.title}</span>
                  </h3>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onTogglePin(note.id);
                      }}
                      className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--bg-main)]"
                      title={note.pinned ? "Desafixar" : "Fixar no topo"}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.pinned ? "text-[var(--accent)] fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRemoveNote(note.id);
                      }}
                      className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                      title="Excluir nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-muted)] whitespace-pre-wrap line-clamp-4 font-mono leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--border-color)]/70 text-xs font-mono text-[var(--text-dim)] flex-wrap">
                <span>{formatDate(note.updatedAt)}</span>
                <div className="flex flex-wrap gap-1.5">
                  {note.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
