import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, Layers, Clock, Cpu } from 'lucide-react';
import { getAuthToken } from '../../services/api.js';

export const AdminBulkAudit: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/audit/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errData.error || 'Audit processing failed');
      }

      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Audit execution failed');
    } finally {
      setUploading(false);
    }
  };

  const generateSampleCSV = () => {
    const lines = ['id,password_hash'];
    // Include 50 realistic hashed entries for immediate demonstration
    const sampleHashes = [
      '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // "password"
      '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // "123456"
      '65e84be33532fb784c48129675f9eff3a682b27164c0ea699acddec988923297', // "qwerty"
      'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', // "12345678"
      '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // "admin"
      '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b', // random 1
      'b7a42146313f8c56fa769d419e7552554eec2476d1a1005a8f0dd87b3fcb51be', // random 2
      '79a40871d87e07ebfd223a579d40b90e0b3c8f2b3fcfa7788448834466b01fff'  // random 3
    ];

    for (let i = 1; i <= 50; i++) {
      const hash = sampleHashes[(i - 1) % sampleHashes.length];
      lines.push(`USR-${String(i).padStart(4, '0')},${hash}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_audit_dataset_50_hashes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Bulk Password Hash Auditing (Up to 10,000 Records)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Upload a CSV file containing password hashes (<code className="font-mono text-slate-300">id,password_hash</code>). Evaluates corpus breaches, distribution, and vulnerabilities with zero plaintext exposure.
            </p>
          </div>

          <button
            onClick={generateSampleCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-cyber-surface text-slate-300 hover:text-white text-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl mb-4 text-xs text-red-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border-2 border-dashed border-cyber-border rounded-xl p-8 text-center space-y-3 bg-cyber-dark/40 hover:border-indigo-500/50 transition-colors">
          <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto" />
          <div>
            <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
              <span>Choose a CSV file</span>
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>
            <p className="text-xs text-slate-500 mt-1">
              {file ? `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Supports .csv up to 10,000 rows'}
            </p>
          </div>

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-indigo-600/20"
            >
              {uploading ? 'Processing 10,000 Records...' : 'Execute Bulk Security Audit'}
            </button>
          )}
        </div>
      </div>

      {/* Audit Report Summary */}
      {report && (
        <div className="space-y-6">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Audit Execution Complete
                </span>
                <h4 className="text-xl font-bold text-white mt-1">
                  Report: {report.filename}
                </h4>
              </div>

              <button
                onClick={downloadReportJSON}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Research Report (JSON)</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-cyber-surface/60 border border-cyber-border rounded-xl">
                <span className="text-xs text-slate-400 block">Total Records</span>
                <span className="text-2xl font-mono font-bold text-white">
                  {report.totalRecords.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-cyber-surface/60 border border-cyber-border rounded-xl">
                <span className="text-xs text-slate-400 block">Breached Matches</span>
                <span className="text-2xl font-mono font-bold text-red-400">
                  {report.distribution.breached}
                </span>
              </div>

              <div className="p-4 bg-cyber-surface/60 border border-cyber-border rounded-xl">
                <span className="text-xs text-slate-400 block">Average Score</span>
                <span className="text-2xl font-mono font-bold text-blue-400">
                  {report.averages.score} / 100
                </span>
              </div>

              <div className="p-4 bg-cyber-surface/60 border border-cyber-border rounded-xl">
                <span className="text-xs text-slate-400 block">Processing Time</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {report.processingTimeMs} ms
                </span>
              </div>
            </div>

            {/* Distribution Breakdown */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Classification Breakdown
              </h5>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl">
                  <span className="text-red-400 block font-bold">Very Weak</span>
                  <span className="text-lg font-mono font-bold text-white">{report.distribution.veryWeak}</span>
                </div>
                <div className="p-3 bg-orange-950/30 border border-orange-500/30 rounded-xl">
                  <span className="text-orange-400 block font-bold">Weak</span>
                  <span className="text-lg font-mono font-bold text-white">{report.distribution.weak}</span>
                </div>
                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl">
                  <span className="text-amber-400 block font-bold">Fair</span>
                  <span className="text-lg font-mono font-bold text-white">{report.distribution.fair}</span>
                </div>
                <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl">
                  <span className="text-blue-400 block font-bold">Strong</span>
                  <span className="text-lg font-mono font-bold text-white">{report.distribution.strong}</span>
                </div>
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                  <span className="text-emerald-400 block font-bold">Very Strong</span>
                  <span className="text-lg font-mono font-bold text-white">{report.distribution.veryStrong}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
