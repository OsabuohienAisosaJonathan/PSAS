import React, { useState } from 'react';
import { Lock, LayoutDashboard, FileText, Database, Search, FlaskConical, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { AdminLogin } from '../AdminLogin.js';
import { AdminOverview } from './AdminOverview.js';
import { AdminBulkAudit } from './AdminBulkAudit.js';
import { AdminBreachCorpus } from './AdminBreachCorpus.js';
import { AdminAnalysisLogs } from './AdminAnalysisLogs.js';
import { AdminResearchEvaluation } from './AdminResearchEvaluation.js';

type AdminTab = 'overview' | 'audit' | 'corpus' | 'logs' | 'research';

export const AdminPortal: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm font-mono">
        Verifying administrative session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const adminNavItems: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    { id: 'overview', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview' },
    { id: 'audit', icon: <FileText className="w-4 h-4" />, label: 'Bulk Audit' },
    { id: 'corpus', icon: <Database className="w-4 h-4" />, label: 'Breach Corpus' },
    { id: 'logs', icon: <Search className="w-4 h-4" />, label: 'Analysis Logs' },
    { id: 'research', icon: <FlaskConical className="w-4 h-4" />, label: 'Research Evaluation' }
  ];

  return (
    <div className="space-y-6">
      {/* Admin Sub-Nav */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-white">Administrative & Research Portal</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {adminNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveAdminTab(item.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeAdminTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-cyber-surface text-slate-300 hover:text-white hover:bg-slate-700 border border-cyber-border'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Admin Tab Content */}
      {activeAdminTab === 'overview' && <AdminOverview />}
      {activeAdminTab === 'audit' && <AdminBulkAudit />}
      {activeAdminTab === 'corpus' && <AdminBreachCorpus />}
      {activeAdminTab === 'logs' && <AdminAnalysisLogs />}
      {activeAdminTab === 'research' && <AdminResearchEvaluation />}
    </div>
  );
};
