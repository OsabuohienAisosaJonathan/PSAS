import React, { useState } from 'react';
import { Shield, KeyRound, ArrowRight } from 'lucide-react';
import { Navbar } from './components/Navbar.js';
import { EthicalNotice } from './components/EthicalNotice.js';
import { PasswordAnalyzerCard } from './components/PasswordAnalyzerCard.js';
import { ComparisonView } from './components/ComparisonView.js';
import { UsabilityExperiment } from './components/UsabilityExperiment.js';
import { AdminPortal } from './components/admin/AdminPortal.js';
import { AuthProvider } from './context/AuthContext.js';

type Tab = 'analyzer' | 'compare' | 'experiment' | 'admin';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('analyzer');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-cyber-dark text-slate-100 font-sans">
        <Navbar activeTab={activeTab} setActiveTab={(t) => setActiveTab(t as Tab)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Headers */}
          {activeTab === 'analyzer' && (
            <div className="mb-8 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Password Security Analyzer
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time multi-dimensional strength evaluation with entropy analysis, pattern recognition, and breach corpus checking
                  </p>
                </div>
              </div>
              <EthicalNotice />
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Comparative Analysis Testbench
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Research-grade side-by-side matrix for evaluating multiple candidate passwords without exposing plaintext in reports
              </p>
              <EthicalNotice />
            </div>
          )}

          {activeTab === 'experiment' && (
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Usability Evaluation Study
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Controlled experiment module — Condition A (Conventional) vs Condition B (Proposed PSAS) — aligned to Chapter Five methodology
              </p>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Administrative & Research Portal
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Protected dashboard for corpus management, bulk auditing, analysis telemetry, and benchmark evaluation
              </p>
            </div>
          )}

          {/* Tab content */}
          {activeTab === 'analyzer' && <PasswordAnalyzerCard />}
          {activeTab === 'compare' && <ComparisonView />}
          {activeTab === 'experiment' && <UsabilityExperiment />}
          {activeTab === 'admin' && <AdminPortal />}
        </main>

        {/* Footer */}
        <footer className="border-t border-cyber-border bg-cyber-card/50 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-500/70" />
              <span>Password Security Analysis System (PSAS) — Dissertation Research Platform</span>
            </div>
            <div className="flex items-center space-x-4 font-mono">
              <span className="text-emerald-600">🔒 Zero-Plaintext Architecture</span>
              <span>|</span>
              <span>Computer Science Dissertation • {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
