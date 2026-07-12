const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "memegrid.db");
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      api_key_hash    TEXT NOT NULL UNIQUE,
      api_key_prefix  TEXT NOT NULL,
      wallet_address  TEXT NOT NULL UNIQUE,
      wallet_key      TEXT NOT NULL,
      payout_address  TEXT,
      status          TEXT NOT NULL DEFAULT 'active',
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS launches (
      id              TEXT PRIMARY KEY,
      agent_id        TEXT NOT NULL REFERENCES agents(id),
      chain_id        INTEGER NOT NULL DEFAULT 4663,
      token_address   TEXT NOT NULL UNIQUE,
      name            TEXT NOT NULL,
      symbol          TEXT NOT NULL,
      description     TEXT DEFAULT '',
      logo_url        TEXT,
      tx_hash         TEXT NOT NULL,
      initial_buy     TEXT DEFAULT '0',
      config_id       INTEGER DEFAULT 0,
      dex_id          INTEGER DEFAULT 0,
      pool_address    TEXT,
      pair_token      TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fee_ledger (
      id              TEXT PRIMARY KEY,
      launch_id       TEXT NOT NULL REFERENCES launches(id),
      accrued_amount  TEXT NOT NULL DEFAULT '0',
      claimed_amount  TEXT NOT NULL DEFAULT '0',
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS claims (
      id              TEXT PRIMARY KEY,
      launch_id       TEXT NOT NULL REFERENCES launches(id),
      agent_id        TEXT NOT NULL REFERENCES agents(id),
      gross_amount    TEXT NOT NULL,
      agent_amount    TEXT NOT NULL,
      memegrid_amount TEXT NOT NULL,
      tx_hash         TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'completed',
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Safe migration: add missing columns to existing launches table
  const migrations = [
    "ALTER TABLE launches ADD COLUMN config_id INTEGER DEFAULT 0",
    "ALTER TABLE launches ADD COLUMN dex_id INTEGER DEFAULT 0",
    "ALTER TABLE launches ADD COLUMN pool_address TEXT",
    "ALTER TABLE launches ADD COLUMN pair_token TEXT",
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch (_) { /* already exists */ }
  }
}

module.exports = { getDb };
