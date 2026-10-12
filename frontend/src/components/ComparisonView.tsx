import React, { useState } from 'react';
import { Columns, Plus, Trash2, ArrowUpDown, Shield, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { PasswordAnalyzer, PasswordAnalysisResult } from '@psas/core';
import { sha256Hex } from '../services/crypto.js';
import { checkBreachByHash } from '../services/api.js';

interface ComparisonCandidate {
  id: string;
  label: string;
  input: string;
  showInput: boolean;
  analysis: PasswordAnalysisResult | null;
  loading: boolean;
}

export const ComparisonView: React.FC = () => {
  const [candidates, setCandidates] = useState<ComparisonCandidate[]>([
    { id: '1', label: 'Test Password A', input: '', showInput: false, analysis: null, loading: false },
    { id: '2', label: 'Test Password B', input: '', showInput: false, analysis: null, loading: false }
  ]);

  const handleInputChange = async (id: string, value: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, input: value, loading: true } : c))
    );

    if (!value) {
      setCandidates(prev =>
        prev.map(c => (c.id === id ? { ...c, analysis: null, loading: false } : c))
      );
      return;
    }

    try {
      const hash = await sha256Hex(value);
      const breachStatus = await checkBreachByHash(hash);
      const result = PasswordAnalyzer.analyze(value, { breachStatus });

      setCandidates(prev =>
        prev.map(c => (c.id === id ? { ...c, analysis: result, loading: false } : c))
      );
    } catch {
      const fallbackResult = PasswordAnalyzer.analyze(value);
      setCandidates(prev =>
        prev.map(c => (c.id === id ? { ...c, analysis: fallbackResult, loading: false } : c))
      );
    }
  };

  const addCandidate = () => {
    if (candidates.length >= 6) return;
    const nextLabelChar = String.fromCharCode(65 + candidates.length); // C, D, E...
    const newId = String(Date.now());
    setCandidates(prev => [
      ...prev,
      {
        id: newId,
        label: `Test Password ${nextLabelChar}`,
        input: '',
        showInput: false,
        analysis: null,
        loading: false
      }
    ]);
  };

  const removeCandidate = (id: string) => {
    if (candidates.length <= 2) return;
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const toggleVisibility = (id: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, showInput: !c.showInput } : c))
    );
  };

  const getScoreBadge = (score: number, category: string) => {
    if (category === 'Very Weak') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (category === 'Weak') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (category === 'Fair') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (category === 'Strong') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                <Columns className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Comparative Research Testbench</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Side-by-side analysis of candidate passwords. Plaintext passwords are not saved or exposed in research exports.
            </p>
          </div>

          <button
            onClick={addCandidate}
            disabled={candidates.length >= 6}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>

        {/* Candidate Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {candidates.map((cand) => (
            <div key={cand.id} className="p-4 bg-cyber-surface/60 border border-cyber-border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{cand.label}</span>
                {candidates.length > 2 && (
                  <button
                    onClick={() => removeCandidate(cand.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Remove candidate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type={cand.showInput ? 'text' : 'password'}
                  value={cand.input}
                  onChange={(e) => handleInputChange(cand.id, e.target.value)}
                  placeholder="Enter test password..."
                  className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 pr-16 text-sm text-white font-mono placeholder:text-slate-600 outline-none focus:border-blue-500"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility(cand.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {cand.showInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {cand.analysis && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Score: {cand.analysis.compositeScore.score}/100</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getScoreBadge(cand.analysis.compositeScore.score, cand.analysis.compositeScore.category)}`}>
                    {cand.analysis.compositeScore.category}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparative Evaluation Matrix Table */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 overflow-hidden">
        <h4 className="text-sm font-bold text-white mb-4">Multi-Dimensional Comparison Matrix</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cyber-border text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-3 px-3">Metric</th>
                {candidates.map((c) => (
                  <th key={c.id} className="py-3 px-3">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50 text-slate-200">
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-400">Length (Chars)</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3 font-mono">
                    {c.analysis ? c.analysis.length : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-400">Theoretical Entropy</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3 font-mono">
                    {c.analysis ? `${c.analysis.entropy.theoreticalBits} bits` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-400">Effective Entropy</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3 font-mono text-blue-400">
                    {c.analysis ? `${c.analysis.entropy.effectiveBits} bits` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-400">Pattern Detected</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3">
                    {c.analysis ? (
                      c.analysis.patterns.length > 0 ? (
                        <span className="text-amber-400 font-medium">{c.analysis.patterns.length} pattern(s)</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">None</span>
                      )
                    ) : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-400">Breach Corpus Status</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3">
                    {c.analysis ? (
                      c.analysis.breachStatus.breached ? (
                        <span className="text-red-400 font-bold">⚠ BREACHED</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">✓ Clean</span>
                      )
                    ) : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-400">Estimated Guesses</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3 font-mono">
                    {c.analysis ? c.analysis.crackTime.formattedGuesses : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-400">Online Throttled Crack</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3 font-mono text-slate-300">
                    {c.analysis ? c.analysis.crackTime.models.online_throttled.formattedTime : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-400">Offline Fast Hash Crack</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3 font-mono text-slate-300">
                    {c.analysis ? c.analysis.crackTime.models.offline_fast_hash.formattedTime : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-400">Offline Slow Hash Crack</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3 font-mono text-slate-300">
                    {c.analysis ? c.analysis.crackTime.models.offline_slow_hash.formattedTime : '—'}
                  </td>
                ))}
              </tr>
              <tr className="bg-cyber-surface/40 font-bold">
                <td className="py-3 px-3 text-white">Final Composite Score</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3 font-mono text-lg text-white">
                    {c.analysis ? `${c.analysis.compositeScore.score} / 100` : '—'}
                  </td>
                ))}
              </tr>
              <tr className="bg-cyber-surface/60 font-bold">
                <td className="py-3 px-3 text-white">Final Security Category</td>
                {candidates.map((c) => (
                  <td key={c.id} className="py-3 px-3">
                    {c.analysis ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${getScoreBadge(c.analysis.compositeScore.score, c.analysis.compositeScore.category)}`}>
                        {c.analysis.compositeScore.category}
                      </span>
                    ) : '—'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
