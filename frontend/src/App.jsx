import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SCORE_CONFIG = {
  High:   { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  Medium: { bg: "bg-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-400",   border: "border-amber-500/30"   },
  Low:    { bg: "bg-rose-500/20",    text: "text-rose-400",    dot: "bg-rose-400",    border: "border-rose-500/30"    },
};

function ScoreBadge({ label, score }) {
  const cfg = SCORE_CONFIG[label] || SCORE_CONFIG.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label} · {score}
    </span>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col gap-1">
      <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">{label}</span>
      <span className="text-3xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

function LeadRow({ lead, onDelete }) {
  const cfg = SCORE_CONFIG[lead.scoreLabel] || SCORE_CONFIG.Low;
  return (
    <div className={`group bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col gap-3 hover:border-white/20 transition-all duration-200`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base truncate">{lead.companyName}</h3>
            <ScoreBadge label={lead.scoreLabel} score={lead.intentScore} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-slate-500">{lead.industry}</span>
            {lead.stage !== "Unknown" && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500">{lead.stage}</span>
              </>
            )}
            {lead.website && lead.website !== "N/A" && (
              <>
                <span className="text-slate-700">·</span>
                <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors truncate max-w-[180px]">
                  {lead.website.replace(/^https?:\/\//, "")}
                </a>
              </>
            )}
          </div>
        </div>

        {/* Score bar */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="w-20 h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${lead.intentScore}%` }} />
          </div>
          <span className="text-[10px] text-slate-600">{lead.intentScore}/100</span>
        </div>
      </div>

      {/* Signal */}
      {lead.signal && (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-indigo-400 shrink-0">⚡</span>
          <p className="text-sm text-slate-300 leading-snug">{lead.signal}</p>
        </div>
      )}

      {/* Summary */}
      {lead.summary && (
        <p className="text-xs text-slate-500 leading-relaxed border-t border-white/5 pt-3">{lead.summary}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {lead.sourceUrl ? (
          <a href={lead.sourceUrl} target="_blank" rel="noreferrer"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1">
            <span>↗</span> Source
          </a>
        ) : <span />}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-700">
            {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
          <button onClick={() => onDelete(lead._id)}
            className="text-xs text-slate-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanMsg, setScanMsg] = useState(null);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leads?sort=${sort}&filter=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sort, filter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleScan = async () => {
    setScanning(true);
    setScanMsg(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leads/scan`, { method: "POST" });
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      setScanMsg(data.message);
      await fetchLeads();
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/leads/${id}`, { method: "DELETE" });
      setLeads(prev => prev.filter(l => l._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const filtered = leads.filter(l =>
    search === "" ||
    l.companyName.toLowerCase().includes(search.toLowerCase()) ||
    l.industry.toLowerCase().includes(search.toLowerCase()) ||
    l.signal.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: leads.length,
    high: leads.filter(l => l.scoreLabel === "High").length,
    medium: leads.filter(l => l.scoreLabel === "Medium").length,
    avgScore: leads.length ? Math.round(leads.reduce((a, l) => a + l.intentScore, 0) / leads.length) : 0,
  };

  return (
    <div className="min-h-screen bg-[#0c0e13] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0c0e13]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">L</div>
          <span className="font-semibold text-white tracking-tight">LeadRadar</span>
          <span className="text-xs text-slate-600 hidden sm:block">/ Sales Intelligence</span>
        </div>
        <button onClick={handleScan} disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-600 text-white text-sm font-medium rounded-lg transition-all duration-200">
          {scanning ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scanning…
            </>
          ) : (
            <><span>⚡</span> Scan for Leads</>
          )}
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Alerts */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <span>✕</span> {error}
          </div>
        )}
        {scanMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <span>✓</span> {scanMsg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Leads" value={stats.total} sub="companies discovered" />
          <StatCard label="High Intent" value={stats.high} sub="score ≥ 70" />
          <StatCard label="Medium Intent" value={stats.medium} sub="score 40–69" />
          <StatCard label="Avg Score" value={stats.avgScore} sub="out of 100" />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search companies, industry, signal…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-[#111318] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <div className="flex gap-2">
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors">
              <option value="All">All Intent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors">
              <option value="score">Sort: Score</option>
              <option value="date">Sort: Recent</option>
            </select>
          </div>
        </div>

        {/* Lead count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "company" : "companies"}`}
            {search && ` matching "${search}"`}
          </p>
          {filtered.length !== leads.length && (
            <button onClick={() => { setSearch(""); setFilter("All"); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Clear filters
            </button>
          )}
        </div>

        {/* Lead list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="w-6 h-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/8 rounded-2xl">
            <p className="text-slate-500 text-sm">No leads found.</p>
            <p className="text-slate-700 text-xs mt-1">
              {leads.length === 0 ? 'Hit "Scan for Leads" to discover companies.' : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(lead => (
              <LeadRow key={lead._id} lead={lead} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}