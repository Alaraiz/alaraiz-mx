import { NextResponse } from "next/server";
import { adminEmail } from "@/lib/auth";
import { ensureMigrated } from "@/lib/db";
import { reconcileLatePayment, sendExitSurveyEmail } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    await ensureMigrated();
    const body = await request.json().catch(() => ({}));
    if (body.confirmLatePayment === true) {
      const reconciliation = await reconcileLatePayment(params.id);
      if (!reconciliation.ok) {
        return NextResponse.json({ error: reconciliation.error }, { status: 404 });
      }
    }
    const result = await sendExitSurveyEmail(params.id);

    if (result.skipped) {
      return NextResponse.json(
        { error: result.error || "Correo omitido. Revisa la configuración de Resend." },
        { status: 409 }
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "No se pudo enviar el cuestionario." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/admin/reservations/:id/exit-survey-email]", error);
    return NextResponse.json(
      { error: "Error al enviar el cuestionario." },
      { status: 500 }
    );
  }
}
