const MEXICO_TIME_ZONE = "America/Mexico_City";

function mexicoParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function getMexicoDateKey(date = new Date()) {
  const parts = mexicoParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getMexicoHour(date = new Date()) {
  const hour = Number(mexicoParts(date).hour);
  return hour === 24 ? 0 : hour;
}
