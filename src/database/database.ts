// src/database/database.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('tontineplus.db');
  await initializeDatabase(db);
  return db;
};

const initializeDatabase = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(database);
};

const runMigrations = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  // Create migrations table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const result = await database.getFirstAsync<{ max_version: number | null }>(
    'SELECT MAX(version) as max_version FROM migrations'
  );
  const currentVersion = result?.max_version ?? 0;

  const migrations = [
    { version: 1, sql: MIGRATION_V1 },
    { version: 2, sql: MIGRATION_V2 },
    { version: 3, sql: MIGRATION_V3 },
  ];

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      // V3 needs special handling: two separate statements
      if (migration.version === 3) {
        await database.runAsync(
          `DELETE FROM contributions WHERE id NOT IN (
            SELECT MIN(id) FROM contributions GROUP BY group_id, member_id, cycle
          )`
        );
        await database.execAsync(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_contributions_unique ON contributions(group_id, member_id, cycle);`
        );
      } else {
        await database.execAsync(migration.sql);
      }
      await database.runAsync(
        'INSERT INTO migrations (version) VALUES (?)',
        migration.version
      );
    }
  }
};

const MIGRATION_V1 = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    photo_uri TEXT,
    pin_hash TEXT NOT NULL,
    biometric_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    language TEXT NOT NULL DEFAULT 'fr',
    theme_mode TEXT NOT NULL DEFAULT 'system',
    biometric_enabled INTEGER NOT NULL DEFAULT 0,
    auto_backup INTEGER NOT NULL DEFAULT 0,
    auto_backup_frequency TEXT NOT NULL DEFAULT 'weekly',
    notifications_enabled INTEGER NOT NULL DEFAULT 1,
    contribution_reminder_days INTEGER NOT NULL DEFAULT 2,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    photo_uri TEXT,
    contribution_amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    frequency TEXT NOT NULL DEFAULT 'monthly',
    custom_frequency_days INTEGER,
    member_count INTEGER NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    selection_mode TEXT NOT NULL DEFAULT 'manual',
    current_cycle INTEGER NOT NULL DEFAULT 1,
    total_cycles INTEGER NOT NULL DEFAULT 0,
    meeting_day INTEGER,
    meeting_time TEXT,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
  CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at);

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY NOT NULL,
    group_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    photo_uri TEXT,
    address TEXT NOT NULL DEFAULT '',
    profession TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    beneficiary_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);
  CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);

  CREATE TABLE IF NOT EXISTS contributions (
    id TEXT PRIMARY KEY NOT NULL,
    group_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    expected_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    cycle INTEGER NOT NULL DEFAULT 1,
    period_label TEXT NOT NULL DEFAULT '',
    payment_date TEXT,
    due_date TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    receipt_number TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_contributions_group_id ON contributions(group_id);
  CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON contributions(member_id);
  CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
  CREATE INDEX IF NOT EXISTS idx_contributions_due_date ON contributions(due_date);
  CREATE INDEX IF NOT EXISTS idx_contributions_cycle ON contributions(cycle);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_contributions_unique ON contributions(group_id, member_id, cycle);

  CREATE TABLE IF NOT EXISTS beneficiaries (
    id TEXT PRIMARY KEY NOT NULL,
    group_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    cycle INTEGER NOT NULL,
    scheduled_date TEXT NOT NULL,
    actual_date TEXT,
    amount REAL NOT NULL,
    is_paid INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_beneficiaries_group_id ON beneficiaries(group_id);
  CREATE INDEX IF NOT EXISTS idx_beneficiaries_member_id ON beneficiaries(member_id);
  CREATE INDEX IF NOT EXISTS idx_beneficiaries_cycle ON beneficiaries(cycle);

  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY NOT NULL,
    group_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    scheduled_date TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    is_completed INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_meetings_group_id ON meetings(group_id);
  CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_date ON meetings(scheduled_date);

  CREATE TABLE IF NOT EXISTS app_notifications (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data TEXT NOT NULL DEFAULT '{}',
    scheduled_date TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    is_sent INTEGER NOT NULL DEFAULT 0,
    expo_notification_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON app_notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_date ON app_notifications(scheduled_date);
`;

const MIGRATION_V2 = `
  CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    record_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// V3 is handled with separate statements in runMigrations to avoid multi-statement execAsync
const MIGRATION_V3 = `-- v3 handled inline`;