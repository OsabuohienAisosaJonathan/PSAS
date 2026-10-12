import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../database/db.js';
import { BenchmarkRunner, BenchmarkTestCase } from '@psas/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ResearchController {
  /**
   * Executes the research benchmark evaluation comparing Conventional Meter vs Proposed PSAS.
   */
  public static async runBenchmark(req: Request, res: Response): Promise<void> {
    try {
      const benchmarkFilePath = path.resolve(__dirname, '../../../research/benchmark_dataset.json');
      if (!fs.existsSync(benchmarkFilePath)) {
        res.status(404).json({ error: 'Benchmark dataset file not found.' });
        return;
      }

      const datasetRaw = fs.readFileSync(benchmarkFilePath, 'utf8');
      const testCases: BenchmarkTestCase[] = JSON.parse(datasetRaw);

      // Fetch known breach hashes to simulate breach corpus lookups in benchmark
      const breachRes = await db.query('SELECT password_hash FROM breach_corpus_entries LIMIT 1000');
      const breachedHashes = new Set<string>(breachRes.rows.map(r => r.password_hash.toLowerCase()));

      const comparisonSummary = BenchmarkRunner.runComparison(testCases, breachedHashes);

      // Format individual test case outcomes for research tables without exposing plaintext passwords
      const detailedResults = testCases.map(tc => {
        const isBreached = tc.categoryType === 'Breached';
        return {
          testId: tc.testId,
          label: tc.label,
          categoryType: tc.categoryType,
          description: tc.description,
          expectedCategory: tc.expectedCategory,
          expectedRisk: tc.expectedRisk
        };
      });

      res.json({
        summary: comparisonSummary,
        testCasesCount: testCases.length,
        dataset: detailedResults,
        generatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Benchmark evaluation failed: ' + err.message });
    }
  }

  /**
   * Records an anonymized trial for Usability Evaluation (Condition A vs Condition B).
   */
  public static async recordUsabilityTrial(req: Request, res: Response): Promise<void> {
    try {
      const {
        participant_id,
        condition,
        score,
        strength_category,
        entropy,
        time_taken_seconds,
        attempts_count = 1
      } = req.body;

      if (!participant_id || !condition || score === undefined || !strength_category) {
        res.status(400).json({ error: 'Missing usability trial parameters.' });
        return;
      }

      await db.execute(
        `INSERT INTO usability_participant_logs
         (participant_id, condition, score, strength_category, entropy, time_taken_seconds, attempts_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          participant_id,
          condition.toUpperCase(),
          Math.round(score),
          strength_category,
          Number(entropy),
          Number(time_taken_seconds),
          Number(attempts_count)
        ]
      );

      res.status(201).json({ status: 'SUCCESS', message: 'Usability trial recorded.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record usability trial: ' + err.message });
    }
  }

  /**
   * Generates comparative Usability Evaluation statistics for Chapter Five evaluation.
   */
  public static async getUsabilityStats(req: Request, res: Response): Promise<void> {
    try {
      const rowsRes = await db.query('SELECT * FROM usability_participant_logs');
      const trials = rowsRes.rows;

      const groupA = trials.filter(t => t.condition === 'CONVENTIONAL');
      const groupB = trials.filter(t => t.condition === 'PROPOSED');

      const calcAverages = (items: any[]) => {
        if (items.length === 0) return { count: 0, avgScore: 0, avgEntropy: 0, avgTime: 0, avgAttempts: 0 };
        const total = items.length;
        const avgScore = items.reduce((acc, i) => acc + i.score, 0) / total;
        const avgEntropy = items.reduce((acc, i) => acc + i.entropy, 0) / total;
        const avgTime = items.reduce((acc, i) => acc + i.time_taken_seconds, 0) / total;
        const avgAttempts = items.reduce((acc, i) => acc + i.attempts_count, 0) / total;
        return {
          count: total,
          avgScore: Number(avgScore.toFixed(2)),
          avgEntropy: Number(avgEntropy.toFixed(2)),
          avgTime: Number(avgTime.toFixed(2)),
          avgAttempts: Number(avgAttempts.toFixed(2))
        };
      };

      res.json({
        totalTrials: trials.length,
        conditionA_Conventional: calcAverages(groupA),
        conditionB_Proposed: calcAverages(groupB),
        rawTrials: trials
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compute usability stats: ' + err.message });
    }
  }
}
