"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  GitBranch,
  Zap,
  MessageSquare,
  Activity,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

// ── Types ─────────────────────────────────────────────────────────

interface ApiNode {
  uuid: string;
  name: string;
  summary?: string;
  group_id?: string;
  labels: string[];
  edgeCount: number;
}

interface ApiEdge {
  source: string;
  target: string;
  relationship: string;
  fact?: string;
  created_at?: string;
}

interface GraphStats {
  entityCount: number;
  edgeCount: number;
  episodeCount: number;
}

interface GNode {
  id: string;
  name: string;
  summary?: string;
  labels: string[];
  inferredType: string;
  edgeCount: number;
  color: string;
  val: number;
}

interface GLink {
  source: string;
  target: string;
  relationship: string;
  fact?: string;
  created_at?: string;
}

// ── Helpers ───────────────────────────────────────────────────────

const GRAPH_API_URL = "/api/knowledge-graph";

const TYPE_COLORS: Record<string, string> = {
  Person: "#3B82F6",
  Topic: "#22C55E",
  Decision: "#F59E0B",
  Technology: "#EC4899",
  Entity: "#8B5CF6",
};

const TECH_KEYWORDS = new Set([
  "react", "redux", "zustand", "typescript", "javascript", "node", "next",
  "postgresql", "postgres", "neo4j", "graphiti", "docker", "kubernetes",
  "aws", "gcp", "azure", "vercel", "github", "linear", "slack", "api",
  "graphql", "rest", "css", "tailwind", "vue", "angular", "python", "go",
  "rust", "java", "swift", "kotlin", "mongodb", "redis", "kafka", "nginx",
  "terraform", "ci/cd", "pipeline", "webpack", "vite", "pnpm", "npm",
]);

function inferType(name: string): string {
  const lower = name.toLowerCase();
  if (/^[A-Z][a-z]+(\s[A-Z][a-z]+)?$/.test(name) && name !== "Entity") return "Person";
  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw)) return "Technology";
  }
  if (lower.includes("decision") || lower.includes("decided") || lower.includes("approved")) return "Decision";
  if (/^(pr\s*#?\d|#\d|eng-|lin-)/i.test(name)) return "Technology";
  return "Topic";
}

function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? TYPE_COLORS.Entity;
}

function useIsDark(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    setDark(el.classList.contains("dark"));
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ── Component ─────────────────────────────────────────────────────

export default function KnowledgeGraphPage() {
  const isDark = useIsDark();

  const [stats, setStats] = useState<GraphStats>({ entityCount: 0, edgeCount: 0, episodeCount: 0 });
  const [graphData, setGraphData] = useState<{ nodes: GNode[]; links: GLink[] }>({ nodes: [], links: [] });
  const [rawEdges, setRawEdges] = useState<ApiEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 384 });
  const initialFitDone = useRef(false);

  const bgColor = isDark ? "#0d0d12" : "#fafafa";
  const labelColor = isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)";
  const labelDimColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const linkStroke = isDark ? "rgba(160,160,200,0.35)" : "rgba(80,80,120,0.25)";

  // ── Resize ──────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setDims({ w: r.width, h: r.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [expanded]);

  // ── Fetch (once on mount + manual) ──────────────────────────────

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${GRAPH_API_URL}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setStats(data.stats);
      setRawEdges(data.edges);
      setError(null);

      const nodeSet = new Set<string>((data.nodes as ApiNode[]).map((n) => n.uuid));
      const nodes: GNode[] = (data.nodes as ApiNode[]).map((n) => {
        const t = inferType(n.name);
        return {
          id: n.uuid, name: n.name, summary: n.summary, labels: n.labels,
          inferredType: t, edgeCount: n.edgeCount, color: typeColor(t),
          val: Math.max(2, 1 + Math.sqrt(n.edgeCount) * 2),
        };
      });
      const links: GLink[] = (data.edges as ApiEdge[])
        .filter((e) => nodeSet.has(e.source) && nodeSet.has(e.target))
        .map((e) => ({ ...e }));

      setGraphData({ nodes, links });
      initialFitDone.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  useEffect(() => {
    if (graphData.nodes.length > 0 && !initialFitDone.current && fgRef.current) {
      initialFitDone.current = true;
      setTimeout(() => fgRef.current?.zoomToFit(500, 50), 600);
    }
  }, [graphData.nodes.length]);

  // ── Node paint ──────────────────────────────────────────────────

  const paintNode = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GNode;
      const r = Math.max(4, n.val * 1.5);
      const isSel = selectedNode?.id === n.id;
      const fs = Math.max(11 / globalScale, 2.5);

      if (isSel) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI);
        ctx.fillStyle = `${n.color}25`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = isSel ? n.color : `${n.color}B0`;
      ctx.fill();

      if (globalScale > 0.4 || isSel) {
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isSel ? labelColor : labelDimColor;
        ctx.font = `${isSel ? "600 " : ""}${fs}px Inter, system-ui, sans-serif`;
        ctx.fillText(n.name.length > 22 ? n.name.slice(0, 20) + "…" : n.name, node.x, node.y + r + 3);
      }
    },
    [selectedNode, labelColor, labelDimColor],
  );

  // ── Link paint ────────────────────────────────────────────────

  const paintLink = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const s = link.source;
      const t = link.target;
      if (!s || !t || typeof s.x !== "number") return;

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = linkStroke;
      ctx.lineWidth = Math.max(1.2, 2 / globalScale);
      ctx.stroke();

      if (globalScale > 1.5 && link.relationship) {
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        ctx.fillStyle = labelDimColor;
        ctx.font = `${Math.max(8 / globalScale, 2.5)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(link.relationship, mx, my - 4 / globalScale);
      }
    },
    [linkStroke, labelDimColor],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onNodeClick = useCallback((node: any) => {
    setSelectedNode((prev) => (prev?.id === (node as GNode).id ? null : node as GNode));
  }, []);

  const focusNode = useCallback((node: GNode) => {
    setSelectedNode(node);
    if (fgRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fgRef.current.centerAt((node as any).x, (node as any).y, 500);
      fgRef.current.zoom(2.5, 500);
    }
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return graphData.nodes.filter((n) => n.name.toLowerCase().includes(q));
  }, [searchQuery, graphData.nodes]);

  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return rawEdges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id);
  }, [selectedNode, rawEdges]);

  const STAT_CARDS = [
    { label: "Entities", value: stats.entityCount, icon: GitBranch, color: "#8B5CF6" },
    { label: "Relationships", value: stats.edgeCount, icon: Zap, color: "#3B82F6" },
    { label: "Episodes", value: stats.episodeCount, icon: MessageSquare, color: "#22C55E" },
    { label: "Visible Nodes", value: graphData.nodes.length, icon: Activity, color: "#F59E0B" },
  ];

  return (
    <div className="mx-auto max-w-5xl animate-fade-in px-6 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-md font-semibold text-foreground">Knowledge Graph</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Entity relationships from Graphiti &amp; Neo4j</p>
        </div>
        <button onClick={fetchGraph} disabled={loading} className="flex items-center gap-1.5 rounded border border-subtle px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/10 hover:text-foreground disabled:opacity-50">
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded border border-subtle bg-surface-1 px-3 py-2.5">
            <div className="flex items-center gap-1.5 pb-1">
              <Icon className="h-3 w-3" style={{ color }} />
              <span className="text-2xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-lg font-semibold tabular-nums text-foreground">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/45" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search entities..." className="h-8 w-full rounded border border-subtle bg-surface-2 pl-8 pr-3 text-xs text-foreground placeholder:text-foreground/45 focus:border-foreground/15 focus:outline-none" />
        </div>
        <button onClick={() => fgRef.current?.zoomToFit(400, 40)} className="rounded border border-subtle px-2 py-1.5 text-2xs text-muted-foreground hover:text-foreground">Fit</button>
        <button onClick={() => setExpanded((v) => !v)} className="rounded border border-subtle p-1.5 text-muted-foreground hover:text-foreground">
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div ref={containerRef} className={cn("relative mb-4 overflow-hidden rounded-lg", expanded ? "h-[70vh]" : "h-96")} style={{ backgroundColor: bgColor }}>
        {loading && graphData.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading from Graphiti...</span>
            </div>
          </div>
        ) : error && graphData.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-xs text-red-400">{error}</span>
              <p className="text-2xs text-muted-foreground">Make sure knowledge-engine is running on port 8001</p>
              <button onClick={fetchGraph} className="mt-1 text-xs text-muted-foreground underline hover:text-foreground">Retry</button>
            </div>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            width={dims.w}
            height={dims.h}
            graphData={graphData}
            nodeCanvasObject={paintNode}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              ctx.beginPath();
              ctx.arc(node.x, node.y, Math.max(4, (node as GNode).val * 1.5) + 6, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkCanvasObject={paintLink}
            nodeLabel=""
            onNodeClick={onNodeClick}
            onBackgroundClick={() => setSelectedNode(null)}
            backgroundColor={bgColor}
            linkColor={() => linkStroke}
            linkWidth={1.5}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            cooldownTicks={200}
            warmupTicks={80}
            enableNodeDrag
            enableZoomInteraction
            enablePanInteraction
          />
        )}
        {loading && graphData.nodes.length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
            <RefreshCw className="h-5 w-5 animate-spin text-foreground/40" />
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-2xs text-foreground/45">Drag nodes · Scroll to zoom · Click to inspect</p>
        <div className="flex gap-3">
          {Object.entries(TYPE_COLORS).filter(([k]) => k !== "Entity").map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-2xs text-foreground/50">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {searchQuery && (
        <div className="animate-fade-in mb-4">
          <p className="mb-2 text-xs font-medium text-foreground">{filteredNodes.length} matching entit{filteredNodes.length !== 1 ? "ies" : "y"}</p>
          {filteredNodes.length > 0 && (
            <div className="overflow-hidden rounded border border-subtle">
              <div className="grid grid-cols-[1fr_100px_80px] gap-4 border-b border-subtle bg-surface-1 px-4 py-2">
                {["Entity", "Type", "Edges"].map((h) => (
                  <span key={h} className="text-2xs font-medium uppercase tracking-widest text-foreground/45">{h}</span>
                ))}
              </div>
              {filteredNodes.slice(0, 20).map((node) => (
                <div key={node.id} onClick={() => focusNode(node)} className="grid cursor-pointer grid-cols-[1fr_100px_80px] items-center gap-4 border-b border-subtle px-4 py-2.5 transition-colors last:border-0 hover:bg-surface-2">
                  <span className="font-mono text-xs text-foreground">{node.name}</span>
                  <span className="rounded px-1 py-px text-2xs" style={{ backgroundColor: `${node.color}20`, color: node.color }}>{node.inferredType}</span>
                  <span className="text-2xs tabular-nums text-muted-foreground">{node.edgeCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedNode && (
        <div className="animate-fade-in overflow-hidden rounded border border-subtle">
          <div className="flex items-center justify-between border-b border-subtle bg-surface-1 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-foreground">{selectedNode.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded px-1.5 py-0.5 text-2xs" style={{ backgroundColor: `${selectedNode.color}20`, color: selectedNode.color }}>{selectedNode.inferredType}</span>
                <span className="text-2xs text-muted-foreground">{selectedNode.edgeCount} connection{selectedNode.edgeCount !== 1 ? "s" : ""}</span>
              </div>
              {selectedNode.summary && <p className="mt-1.5 text-2xs text-muted-foreground">{selectedNode.summary}</p>}
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-2xs text-muted-foreground hover:text-foreground">Close</button>
          </div>
          {connectedEdges.length > 0 && (
            <div className="divide-y divide-subtle">
              {connectedEdges.slice(0, 15).map((edge, i) => {
                const isSource = edge.source === selectedNode.id;
                const otherName = graphData.nodes.find((n) => n.id === (isSource ? edge.target : edge.source))?.name ?? "?";
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="mt-0.5 shrink-0 rounded border border-subtle bg-surface-3 px-1 py-px text-2xs font-mono text-foreground/50">{edge.relationship}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground">{isSource ? "→" : "←"} <span className="font-medium">{otherName}</span></p>
                      {edge.fact && <p className="mt-0.5 text-2xs text-muted-foreground line-clamp-2">{edge.fact}</p>}
                    </div>
                    {edge.created_at && <span className="shrink-0 text-2xs text-foreground/40">{new Date(edge.created_at).toLocaleDateString()}</span>}
                  </div>
                );
              })}
              {connectedEdges.length > 15 && <div className="px-4 py-2 text-2xs text-muted-foreground">+ {connectedEdges.length - 15} more</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
