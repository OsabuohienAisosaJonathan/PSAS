import React, { useState, useEffect } from 'react';
import { Database, Plus, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Hash } from 'lucide-react';
import { apiFetchWithAuth } from '../../services/api.js';

export const AdminBreachCorpus: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [integrityStatus, setIntegrityStatus] = useState<any>(null);
  const [newHash, setNewHash] = useState<string>('');
  const [newSource, setNewSource] = useState<string>('Custom Research');
  const [newFrequency, setNewFrequency] = useState<number>(1000);
  const [addMessage, setAddMessage] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await apiFetchWithAuth('/admin/corpus/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load corpus stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHash) return;

    try {
      await apiFetchWithAuth('/admin/corpus/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password_hash: newHash.trim().toLowerCase(),
          hash_type: newHash.length === 40 ? 'SHA-1' : 'SHA-256',
          frequency: newFrequency,
          source: newSource
        })
      });
      setAddMessage('Corpus entry successfully inserted and indexed.');
      setNewHash('');
      loadStats();
    } catch (err: any) {
      setAddMessage('Error: ' + err.message);
    }
  };

  const handleVerifyIntegrity = async () => {
    try {
      const res = await apiFetchWithAuth('/admin/corpus/verify', { method: 'POST' });
      setIntegrityStatus(res);
    } catch (err: any) {
      alert('Integrity check failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Corpus Header & Integrity */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Local Breach Corpus Management</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Indexed repository of known compromised password hashes. Plaintext passwords are never stored.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleVerifyIntegrity}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-cyber-surface hover:bg-slate-700 border border-cyber-border text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Run Integrity Check</span>
            </button>
            <button
              onClick={loadStats}
              className="p-2 bg-cyber-surface hover:bg-slate-700 border border-cyber-border text-slate-300 rounded-xl"
              title="Refresh statistics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-cyber-border">
          <div className="p-4 bg-cyber-surface/60 border border-cyber-border rounded-xl">
            <span className="text-xs text-slate-400 block">Total Corpus Entries</span>
            <span className="text-2xl font-mono font-bold text-white">
              {stats?.totalEntries?.toLocaleString() || 0}
            </span>
          </div>

          <div className="p-4 bg-cyber-surface/60 border border-cyber-border rounded-xl">
            <span className="text-xs text-slate-400 block">Corpus Sources</span>
            <span className="text-sm font-semibold text-indigo-300 mt-1 block">
              {stats?.sources?.map((s: any) => `${s.source} (${s.count})`).join(', ') || 'None'}
            </span>
          </div>

          <div className="p-4 bg-cyber-surface/60 border border-cyber-border rounded-xl">
            <span className="text-xs text-slate-400 block">Index Architecture</span>
            <span className="text-sm font-mono text-emerald-400 mt-1 block">
              B-Tree Indexed on password_hash
            </span>
          </div>
        </div>

        {/* Integrity Check Result */}
        {integrityStatus && (
          <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-1">
            <div className="flex items-center space-x-2 font-bold text-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Corpus Status: {integrityStatus.status}</span>
            </div>
            <p>Indexed rows verified: {integrityStatus.totalEntries.toLocaleString()} records.</p>
            <p className="text-slate-400">{integrityStatus.indexVerification}</p>
          </div>
        )}
      </div>

      {/* Add Single Hash Entry Form */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
        <h4 className="text-sm font-bold text-white mb-2">Insert New Compromised Hash Entry</h4>
        <p className="text-xs text-slate-400 mb-4">
          Directly register a known compromised SHA-256 or SHA-1 hash to the local database.
        </p>

        {addMessage && (
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl mb-4 text-xs text-indigo-300">
            {addMessage}
          </div>
        )}

        <form onSubmit={handleAddEntry} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Cryptographic Hash (SHA-256 or SHA-1)</label>
            <input
              type="text"
              value={newHash}
              onChange={(e) => setNewHash(e.target.value)}
              placeholder="e.g. 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
              required
              className="w-full bg-cyber-dark border border-cyber-border rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Source Label</label>
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Estimated Breach Frequency</label>
              <input
                type="number"
                value={newFrequency}
                onChange={(e) => setNewFrequency(parseInt(e.target.value) || 1)}
                className="w-full bg-cyber-dark border border-cyber-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Insert Indexed Hash</span>
          </button>
        </form>
      </div>
    </div>
  );
};
