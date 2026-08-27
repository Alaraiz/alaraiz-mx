import LandingClient, { type AvailabilitySlot, type Experience, type Facilitator } from "./landing-client";
import { contentRowsToMap, type ContentMap } from "@/content-cms/registry";
import { db, ensureMigrated } from "@/lib/db";
import { getMexicoDateKey } from "@/lib/mexico-time";

export const dynamic = "force-dynamic";

type LandingContentRow = {
  page_key?: unknown;
  section_key?: unknown;
  field_key?: unknown;
  locale?: unknown;
  value?: unknown;
  default_value?: unknown;
};

function toPlainRows<T>(rows: Iterable<Record<string, unknown>>): T[] {
  return Array.from(rows, (row) => ({ ...row }) as T);
}

async function loadWithTimeout<T>(loader: () => Promise<T>, fallback: T, timeoutMs = 800) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      loader(),
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch (error) {
    console.error("[landing initial data]", error);
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function loadExperiences() {
  const result = await db.execute(
    `SELECT e.id, e.slug, e.title, e.tag, e.description, e.duration, e.price,
            e.capacity, e.cover_image_url, e.gallery_images_json, e.collection, e.pace, e.zone,
            e.language, e.includes, e.facilitator_id,
            e.title_en, e.tag_en, e.description_en, e.includes_en,
            f.name AS facilitator_name, f.role AS facilitator_role,
            f.photo_url AS facilitator_photo_url
     FROM experiences e
     LEFT JOIN facilitators f ON f.id = e.facilitator_id
     WHERE e.is_published = 1
     ORDER BY e.created_at ASC`
  );
  return toPlainRows<Experience>(result.rows as Iterable<Record<string, unknown>>);
}

async function loadFacilitators() {
  const result = await db.execute(
    `SELECT id, name, role, bio, photo_url, collection, reclaims
     FROM facilitators
     WHERE is_published = 1
     ORDER BY created_at ASC`
  );
  return toPlainRows<Facilitator>(result.rows as Iterable<Record<string, unknown>>);
}

async function loadAvailability() {
  const result = await db.execute({
    sql: `SELECT a.id, a.experience_id, a.date, a.time, a.capacity, a.booked, a.status
          FROM availability a
          JOIN experiences e ON e.id = a.experience_id
          WHERE a.status = 'open' AND e.is_published = 1
            AND a.date >= ?
            AND (a.capacity - a.booked) > 0
          ORDER BY a.date ASC, a.time ASC`,
    args: [getMexicoDateKey()],
  });

  return toPlainRows<AvailabilitySlot>(
    result.rows.map((row) => ({
      ...row,
      remaining: Number(row.capacity) - Number(row.booked),
    })) as Iterable<Record<string, unknown>>
  );
}

async function loadContent(): Promise<ContentMap> {
  const result = await db.execute({
    sql: `SELECT page_key, section_key, field_key, locale,
                 COALESCE(value, default_value, '') AS value,
                 default_value
          FROM content_blocks
          WHERE page_key = ?
          ORDER BY sort_order ASC`,
    args: ["landing"],
  });

  return contentRowsToMap(result.rows as LandingContentRow[]);
}

async function loadLandingData() {
  await ensureMigrated();
  const [experiences, facilitators, availability, content] = await Promise.all([
    loadWithTimeout(loadExperiences, []),
    loadWithTimeout(loadFacilitators, []),
    loadWithTimeout(loadAvailability, []),
    loadWithTimeout(loadContent, {}),
  ]);
  return { experiences, facilitators, availability, content };
}

export default async function HomePage() {
  const initialData = await loadLandingData();

  return (
    <LandingClient
      initialExperiences={initialData.experiences}
      initialFacilitators={initialData.facilitators}
      initialAvailability={initialData.availability}
      initialContent={initialData.content}
    />
  );
}
