# Password Security Analysis System (PSAS)

> **Research Dissertation Software Artefact**  
> Design and Implementation of a Password Security Analysis System  
> Computer Science BSc/MSc Dissertation — Academic Year 2025–2026

---

## Overview

PSAS is a full-stack, research-grade web application implementing multi-dimensional password security analysis. It goes well beyond conventional composition rules by integrating:

- **Shannon information-theoretic entropy estimation**
- **Structural pattern detection** (keyboard walks, sequences, dates, leet-speak, repeated sequences)
- **Curated dictionary word analysis**
- **Local breach corpus comparison** (zero plaintext over the wire)
- **Three-model crack-time estimation** (Online throttled / Offline fast hash / Offline slow salted hash)
- **Composite security scoring** with fully documented formula
- **Research evaluation framework** (confusion matrices, accuracy, precision, recall, F1-score)
- **Usability experiment module** (Condition A: Conventional vs Condition B: Proposed)
- **Administrative bulk auditing** (up to 10,000 hashed records per batch)
- **Analysis telemetry logging** (metadata only — zero plaintext stored anywhere)

---

## Research Traceability

| Objective | Modules | Files |
|---|---|---|
| Objective 1 — Requirements | Functional & Non-Functional Requirements (FR-01 to FR-10, NFR-01 to NFR-07) | This README |
| Objective 2 — System Design | Architecture, entropy, patterns, breach corpus, crack-time | `core/src/analyzers/*` |
| Objective 3 — Implementation | Full-stack React+Vite+Express+SQLite/PostgreSQL system | `frontend/`, `backend/` |
| Objective 4 — Evaluation | Unit tests, integration tests, benchmark runner, usability study | `tests/`, research evaluation admin tab |

---

## Requirements Traceability Matrix

| Req ID | Description | Implementation | Module/File | Test | Status |
|---|---|---|---|---|---|
| FR-01 | Secure masked password input | Masked `<input type="password">` with show/hide toggle | `PasswordAnalyzerCard.tsx` | Integration test | ✅ |
| FR-02 | Real-time entropy calculation | Shannon entropy H=L×log2(N) + effective bits | `EntropyAnalyzer.ts` | Unit test | ✅ |
| FR-03 | Pattern detection | Keyboard, sequential, repeated, date, dictionary, leet-speak | `PatternMatcher.ts`, `DictionaryMatcher.ts` | Unit tests | ✅ |
| FR-04 | Local breach corpus comparison | SHA-256 hash lookup against indexed SQLite/PostgreSQL table | `BreachController.ts`, `/breach/check/:hash` | Integration test | ✅ |
| FR-05 | Three crack-time models | Online throttled, offline fast hash, offline slow/salted hash | `CrackTimeEstimator.ts` | Unit tests | ✅ |
| FR-06 | Composite strength score | Documented multi-attribute scoring formula | `ScoreAggregator.ts` | Unit tests | ✅ |
| FR-07 | Actionable feedback | Human-readable explanations per weakness | `FeedbackGenerator.ts` | Unit tests | ✅ |
| FR-08 | Bulk audit | CSV upload → batch analysis → report | `AuditController.ts`, `AdminBulkAudit.tsx` | Tested via API | ✅ |
| FR-09 | Analysis logging without plaintext | Metadata-only telemetry table (no plaintext fields) | `LogController.ts`, `analysis_logs` table | Privacy test | ✅ |
| FR-10 | Corpus management | Admin CRUD, stats, integrity check | `BreachController.ts`, `AdminBreachCorpus.tsx` | API test | ✅ |
| NFR-01 | Privacy | Web Crypto API hash; no plaintext in URLs, localStorage, logs, DB | All layers | Privacy tests | ✅ |
| NFR-02 | ≤200ms analysis latency | Client-side computation, debounced breach check | `PasswordAnalyzer.ts` | Performance test | ✅ |
| NFR-03 | Usability | Plain-English feedback; accessible typography | `FeedbackGenerator.ts`, UI | Manual + usability study | ✅ |
| NFR-04 | Offline deployment | SQLite fallback; `npm run dev` only | `db.ts` | Local deployment test | ✅ |
| NFR-05 | 10,000-entry bulk audit | Chunked batch processing in `AuditController.ts` | `auditController.ts` | Bulk test | ✅ |
| NFR-06 | Modular architecture | Independent analyzers, replaceable modules | `core/src/analyzers/` | Each unit-tested | ✅ |
| NFR-07 | Graceful fallback | Offline breach mode if server unavailable | `api.ts` checkBreachByHash | Fallback tested | ✅ |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Primary Database | PostgreSQL |
| Offline Database | SQLite (via Node.js native `node:sqlite`) |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| Cryptographic Hashing | Web Crypto API (browser-native SHA-256) |
| Pattern Analysis | Custom algorithm corpus (no external APIs) |

---

## Project Structure

```
PSAS/
├── core/                    # Shared analysis engine (@psas/core)
│   └── src/
│       ├── analyzers/
│       │   ├── EntropyAnalyzer.ts
│       │   ├── PatternMatcher.ts
│       │   ├── DictionaryMatcher.ts
│       │   ├── CrackTimeEstimator.ts
│       │   ├── ScoreAggregator.ts
│       │   ├── FeedbackGenerator.ts
│       │   ├── ConventionalMeter.ts
│       │   └── PasswordAnalyzer.ts
│       ├── benchmarks/
│       │   └── BenchmarkRunner.ts
│       └── types/index.ts
├── backend/                 # Express REST API
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── database/
│       └── server.ts
├── frontend/                # React application
│   └── src/
│       ├── components/
│       │   ├── admin/
│       │   ├── PasswordAnalyzerCard.tsx
│       │   ├── ComparisonView.tsx
│       │   └── UsabilityExperiment.tsx
│       ├── services/
│       ├── context/
│       └── App.tsx
├── database/
│   ├── schema.sql           # PostgreSQL schema
│   ├── sqlite-schema.sql    # SQLite schema
│   └── seeds/
│       └── common-breaches.json
├── research/
│   └── benchmark_dataset.json   # 20-case labelled benchmark
├── tests/
│   └── unit/core.test.ts    # 40+ test cases
└── .env.example
```

---

## Installation & Quick Start

### Prerequisites

- Node.js v18+ (v22 recommended)
- npm v9+
- (Optional) PostgreSQL 15+ for production database mode

### 1. Clone / extract and install

```bash
# From project root
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local SQLite mode)
```

### 3. Start development servers

```bash
# Start both backend (port 4000) and frontend (port 5173) concurrently
npm run dev
```

Then open: **http://localhost:5173**

### 4. Run tests

```bash
npm test
```

---

## Database Modes

### SQLite (Default — Zero Configuration)

The system defaults to SQLite for local/offline research use.  
Database file: `backend/data/psas.sqlite`  
No additional software required.

### PostgreSQL (Production Mode)

Set in `.env`:
```
DB_TYPE=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/psas
```

---

## Default Admin Credentials

After first run, a seed admin account is created:

| Field | Value |
|---|---|
| Email | `admin@psas.local` |
| Password | `Admin2026!ResearchSecure` |

**Change these credentials before any deployment.**

---

## Privacy Architecture

This system implements a strict **Zero-Plaintext Architecture**:

1. **Client-side analysis**: All structural evaluation (entropy, patterns, dictionary) happens entirely in the browser using the `@psas/core` module.
2. **Hash-only breach check**: The browser computes `SHA-256(password)` via the native Web Crypto API and sends only the hash to the backend.
3. **No plaintext in logs**: The `analysis_logs` table stores only score, category, entropy, and timing metadata.
4. **No plaintext in database**: The `breach_corpus_entries` table stores only cryptographic hashes.
5. **No plaintext in URLs**: The privacy guard middleware blocks any request containing `?password=` or similar.
6. **Memory clearing**: Plaintext candidates are cleared from component state after usability trial submission.

---

## Research Benchmark Dataset

Located at `research/benchmark_dataset.json` — 20 labelled test cases covering:
- Dictionary roots (password, football, admin...)
- Sequential patterns (123456, 654321, abcdef...)
- Keyboard walks (qwerty, asdfgh, mnbvcxz...)
- Leet-speak obfuscation (P@ssw0rd123!, Tr0ub4dor&3)
- Calendar dates (Admin2024!, 12052001!)
- Repeated sequences (johnjohn, adminadmin)
- Known breached credentials
- Cryptographically strong candidates
- Diceware-style passphrases

---

## Scoring Formula

```
Score (0–100) =
  Entropy Component         (0–35 pts, based on effective bits / 65)
+ Length Bonus              (0–25 pts, NIST length tiers 8/12/16+)
+ Character Variety         (0–15 pts, 4 character class tiers)
+ Guess Resistance          (0–25 pts, log10(guesses) / 16)
− Pattern Penalty           (capped at 50 pts, per-pattern deduction)
− Dictionary Penalty        (capped at 45 pts, word-match deduction)
− Breach Penalty            (−60 pts fixed, score hard-capped at 20)
```

**Scoring Thresholds (configurable in System Settings):**

| Score | Category |
|---|---|
| 0–29 | Very Weak |
| 30–49 | Weak |
| 50–69 | Fair |
| 70–84 | Strong |
| 85–100 | Very Strong |

---

## Crack-Time Attacker Models

| Model | Rate | Represents |
|---|---|---|
| Online Throttled | 10 guesses/sec | Rate-limited web login interface |
| Offline Fast Hash | 10,000,000,000 guesses/sec | GPU cluster cracking MD5/SHA-256 dumps |
| Offline Slow/Salted | 10,000 guesses/sec | Argon2id / bcrypt key-stretched hashes |

All rates are configurable in the Admin → System Settings panel.

---

## Ethical Compliance

- System only analyses synthetic or researcher-created test passwords
- All interfaces display the ethical warning: *"Never enter a password you currently use on a real account"*
- No real user credential collection
- Usability experiment data is anonymised (participant IDs, no passwords)
- Complies with research ethics guidelines for password security studies
"# PSAS" 
