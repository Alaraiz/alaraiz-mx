import { NextResponse } from "next/server";
import { adminEmail } from "@/lib/auth";
import { ensureMigrated } from "@/lib/db";
import { sendExitSurveyEmail } from "@/lib/reservations";

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
