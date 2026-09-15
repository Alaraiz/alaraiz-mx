import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { ensureMigrated } from "@/lib/db";
import { moveReservationGroup, RescheduleError } from "@/lib/reschedule";
import { sendRescheduleNotifications } from "@/lib/reschedule-notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(["admin", "editor"]);
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    await ensureMigrated();
    const body = await request.json();
    const targetId = String(body.targetAvailabilityId || "");
    const result = await moveReservationGroup(user, params.id, targetId);
    // Email failure must never turn a committed move into an apparent failed move.
    let notifications = null;
    let notificationError: string | null = null;
    if (body.notifyCustomers === true) {
      try { notifications = await sendRescheduleNotifications(targetId, { ids: result.notificationIds }); }
      catch (error) {
        console.error("[reschedule notices]", error);
        notificationError = "El grupo ya se movió. Revisa los avisos pendientes en la fecha destino.";
      }
    }
    return NextResponse.json({ ok: true, ...result, notifications, notificationError });
  } catch (error) {
    if (error instanceof RescheduleError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[move reservations]", error);
    return NextResponse.json({ error: "Error al mover las reservas." }, { status: 500 });
  }
}
