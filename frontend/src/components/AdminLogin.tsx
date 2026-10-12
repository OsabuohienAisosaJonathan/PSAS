import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';
import { apiLogin } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const AdminLogin: React.FC = () => {
  const { loginSuccess } = useAuth();
  const [email, setEmail] = useState<string>('admin@psas.local');
  const [password, setPassword] = useState<string>('Admin2026!ResearchSecure');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiLogin(email, password);
      loginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-cyber-card border border-cyber-border rounded-2xl p-8 shadow-2xl">
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-2xl">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Admin & Researcher Portal</h3>
        <p className="text-xs text-slate-400">
          Enter administrative credentials to access corpus management, bulk audit tools, and evaluation benchmarks.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl mb-4 text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-cyber-dark border border-cyber-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-cyber-dark border border-cyber-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
        >
          <KeyRound className="w-4 h-4" />
          <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-cyber-border text-center text-xs text-slate-500">
        Default Seed Account: <code className="text-slate-400 font-mono">admin@psas.local</code>
      </div>
    </div>
  );
};
