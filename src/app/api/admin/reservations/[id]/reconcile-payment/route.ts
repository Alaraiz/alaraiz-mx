import { NextResponse } from "next/server";
import { adminEmail } from "@/lib/auth";
import { ensureMigrated } from "@/lib/db";
import { reconcileLatePayment } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    await ensureMigrated();
    const result = await reconcileLatePayment(params.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/admin/reservations/:id/reconcile-payment]", error);
    return NextResponse.json(
      { error: "No se pudo registrar el pago recibido." },
      { status: 500 }
    );
  }
}
