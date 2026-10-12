import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  Eye,
  EyeOff,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Cpu,
  Binary,
  Layers,
  HelpCircle,
  Activity,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { PasswordAnalyzer, PasswordAnalysisResult, BreachStatusResult } from '@psas/core';
import { sha256Hex } from '../services/crypto.js';
import { checkBreachByHash, sendAnalysisTelemetry } from '../services/api.js';

export const PasswordAnalyzerCard: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<PasswordAnalysisResult | null>(null);
  const [breachStatus, setBreachStatus] = useState<BreachStatusResult>({
    checked: false,
    breached: false,
    message: 'Awaiting candidate input...',
    riskLevel: 'NONE'
  });
  const [isCheckingBreach, setIsCheckingBreach] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const telemetryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time Keystroke Analysis (< 200ms target)
  useEffect(() => {
    if (!password) {
      setAnalysis(null);
      setBreachStatus({
        checked: false,
        breached: false,
        message: 'Awaiting candidate input...',
        riskLevel: 'NONE'
      });
      return;
    }

    // Immediate client-side calculation
    const immediateResult = PasswordAnalyzer.analyze(password, { breachStatus });
    setAnalysis(immediateResult);

    // Debounced asynchronous breach lookup via SHA-256 hash (never sending plaintext!)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      setIsCheckingBreach(true);
      try {
        const hash = await sha256Hex(password);
        const breachResult = await checkBreachByHash(hash);
        setBreachStatus(breachResult);

        // Re-analyze with confirmed breach status
        const updatedResult = PasswordAnalyzer.analyze(password, { breachStatus: breachResult });
        setAnalysis(updatedResult);

        // Record telemetry metadata asynchronously (no plaintext)
        if (telemetryTimerRef.current) clearTimeout(telemetryTimerRef.current);
        telemetryTimerRef.current = setTimeout(() => {
          sendAnalysisTelemetry({
            analysis_type: 'INTERACTIVE',
            score: updatedResult.compositeScore.score,
            strength_category: updatedResult.compositeScore.category,
            entropy: updatedResult.entropy.effectiveBits,
            estimated_guesses: updatedResult.crackTime.formattedGuesses,
            breach_detected: breachResult.breached,
            processing_time_ms: updatedResult.latencyMs
          });
        }, 1500);
      } catch (err) {
        console.error('Breach check error:', err);
      } finally {
        setIsCheckingBreach(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [password]);

  const handleClear = () => {
    setPassword('');
    setAnalysis(null);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Very Weak':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          bar: 'bg-red-500',
          glow: 'glow-danger'
        };
      case 'Weak':
        return {
          bg: 'bg-orange-500/10',
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          bar: 'bg-orange-500',
          glow: 'glow-danger'
        };
      case 'Fair':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          bar: 'bg-amber-500',
          glow: ''
        };
      case 'Strong':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          bar: 'bg-blue-500',
          glow: 'glow-accent'
        };
      case 'Very Strong':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          bar: 'bg-emerald-500',
          glow: 'glow-success'
        };
      default:
        return {
          bg: 'bg-slate-800',
          text: 'text-slate-400',
          border: 'border-slate-700',
          bar: 'bg-slate-600',
          glow: ''
        };
    }
  };

  const colors = getCategoryColor(analysis?.compositeScore.category);

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <label htmlFor="candidate-password-input" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span>Enter a password to analyse</span>
            <span className="text-xs text-slate-500 font-normal">(Instant keystroke evaluation)</span>
          </label>

          {analysis && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-md self-start sm:self-auto">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Analysis time: {analysis.latencyMs} ms</span>
            </div>
          )}
        </div>

        {/* Masked Input Field */}
        <div className="relative">
          <input
            id="candidate-password-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type or paste a candidate password to begin security evaluation..."
            className="w-full bg-cyber-dark/80 border border-cyber-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl px-4 py-3.5 pr-24 text-base sm:text-lg text-white font-mono placeholder:text-slate-600 placeholder:font-sans transition-all outline-none"
            autoComplete="off"
            spellCheck="false"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {password && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-cyber-surface transition-colors"
                title="Clear input"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-cyber-surface transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Character Class Counters */}
        {analysis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-cyber-border text-xs text-slate-400">
            <div className={`p-2 rounded-lg border flex items-center justify-between ${analysis.characterAnalysis.hasLowercase ? 'bg-blue-950/30 border-blue-500/30 text-blue-300' : 'bg-slate-900/50 border-slate-800'}`}>
              <span>Lowercase [a-z]</span>
              <span className="font-mono font-bold">{analysis.characterAnalysis.lowercaseCount}</span>
            </div>
            <div className={`p-2 rounded-lg border flex items-center justify-between ${analysis.characterAnalysis.hasUppercase ? 'bg-blue-950/30 border-blue-500/30 text-blue-300' : 'bg-slate-900/50 border-slate-800'}`}>
              <span>Uppercase [A-Z]</span>
              <span className="font-mono font-bold">{analysis.characterAnalysis.uppercaseCount}</span>
            </div>
            <div className={`p-2 rounded-lg border flex items-center justify-between ${analysis.characterAnalysis.hasNumber ? 'bg-blue-950/30 border-blue-500/30 text-blue-300' : 'bg-slate-900/50 border-slate-800'}`}>
              <span>Numbers [0-9]</span>
              <span className="font-mono font-bold">{analysis.characterAnalysis.numberCount}</span>
            </div>
            <div className={`p-2 rounded-lg border flex items-center justify-between ${analysis.characterAnalysis.hasSymbol ? 'bg-blue-950/30 border-blue-500/30 text-blue-300' : 'bg-slate-900/50 border-slate-800'}`}>
              <span>Symbols [!@#$]</span>
              <span className="font-mono font-bold">{analysis.characterAnalysis.symbolCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Strength & Score Banner */}
          <div className={`bg-cyber-card border ${colors.border} rounded-2xl p-6 ${colors.glow} transition-all`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Composite Strength Assessment
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${colors.text}`}>
                    {analysis.compositeScore.category.toUpperCase()}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                    Score: {analysis.compositeScore.score} / 100
                  </span>
                </div>
              </div>

              {/* Estimated Guesses Badge */}
              <div className="bg-cyber-surface/60 border border-cyber-border px-4 py-2.5 rounded-xl self-start md:self-auto">
                <span className="text-xs text-slate-400 block">Estimated Guess Count</span>
                <span className="text-lg font-mono font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  {analysis.crackTime.formattedGuesses} <span className="text-xs text-slate-400 font-sans font-normal">guesses</span>
                </span>
              </div>
            </div>

            {/* Strength Meter Progress Bar */}
            <div className="w-full bg-cyber-dark/80 rounded-full h-3.5 p-0.5 border border-cyber-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
                style={{ width: `${Math.max(5, analysis.compositeScore.score)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
              <span>0 (Very Weak)</span>
              <span>30 (Weak)</span>
              <span>50 (Fair)</span>
              <span>70 (Strong)</span>
              <span>85-100 (Very Strong)</span>
            </div>
          </div>

          {/* Entropy & Breach Dual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Information-Theoretic Entropy Card */}
            <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                    <Binary className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Entropy Estimation</h4>
                    <p className="text-xs text-slate-400">Shannon Information Theory</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-bold text-blue-400">
                    {analysis.entropy.theoreticalBits} <span className="text-xs text-slate-400">bits</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-cyber-surface/50 border border-cyber-border rounded-xl flex justify-between items-center">
                  <span className="text-slate-400">Length (L):</span>
                  <span className="font-mono font-bold text-white">{analysis.entropy.length} characters</span>
                </div>
                <div className="p-3 bg-cyber-surface/50 border border-cyber-border rounded-xl flex justify-between items-center">
                  <span className="text-slate-400">Character Space (N):</span>
                  <span className="font-mono font-bold text-white">{analysis.entropy.poolSize} characters</span>
                </div>
                <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex justify-between items-center text-indigo-300">
                  <span className="flex items-center gap-1">
                    <span>Effective Guess Entropy:</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-200">{analysis.entropy.effectiveBits} bits</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed italic border-t border-cyber-border pt-2">
                  {analysis.entropy.explanation}
                </p>
              </div>
            </div>

            {/* Breach Corpus Status Card */}
            <div className={`bg-cyber-card border rounded-2xl p-6 ${breachStatus.breached ? 'border-red-500/40 bg-red-950/20 glow-danger' : 'border-cyber-border'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg border ${breachStatus.breached ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    {breachStatus.breached ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Breach Corpus Status</h4>
                    <p className="text-xs text-slate-400">Local Compromised Database</p>
                  </div>
                </div>

                {isCheckingBreach && (
                  <span className="text-xs text-blue-400 animate-pulse font-mono">Verifying...</span>
                )}
              </div>

              <div className="space-y-3">
                <div className={`p-3.5 rounded-xl border flex items-center space-x-3 ${
                  breachStatus.breached
                    ? 'bg-red-900/40 border-red-500/40 text-red-200'
                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                }`}>
                  {breachStatus.breached ? (
                    <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div className="text-xs">
                    <p className="font-bold">
                      {breachStatus.breached
                        ? '⚠ PASSWORD FOUND IN BREACH CORPUS'
                        : '✓ No match found in local breach corpus'}
                    </p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {breachStatus.message}
                    </p>
                  </div>
                </div>

                {breachStatus.breached && (
                  <div className="p-3 bg-red-950/40 border border-red-600/30 rounded-xl text-xs text-red-300 space-y-1">
                    <span className="font-semibold text-red-200 block">Risk Level: CRITICAL</span>
                    <p className="text-[11px] text-red-300/80">
                      Even with high length, breached credentials are cataloged in automated attacker wordlists. Composite score has been capped to Very Weak.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Crack-Time Estimation Across 3 Attacker Models */}
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Estimated Crack Times</h4>
                  <p className="text-xs text-slate-400">Three Research Attacker Threat Models</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                Model: Rate-Dependent Exhaustion
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Model 1: Online Throttled */}
              <div className="p-4 bg-cyber-surface/50 border border-cyber-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Model 1 — Online Throttled</span>
                  <span className="text-[10px] font-mono text-slate-400">~10 guesses/s</span>
                </div>
                <div className="text-xl font-mono font-bold text-blue-400">
                  {analysis.crackTime.models.online_throttled.formattedTime}
                </div>
                <p className="text-[11px] text-slate-400">
                  {analysis.crackTime.models.online_throttled.description}
                </p>
              </div>

              {/* Model 2: Offline Fast Hash */}
              <div className="p-4 bg-cyber-surface/50 border border-cyber-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Model 2 — Offline Fast Hash</span>
                  <span className="text-[10px] font-mono text-slate-400">~10B guesses/s</span>
                </div>
                <div className={`text-xl font-mono font-bold ${
                  analysis.crackTime.models.offline_fast_hash.seconds < 3600
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`}>
                  {analysis.crackTime.models.offline_fast_hash.formattedTime}
                </div>
                <p className="text-[11px] text-slate-400">
                  {analysis.crackTime.models.offline_fast_hash.description}
                </p>
              </div>

              {/* Model 3: Offline Slow / Salted Hash */}
              <div className="p-4 bg-cyber-surface/50 border border-cyber-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Model 3 — Offline Slow Hash</span>
                  <span className="text-[10px] font-mono text-slate-400">~10k guesses/s</span>
                </div>
                <div className="text-xl font-mono font-bold text-emerald-400">
                  {analysis.crackTime.models.offline_slow_hash.formattedTime}
                </div>
                <p className="text-[11px] text-slate-400">
                  {analysis.crackTime.models.offline_slow_hash.description}
                </p>
              </div>
            </div>

            <div className="mt-4 p-2.5 bg-cyber-dark/60 border border-cyber-border rounded-lg flex items-center space-x-2 text-xs text-slate-400">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Academic Disclaimer:</strong> {analysis.crackTime.tooltipNote}
              </span>
            </div>
          </div>

          {/* Pattern Warnings & Actionable Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pattern Warnings */}
            <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Detected Structural Patterns</h4>
                  <p className="text-xs text-slate-400">{analysis.patterns.length} pattern(s) identified</p>
                </div>
              </div>

              {analysis.patterns.length === 0 ? (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No predictable dictionary, keyboard walks, or sequential patterns identified.</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {analysis.patterns.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-cyber-surface/60 border border-cyber-border rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          {p.patternName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/50 text-red-300 border border-red-500/30">
                          -{p.penalty} pts
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{p.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actionable Recommendations */}
            <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Actionable Recommendations</h4>
                  <p className="text-xs text-slate-400">Usable security guidance</p>
                </div>
              </div>

              <div className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-cyber-surface/60 border border-cyber-border rounded-xl flex items-start space-x-2.5 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
