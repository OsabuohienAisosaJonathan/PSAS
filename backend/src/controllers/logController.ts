import { Request, Response } from 'express';
import { db } from '../database/db.js';

export class LogController {
  /**
   * Records anonymized analysis metadata.
   * STRICT PRIVACY GUARANTEE: Plaintext passwords are NEVER accepted or persisted.
   */
  public static async recordLog(req: Request, res: Response): Promise<void> {
    try {
      const {
        analysis_type = 'INTERACTIVE',
        score,
        strength_category,
        entropy,
        estimated_guesses,
        breach_detected = false,
        processing_time_ms
      } = req.body;

      if (score === undefined || !strength_category || entropy === undefined) {
        res.status(400).json({ error: 'Missing required analysis telemetry fields.' });
        return;
      }

      await db.execute(
        `INSERT INTO analysis_logs
         (analysis_type, score, strength_category, entropy, estimated_guesses, breach_detected, processing_time_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          analysis_type,
          Math.round(score),
          strength_category,
          Number(entropy),
          String(estimated_guesses || '0'),
          breach_detected ? 1 : 0,
          Number(processing_time_ms || 0)
        ]
      );

      res.status(201).json({ status: 'SUCCESS', message: 'Telemetry recorded securely.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record analysis log: ' + err.message });
    }
  }

  /**
   * Retrieves paginated analysis logs for research auditing.
   */
  public static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 25);
      const offset = (page - 1) * limit;

      const logsRes = await db.query(
        'SELECT * FROM analysis_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const totalRes = await db.query('SELECT COUNT(*) as total FROM analysis_logs');
      const total = Number(totalRes.rows[0]?.total || 0);

      res.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        logs: logsRes.rows
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve logs: ' + err.message });
    }
  }

  /**
   * Aggregates statistics for Chapter 4/5 implementation and evaluation results.
   */
  public static async getLogStats(req: Request, res: Response): Promise<void> {
    try {
      const totalRes = await db.query('SELECT COUNT(*) as count FROM analysis_logs');
      const total = Number(totalRes.rows[0]?.count || 0);

      if (total === 0) {
        res.json({
          totalAnalyses: 0,
          distribution: { 'Very Weak': 0, 'Weak': 0, 'Fair': 0, 'Strong': 0, 'Very Strong': 0 },
          averageScore: 0,
          averageEntropy: 0,
          averageLatencyMs: 0,
          breachDetectionRate: 0
        });
        return;
      }

      const distRes = await db.query(
        'SELECT strength_category, COUNT(*) as count FROM analysis_logs GROUP BY strength_category'
      );

      const distribution: Record<string, number> = {
        'Very Weak': 0,
        'Weak': 0,
        'Fair': 0,
        'Strong': 0,
        'Very Strong': 0
      };

      for (const row of distRes.rows) {
        distribution[row.strength_category] = Number(row.count);
      }

      const avgRes = await db.query(
        `SELECT
           AVG(score) as avg_score,
           AVG(entropy) as avg_entropy,
           AVG(processing_time_ms) as avg_latency,
           SUM(CASE WHEN breach_detected = 1 THEN 1 ELSE 0 END) as breach_count
         FROM analysis_logs`
      );

      const row = avgRes.rows[0];
      const breachCount = Number(row.breach_count || 0);

      res.json({
        totalAnalyses: total,
        distribution,
        averageScore: Number(Number(row.avg_score || 0).toFixed(2)),
        averageEntropy: Number(Number(row.avg_entropy || 0).toFixed(2)),
        averageLatencyMs: Number(Number(row.avg_latency || 0).toFixed(2)),
        breachDetectionRate: Number(((breachCount / total) * 100).toFixed(2))
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to aggregate log statistics: ' + err.message });
    }
  }
}
