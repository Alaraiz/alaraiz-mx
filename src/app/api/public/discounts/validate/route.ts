import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db";
import { calculateDiscount } from "@/lib/discounts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await ensureMigrated();
    const body = await request.json();
    const subtotal = Math.max(0, Number(body.subtotal) || 0);
    const discount = await calculateDiscount(body.code, subtotal);
    if (!discount.ok) {
      return NextResponse.json({ error: discount.error }, { status: discount.status });
    }

    return NextResponse.json({ discount });
  } catch (error) {
    console.error("[POST /api/public/discounts/validate]", error);
    return NextResponse.json({ error: "Error al validar el descuento." }, { status: 500 });
  }
}
