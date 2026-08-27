import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";
import { getEditorProfile } from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureMigrated();

    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const isAdmin = user.role === "admin";
    const editorProfile = isAdmin ? null : await getEditorProfile(user);
    const facilitatorId = editorProfile?.facilitatorId || "";

    // Base queries available to all roles
    const [experiences, dates, facilitators, collections] = await Promise.all([
      db.execute({
        sql: `SELECT e.*,
                     CASE WHEN e.facilitator_id = ? THEN 1 ELSE 0 END AS is_hosted_by_current_user
              FROM experiences e
              ORDER BY e.created_at DESC`,
        args: [facilitatorId],
      }),
      db.execute({
        sql: `SELECT a.*, e.title, e.facilitator_id,
                     f.name AS facilitator_name,
                     CASE WHEN e.facilitator_id = ? THEN 1 ELSE 0 END AS is_hosted_by_current_user
              FROM availability a
              JOIN experiences e ON e.id = a.experience_id
              LEFT JOIN facilitators f ON f.id = e.facilitator_id
              ORDER BY a.date ASC`,
        args: [facilitatorId],
      }),
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
    } else if (facilitatorId) {
      [customers, reservations] = await Promise.all([
        db.execute({
          sql: `SELECT DISTINCT c.*
                FROM customers c
                JOIN reservations r ON r.customer_id = c.id
                JOIN experiences e ON e.id = r.experience_id
                WHERE e.facilitator_id = ?
                ORDER BY c.updated_at DESC`,
          args: [facilitatorId],
        }),
        db.execute({
          sql: `SELECT r.*, c.name, c.email, c.phone, e.title, a.date, a.time
                FROM reservations r
                LEFT JOIN customers c ON c.id = r.customer_id
                LEFT JOIN experiences e ON e.id = r.experience_id
                LEFT JOIN availability a ON a.id = r.availability_id
                WHERE e.facilitator_id = ?
                ORDER BY r.created_at DESC`,
          args: [facilitatorId],
        }),
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
      currentRole: user.role,
      currentFacilitatorId: facilitatorId || null,
    });
  } catch (error) {
    console.error("[GET /api/admin/data]", error);
    return NextResponse.json(
      { error: "Error al cargar los datos." },
      { status: 500 }
    );
  }
}
