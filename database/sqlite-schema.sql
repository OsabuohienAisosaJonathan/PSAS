-- SQLite Database Schema for Password Security Analysis System (PSAS)
-- Lightweight offline/local deployment

CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS breach_corpus_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password_hash TEXT UNIQUE NOT NULL,
    hash_type TEXT DEFAULT 'SHA-256',
    frequency INTEGER DEFAULT 1,
    source TEXT DEFAULT 'Research Corpus',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_breach_corpus_hash ON breach_corpus_entries(password_hash);

-- AnalysisLog (ZERO PLAINTEXT PASSWORDS)
CREATE TABLE IF NOT EXISTS analysis_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    strength_category TEXT NOT NULL,
    entropy REAL NOT NULL,
    estimated_guesses TEXT NOT NULL,
    breach_detected INTEGER DEFAULT 0,
    processing_time_ms REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_logs_created ON analysis_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_category ON analysis_logs(strength_category);

CREATE TABLE IF NOT EXISTS bulk_audit_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    total_records INTEGER NOT NULL,
    processed_records INTEGER NOT NULL,
    very_weak_count INTEGER DEFAULT 0,
    weak_count INTEGER DEFAULT 0,
    fair_count INTEGER DEFAULT 0,
    strong_count INTEGER DEFAULT 0,
    very_strong_count INTEGER DEFAULT 0,
    breached_count INTEGER DEFAULT 0,
    average_score REAL DEFAULT 0,
    average_entropy REAL DEFAULT 0,
    processing_time_ms REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usability_participant_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id TEXT NOT NULL,
    condition TEXT NOT NULL,
    score INTEGER NOT NULL,
    strength_category TEXT NOT NULL,
    entropy REAL NOT NULL,
    time_taken_seconds REAL NOT NULL,
    attempts_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
