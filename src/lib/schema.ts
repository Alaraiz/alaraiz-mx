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
      gallery_images_json TEXT DEFAULT '[]',
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
      capacity_held INTEGER NOT NULL DEFAULT 0,
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

    // Collections (experience/facilitator grouping)
    `CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      name_en TEXT,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Portable page content CMS
    `CREATE TABLE IF NOT EXISTS content_blocks (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      page_key TEXT NOT NULL,
      section_key TEXT NOT NULL,
      field_key TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'es',
      label TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      value TEXT,
      default_value TEXT,
      is_rich_text INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(page_key, section_key, field_key, locale)
    )`,

    // Public form submissions connected to CRM
    `CREATE TABLE IF NOT EXISTS form_submissions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      type TEXT NOT NULL,
      customer_id TEXT REFERENCES customers(id),
      reservation_id TEXT REFERENCES reservations(id),
      experience_id TEXT REFERENCES experiences(id),
      payload_json TEXT NOT NULL DEFAULT '{}',
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

  try {
    await db.execute("ALTER TABLE experiences ADD COLUMN gallery_images_json TEXT DEFAULT '[]'");
  } catch {
    // Column already exists — ignore
  }

  try {
    await db.execute("ALTER TABLE users ADD COLUMN facilitator_id TEXT REFERENCES facilitators(id)");
  } catch {
    // Column already exists — ignore
  }

  const reservationColumns = [
    ["dietary_restrictions", "TEXT"],
    ["accessibility_needs", "TEXT"],
    ["interests", "TEXT"],
    ["referral_source", "TEXT"],
    ["capacity_held", "INTEGER NOT NULL DEFAULT 0"],
  ];
  for (const [col, type] of reservationColumns) {
    try {
      await db.execute(`ALTER TABLE reservations ADD COLUMN ${col} ${type}`);
    } catch {
      // Column already exists — ignore
    }
  }

  await db.batch([
    "CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)",
    "CREATE INDEX IF NOT EXISTS idx_reservations_availability ON reservations(availability_id)",
    "CREATE INDEX IF NOT EXISTS idx_form_submissions_customer ON form_submissions(customer_id)",
    "CREATE INDEX IF NOT EXISTS idx_content_blocks_page ON content_blocks(page_key)",
  ]);
}
