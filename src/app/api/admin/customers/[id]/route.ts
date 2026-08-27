import { NextRequest, NextResponse } from "next/server";
import { adminEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { releaseReservationCapacity } from "@/lib/reservations";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email: customerEmail, phone, source, stage, tags, notes, folderIds, nextFollowUpAt } = body;

    await db.execute({
      sql: `UPDATE customers SET
              name = ?, email = ?, phone = ?, source = ?, stage = ?,
              tags_json = ?, notes = ?, folder_ids = ?, next_follow_up_at = ?,
              updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        name, customerEmail, phone || null, source || "landing",
        stage || "nuevo", JSON.stringify(tags || []), notes || null,
        (folderIds || []).join(","), nextFollowUpAt || null, params.id,
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/customers/:id]", error);
    return NextResponse.json({ error: "Error al actualizar el cliente." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const reservations = await db.execute({
      sql: "SELECT id FROM reservations WHERE customer_id = ?",
      args: [params.id],
    });
    for (const reservation of reservations.rows) {
      await releaseReservationCapacity(String(reservation.id));
    }
    await db.execute({ sql: "DELETE FROM crm_events WHERE customer_id = ?", args: [params.id] });
    await db.execute({ sql: "DELETE FROM reservations WHERE customer_id = ?", args: [params.id] });
    await db.execute({ sql: "DELETE FROM customers WHERE id = ?", args: [params.id] });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/customers/:id]", error);
    return NextResponse.json({ error: "Error al eliminar el cliente." }, { status: 500 });
  }
}
