import React, { useState, useEffect } from 'react';
import { Shield, FileText, ChevronLeft, ChevronRight, RefreshCw, Download } from 'lucide-react';
import { apiFetchWithAuth } from '../../services/api.js';

export const AdminAnalysisLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const data = await apiFetchWithAuth(`/admin/logs?page=${p}&limit=20`);
      setLogs(data.logs || []);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const exportLogsCSV = () => {
    if (logs.length === 0) return;
    const header = 'id,analysis_type,score,strength_category,entropy,estimated_guesses,breach_detected,processing_time_ms,created_at\n';
    const rows = logs.map(l =>
      `${l.id},${l.analysis_type},${l.score},${l.strength_category},${l.entropy},"${l.estimated_guesses}",${l.breach_detected},${l.processing_time_ms},${l.created_at}`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `psas_analysis_logs_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Analysis Telemetry Logs (Zero Plaintext)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Historical metadata audit trail. Guarantees 100% privacy compliance — no plaintext passwords are saved.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportLogsCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyber-surface hover:bg-slate-700 border border-cyber-border text-slate-200 rounded-lg text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => fetchLogs(page)}
              className="p-1.5 bg-cyber-surface hover:bg-slate-700 border border-cyber-border text-slate-300 rounded-lg"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cyber-border text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3">Log ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Analysis Type</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Entropy</th>
                <th className="py-2.5 px-3">Guesses</th>
                <th className="py-2.5 px-3">Breach Flag</th>
                <th className="py-2.5 px-3">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/40 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500">
                    {loading ? 'Fetching logs...' : 'No telemetry records present.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-cyber-surface/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400">LOG-{log.id}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">{log.analysis_type}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{log.score}</td>
                    <td className="py-2.5 px-3">{log.strength_category}</td>
                    <td className="py-2.5 px-3 font-mono">{log.entropy} bits</td>
                    <td className="py-2.5 px-3 font-mono">{log.estimated_guesses}</td>
                    <td className="py-2.5 px-3">
                      {log.breach_detected ? (
                        <span className="text-red-400 font-bold">⚠ Breached</span>
                      ) : (
                        <span className="text-emerald-400">✓ Clean</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-blue-400">{log.processing_time_ms} ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-cyber-border text-xs text-slate-400">
          <span>Total records: {total}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-cyber-border disabled:opacity-30 hover:bg-cyber-surface"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-cyber-border disabled:opacity-30 hover:bg-cyber-surface"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
