-- PostgreSQL Database Schema for Password Security Analysis System (PSAS)

-- 1. AdminUser
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BreachCorpusEntry
CREATE TABLE IF NOT EXISTS breach_corpus_entries (
    id SERIAL PRIMARY KEY,
    password_hash VARCHAR(128) UNIQUE NOT NULL,
    hash_type VARCHAR(32) DEFAULT 'SHA-256',
    frequency BIGINT DEFAULT 1,
    source VARCHAR(128) DEFAULT 'Research Corpus',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_breach_corpus_hash ON breach_corpus_entries(password_hash);

-- 3. AnalysisLog (ZERO PLAINTEXT PASSWORDS STORED)
CREATE TABLE IF NOT EXISTS analysis_logs (
    id SERIAL PRIMARY KEY,
    analysis_type VARCHAR(64) NOT NULL,
    score INTEGER NOT NULL,
    strength_category VARCHAR(32) NOT NULL,
    entropy NUMERIC(8, 2) NOT NULL,
    estimated_guesses VARCHAR(64) NOT NULL,
    breach_detected BOOLEAN DEFAULT FALSE,
    processing_time_ms NUMERIC(8, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_logs_created ON analysis_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_category ON analysis_logs(strength_category);

-- 4. BulkAuditReport
CREATE TABLE IF NOT EXISTS bulk_audit_reports (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    total_records INTEGER NOT NULL,
    processed_records INTEGER NOT NULL,
    very_weak_count INTEGER DEFAULT 0,
    weak_count INTEGER DEFAULT 0,
    fair_count INTEGER DEFAULT 0,
    strong_count INTEGER DEFAULT 0,
    very_strong_count INTEGER DEFAULT 0,
    breached_count INTEGER DEFAULT 0,
    average_score NUMERIC(5, 2) DEFAULT 0,
    average_entropy NUMERIC(6, 2) DEFAULT 0,
    processing_time_ms NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SystemSettings
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(128) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. UsabilityParticipantLog
CREATE TABLE IF NOT EXISTS usability_participant_logs (
    id SERIAL PRIMARY KEY,
    participant_id VARCHAR(64) NOT NULL,
    condition VARCHAR(32) NOT NULL, -- 'CONVENTIONAL' | 'PROPOSED'
    score INTEGER NOT NULL,
    strength_category VARCHAR(32) NOT NULL,
    entropy NUMERIC(8, 2) NOT NULL,
    time_taken_seconds NUMERIC(8, 2) NOT NULL,
    attempts_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
