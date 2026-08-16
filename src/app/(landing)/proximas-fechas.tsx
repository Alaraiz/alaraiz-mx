"use client";

import { useEffect, useState } from "react";

type Slot = {
  id: string;
  experience_id: string;
  date: string;
  time: string;
  capacity: number;
  booked: number;
  remaining: number;
  title: string;
  slug: string;
  price: number;
  duration: string;
  cover_image_url: string | null;
};

/**
 * Public "Próximas fechas" component.
 * Shows upcoming available experiences from the API.
 */
export default function ProximasFechas() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/availability")
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (slots.length === 0) return null;

  return (
    <section
      style={{
        padding: "var(--gut)",
        maxWidth: "var(--maxw)",
        margin: "0 auto",
      }}
    >
      <p
        style={{
          color: "var(--accent)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "0.4rem",
        }}
      >
        Próximas salidas
      </p>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.4rem, 3vw, 2rem)",
          marginBottom: "1.5rem",
        }}
      >
        Reserva tu lugar
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {slots.slice(0, 6).map((slot) => (
          <a
            key={slot.id}
            href={`/reservar/${slot.slug}`}
            style={{
              display: "block",
              background: "var(--paper-2)",
              border: "1px solid var(--rule)",
              borderRadius: 10,
              padding: "1.2rem",
              textDecoration: "none",
              transition: "border-color 0.2s, transform 0.2s",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.6rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                {slot.title}
              </span>
              {slot.price > 0 && (
                <span
                  style={{
                    color: "var(--ink-dim)",
                    fontSize: "0.8rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  ${slot.price} MXN
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                fontSize: "0.82rem",
                color: "var(--ink-dim)",
              }}
            >
              <span>{formatPubDate(slot.date)}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{slot.time}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span
                style={{
                  color: slot.remaining <= 3 ? "var(--brasa)" : "var(--moss)",
                }}
              >
                {slot.remaining} cupos
              </span>
            </div>
            {slot.duration && (
              <p
                style={{
                  margin: "0.4rem 0 0",
                  fontSize: "0.75rem",
                  color: "var(--ink-faint)",
                }}
              >
                {slot.duration}
              </p>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}

function formatPubDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}
