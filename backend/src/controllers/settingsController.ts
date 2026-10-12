import { Request, Response } from 'express';
import { db } from '../database/db.js';
import { DEFAULT_ATTACK_RATES, DEFAULT_SCORING_WEIGHTS } from '@psas/core';

export class SettingsController {
  public static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const rows = await db.query('SELECT key, value, description FROM system_settings');
      const settingsMap: Record<string, any> = {};

      for (const row of rows.rows) {
        try {
          settingsMap[row.key] = JSON.parse(row.value);
        } catch {
          settingsMap[row.key] = row.value;
        }
      }

      res.json({
        attack_rates: settingsMap.attack_rates || DEFAULT_ATTACK_RATES,
        scoring_weights: settingsMap.scoring_weights || DEFAULT_SCORING_WEIGHTS,
        system_mode: settingsMap.system_mode || 'production',
        database_type: db.getDbType()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve settings: ' + err.message });
    }
  }

  public static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { attack_rates, scoring_weights } = req.body;

      if (attack_rates) {
        await db.execute(
          `INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          ['attack_rates', JSON.stringify(attack_rates), 'Crack time benchmark rates']
        );
      }

      if (scoring_weights) {
        await db.execute(
          `INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          ['scoring_weights', JSON.stringify(scoring_weights), 'Composite score weights and thresholds']
        );
      }

      res.json({ message: 'Settings successfully updated.' });
    } catch (err: any) {
      // Fallback for SQLite INSERT OR REPLACE
      try {
        const { attack_rates, scoring_weights } = req.body;
        if (attack_rates) {
          await db.execute(
            `INSERT OR REPLACE INTO system_settings (key, value, description) VALUES (?, ?, ?)`,
            ['attack_rates', JSON.stringify(attack_rates), 'Crack time benchmark rates']
          );
        }
        if (scoring_weights) {
          await db.execute(
            `INSERT OR REPLACE INTO system_settings (key, value, description) VALUES (?, ?, ?)`,
            ['scoring_weights', JSON.stringify(scoring_weights), 'Composite score weights and thresholds']
          );
        }
        res.json({ message: 'Settings successfully updated.' });
      } catch (innerErr: any) {
        res.status(500).json({ error: 'Failed to update settings: ' + innerErr.message });
      }
    }
  }
}
