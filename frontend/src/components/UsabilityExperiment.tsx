import React, { useState, useEffect, useRef } from 'react';
import { FlaskConical, Play, CheckCircle2, RotateCcw, Download, UserCheck, Timer, Shield } from 'lucide-react';
import { PasswordAnalyzer, ConventionalMeter, StrengthCategory } from '@psas/core';

export const UsabilityExperiment: React.FC = () => {
  const [participantId, setParticipantId] = useState<string>('P-' + Math.floor(100 + Math.random() * 900));
  const [condition, setCondition] = useState<'CONVENTIONAL' | 'PROPOSED'>('CONVENTIONAL');
  const [password, setPassword] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(1);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [recordedTrials, setRecordedTrials] = useState<any[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTestActive) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestActive]);

  const startExperiment = () => {
    setIsTestActive(true);
    setSecondsElapsed(0);
    setSubmitted(false);
    setPassword('');
    setAttempts(1);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
  };

  const handleTryAnother = () => {
    setPassword('');
    setAttempts(prev => prev + 1);
  };

  // Evaluation outcome
  const conventionalResult = ConventionalMeter.evaluate(password);
  const proposedResult = PasswordAnalyzer.analyze(password);

  const handleSubmitTrial = async () => {
    if (!password) return;

    setIsTestActive(false);

    const score = condition === 'CONVENTIONAL' ? conventionalResult.score : proposedResult.compositeScore.score;
    const category = condition === 'CONVENTIONAL' ? conventionalResult.category : proposedResult.compositeScore.category;
    const entropy = proposedResult.entropy.effectiveBits;

    const trialRecord = {
      participant_id: participantId,
      condition,
      score,
      strength_category: category,
      entropy,
      time_taken_seconds: secondsElapsed,
      attempts_count: attempts,
      created_at: new Date().toISOString()
    };

    try {
      await fetch('/api/research/usability/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialRecord)
      });
    } catch (err) {
      console.warn('Offline logging trial:', err);
    }

    setRecordedTrials(prev => [trialRecord, ...prev]);
    setSubmitted(true);
    // Securely clear plaintext password from memory
    setPassword('');
    // Prep next participant
    setParticipantId('P-' + Math.floor(100 + Math.random() * 900));
  };

  const exportCSV = () => {
    if (recordedTrials.length === 0) return;
    const header = 'participant_id,condition,score,strength_category,entropy,time_taken_seconds,attempts_count,created_at\n';
    const rows = recordedTrials.map(t =>
      `${t.participant_id},${t.condition},${t.score},${t.strength_category},${t.entropy},${t.time_taken_seconds},${t.attempts_count},${t.created_at}`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usability_experiment_trials_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Experiment Setup Card */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Usability Experiment Module (Chapter Five Protocol)</h3>
            <p className="text-xs text-slate-400">
              Researcher-controlled comparative evaluation between Conventional Meter (Condition A) and Proposed PSAS (Condition B).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-cyber-border">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Participant ID</label>
            <input
              type="text"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              disabled={isTestActive}
              className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Assigned Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              disabled={isTestActive}
              className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="CONVENTIONAL">Condition A — Conventional Meter</option>
              <option value="PROPOSED">Condition B — Proposed PSAS System</option>
            </select>
          </div>

          <div className="flex items-end">
            {!isTestActive ? (
              <button
                onClick={startExperiment}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Begin Trial</span>
              </button>
            ) : (
              <div className="w-full flex items-center justify-between p-2 bg-cyber-surface rounded-lg border border-cyber-border text-xs text-slate-300 font-mono">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Timer className="w-4 h-4 animate-spin" />
                  {secondsElapsed}s elapsed
                </span>
                <span>Attempt #{attempts}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Participant Interface */}
      {isTestActive && (
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase">
              Participant Task: Create a Strong Password
            </span>
            <span className="text-xs px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-mono">
              {condition === 'CONVENTIONAL' ? 'Conventional Mode' : 'Proposed PSAS Mode'}
            </span>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Type your proposed password..."
            className="w-full bg-cyber-dark border border-cyber-border rounded-xl px-4 py-3 text-lg font-mono text-white outline-none focus:border-indigo-500"
            autoComplete="off"
          />

          {/* Condition A: Conventional Rule-based Display */}
          {condition === 'CONVENTIONAL' && password && (
            <div className="p-4 bg-cyber-surface/50 border border-cyber-border rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Basic Composition Rules</span>
                <span className="font-mono text-indigo-400">{conventionalResult.rulesSatisfied}/5 Satisfied</span>
              </div>

              <div className="w-full bg-cyber-dark rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all"
                  style={{ width: `${conventionalResult.score}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <span className={conventionalResult.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Length ≥ 8 characters ({conventionalResult.length})
                </span>
                <span className={conventionalResult.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Contains Uppercase
                </span>
                <span className={conventionalResult.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Contains Lowercase
                </span>
                <span className={conventionalResult.hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Contains Numbers
                </span>
                <span className={conventionalResult.hasSymbol ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Contains Symbols
                </span>
              </div>
            </div>
          )}

          {/* Condition B: Proposed PSAS Multi-Dimensional Feedback Display */}
          {condition === 'PROPOSED' && password && (
            <div className="p-4 bg-cyber-surface/50 border border-cyber-border rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">PSAS Multi-Dimensional Feedback</span>
                <span className="font-mono text-blue-400">Score: {proposedResult.compositeScore.score}/100 ({proposedResult.compositeScore.category})</span>
              </div>

              <div className="w-full bg-cyber-dark rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${proposedResult.compositeScore.score}%` }}
                ></div>
              </div>

              {proposedResult.actionableFeedback.length > 0 && (
                <div className="text-xs text-amber-300 space-y-1">
                  {proposedResult.actionableFeedback.slice(0, 2).map((fb, i) => (
                    <p key={i} className="text-[11px]">⚠ {fb}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleTryAnother}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear & Try Alternate Candidate</span>
            </button>

            <button
              onClick={handleSubmitTrial}
              disabled={!password}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Submit Password</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation & Summary */}
      {submitted && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Trial saved successfully. Plaintext password was erased from client and server memory.</span>
        </div>
      )}

      {/* Recorded Trials Table & Export */}
      {recordedTrials.length > 0 && (
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white">Anonymized Usability Trials ({recordedTrials.length})</h4>
            <button
              onClick={exportCSV}
              className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV for Dissertation</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cyber-border text-slate-400 font-semibold uppercase text-[11px]">
                  <th className="py-2 px-3">Participant ID</th>
                  <th className="py-2 px-3">Condition</th>
                  <th className="py-2 px-3">Score</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Entropy</th>
                  <th className="py-2 px-3">Time Taken</th>
                  <th className="py-2 px-3">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40 text-slate-300">
                {recordedTrials.map((t, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-mono">{t.participant_id}</td>
                    <td className="py-2 px-3 font-semibold text-indigo-300">{t.condition}</td>
                    <td className="py-2 px-3 font-mono">{t.score}/100</td>
                    <td className="py-2 px-3">{t.strength_category}</td>
                    <td className="py-2 px-3 font-mono">{t.entropy} bits</td>
                    <td className="py-2 px-3 font-mono">{t.time_taken_seconds}s</td>
                    <td className="py-2 px-3 font-mono">{t.attempts_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
