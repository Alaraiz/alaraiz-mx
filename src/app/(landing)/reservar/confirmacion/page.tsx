"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Reservation = {
  id: string;
  customerName: string;
  customerEmail: string;
  experienceTitle: string;
  attendeesCount: number;
  amount: number;
  status: string;
  paymentStatus: string;
};

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100dvh", overflow: "auto", padding: "var(--gut)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--ink-dim)", position: "relative", zIndex: 1 }}>Cargando...</p>
      </main>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const pending = searchParams.get("pending");

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ref) {
      setError("No se encontró la referencia de pago.");
      setLoading(false);
      return;
    }

    async function confirm() {
      try {
        const res = await fetch(`/api/public/reservations/confirm?ref=${encodeURIComponent(ref!)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setReservation(data.reservation);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al confirmar la reserva.");
      } finally {
        setLoading(false);
      }
    }

    confirm();
  }, [ref]);

  return (
    <main style={{ minHeight: "100dvh", overflow: "auto", padding: "var(--gut)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 1, textAlign: "center" }}>
        {loading && (
          <p style={{ color: "var(--ink-dim)" }}>Verificando tu reserva...</p>
        )}

        {!loading && error && (
          <div>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>&#9888;</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", marginBottom: "0.5rem" }}>
              Algo salió mal
            </h2>
            <p style={{ color: "var(--ink-dim)", fontSize: "0.9rem" }}>{error}</p>
            <a
              href="/"
              style={{ display: "inline-block", marginTop: "1.5rem", color: "var(--accent)", fontSize: "0.9rem" }}
            >
              &larr; Volver al inicio
            </a>
          </div>
        )}

        {!loading && !error && reservation && (
          <div>
            {/* Success icon */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: pending ? "var(--clay)" : "var(--moss)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "1.8rem",
            }}>
              {pending ? "&#8987;" : "&#10003;"}
            </div>

            <p style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>
              {pending ? "Pago pendiente" : "Reserva confirmada"}
            </p>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", lineHeight: 1.3, margin: "0 0 0.3rem" }}>
              {pending ? "Tu pago está en proceso" : "¡Nos vemos pronto!"}
            </h1>

            <p style={{ color: "var(--ink-dim)", fontSize: "0.9rem", marginBottom: "2rem" }}>
              {pending
                ? "Te notificaremos cuando se confirme tu pago."
                : "Tu lugar está asegurado. Recibirás los detalles por correo."
              }
            </p>

            {/* Reservation details card */}
            <div style={{
              background: "var(--paper-2)",
              border: "1px solid var(--rule)",
              borderRadius: 12,
              padding: "1.5rem",
              textAlign: "left",
            }}>
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ color: "var(--ink-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  Experiencia
                </span>
                <p style={{ margin: "0.2rem 0 0", fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
                  {reservation.experienceTitle}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <span style={{ color: "var(--ink-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    Personas
                  </span>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "1rem" }}>
                    {reservation.attendeesCount}
                  </p>
                </div>
                <div>
                  <span style={{ color: "var(--ink-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    Total
                  </span>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "1rem" }}>
                    ${Number(reservation.amount).toLocaleString("es-MX")} MXN
                  </p>
                </div>
                <div>
                  <span style={{ color: "var(--ink-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    Nombre
                  </span>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.9rem" }}>
                    {reservation.customerName}
                  </p>
                </div>
                <div>
                  <span style={{ color: "var(--ink-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    Correo
                  </span>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.9rem", wordBreak: "break-all" }}>
                    {reservation.customerEmail}
                  </p>
                </div>
              </div>

              {/* Reference */}
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--rule)" }}>
                <span style={{ color: "var(--ink-faint)", fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
                  REF: {ref}
                </span>
              </div>
            </div>

            <a
              href="/"
              style={{
                display: "inline-block",
                marginTop: "2rem",
                background: "var(--accent)",
                color: "var(--accent-ink)",
                padding: "0.7rem 1.5rem",
                borderRadius: 8,
                fontFamily: "var(--font-display)",
                fontSize: "0.9rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Volver al inicio
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
