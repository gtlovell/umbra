"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { createClient } from "../../../utils/supabase/client";
import {
  Loader2,
  UploadCloud,
  Activity,
  Database,
  Share2,
  ArrowRight,
  PenTool,
  Image as ImageIcon,
  Save,
  ArrowLeft,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import NoteCard from "@/app/components/NoteCard";
import Sidebar from "@/app/components/Sidebar";
import CyberEditor from "@/app/components/CyberEditor";

const GraphView = dynamic(() => import("@/app/components/GraphView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full glass-panel rounded-xl animate-pulse flex items-center justify-center text-zinc-600 font-medium">
      Loading Graph...
    </div>
  ),
});

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState<any[]>([]);
  const [stats, setStats] = useState({ notes: 0, edges: 0 });
  const [graphKey, setGraphKey] = useState(0);
  const [viewMode, setViewMode] = useState<
    "home" | "graph" | "grid" | "chat" | "create"
  >("home");
  const [inputType, setInputType] = useState<"upload" | "write">("upload");
  const [textContent, setTextContent] = useState("");

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/");
        return;
      }
      setUser(user);
      fetchData(user.id);
    };
    init();
  }, [router]);

  const fetchData = async (userId: string) => {
    const { data: notesData, count: notesCount } = await supabase
      .from("notes")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { count: edgesCount } = await supabase
      .from("edges")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (notesData) setNotes(notesData);
    setStats({
      notes: notesCount || 0,
      edges: edgesCount || 0,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleViewChange = (newView: typeof viewMode) => {
    if (newView === "create") {
      setInputType("write");
      setTextContent("");
    }
    setViewMode(newView);
  };

  const handleNoteCreation = async (file?: File) => {
    setLoading(true);
    setStatus(inputType === "upload" ? "Uploading..." : "Processing text...");

    try {
      let publicUrl = null;
      let base64 = null;
      let mimeType = null;

      if (inputType === "upload" && file) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("notes")
          .upload(fileName, file);
        if (uploadError) throw new Error(uploadError.message);

        const urlData = supabase.storage.from("notes").getPublicUrl(fileName);
        publicUrl = urlData.data.publicUrl;

        base64 = await fileToBase64(file);
        mimeType = file.type;
      } else if (inputType === "write") {
        if (!textContent.trim()) {
          alert("Note content is empty.");
          setLoading(false);
          return;
        }
      }

      setStatus("Analyzing content...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mimeType,
          textContent: inputType === "write" ? textContent : null,
        }),
      });

      const aiData = await response.json();
      if (aiData.error) throw new Error(aiData.details || aiData.error);

      setStatus("Saving note...");

      const { data: insertedNote, error: dbError } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          title: aiData.title,
          transcription: aiData.transcription,
          summary: aiData.summary,
          tags: aiData.tags,
          embedding: aiData.embedding,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setStatus("Finding connections...");

      const { data: relatedNotes } = await supabase.rpc("match_notes", {
        query_embedding: aiData.embedding,
        match_threshold: 0.7,
        match_count: 5,
      });

      if (relatedNotes && relatedNotes.length > 0) {
        const edgesToInsert = relatedNotes
          .filter((n: any) => n.id !== insertedNote.id)
          .map((n: any) => ({
            user_id: user.id,
            source_note_id: insertedNote.id,
            target_note_id: n.id,
            similarity: n.similarity,
          }));
        await supabase.from("edges").insert(edgesToInsert);
      }

      setGraphKey((prev) => prev + 1);
      fetchData(user.id);
      setTextContent("");
      setStatus("Done");
      setViewMode("graph");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-neon/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

      <Sidebar
        view={viewMode}
        setView={handleViewChange}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 md:ml-64 min-h-screen transition-all z-10 relative overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-12 pb-24 md:pb-12">
          {/* 1. HOME VIEW */}
          {viewMode === "home" && (
            <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Home
                </h2>
                <p className="text-rose-300 font-medium text-sm mt-1">
                  Welcome back
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-xl border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Database className="text-neonyellow-600" size={20} />
                    <span className="text-xs font-bold text-zinc-700 uppercase">
                      Total Notes
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-white">
                    {stats.notes}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-xl border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Share2 className="text-blue-400" size={20} />
                    <span className="text-xs font-bold text-zinc-700 uppercase">
                      Connections
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-white">
                    {stats.edges}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-xl border-t border-white/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-neon/5 group-hover:bg-neon/10 transition-colors"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <Activity className="text-green-400" size={20} />
                    <span className="text-xs font-bold text-zinc-700 uppercase">
                      AI Model
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white relative z-10">
                    Gemini 2.5 Flash
                  </div>
                  <div className="text-sm text-green-400 mt-2 font-medium relative z-10">
                    ● Active
                  </div>
                </div>
              </div>

              {/* Ingest Box */}
              <div className="mb-12 gradient-border-wrapper group">
                <div className="gradient-border-content bg-zinc-950/80 backdrop-blur-sm flex flex-col relative overflow-hidden">
                  <div className="flex border-b border-white/5">
                    <button
                      onClick={() => setInputType("upload")}
                      className={`flex-1 p-4 text-sm font-bold uppercase flex items-center justify-center gap-2 transition-colors ${
                        inputType === "upload"
                          ? "text-neon bg-white/5"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <ImageIcon size={16} /> Upload Image
                    </button>
                    <div className="w-px bg-white/5"></div>
                    <button
                      onClick={() => setInputType("write")}
                      className={`flex-1 p-4 text-sm font-bold uppercase flex items-center justify-center gap-2 transition-colors ${
                        inputType === "write"
                          ? "text-neon bg-white/5"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <PenTool size={16} /> Write Note
                    </button>
                  </div>

                  <div className="p-8">
                    {inputType === "upload" && (
                      <div className="relative flex items-center justify-between cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0])
                              handleNoteCreation(e.target.files[0]);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          disabled={loading}
                        />
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-800 group-hover:text-neon group-hover:border-neon/50 transition-all">
                            {loading ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <UploadCloud />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {loading ? status : "Upload Image"}
                            </h3>
                            <p className="text-zinc-500 text-sm font-medium">
                              Drag & Drop or Click to browse
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {inputType === "write" && (
                      <div className="space-y-4">
                        <CyberEditor
                          content={textContent}
                          onChange={setTextContent}
                          disabled={loading}
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleNoteCreation()}
                            disabled={loading || !textContent.trim()}
                            className="bg-zinc-100 text-black px-6 py-2 rounded font-bold text-sm hover:bg-neon transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {loading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <PenTool size={16} />
                            )}
                            {loading ? status : "Save Note"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity + Graph */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wide">
                      Recent Notes
                    </h3>
                    <button
                      onClick={() => setViewMode("grid")}
                      className="text-xs font-bold text-neon hover:underline flex items-center gap-1"
                    >
                      VIEW ALL <ArrowRight size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {notes.slice(0, 2).map((note) => (
                      <div key={note.id} className="h-64">
                        <NoteCard note={note} />
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <div className="text-zinc-600 text-sm font-medium">
                        No notes created yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wide">
                      Graph Overview
                    </h3>
                    <button
                      onClick={() => setViewMode("graph")}
                      className="text-xs font-bold text-neon hover:underline flex items-center gap-1"
                    >
                      EXPAND <ArrowRight size={12} />
                    </button>
                  </div>
                  <div className="flex-grow rounded-xl overflow-hidden border border-zinc-800">
                    <GraphView height={300} key={graphKey} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CREATE / WRITER VIEW */}
          {viewMode === "create" && (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setViewMode("home")}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <PenTool size={20} className="text-neon" />
                    New Note
                  </h2>
                </div>
                <button
                  onClick={() => handleNoteCreation()}
                  disabled={loading || !textContent.trim()}
                  className="bg-neon text-black px-6 py-2 rounded font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-neon/20"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {loading ? status : "Save Note"}
                </button>
              </div>

              <div className="flex-grow gradient-border-wrapper">
                <div className="gradient-border-content bg-zinc-950/80 backdrop-blur-md flex flex-col p-6">
                  <div className="flex-grow h-full">
                    <CyberEditor
                      content={textContent}
                      onChange={setTextContent}
                      disabled={loading}
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-zinc-500 font-medium uppercase tracking-wide">
                    <span>AI Auto-Tagging On</span>
                    <span>Gemini 2.5 Flash</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. GRAPH VIEW */}
          {viewMode === "graph" && (
            <div className="animate-in fade-in duration-700">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-neon rounded-full"></div>
                  Knowledge Graph
                </h2>
                <span className="text-xs font-bold text-zinc-600 border border-zinc-800 px-2 py-1 rounded uppercase">
                  Fullscreen
                </span>
              </div>
              <GraphView height={600} key={graphKey} />
            </div>
          )}

          {/* 4. LIBRARY VIEW */}
          {viewMode === "grid" && (
            <div className="animate-in fade-in duration-700">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Library
                </h2>
                <span className="text-zinc-500 font-bold text-sm">
                  {notes.length} Notes
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {notes.map((note) => (
                  <div key={note.id} className="h-[300px]">
                    <NoteCard note={note} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. CHAT VIEW */}
          {viewMode === "chat" && (
            <div className="animate-in fade-in duration-500 h-[60vh] flex flex-col items-center justify-center glass-panel rounded-2xl border border-white/5">
              <div className="w-24 h-24 bg-zinc-900/50 rounded-full flex items-center justify-center text-neon mb-6 border border-neon/20 shadow-[0_0_30px_rgba(204,255,0,0.05)]">
                <UploadCloud size={48} strokeWidth={1} />
              </div>
              <h2 className="text-3xl font-thin text-white mb-3 tracking-tight">
                AI Assistant
              </h2>
              <p className="text-zinc-500 text-center max-w-md px-4 text-sm">
                Coming soon.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
