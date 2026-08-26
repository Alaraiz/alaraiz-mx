import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureMigrated();

  const user = await getUserFromToken();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const isAdmin = user.role === "admin";

    // Base queries available to all roles
    const [experiences, dates, facilitators, collections] = await Promise.all([
      db.execute("SELECT * FROM experiences ORDER BY created_at DESC"),
      db.execute(
        `SELECT a.*, e.title FROM availability a
         JOIN experiences e ON e.id = a.experience_id
         ORDER BY a.date ASC`
      ),
      db.execute("SELECT * FROM facilitators ORDER BY created_at DESC"),
      db.execute("SELECT * FROM collections WHERE is_active = 1 ORDER BY sort_order ASC, name ASC"),
    ]);

    // Admin-only data
    let customers = { rows: [] as unknown[] };
    let reservations = { rows: [] as unknown[] };
    let events = { rows: [] as unknown[] };
    let folders = { rows: [] as unknown[] };
    let submissions = { rows: [] as unknown[] };

    if (isAdmin) {
      [customers, reservations, events, folders, submissions] = await Promise.all([
        db.execute("SELECT * FROM customers ORDER BY updated_at DESC"),
        db.execute(
          `SELECT r.*, c.name, c.email, c.phone, e.title, a.date, a.time
           FROM reservations r
           LEFT JOIN customers c ON c.id = r.customer_id
           LEFT JOIN experiences e ON e.id = r.experience_id
           LEFT JOIN availability a ON a.id = r.availability_id
           ORDER BY r.created_at DESC`
        ),
        db.execute("SELECT * FROM crm_events ORDER BY created_at DESC"),
        db.execute("SELECT * FROM folders ORDER BY name ASC"),
        db.execute(
          `SELECT fs.*, c.name, c.email
           FROM form_submissions fs
           LEFT JOIN customers c ON c.id = fs.customer_id
           ORDER BY fs.created_at DESC`
        ),
      ]);
    }

    return NextResponse.json({
      experiences: experiences.rows,
      dates: dates.rows,
      customers: customers.rows,
      reservations: reservations.rows,
      events: events.rows,
      folders: folders.rows,
      submissions: submissions.rows,
      facilitators: facilitators.rows,
      collections: collections.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al cargar los datos." },
      { status: 500 }
    );
  }
}
