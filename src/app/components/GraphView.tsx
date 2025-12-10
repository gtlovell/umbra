"use client";

import { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { createClient } from "../../../utils/supabase/client";

interface GraphViewProps {
  height?: number; // Optional height prop
}

export default function GraphView({ height = 500 }: GraphViewProps) {
  const supabase = createClient();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const graphRef = useRef<any>();

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: notes } = await supabase
      .from("notes")
      .select("id, summary, tags")
      .eq("user_id", user.id);
    const { data: edges } = await supabase
      .from("edges")
      .select("source_note_id, target_note_id")
      .eq("user_id", user.id);

    if (!notes || !edges) return;

    const nodes = notes.map((n) => ({
      id: n.id,
      name: n.summary.slice(0, 20) + "...",
      val: 3,
    }));

    const links = edges.map((e) => ({
      source: e.source_note_id,
      target: e.target_note_id,
    }));

    setGraphData({ nodes, links });
  };

  return (
    <div
      style={{ height: `${height}px` }}
      className="w-full border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 shadow-inner mt-4 relative"
    >
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <span className="text-xs font-mono text-neon bg-neon/10 px-2 py-1 rounded border border-neon/20">
          LIVE NETWORK
        </span>
      </div>

      {typeof window !== "undefined" && (
        <ForceGraph2D
          ref={graphRef}
          width={undefined} // Let parent control width
          height={height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={() => "#ccff00"}
          linkColor={() => "#3f3f46"}
          backgroundColor="#09090b"
          nodeRelSize={4}
        />
      )}
    </div>
  );
}
