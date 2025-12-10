"use client";

import {
  Calendar,
  Edit2,
  Check,
  X,
  FileText,
  Terminal,
  Image,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "../../../utils/supabase/client";

export default function NoteCard({ note }: { note: any }) {
  const supabase = createClient();

  // State for Title Editing
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title || "Untitled Note");
  const [tempTitle, setTempTitle] = useState(title);
  const [loading, setLoading] = useState(false);

  // Save the new title to Supabase
  const handleSave = async () => {
    if (!tempTitle.trim()) return;
    setLoading(true);

    const { error } = await supabase
      .from("notes")
      .update({ title: tempTitle })
      .eq("id", note.id);

    if (error) {
      alert("Failed to update title");
    } else {
      setTitle(tempTitle);
      setIsEditing(false);
    }
    setLoading(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setTempTitle(title);
    setIsEditing(false);
  };

  return (
    <div className="gradient-border-wrapper group h-full">
      <div className="gradient-border-content flex flex-col overflow-hidden relative">
        {/* --- VISUAL HEADER (Image or Icon) --- */}
        <div className="h-40 bg-black relative border-b border-white/5 overflow-hidden group-hover:border-neon/20 transition-colors">
          {note.image_url ? (
            <>
              {/* IMAGE MODE */}
              <div className="absolute inset-0 bg-zinc-900/50 group-hover:bg-transparent transition-all duration-700 z-10" />
              <img
                src={note.image_url}
                alt="Note Visual"
                className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-105"
              />
              <div className="absolute bottom-2 right-2 z-20 bg-black/80 border border-neon/20 px-2 py-1 rounded flex items-center gap-1 text-[10px] text-neon font-mono uppercase tracking-widest shadow-lg">
                <Image size={10} color="#11fa57" /> IMAGE
              </div>
            </>
          ) : (
            <>
              {/* TEXT MODE */}
              <div className="w-full h-full bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(#3f3f46 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                ></div>
                {/* Visual Noise / Text Preview in Background */}
                <div className="absolute inset-0 p-4 opacity-10 text-[8px] font-mono leading-tight text-neon overflow-hidden select-none pointer-events-none whitespace-pre-wrap break-all">
                  {note.transcription || "NO PREVIEW AVAILABLE"}
                </div>
                <div className="relative z-10 w-16 h-16 rounded-full bg-zinc-900/80 border border-neon/30 flex items-center justify-center shadow-[0_0_30px_rgba(204,255,0,0.1)] group-hover:scale-110 transition-transform duration-500">
                  <FileText className="text-neon" size={24} />
                </div>
                <div className="absolute bottom-2 right-2 z-20 bg-black/80 border border-neon/20 px-2 py-1 rounded flex items-center gap-1 text-[10px] text-neon font-mono uppercase tracking-widest shadow-lg">
                  <Terminal size={10} color="#fe7097" /> TEXT NOTE
                </div>
              </div>
            </>
          )}

          {/* DATE BADGE */}
          <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded flex items-center gap-2 text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
            <Calendar size={10} />
            <span>{new Date(note.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* --- CONTENT BODY --- */}
        <div className="p-5 flex flex-col flex-grow bg-zinc-950/50">
          {/* 1. TITLE SECTION (Editable) */}
          <div className="mb-3 min-h-[32px] flex items-center justify-between gap-2">
            {isEditing ? (
              // EDIT MODE INPUT
              <div className="flex items-center gap-2 w-full animate-in fade-in duration-200">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-neon/50 rounded p-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon font-bold tracking-wide"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="text-neon hover:text-white transition-colors"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancel}
                  className="text-red-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              // VIEW MODE HEADER
              <div className="flex items-center justify-between w-full group/title">
                <h3
                  className="text-white font-bold text-lg tracking-wide line-clamp-1"
                  title={title}
                >
                  {title}
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-zinc-600 hover:text-neon opacity-0 group-hover/title:opacity-100 transition-all duration-200"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* 2. SUMMARY */}
          <p className="text-zinc-400 text-xs font-light leading-relaxed line-clamp-3 mb-6 flex-grow group-hover:text-zinc-200 transition-colors">
            {note.summary}
          </p>

          {/* 3. TAGS */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {note.tags?.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-neon/70 border border-neon/20 px-2 py-1 rounded bg-neon/5 tracking-wide"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
