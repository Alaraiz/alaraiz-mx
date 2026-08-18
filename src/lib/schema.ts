import { db } from "./db";

/**
 * Database schema for Raíz CMS.
 * Run this once to create all tables.
 * Usage: import { migrate } from '@/lib/schema'; await migrate();
 */
export async function migrate() {
  await db.batch([
    // Auth
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Experiences
    `CREATE TABLE IF NOT EXISTS experiences (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      tag TEXT,
      description TEXT,
      duration TEXT,
      price REAL,
      capacity INTEGER NOT NULL DEFAULT 12,
      cover_image_url TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      collection TEXT,
      pace TEXT,
      zone TEXT,
      language TEXT DEFAULT 'ES / EN',
      includes TEXT,
      title_en TEXT,
      tag_en TEXT,
      description_en TEXT,
      includes_en TEXT,
      facilitator_id TEXT REFERENCES facilitators(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Facilitators / Specialists
    `CREATE TABLE IF NOT EXISTS facilitators (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      role TEXT,
      bio TEXT,
      photo_url TEXT,
      collection TEXT,
      reclaims TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Availability / Calendar
    `CREATE TABLE IF NOT EXISTS availability (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      experience_id TEXT NOT NULL REFERENCES experiences(id),
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 12,
      booked INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Customers (CRM)
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      source TEXT DEFAULT 'landing',
      stage TEXT NOT NULL DEFAULT 'nuevo',
      tags_json TEXT DEFAULT '[]',
      notes TEXT,
      folder_ids TEXT DEFAULT '',
      next_follow_up_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // CRM Events (follow-ups)
    `CREATE TABLE IF NOT EXISTS crm_events (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      customer_id TEXT NOT NULL REFERENCES customers(id),
      type TEXT NOT NULL DEFAULT 'note',
      title TEXT NOT NULL,
      body TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Reservations
    `CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      customer_id TEXT NOT NULL REFERENCES customers(id),
      experience_id TEXT NOT NULL REFERENCES experiences(id),
      availability_id TEXT REFERENCES availability(id),
      attendees_count INTEGER NOT NULL DEFAULT 1,
      amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      payment_method TEXT DEFAULT 'pending',
      payment_reference TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // CRM Folders
    `CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      color TEXT DEFAULT '#888',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ]);

  // Add _en columns to existing experiences tables (safe to run repeatedly)
  const enColumns = ["title_en", "tag_en", "description_en", "includes_en"];
  for (const col of enColumns) {
    try {
      await db.execute(`ALTER TABLE experiences ADD COLUMN ${col} TEXT`);
    } catch {
      // Column already exists — ignore
    }
  }
}
