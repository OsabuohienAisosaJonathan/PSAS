import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { PasswordAnalyzer } from '@psas/core';

export class AuditController {
  /**
   * Processes a CSV file containing up to 10,000 records.
   * CSV Header: id,password_hash OR id,candidate (synthetic research data)
   * Transient memory processing: No plaintext passwords ever stored or logged.
   */
  public static async processBulkAudit(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();

    try {
      if (!req.file) {
        res.status(400).json({ error: 'No CSV file uploaded.' });
        return;
      }

      const fileBuffer = req.file.buffer.toString('utf8');
      const records: any[] = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      if (records.length === 0) {
        res.status(400).json({ error: 'Uploaded CSV contains no valid data rows.' });
        return;
      }

      const totalRecords = Math.min(records.length, 10000); // Process up to 10,000 records
      const auditItems: Array<{ id: string; hash: string; candidate?: string }> = [];

      for (let i = 0; i < totalRecords; i++) {
        const row = records[i];
        const recordId = row.id || row.ID || row.user_id || `REC-${i + 1}`;
        let hash = (row.password_hash || row.hash || '').toLowerCase();
        let candidate = row.candidate || row.password || '';

        if (!hash && candidate) {
          // Compute hash in transient memory for breach checking
          hash = crypto.createHash('sha256').update(candidate).digest('hex');
        }

        auditItems.push({ id: recordId, hash, candidate });
      }

      // Collect all hashes for batch lookup against local breach corpus
      const validHashes = auditItems.map(item => item.hash).filter(h => h && h.length >= 40);
      const breachedSet = new Set<string>();

      // Batch query in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < validHashes.length; i += chunkSize) {
        const chunk = validHashes.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => '?').join(',');
        const queryRes = await db.query(
          `SELECT password_hash FROM breach_corpus_entries WHERE password_hash IN (${placeholders})`,
          chunk
        );
        for (const row of queryRes.rows) {
          breachedSet.add(row.password_hash.toLowerCase());
        }
      }

      // Evaluate records
      let veryWeakCount = 0;
      let weakCount = 0;
      let fairCount = 0;
      let strongCount = 0;
      let veryStrongCount = 0;
      let breachedCount = 0;
      let totalScoreSum = 0;
      let totalEntropySum = 0;

      const patternCounts: Record<string, number> = {
        dictionary: 0,
        keyboard: 0,
        sequential: 0,
        repeated_char: 0,
        date: 0,
        substitution: 0,
        common_suffix_prefix: 0
      };

      const auditResults: any[] = [];

      for (const item of auditItems) {
        const isBreached = item.hash ? breachedSet.has(item.hash) : false;
        if (isBreached) breachedCount++;

        // If synthetic candidate string is present, perform full structural analysis
        // Otherwise, evaluate hash-based classification
        let analysis;
        if (item.candidate) {
          analysis = PasswordAnalyzer.analyze(item.candidate, {
            breachStatus: {
              checked: true,
              breached: isBreached,
              message: isBreached ? 'Breached' : 'Clean',
              riskLevel: isBreached ? 'CRITICAL' : 'NONE'
            }
          });
          // Immediately wipe candidate from memory
          item.candidate = undefined;
        } else {
          // Hash-only evaluation: simulate conservative model based on breach prevalence
          const simulatedScore = isBreached ? 10 : 55;
          const simulatedCategory = isBreached ? 'Very Weak' : 'Fair';
          analysis = {
            compositeScore: { score: simulatedScore, category: simulatedCategory },
            entropy: { effectiveBits: isBreached ? 12 : 48 },
            patterns: []
          };
        }

        const score = analysis.compositeScore.score;
        const category = analysis.compositeScore.category;
        const entropyBits = analysis.entropy.effectiveBits;

        totalScoreSum += score;
        totalEntropySum += entropyBits;

        if (category === 'Very Weak') veryWeakCount++;
        else if (category === 'Weak') weakCount++;
        else if (category === 'Fair') fairCount++;
        else if (category === 'Strong') strongCount++;
        else if (category === 'Very Strong') veryStrongCount++;

        for (const p of analysis.patterns) {
          if (patternCounts[p.type] !== undefined) {
            patternCounts[p.type]++;
          }
        }

        auditResults.push({
          id: item.id,
          hash_prefix: item.hash ? item.hash.slice(0, 10) + '...' : 'N/A',
          score,
          category,
          entropy: entropyBits,
          is_breached: isBreached
        });
      }

      const processingTimeMs = Number((performance.now() - startTime).toFixed(2));
      const avgScore = Number((totalScoreSum / totalRecords).toFixed(2));
      const avgEntropy = Number((totalEntropySum / totalRecords).toFixed(2));

      // Save report in database
      const insertRes = await db.execute(
        `INSERT INTO bulk_audit_reports
         (filename, total_records, processed_records, very_weak_count, weak_count, fair_count,
          strong_count, very_strong_count, breached_count, average_score, average_entropy, processing_time_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.file.originalname,
          totalRecords,
          totalRecords,
          veryWeakCount,
          weakCount,
          fairCount,
          strongCount,
          veryStrongCount,
          breachedCount,
          avgScore,
          avgEntropy,
          processingTimeMs
        ]
      );

      res.json({
        reportId: insertRes.lastInsertRowid,
        filename: req.file.originalname,
        totalRecords,
        processedRecords: totalRecords,
        processingTimeMs,
        averages: {
          score: avgScore,
          entropy: avgEntropy
        },
        distribution: {
          veryWeak: veryWeakCount,
          weak: weakCount,
          fair: fairCount,
          strong: strongCount,
          veryStrong: veryStrongCount,
          breached: breachedCount
        },
        patternStatistics: patternCounts,
        sampleRecords: auditResults.slice(0, 50)
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Bulk audit processing failed: ' + err.message });
    }
  }

  /**
   * Retrieves past audit reports.
   */
  public static async getReports(req: Request, res: Response): Promise<void> {
    try {
      const reports = await db.query(
        'SELECT * FROM bulk_audit_reports ORDER BY created_at DESC LIMIT 20'
      );
      res.json({ reports: reports.rows });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve reports: ' + err.message });
    }
  }
}
