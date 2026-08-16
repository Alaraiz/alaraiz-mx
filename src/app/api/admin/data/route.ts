import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getUserFromToken();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const isAdmin = user.role === "admin";

    // Base queries available to all roles
    const [experiences, dates, facilitators] = await Promise.all([
      db.execute("SELECT * FROM experiences ORDER BY created_at DESC"),
      db.execute(
        `SELECT a.*, e.title FROM availability a
         JOIN experiences e ON e.id = a.experience_id
         ORDER BY a.date ASC`
      ),
      db.execute("SELECT * FROM facilitators ORDER BY created_at DESC"),
    ]);

    // Admin-only data
    let customers = { rows: [] as unknown[] };
    let reservations = { rows: [] as unknown[] };
    let events = { rows: [] as unknown[] };
    let folders = { rows: [] as unknown[] };

    if (isAdmin) {
      [customers, reservations, events, folders] = await Promise.all([
        db.execute("SELECT * FROM customers ORDER BY updated_at DESC"),
        db.execute(
          `SELECT r.*, c.name, e.title FROM reservations r
           LEFT JOIN customers c ON c.id = r.customer_id
           LEFT JOIN experiences e ON e.id = r.experience_id
           ORDER BY r.created_at DESC`
        ),
        db.execute("SELECT * FROM crm_events ORDER BY created_at DESC"),
        db.execute("SELECT * FROM folders ORDER BY name ASC"),
      ]);
    }

    return NextResponse.json({
      experiences: experiences.rows,
      dates: dates.rows,
      customers: customers.rows,
      reservations: reservations.rows,
      events: events.rows,
      folders: folders.rows,
      facilitators: facilitators.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al cargar los datos." },
      { status: 500 }
    );
  }
}
