import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";
import { userCanManageExperience } from "@/lib/admin-permissions";
import { getRescheduleNotificationSummary, getRescheduleNotificationErrors, sendRescheduleNotifications } from "@/lib/reschedule-notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
async function authorize(id: string) {
  const user = await requireRole(["admin", "editor"]);
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  await ensureMigrated();
  const slot = await db.execute({ sql: "SELECT experience_id FROM availability WHERE id = ?", args: [id] });
  if (!slot.rows[0]) return NextResponse.json({ error: "Fecha no encontrada." }, { status: 404 });
  if (!(await userCanManageExperience(user, String(slot.rows[0].experience_id)))) return NextResponse.json({ error: "No autorizado para gestionar avisos de esta experiencia." }, { status: 403 });
  return null;
}
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const denied = await authorize(params.id); if (denied) return denied;
    return NextResponse.json({ counts: await getRescheduleNotificationSummary(params.id), errors: await getRescheduleNotificationErrors(params.id) });
  } catch (error) {
    console.error("[reschedule email status]", error);
    return NextResponse.json({ error: "No se pudo consultar el estado de los avisos." }, { status: 500 });
  }
}
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const denied = await authorize(params.id); if (denied) return denied;
    return NextResponse.json(await sendRescheduleNotifications(params.id));
  } catch (error) {
    console.error("[reschedule email send]", error);
    return NextResponse.json({ error: "No se pudo completar el envío. Actualiza el estado antes de reintentar." }, { status: 500 });
  }
}
