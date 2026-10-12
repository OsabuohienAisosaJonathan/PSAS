import React from 'react';
import { Shield, ShieldAlert, KeyRound, Columns, FlaskConical, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="border-b border-cyber-border bg-cyber-card/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('analyzer')}>
            <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                PSAS <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">v1.0 RESEARCH</span>
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">Password Security Analysis System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'analyzer'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-cyber-surface'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Analyzer</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-cyber-surface'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Comparison</span>
            </button>

            <button
              onClick={() => setActiveTab('experiment')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'experiment'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-cyber-surface'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Usability Study</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab.startsWith('admin')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-cyber-surface'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          </nav>

          {/* Status & Auth */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 hidden md:inline font-mono">
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="hidden md:flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Zero-Leakage Active</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
