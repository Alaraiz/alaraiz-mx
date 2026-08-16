"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

export default function ReservarPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [attendees, setAttendees] = useState(1);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/public/availability");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        // Filter by slug
        const filtered = (data.slots as Slot[]).filter(
          (s) => s.slug === slug
        );
        setSlots(filtered);
        if (filtered.length > 0) setSelectedSlot(filtered[0]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error cargando disponibilidad.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/public/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceId: selectedSlot.experience_id,
          availabilityId: selectedSlot.id,
          customer,
          attendeesCount: attendees,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect to checkout URL
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la reserva.");
      setSubmitting(false);
    }
  }

  const experience = slots.length > 0 ? slots[0] : null;
  const totalAmount = selectedSlot ? (selectedSlot.price || 0) * attendees : 0;

  return (
    <main style={{ minHeight: "100dvh", overflow: "auto", padding: "var(--gut)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 560, position: "relative", zIndex: 1 }}>
        {/* Back link */}
        <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--ink-dim)", fontSize: "0.85rem", textDecoration: "none" }}>
          &larr; Volver al inicio
        </a>

        {loading && <p style={{ color: "var(--ink-dim)" }}>Cargando experiencia...</p>}

        {!loading && !experience && (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Experiencia no encontrada</h2>
            <p style={{ color: "var(--ink-dim)" }}>No hay fechas disponibles para esta experiencia o no existe.</p>
          </div>
        )}

        {!loading && experience && (
          <>
            {/* Header */}
            <header style={{ marginBottom: "2rem" }}>
              {experience.cover_image_url && (
                <img
                  src={experience.cover_image_url}
                  alt={experience.title}
                  style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 12, marginBottom: "1.25rem" }}
                />
              )}
              <p style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>
                Reservar lugar
              </p>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", lineHeight: 1.2, margin: 0 }}>
                {experience.title}
              </h1>
              {experience.duration && (
                <p style={{ color: "var(--ink-dim)", fontSize: "0.9rem", marginTop: "0.4rem" }}>
                  Duración: {experience.duration}
                </p>
              )}
              {experience.price > 0 && (
                <p style={{ color: "var(--ink-faint)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                  ${experience.price} MXN / persona
                </p>
              )}
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Date selector */}
              <fieldset style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "1rem", margin: 0 }}>
                <legend style={{ color: "var(--ink-dim)", fontSize: "0.8rem", fontFamily: "var(--font-mono)", padding: "0 0.5rem" }}>
                  Fecha disponible
                </legend>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {slots.map((slot) => (
                    <label
                      key={slot.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.6rem 0.8rem",
                        border: selectedSlot?.id === slot.id ? "1px solid var(--accent)" : "1px solid var(--rule)",
                        borderRadius: 6,
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={slot.id}
                        checked={selectedSlot?.id === slot.id}
                        onChange={() => setSelectedSlot(slot)}
                        style={{ accentColor: "var(--accent)" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong style={{ fontSize: "0.9rem" }}>{formatDate(slot.date)}</strong>
                        <span style={{ color: "var(--ink-dim)", marginLeft: "0.5rem", fontSize: "0.85rem" }}>
                          {slot.time}
                        </span>
                      </span>
                      <span style={{ color: "var(--ink-faint)", fontSize: "0.8rem" }}>
                        {slot.remaining} cupos
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Attendees */}
              <div>
                <label style={{ display: "block", color: "var(--ink-dim)", fontSize: "0.8rem", fontFamily: "var(--font-mono)", marginBottom: "0.3rem" }}>
                  Personas
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedSlot?.remaining || 12}
                  value={attendees}
                  onChange={(e) => setAttendees(Math.max(1, parseInt(e.target.value) || 1))}
                  style={inputStyle}
                />
              </div>

              {/* Customer info */}
              <div>
                <label style={{ display: "block", color: "var(--ink-dim)", fontSize: "0.8rem", fontFamily: "var(--font-mono)", marginBottom: "0.3rem" }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Tu nombre"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--ink-dim)", fontSize: "0.8rem", fontFamily: "var(--font-mono)", marginBottom: "0.3rem" }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--ink-dim)", fontSize: "0.8rem", fontFamily: "var(--font-mono)", marginBottom: "0.3rem" }}>
                  Teléfono (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="+52 55 1234 5678"
                  style={inputStyle}
                />
              </div>

              {/* Total */}
              {totalAmount > 0 && (
                <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--ink-dim)", fontSize: "0.9rem" }}>Total</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--ink)" }}>
                    ${totalAmount.toLocaleString("es-MX")} MXN
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <p style={{ color: "#e55", fontSize: "0.85rem", margin: 0 }}>{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  border: "none",
                  borderRadius: 8,
                  padding: "0.9rem 1.5rem",
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: submitting ? "wait" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {submitting ? "Procesando..." : "Reservar y pagar"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--paper-2)",
  border: "1px solid var(--rule)",
  borderRadius: 6,
  padding: "0.7rem 0.9rem",
  color: "var(--ink)",
  fontSize: "0.95rem",
  fontFamily: "var(--font-body)",
  outline: "none",
  boxSizing: "border-box",
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}
