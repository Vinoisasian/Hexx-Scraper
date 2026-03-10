import { useState, useEffect, useRef } from "react";
import { Play, SquareSquare, CheckCircle2, XCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface JobResult {
  url: string;
  status: string;
  data?: any;
  error?: string;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<string[]>([
    "[INFO] Dashboard initialized. Waiting for commands..."
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<JobResult[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll logs
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    const unlistenStdout = listen<string>("sidecar-stdout", (event) => {
      // Python's stdout emits JSON strings per line
      try {
        const data = JSON.parse(event.payload);
        if (data.type === "progress") {
          setLogs(prev => [...prev, `[PROGRESS] ${data.message}`]);
          if (data.result) {
             setResults(prev => {
                const newRes = [...prev];
                const existing = newRes.findIndex(r => r.url === data.result.url);
                if(existing >= 0) {
                   newRes[existing] = data.result;
                } else {
                   newRes.push(data.result);
                }
                return newRes;
             });
          }
        } else if (data.type === "done") {
          setLogs(prev => [...prev, `[DONE] ${data.message || "Batch finished."}`]);
          setIsRunning(false);
        } else if (data.type === "error") {
          setLogs(prev => [...prev, `[ERROR] ${data.message}`]);
          setIsRunning(false);
        }
      } catch {
        setLogs(prev => [...prev, event.payload.trim()]);
      }
    });

    const unlistenStderr = listen<string>("sidecar-stderr", (event) => {
      setLogs(prev => [...prev, `[STDERR] ${event.payload.trim()}`]);
    });

    const unlistenExit = listen<string>("sidecar-exit", () => {
      setLogs(prev => [...prev, "[INFO] Sidecar process exited."]);
      setIsRunning(false);
    });

    return () => {
      unlistenStdout.then(f => f());
      unlistenStderr.then(f => f());
      unlistenExit.then(f => f());
    };
  }, []);

  const handleStartScrape = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs(prev => [
      ...prev, 
      "[INFO] Warm-up: Unpacking Python engine... (may take 30s on first run)",
      "[INFO] Starting full pipeline scrape..."
    ]);
    
    try {
      await invoke("run_scraper", { payloadJson: JSON.stringify({ action: "pipeline" }) });
    } catch (err) {
      setLogs(prev => [...prev, `[ERROR] Failed to start sidecar: ${err}`]);
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <section className="bg-[var(--color-slate-bg)] border border-[var(--color-border)] rounded-[var(--radius-normal)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="text-sm font-semibold">Active Jobs</h2>
          <div className="flex gap-2">
             <button 
               onClick={handleStartScrape}
               disabled={isRunning}
               className="flex items-center gap-1.5 text-xs bg-[var(--color-slate-primary)] text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
             >
               <Play className="w-3.5 h-3.5" /> Start Pipeline
             </button>
             <button 
               disabled={!isRunning}
               className="flex items-center gap-1.5 text-xs bg-[var(--color-slate-surface)] border border-[var(--color-border)] px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
             >
               <SquareSquare className="w-3.5 h-3.5" /> Stop All
             </button>
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[150px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-slate-surface)] text-gray-400 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Metrics</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-slate-surface)] transition-colors">
                  <td className="px-4 py-3 text-gray-300 max-w-[250px] truncate" title={res.url}>
                    {res.url}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {res.url.includes("reddit.com") ? "Reddit" : "X (Twitter)"}
                  </td>
                  <td className="px-4 py-3">
                    {res.status === "ok" ? (
                      <span className="flex items-center gap-1.5 text-green-500">
                        <CheckCircle2 className="w-4 h-4" /> Ok
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-500" title={res.error}>
                        <XCircle className="w-4 h-4" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {res.data ? JSON.stringify(res.data) : "—"}
                  </td>
                </tr>
              ))}
              
              {results.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No recent jobs</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-[var(--color-slate-bg)] border border-[var(--color-border)] rounded-[var(--radius-normal)] overflow-hidden flex flex-col h-[350px]">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold">Live Logs</h2>
        </div>
        <div className="flex-1 p-4 bg-[#0a0a0a] text-[#00ff00] font-mono text-xs overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="mb-1" style={{ wordBreak: "break-all" }}>{log}</div>
          ))}
          <div ref={logsEndRef} className="animate-pulse">_</div>
        </div>
      </section>
    </div>
  );
}