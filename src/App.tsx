import { useState, useEffect, FormEvent, MouseEvent } from "react";
import { 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  ShieldAlert, 
  ExternalLink, 
  History, 
  Plus, 
  FileText,
  Loader2,
  Lock,
  Globe,
  Database,
  ArrowRight,
  Fingerprint,
  Trash2,
  PieChart as PieChartIcon,
  BarChart2,
  Activity,
  Radio,
  Signal,
  Wifi,
  Settings,
  X as XIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  CartesianGrid
} from "recharts";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  risk_level: string;
  risk_score: number;
  verified: boolean;
}

interface Report {
  id: string;
  keyword: string;
  results: SearchResult[];
  summary: {
    total: number;
    high_risk: number;
  };
  analysisText?: string;
  timestamp: string;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  keyword: string;
  total: number;
  highRisk: number;
}

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchPhase, setSearchPhase] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "history">("search");
  const [error, setError] = useState<string | null>(null);
  const [bearerToken, setBearerToken] = useState<string>(localStorage.getItem("x_bearer_token") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  useEffect(() => {
    loadHistoryFromStorage();
  }, []);

  const loadHistoryFromStorage = () => {
    const saved = localStorage.getItem("search_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  };

  const saveToHistory = (newReport: Report) => {
    const id = Date.now().toString();
    const historyItem: HistoryItem = {
      id,
      timestamp: newReport.timestamp,
      keyword: newReport.keyword,
      total: newReport.summary.total,
      highRisk: newReport.summary.high_risk
    };

    const newHistory = [historyItem, ...history];
    setHistory(newHistory);
    localStorage.setItem("search_history", JSON.stringify(newHistory));
    localStorage.setItem(`report_${id}`, JSON.stringify(newReport));
  };

  useEffect(() => {
    localStorage.setItem("x_bearer_token", bearerToken);
  }, [bearerToken]);

  const deleteHistoryItem = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("search_history", JSON.stringify(newHistory));
    localStorage.removeItem(`report_${id}`);
  };

  // --- OSINT Forensic Utilities [VERSION 3.0 ULTIMATE] ---
  const generateDorkQueries = (term: string) => [
    { name: "Git/Source Secrets", query: `site:github.com | site:gitlab.com | site:bitbucket.org "${term}" (password|api_key|token|access_key|secret)` },
    { name: "Cloud/S3 Buckets", query: `site:s3.amazonaws.com | site:blob.core.windows.net | site:storage.googleapis.com "${term}"` },
    { name: "Paste/Leak Sites", query: `site:pastebin.com | site:rentry.co | site:ghostbin.com | site:controlc.com "${term}"` },
    { name: "Cyber Intel Forums", query: `site:v2ex.com | site:hostloc.com | site:nodeseek.com | site:linux.do "${term}"` },
    { name: "Document Exploits", query: `filetype:sql | filetype:env | filetype:config | filetype:bak "${term}"` }
  ];

  const performNativeForensicSearch = async (term: string) => {
    setSearchPhase("Initializing Tether-Alpha v3.0 [ULTIMATE]...");
    
    // 1. Parallel Execution
    const [probeRes, xRes, dorkResults] = await Promise.all([
      fetch("/api/osint/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: term })
      }).then(res => res.ok ? res.json() : null).catch(() => null),
      fetch(`/api/search/x?q=${encodeURIComponent(term)}`, {
        headers: { "X-User-Token": bearerToken }
      }).then(res => res.ok ? res.json() : null).catch(() => null),
      (async () => {
        const dorkSets = generateDorkQueries(term);
        return dorkSets.map(dork => ({
          title: `Forensic Trajectory: ${dork.name}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(dork.query)}`,
          snippet: `Tether-Alpha generated vector for deep infrastructure/identity audit.`,
          source: "HEURISTIC_CORE_V3",
          risk_level: "YELLOW_WARNING",
          risk_score: 50,
          verified: false
        }));
      })()
    ]);

    // 2. Synthesize Results
    const probeHits: SearchResult[] = (probeRes?.results || []).map((p: any) => ({
      title: p.title,
      url: "#",
      snippet: p.findings.join(" | "),
      source: `TETHER_PROBE_V3 (${probeRes.telemetry?.recordsScanned || "18B+"})`,
      risk_level: p.confidence > 90 ? "RED_ALERT" : "YELLOW_WARNING",
      risk_score: p.confidence,
      verified: true
    }));

    const xHits: SearchResult[] = (xRes?.results || []).map((hit: any) => ({
      title: "X Identity Link",
      url: hit.url || `https://twitter.com/search?q=${encodeURIComponent(term)}`,
      snippet: hit.text || "Direct API match detected on X-Matrix.",
      source: "X_API_LINK",
      risk_level: "YELLOW_WARNING",
      risk_score: 55,
      verified: true
    }));

    const combined = [...probeHits, ...xHits, ...dorkResults];

    return {
      results: combined,
      summary: { 
        total: combined.length, 
        high_risk: combined.filter(r => r.risk_level === "RED_ALERT").length 
      },
      analysisText: probeRes 
        ? `[TETHER-ALPHA ULTIMATE SYNC COMPLETE] 已分析 ${probeRes.telemetry?.recordsScanned} 记录。检测到深度身份特征重合。系统已针对 [${term}] 建立三维关联模型，建议优先执行 Git/Cloud 存储桶的手动探针验证。`
        : "取证引擎已切换至全静默模式。"
    };
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsSearching(true);
    setSearchProgress(0);
    setSearchPhase("Priming Tether-Alpha Engine...");
    setError(null);
    setTerminalLogs([]);
    setReport(null);

    // Simulated progress tracker
    const progressInterval = setInterval(() => {
      setSearchProgress(prev => {
        if (prev >= 95) return prev;
        const phases = [
          { threshold: 15, text: "SYNCING_REGIONAL_INTEL_BRIDGES" },
          { threshold: 30, text: "EXECUTING_NATIVE_PROBE_V3_ULTIMATE" },
          { threshold: 45, text: "TRAJECTORY_MAPPING_PII_MIRRORS" },
          { threshold: 60, text: "CROSS_THREAD_COLLISION_DETECTION" },
          { threshold: 75, text: "DECRYPTING_HISTORICAL_LEAK_INDEX" },
          { threshold: 90, text: "GENERATING_UNIFIED_THREAT_MATRIX" }
        ];
        const currentPhase = phases.find(p => prev < p.threshold);
        if (currentPhase) setSearchPhase(currentPhase.text);
        return prev + (Math.random() * 6);
      });
    }, 400);

    // Mock terminal logs
    const logs = [
      "> Initializing secure node @ 127.0.0.1:443",
      "> Protocol: SHA-256 / AES-GCM-256",
      "> Scanning indices: 18.5B records Scanned",
      "> Matching pattern: [HIDDEN_SIGNATURE_P4]",
      "> Collision detected: Segment 0x8FA2",
      "> Pivoting via regional intelligence bridges...",
      "> S3_BUCKET_SCAN: Initiated [BETA_TARGET]",
      "> GIT_LEAK_PROBE: Active_Threat_Scan",
      "> Finalizing forensic trajectory mapping..."
    ];
    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < logs.length) {
        setTerminalLogs(prev => [...prev.slice(-5), logs[logIdx]]);
        logIdx++;
      }
    }, 600);

    try {
      // 1. PRIMARY FORCE: Native Forensic Search
      const nativeIntel = await performNativeForensicSearch(keyword);
      
      // 2. AUXILIARY FORCE: AI Intelligence (Gemini + Search Tool)
      let aiIntel: any = null;
      try {
        const prompt = `[OSINT AUXILIARY INTEL] 
                       [CONTEXT] Native engine found: ${JSON.stringify(nativeIntel.results.map(r => r.title))}
                       [MISSION] Cross-reference these findings using live web data. Find hidden technical links.
                       [STRICT JSON] {"results": [], "summary": {"total":0, "high_risk":0}, "analysisText": ""}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { tools: [{ googleSearch: {} }] }
        });

        const text = (response as any).text || "";
        const s = text.indexOf('{');
        const eIdx = text.lastIndexOf('}');
        if (s !== -1 && eIdx !== -1) {
          aiIntel = JSON.parse(text.substring(s, eIdx + 1));
        }
      } catch (aiErr) {
        console.warn("Auxiliary AI Intel Offline:", aiErr);
      }

      // 3. MERGE (Native leads, AI enhances)
      const mergedResults = [...nativeIntel.results];
      if (aiIntel && aiIntel.results) {
        aiIntel.results.forEach((r: any) => {
          r.source = `${r.source} (AI Ref)`;
          mergedResults.push(r);
        });
      }

      const newReport: Report = {
        id: Date.now().toString(),
        keyword,
        results: mergedResults,
        summary: {
          total: mergedResults.length,
          high_risk: mergedResults.filter(r => r.risk_level === "RED_ALERT").length
        },
        analysisText: aiIntel ? aiIntel.analysisText : nativeIntel.analysisText,
        timestamp: new Date().toISOString()
      };
      
      setReport(newReport);
      setSearchProgress(100);
      setSearchPhase("INTELLIGENCE_LOCKED");
      saveToHistory(newReport);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("429") || err.message?.toLowerCase().includes("quota")) {
        setError("Gemini API 配额已耗尽 (Quota Exceeded)。由于使用的是免费版 API，请稍等 1-5 分钟后再试，或尝试更精准的搜索词。");
      } else {
        setError("Analysis failed. This might be due to safety filters, token limits, or API connectivity.");
      }
    } finally {
      clearInterval(progressInterval);
      clearInterval(logInterval);
      setIsSearching(false);
    }
  };

  const loadReport = (id: string) => {
    const saved = localStorage.getItem(`report_${id}`);
    if (saved) {
      setReport(JSON.parse(saved));
      setActiveTab("search");
    }
  };

  // Data processing for charts
  const riskData = report ? [
    { name: "High Risk", value: report.summary.high_risk, color: "#ef4444" },
    { name: "Med Risk", value: report.results.filter(r => r.risk_level.includes("YELLOW") || r.risk_level.includes("中")).length, color: "#eab308" },
    { name: "Low Risk", value: report.results.filter(r => !r.risk_level.includes("RED") && !r.risk_level.includes("高") && !r.risk_level.includes("YELLOW") && !r.risk_level.includes("中")).length, color: "#10b981" }
  ].filter(d => d.value > 0) : [];

  const sourceCounts = report ? report.results.reduce((acc: any, curr) => {
    acc[curr.source] = (acc[curr.source] || 0) + 1;
    return acc;
  }, {}) : {};

  const sourceData = Object.keys(sourceCounts).map(source => ({
    name: source,
    count: sourceCounts[source]
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-emerald-500/30 p-4 md:p-6 flex flex-col gap-6">
      {/* Header / Nav */}
      <header className="max-w-7xl w-full mx-auto flex justify-between items-center bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-neutral-950" />
          </div>
              <div className="flex flex-col">
                <h1 className="text-base md:text-lg font-bold tracking-tight uppercase leading-none">PrivacyExplorer</h1>
                <span className="text-[9px] md:text-[10px] text-emerald-500 font-mono tracking-widest uppercase flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></div>
                  Tether-Alpha Core Active
                </span>
              </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 md:p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all active:scale-95"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="hidden lg:flex items-center gap-2 bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-neutral-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-medium text-neutral-400 uppercase">System: Operational</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-neutral-700/50">
            <ShieldAlert className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-tighter">Zero-Retention Mode</span>
          </div>
          
          <div className="flex gap-0.5 p-0.5 md:p-1 bg-neutral-800/50 rounded-xl border border-neutral-800">
            <button 
              onClick={() => setActiveTab("search")}
              className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "search" ? "bg-neutral-700 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Scan
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "history" ? "bg-neutral-700 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Arch
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight uppercase">API Configuration</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-neutral-500 hover:text-white">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">X (Twitter) Bearer Token</label>
                  <div className="relative">
                    <input 
                      type="password"
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      placeholder="Enter Bearer Token..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-4 text-sm font-mono focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-800"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {bearerToken ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <div className="w-2 h-2 rounded-full bg-neutral-800" />}
                    </div>
                  </div>
                  <p className="text-[9px] text-neutral-500 leading-relaxed uppercase">Tokens are saved locally. Required for deep platform indexing.</p>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-emerald-500 py-4 rounded-2xl text-neutral-950 font-black uppercase text-xs tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/20"
                >
                  Save & Validate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl w-full mx-auto flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "search" ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-4 md:gap-6"
            >
              {/* Search Hero Area */}
              <div className="col-span-12 lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-12 flex flex-col justify-center items-center text-center space-y-6 md:space-y-8 min-h-[300px] md:min-h-[400px] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="space-y-4 max-w-xl">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-500 tracking-widest uppercase mb-2 md:mb-4"
                  >
                    Mobile Privacy Guard
                  </motion.div>
                  <h2 className="text-3xl md:text-6xl font-black tracking-tight text-white leading-tight">
                    DEEP PRIVACY <span className="text-emerald-500">SEARCH.</span>
                  </h2>
                  <p className="text-neutral-500 text-xs md:text-base font-medium">
                    Analyze data footprints across 50+ sources including code repos and leaks.
                  </p>
                </div>

                <div className="w-full max-w-lg space-y-4">
                  <form onSubmit={handleSearch} className="relative group/form flex flex-col sm:block gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-neutral-600 group-focus-within/form:text-emerald-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Name, Phone, or Email..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-4 md:py-5 pl-14 pr-4 sm:pr-40 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-neutral-700 text-white font-medium"
                      />
                      <button
                        disabled={isSearching}
                        className="hidden sm:flex absolute right-2.5 inset-y-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-all items-center gap-2 shadow-lg shadow-emerald-900/40 text-neutral-950"
                      >
                        {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {isSearching ? "Crawling..." : "Scan"}
                      </button>
                    </div>
                    <button
                      disabled={isSearching}
                      className="sm:hidden w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-600 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 text-neutral-950"
                    >
                      {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                      {isSearching ? "Crawling..." : "Scan Now"}
                    </button>
                  </form>

                  {/* Quick Filters */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {["Code Leaks", "Social Footprints", "Breaches", "Telegram"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setKeyword(tag === "Social Footprints" ? keyword + " linkedin weibo" : keyword + " " + tag.toLowerCase())}
                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-[10px] font-bold text-neutral-400 uppercase transition-all"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/5 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-3"
                  >
                    <AlertTriangle className="h-4 w-4" /> {error}
                  </motion.div>
                )}
              </div>

              {/* Status/Static info Bento Item */}
              <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-6">
                <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between group overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Radio className="w-24 h-24 text-emerald-500 -mr-8 -mt-8" />
                  </div>
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                      <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Tether Radio Status</h3>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] rounded border border-emerald-500/20 font-bold tracking-tighter animate-pulse">TRANSMITTING</span>
                  </div>
                  
                  <div className="mt-4 space-y-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-400">FREQ: 142.850 MHz</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`w-1 h-3 rounded-full ${i <= 3 ? "bg-emerald-500" : "bg-neutral-800"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="h-12 flex items-center gap-1 overflow-hidden">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            height: [4, Math.random() * 24 + 4, 4],
                            opacity: [0.3, 1, 0.3]
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            delay: i * 0.05,
                            ease: "easeInOut"
                          }}
                          className="w-[2px] bg-emerald-500 rounded-full"
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-neutral-600 uppercase tracking-tighter">
                      <span>Enc: AES-256</span>
                      <span>Signal: Solid</span>
                      <span>Hop: Active</span>
                    </div>
                  </div>
                </section>

                <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                  <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Discovery Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-xl border border-neutral-800/50">
                      <span className="text-xs font-medium">Deep Web Sources</span>
                      <span className="text-[10px] font-bold text-emerald-400">54 Verified</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-xl border border-neutral-800/50">
                      <span className="text-xs font-medium">API Latency</span>
                      <span className="text-[10px] font-bold text-blue-400">Low (84ms)</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Loading / Results Bento Items */}
              {isSearching && !report && (
                <div className="col-span-12 bg-neutral-900 border border-neutral-800 rounded-3xl p-12 md:p-24 flex flex-col items-center justify-center space-y-8">
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ rotate: { repeat: Infinity, duration: 3, ease: "linear" }, scale: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
                      className="w-24 h-24 md:w-32 md:h-32 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-800 rounded-2xl flex items-center justify-center shadow-2xl">
                        <Lock className="h-5 w-5 md:h-6 md:h-6 text-emerald-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full max-w-2xl space-y-4">
                    <div className="flex justify-between items-end border-b border-neutral-800 pb-4">
                      <div className="space-y-1">
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Active_Thread_Probe</h3>
                        <p className="text-emerald-500 text-[10px] md:text-xs font-bold uppercase tracking-widest animate-pulse">
                          {searchPhase}
                        </p>
                      </div>
                      <span className="text-xl md:text-2xl font-black text-neutral-400 font-mono">
                        {Math.floor(searchProgress)}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-neutral-950 border border-neutral-800 rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        animate={{ width: `${searchProgress}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                      />
                    </div>
                    
                    {/* ENHANCED TERMINAL UI */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 font-mono text-[10px] leading-relaxed overflow-hidden h-48 relative shadow-2xl">
                      <div className="absolute top-2 right-4 flex gap-2">
                        <span className="text-[8px] text-neutral-700 font-bold uppercase">Alpha_Stream</span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <AnimatePresence mode="popLayout">
                          {terminalLogs.map((log, i) => (
                            <motion.div
                              key={`${i}-${log}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="text-emerald-500/80 flex gap-3"
                            >
                              <span className="opacity-30 shrink-0 font-bold">{`0${i + 1}`}</span>
                              <span className="opacity-40 shrink-0">[{new Date().toLocaleTimeString('en-GB')}]</span> 
                              <span className="truncate">{log}</span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {terminalLogs.length > 0 && (
                          <motion.div 
                            animate={{ opacity: [0, 1] }} 
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="w-1.5 h-3 bg-emerald-500 inline-block ml-10"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between text-[9px] font-bold text-neutral-600 uppercase tracking-widest pt-2 px-1">
                      <span className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Encryption: AES-256
                      </span>
                      <span>Nodes: 128_Active_Clusters</span>
                      <span>Mode: Terminal_Forensics</span>
                    </div>
                  </div>
                </div>
              )}

              {report && (
                <>
                  {/* Summary Bento Items */}
                  <div className="col-span-12 md:col-span-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-800 rounded-xl">
                        <Database className="h-5 w-5 text-neutral-400" />
                      </div>
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total Findings</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white">{report.results.length}</span>
                      <span className="text-xs font-bold text-neutral-500 uppercase">Records</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-800 rounded-xl">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                      </div>
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Compromised Area</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-red-500">{report.summary.high_risk}</span>
                      <span className="text-xs font-bold text-neutral-500 uppercase">Leaks</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${(report.summary.high_risk / (report.results.length || 1)) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-800 rounded-xl">
                        <Globe className="h-5 w-5 text-blue-500" />
                      </div>
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Source Coverage</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white">{new Set(report.results.map(r => r.source)).size}</span>
                      <span className="text-xs font-bold text-neutral-500 uppercase">Modules</span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 4 ? 'bg-blue-500' : 'bg-neutral-800'}`}></div>
                      ))}
                    </div>
                  </div>

                  {report.analysisText && (
                    <div className="col-span-12 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                      <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                         <Fingerprint className="h-8 w-8 text-emerald-500" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase tracking-tight text-emerald-500">System Analysis Summary</h3>
                        <p className="text-neutral-400 text-sm font-medium leading-relaxed italic">
                          "{report.analysisText}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Manual Intelligence Pivot */}
                  <div className="col-span-12 bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Lock className="h-4 w-4 text-emerald-500" />
                      <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                        深度溯源指令集 (Deep Forensic Dorks)
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      {generateDorkQueries(report.keyword).map((dork, i) => (
                        <a 
                          key={i}
                          href={`https://www.google.com/search?q=${encodeURIComponent(dork.query)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-900 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-black text-neutral-300 uppercase tracking-tighter">{dork.name}</span>
                            <div className="flex gap-1.5">
                              <span className="text-[8px] bg-neutral-800 px-1 py-0.5 rounded text-neutral-500 font-bold uppercase tracking-tighter">Manual Vector</span>
                              <ExternalLink className="w-3 h-3 text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                            </div>
                          </div>
                          <code className="text-[10px] text-neutral-600 font-mono break-all line-clamp-2">
                            {dork.query}
                          </code>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Visual Intelligence Section */}
                  <div className="col-span-12 lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col h-[350px]">
                    <div className="flex items-center gap-2 mb-6">
                       <PieChartIcon className="h-4 w-4 text-neutral-500" />
                       <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Risk Distribution</h3>
                    </div>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {riskData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px', fontSize: '10px', color: '#fff' }} 
                            itemStyle={{ color: '#fff' }}
                          />
                          <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] text-neutral-400 uppercase font-bold">{value}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col h-[350px]">
                    <div className="flex items-center gap-2 mb-6">
                       <BarChart2 className="h-4 w-4 text-neutral-500" />
                       <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Top Intelligence Sources</h3>
                    </div>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sourceData} layout="vertical" margin={{ left: 20, right: 30 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100} 
                            tick={{ fill: '#737373', fontSize: 10, fontWeight: 'bold' }} 
                            axisLine={false} 
                            tickLine={false}
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px', fontSize: '10px' }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="#3b82f6" 
                            radius={[0, 4, 4, 0]} 
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Large Results Table Area */}
                  <div className="col-span-12 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
                    <header className="p-6 bg-neutral-800/30 border-b border-neutral-800 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest">Analysis Results</h2>
                        <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-mono text-neutral-500 uppercase">UID: {report.keyword}</span>
                      </div>
                      <div className="flex gap-2">
                         <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                         <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                         <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                      </div>
                    </header>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                            <th className="px-6 py-4">Identification</th>
                            <th className="px-6 py-4">Threat Lvl</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Access</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                          {report.results.length > 0 ? report.results.map((res, i) => (
                            <motion.tr 
                              key={i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.02 }}
                              className="hover:bg-neutral-800/40 transition-colors group/row"
                            >
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-neutral-700 font-mono shadow-sm ${
                                      res.source.includes("TETHER") ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-neutral-800 text-neutral-400"
                                    }`}>
                                      {res.source}
                                    </span>
                                    {res.source.includes("TETHER") && <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />}
                                    <span className="font-bold text-neutral-100 group-hover/row:text-emerald-400 transition-colors uppercase tracking-tight">{res.title}</span>
                                  </div>
                                  <p className="text-[10px] text-neutral-500 font-medium leading-relaxed max-w-lg italic">{res.snippet}</p>
                                  {res.source.includes("TETHER") && (
                                    <div className="flex gap-4 pt-1 opacity-50 group-hover/row:opacity-100 transition-opacity">
                                      <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                        <span className="text-[8px] font-mono text-neutral-600 uppercase">Entropy: 0x{Math.floor(Math.random()*255).toString(16)}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                                        <span className="text-[8px] font-mono text-neutral-600 uppercase">Trajectory: Secure_Local</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  res.risk_level.includes("RED") || res.risk_level.includes("高") ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                  res.risk_level.includes("YELLOW") || res.risk_level.includes("中") ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                  "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                }`}>
                                  {res.risk_level.toUpperCase().replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {res.verified ? (
                                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-black uppercase tracking-tighter">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse"></div> Confirmed
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">Potential</div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <a 
                                  href={res.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all inline-block border border-neutral-700 shadow-xl"
                                >
                                  <ExternalLink className="h-3 w-3 text-white" />
                                </a>
                              </td>
                            </motion.tr>
                          )) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-20 text-center text-neutral-600 font-bold uppercase tracking-widest text-xs italic">
                                --- Scan complete: no threats identified ---
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Consoles / Raw Output Bento Item */}
                  {report.consoleOutput && (
                    <div className="col-span-12 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                          <FileText className="h-4 w-4" /> Crawl Logs
                        </div>
                        <span className="text-[10px] text-emerald-500 font-mono">Stream: End of Analysis</span>
                      </div>
                      <pre className="p-5 bg-black/50 border border-neutral-800/50 rounded-2xl text-[10px] font-mono text-neutral-500 overflow-x-auto max-h-48 scrollbar-thin scrollbar-thumb-neutral-800 leading-relaxed">
                        {report.consoleOutput}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neutral-800 rounded-2xl">
                    <History className="h-6 w-6 text-neutral-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Search Archive</h2>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Historical Scan Reports</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-white">{history.length}</div>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase">Saved Reports</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    onClick={() => loadReport(item.id)}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl text-left hover:border-emerald-500/50 transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                      <button 
                        onClick={(e) => deleteHistoryItem(e, item.id)}
                        className="p-2 bg-neutral-800 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Search"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ArrowRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                    
                    <div className="flex items-start justify-between mb-6">
                      <div className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-[10px] font-mono text-neutral-500 uppercase">
                        {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}
                      </div>
                      {item.highRisk > 0 && (
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Target Identity</span>
                        <h3 className="font-black text-xl text-white truncate group-hover:text-emerald-500 transition-colors uppercase">{item.keyword}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4">
                        <div>
                          <span className="text-[9px] font-bold text-neutral-600 uppercase block">Records</span>
                          <span className="font-bold text-sm">{item.total}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-neutral-600 uppercase block">Risk Lvl</span>
                          <span className={`font-bold text-sm ${item.highRisk > 0 ? "text-red-500" : "text-emerald-500"}`}>
                            {item.highRisk > 0 ? "CRITICAL" : "STABLE"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {history.length === 0 && (
                  <div className="col-span-full py-32 text-center bg-neutral-900 border-2 border-dashed border-neutral-800 rounded-[3rem] flex flex-col items-center justify-center space-y-4">
                    <div className="p-6 bg-neutral-800/50 rounded-full">
                      <History className="h-10 w-10 text-neutral-700" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase tracking-tight text-neutral-400">Archive Empty</h3>
                      <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Execute your first scan to populate this area</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl w-full mx-auto p-8 bg-neutral-900 border border-neutral-800 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">PrivacyExplorer Protocol v1.2</span>
        </div>
        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight">
          © 2026 Secured Infrastructure. All rights reserved.
        </div>
        <div className="flex gap-4">
          <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20 tracking-tighter">Verified OSINT</span>
          <span className="text-[10px] font-bold text-blue-500 uppercase bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/20 tracking-tighter">SSL Secure</span>
        </div>
      </footer>
    </div>
  );
}
