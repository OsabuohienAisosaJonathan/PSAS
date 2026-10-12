import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { DEFAULT_ATTACK_RATES } from '@psas/core';
import { DEFAULT_SCORING_WEIGHTS } from '@psas/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runSeeds(): Promise<void> {
  console.log('--- Initializing PSAS Database Seeder ---');
  await db.initialize();

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@psas.local';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin2026!ResearchSecure';

  const existingAdmin = await db.query('SELECT id, email FROM admin_users WHERE email = ?', [adminEmail]);
  if (existingAdmin.rows.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    await db.execute(
      'INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, ?)',
      [adminEmail, passwordHash, 'admin']
    );
    console.log(`✓ Admin user created: ${adminEmail} (Initial Password: ${adminPassword})`);
  } else {
    console.log(`✓ Admin user ${adminEmail} already exists.`);
  }

  // 2. Seed Breach Corpus
  const corpusSeedsPath = path.resolve(__dirname, '../../../database/seeds/common-breaches.json');
  if (fs.existsSync(corpusSeedsPath)) {
    const seedDataRaw = fs.readFileSync(corpusSeedsPath, 'utf8');
    const entries = JSON.parse(seedDataRaw);

    let inserted = 0;
    for (const item of entries) {
      try {
        await db.execute(
          `INSERT OR IGNORE INTO breach_corpus_entries (password_hash, hash_type, frequency, source)
           VALUES (?, ?, ?, ?)`,
          [item.password_hash.toLowerCase(), item.hash_type || 'SHA-256', item.frequency || 1, item.source || 'Seed Corpus']
        );
        inserted++;
      } catch (err: any) {
        // Postgres syntax fallback if INSERT OR IGNORE fails
        try {
          await db.execute(
            `INSERT INTO breach_corpus_entries (password_hash, hash_type, frequency, source)
             VALUES (?, ?, ?, ?)
             ON CONFLICT (password_hash) DO NOTHING`,
            [item.password_hash.toLowerCase(), item.hash_type || 'SHA-256', item.frequency || 1, item.source || 'Seed Corpus']
          );
          inserted++;
        } catch {
          // Ignore duplicates
        }
      }
    }
    console.log(`✓ Seeded ${inserted} breach corpus entries.`);
  }

  // 3. Seed System Settings
  const settingsEntries = [
    { key: 'attack_rates', value: JSON.stringify(DEFAULT_ATTACK_RATES), description: 'Crack time simulation benchmark rates' },
    { key: 'scoring_weights', value: JSON.stringify(DEFAULT_SCORING_WEIGHTS), description: 'Composite scoring formula weights and thresholds' },
    { key: 'system_mode', value: 'production', description: 'System operational state' }
  ];

  for (const s of settingsEntries) {
    try {
      await db.execute(
        `INSERT OR REPLACE INTO system_settings (key, value, description) VALUES (?, ?, ?)`,
        [s.key, s.value, s.description]
      );
    } catch {
      await db.execute(
        `INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description`,
        [s.key, s.value, s.description]
      );
    }
  }
  console.log('✓ System settings initialized.');

  console.log('--- Database Seeding Completed Successfully ---');
}

// Direct execution guard
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
