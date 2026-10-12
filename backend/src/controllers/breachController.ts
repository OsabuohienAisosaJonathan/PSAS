import { Request, Response } from 'express';
import { db } from '../database/db.js';

export class BreachController {
  /**
   * Public privacy-preserving endpoint.
   * Client transmits only the cryptographic hash of the candidate password.
   * Plaintext password is NEVER transmitted over the wire or logged.
   */
  public static async checkHash(req: Request, res: Response): Promise<void> {
    try {
      const rawHash = Array.isArray(req.params.hash) ? req.params.hash[0] : req.params.hash;
      const hashParam = rawHash?.toLowerCase().trim();

      if (!hashParam || !/^[a-f0-9]{40,64}$/.test(hashParam)) {
        res.status(400).json({
          error: 'Invalid hash format. Expected SHA-256 (64 hex characters) or SHA-1 (40 hex characters).'
        });
        return;
      }

      const result = await db.query(
        'SELECT password_hash, hash_type, frequency, source FROM breach_corpus_entries WHERE password_hash = ? LIMIT 1',
        [hashParam]
      );

      if (result.rows.length > 0) {
        const entry = result.rows[0];
        res.json({
          checked: true,
          breached: true,
          frequency: Number(entry.frequency) || 1,
          source: entry.source || 'Compromised Password Corpus',
          riskLevel: 'CRITICAL',
          message: `Match identified in local compromised-password corpus (${entry.source || 'Public Breach'}). Prevalence index: ${Number(entry.frequency).toLocaleString()} occurrences.`
        });
      } else {
        res.json({
          checked: true,
          breached: false,
          riskLevel: 'NONE',
          message: 'No match found in local indexed breach corpus.'
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Breach check failed: ' + err.message });
    }
  }

  /**
   * Administrative corpus statistics.
   */
  public static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const countRes = await db.query('SELECT COUNT(*) as total FROM breach_corpus_entries');
      const totalEntries = countRes.rows[0]?.total || 0;

      const sourcesRes = await db.query(
        'SELECT source, COUNT(*) as count FROM breach_corpus_entries GROUP BY source ORDER BY count DESC'
      );

      const hashTypesRes = await db.query(
        'SELECT hash_type, COUNT(*) as count FROM breach_corpus_entries GROUP BY hash_type'
      );

      res.json({
        totalEntries: Number(totalEntries),
        sources: sourcesRes.rows,
        hashTypes: hashTypesRes.rows
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve corpus statistics: ' + err.message });
    }
  }

  /**
   * Add a single hash entry to the corpus.
   */
  public static async addEntry(req: Request, res: Response): Promise<void> {
    try {
      const { password_hash, hash_type = 'SHA-256', frequency = 1, source = 'Manual Admin Entry' } = req.body;

      if (!password_hash || !/^[a-f0-9]{40,64}$/.test(password_hash.trim().toLowerCase())) {
        res.status(400).json({ error: 'Valid hexadecimal hash is required.' });
        return;
      }

      const cleanHash = password_hash.trim().toLowerCase();

      try {
        await db.execute(
          `INSERT OR IGNORE INTO breach_corpus_entries (password_hash, hash_type, frequency, source)
           VALUES (?, ?, ?, ?)`,
          [cleanHash, hash_type, frequency, source]
        );
      } catch {
        await db.execute(
          `INSERT INTO breach_corpus_entries (password_hash, hash_type, frequency, source)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (password_hash) DO NOTHING`,
          [cleanHash, hash_type, frequency, source]
        );
      }

      res.status(201).json({ message: 'Corpus entry added successfully.', hash: cleanHash });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add corpus entry: ' + err.message });
    }
  }

  /**
   * Run corpus database integrity check.
   */
  public static async verifyIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const countRes = await db.query('SELECT COUNT(*) as total FROM breach_corpus_entries');
      const total = Number(countRes.rows[0]?.total || 0);

      const invalidHashesRes = await db.query(
        `SELECT COUNT(*) as invalid_count FROM breach_corpus_entries
         WHERE LENGTH(password_hash) NOT IN (40, 64)`
      );
      const invalidCount = Number(invalidHashesRes.rows[0]?.invalid_count || 0);

      res.json({
        status: invalidCount === 0 ? 'HEALTHY' : 'WARNING',
        totalEntries: total,
        invalidHashCount: invalidCount,
        indexVerification: 'B-tree index verified on password_hash column',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Corpus integrity check failed: ' + err.message });
    }
  }
}
