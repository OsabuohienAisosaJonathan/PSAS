import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type DatabaseType = 'sqlite' | 'postgres';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private dbType: DatabaseType = (process.env.DB_TYPE as DatabaseType) || 'sqlite';
  private sqliteDb: any = null;
  private pgPool: pg.Pool | null = null;
  private initialized = false;

  private constructor() {
    this.dbType = (process.env.DB_TYPE?.toLowerCase() === 'postgres') ? 'postgres' : 'sqlite';
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getDbType(): DatabaseType {
    return this.dbType;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.dbType === 'postgres') {
      const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/psas';
      this.pgPool = new pg.Pool({ connectionString });
      
      const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await this.pgPool.query(schemaSql);
      }
      console.log('✓ PostgreSQL connected and initialized.');
    } else {
      // Default: SQLite via Node.js native DatabaseSync
      const { DatabaseSync } = await import('node:sqlite');
      const defaultDataDir = path.resolve(__dirname, '../../data');
      const rawDbPath = process.env.SQLITE_DB_PATH || path.join(defaultDataDir, 'psas.sqlite');
      const dbPath = path.isAbsolute(rawDbPath) ? rawDbPath : path.resolve(process.cwd(), rawDbPath);
      const parentDir = path.dirname(dbPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      this.sqliteDb = new DatabaseSync(dbPath);

      const schemaPath = path.resolve(__dirname, '../../../database/sqlite-schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        this.sqliteDb.exec(schemaSql);
      }
      console.log(`✓ SQLite initialized at ${dbPath}`);
    }

    this.initialized = true;
  }

  /**
   * Executes a SELECT query and returns rows.
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    await this.initialize();

    if (this.dbType === 'postgres' && this.pgPool) {
      // Convert ? parameters to $1, $2, ... for Postgres
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      const res = await this.pgPool.query(pgSql, params);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount || 0
      };
    } else {
      // SQLite
      const stmt = this.sqliteDb.prepare(sql);
      const rows = stmt.all(...params) as T[];
      return {
        rows,
        rowCount: rows.length
      };
    }
  }

  /**
   * Executes an INSERT / UPDATE / DELETE query.
   */
  public async execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
    await this.initialize();

    if (this.dbType === 'postgres' && this.pgPool) {
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      const res = await this.pgPool.query(pgSql, params);
      return {
        changes: res.rowCount || 0
      };
    } else {
      const stmt = this.sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return {
        changes: info.changes || 0,
        lastInsertRowid: info.lastInsertRowid
      };
    }
  }

  /**
   * Runs raw multiple statements (e.g. migration script)
   */
  public async execRaw(sql: string): Promise<void> {
    await this.initialize();
    if (this.dbType === 'postgres' && this.pgPool) {
      await this.pgPool.query(sql);
    } else {
      this.sqliteDb.exec(sql);
    }
  }
}

export const db = DatabaseService.getInstance();
