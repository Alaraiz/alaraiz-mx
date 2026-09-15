/** Public calendar serialization (RFC 5545). Never includes attendee data. */
export type CalendarSlot = {
  id: string; date: string; time: string; title: string; slug: string;
  duration: string; zone: string; facilitator: string; remaining: number;
};

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function foldLine(line: string) {
  const lines: string[] = [];
  let part = "";
  for (const char of line) {
    if (Buffer.byteLength(part + char, "utf8") > 75) { lines.push(part); part = " "; }
    part += char;
  }
  return [...lines, part].join("\r\n");
}

export function calendarFile(slots: CalendarSlot[], baseUrl: string, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//A la raiz//Agenda//ES", "CALSCALE:GREGORIAN", "X-WR-CALNAME:A la raíz · Experiencias",
    "BEGIN:VTIMEZONE", "TZID:America/Mexico_City", "BEGIN:STANDARD", "DTSTART:20230101T000000", "TZOFFSETFROM:-0600", "TZOFFSETTO:-0600", "TZNAME:CST", "END:STANDARD", "END:VTIMEZONE"];
  for (const slot of slots) {
    const url = `${baseUrl}/reservar/${encodeURIComponent(slot.slug)}`;
    // Duration is editorial text; only export unambiguous values, never guess ranges.
    const duration = slot.duration.trim().match(/^(\d+(?:[.,]\d+)?)\s*(h|hr|hrs|hora|horas|hour|hours|min|mins|minuto|minutos|minute|minutes)\.?$/i);
    const minutes = duration ? Math.round(Number(duration[1].replace(",", ".")) * (/^h/i.test(duration[2]) ? 60 : 1)) : 0;
    lines.push("BEGIN:VEVENT", `UID:${encodeURIComponent(slot.id)}@alaraiz.mx`, `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/Mexico_City:${slot.date.replace(/-/g, "")}T${slot.time.slice(0, 5).replace(":", "")}00`,
      ...(minutes > 0 ? [`DURATION:PT${minutes}M`] : []),
      `SUMMARY:${escapeText(slot.title)}`, `LOCATION:${escapeText(slot.zone || "Ciudad de México")}`,
      `DESCRIPTION:${escapeText([slot.duration && `Duración: ${slot.duration}`, slot.facilitator && `Anfitrión: ${slot.facilitator}`, "Guardar esta fecha no reserva un lugar. Consulta disponibilidad y reserva en:", url].filter(Boolean).join("\n"))}`,
      `URL:${url}`, "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  return [...lines, "END:VCALENDAR"].map(foldLine).join("\r\n") + "\r\n";
}
