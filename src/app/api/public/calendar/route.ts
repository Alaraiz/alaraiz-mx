import { NextRequest, NextResponse } from "next/server";
import { getPublicCalendar } from "@/lib/public-calendar";
import { calendarFile } from "@/lib/calendar";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    const slots = (await getPublicCalendar()).filter(slot => !id || slot.id === id);
    if (id && !slots.length) return NextResponse.json({ error: "Esta fecha ya no está disponible." }, { status: 404 });
    return new NextResponse(calendarFile(slots, siteUrl()), { headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="a-la-raiz.ics"',
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    console.error("[public calendar]", error);
    return NextResponse.json({ error: "No pudimos cargar el calendario. Intenta nuevamente." }, { status: 500 });
  }
}
