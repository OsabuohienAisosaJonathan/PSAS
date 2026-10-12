import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, Database, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { apiFetchWithAuth } from '../../services/api.js';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [corpusStats, setCorpusStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [statsData, corpusData, logsData] = await Promise.all([
          apiFetchWithAuth('/admin/logs/stats'),
          apiFetchWithAuth('/admin/corpus/stats'),
          apiFetchWithAuth('/admin/logs?limit=8')
        ]);
        setStats(statsData);
        setCorpusStats(corpusData);
        setRecentLogs(logsData.logs || []);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-sm">
        Loading system telemetry and corpus statistics...
      </div>
    );
  }

  const dist = stats?.distribution || {};
  const total = stats?.totalAnalyses || 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyses */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Analyses Logged</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats?.totalAnalyses?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-500">Zero plaintext stored</div>
        </div>

        {/* Breach Detections */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Breach Detection Rate</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-red-400">
            {stats?.breachDetectionRate || 0}%
          </div>
          <div className="text-[11px] text-slate-500">Corpus matches detected</div>
        </div>

        {/* Average Entropy */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Guess Entropy</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {stats?.averageEntropy || 0} <span className="text-xs font-normal text-slate-400">bits</span>
          </div>
          <div className="text-[11px] text-slate-500">Effective search space</div>
        </div>

        {/* Corpus Size */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Indexed Breach Corpus</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-indigo-300">
            {corpusStats?.totalEntries?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">hashes</span>
          </div>
          <div className="text-[11px] text-slate-500">Local B-Tree indexed</div>
        </div>
      </div>

      {/* Strength Category Distribution */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Strength-Category Empirical Distribution</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Average Score: {stats?.averageScore || 0} / 100
          </span>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Very Weak', count: dist['Very Weak'] || 0, color: 'bg-red-500' },
            { label: 'Weak', count: dist['Weak'] || 0, color: 'bg-orange-500' },
            { label: 'Fair', count: dist['Fair'] || 0, color: 'bg-amber-500' },
            { label: 'Strong', count: dist['Strong'] || 0, color: 'bg-blue-500' },
            { label: 'Very Strong', count: dist['Very Strong'] || 0, color: 'bg-emerald-500' }
          ].map((item) => {
            const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
            return (
              <div key={item.label} className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{item.label}</span>
                  <span className="font-mono">{item.count} ({pct}%)</span>
                </div>
                <div className="w-full bg-cyber-dark rounded-full h-2 overflow-hidden">
                  <div
                    className={`${item.color} h-full transition-all`}
                    style={{ width: `${Math.max(1, Number(pct))}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Analysis Telemetry (No Plaintext) */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
        <h4 className="text-sm font-bold text-white mb-4">Recent Telemetry Activity (Metadata Only)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cyber-border text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Entropy</th>
                <th className="py-2.5 px-3">Breach Status</th>
                <th className="py-2.5 px-3">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/40 text-slate-300">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500">
                    No analyses recorded yet. Use the interactive analyzer to generate telemetry.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">{log.analysis_type}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{log.score} / 100</td>
                    <td className="py-2.5 px-3">{log.strength_category}</td>
                    <td className="py-2.5 px-3 font-mono">{log.entropy} bits</td>
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
      </div>
    </div>
  );
};
