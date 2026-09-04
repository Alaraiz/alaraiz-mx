import { NextResponse } from "next/server";
import { adminEmail } from "@/lib/auth";
import { ensureMigrated } from "@/lib/db";
import { sendReservationConfirmationEmail } from "@/lib/reservations";

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
    const result = await sendReservationConfirmationEmail(params.id);

    if (result.skipped) {
      return NextResponse.json(
        { error: result.error || "Correo omitido. Revisa la configuración de Resend." },
        { status: 409 }
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "No se pudo enviar el correo de confirmación." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/admin/reservations/:id/confirmation-email]", error);
    return NextResponse.json(
      { error: "Error al enviar el correo de confirmación." },
      { status: 500 }
    );
  }
}
