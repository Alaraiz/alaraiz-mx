"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Reservation = {
  id: string;
  customerName: string;
  customerEmail: string;
  experienceTitle: string;
  attendeesCount: number;
  subtotalAmount?: number;
  discountCode?: string;
  discountAmount?: number;
  amount: number;
  status: string;
  paymentStatus: string;
};

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<ConfirmationShell eyebrow="Reserva" title="Verificando tu reserva..." />}>
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

  if (loading) {
    return <ConfirmationShell eyebrow="Reserva" title="Verificando tu reserva..." />;
  }

  if (error || !reservation) {
    return (
      <ConfirmationShell
        eyebrow="No pudimos confirmar"
        title="Algo salió mal"
        text={error || "No encontramos la reserva asociada a esta referencia."}
        tone="error"
      />
    );
  }

  const isPending = Boolean(pending);

  return (
    <main className="public-flow public-flow--confirmation">
      <section className="confirmation-card" aria-labelledby="confirmation-title">
        <div className={`confirmation-mark${isPending ? " confirmation-mark--pending" : ""}`}>
          {isPending ? "..." : "✓"}
        </div>

        <p className="kicker">{isPending ? "Pago pendiente" : "Reserva confirmada"}</p>
        <h1 id="confirmation-title">{isPending ? "Tu pago está en proceso" : "Nos vemos pronto"}</h1>
        <p className="lede">
          {isPending
            ? "Te notificaremos cuando se confirme el pago y el lugar quede asegurado."
            : "Tu lugar quedó registrado. Recibirás los detalles por correo para preparar la experiencia."}
        </p>

        <dl className="confirmation-details">
          <div className="confirmation-details__full">
            <dt>Experiencia</dt>
            <dd>{reservation.experienceTitle}</dd>
          </div>
          <div>
            <dt>Personas</dt>
            <dd>{reservation.attendeesCount}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>${Number(reservation.amount).toLocaleString("es-MX")} MXN</dd>
          </div>
          {Number(reservation.discountAmount || 0) > 0 && (
            <div>
              <dt>Descuento</dt>
              <dd>{reservation.discountCode} · -${Number(reservation.discountAmount).toLocaleString("es-MX")} MXN</dd>
            </div>
          )}
          <div>
            <dt>Nombre</dt>
            <dd>{reservation.customerName}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{reservation.customerEmail}</dd>
          </div>
          <div className="confirmation-details__full confirmation-ref">
            <dt>Referencia de pago con tarjeta</dt>
            <dd>{ref}</dd>
          </div>
        </dl>

        <div className="confirmation-actions">
          <a href="/" className="btn btn-solid">
            Volver al inicio
          </a>
        </div>
      </section>
    </main>
  );
}

function ConfirmationShell({
  eyebrow,
  title,
  text,
  tone,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  tone?: "error";
}) {
  return (
    <main className="public-flow public-flow--confirmation">
      <section className={`confirmation-card${tone === "error" ? " confirmation-card--error" : ""}`}>
        <div className="confirmation-mark confirmation-mark--pending">{tone === "error" ? "!" : "..."}</div>
        <p className="kicker">{eyebrow}</p>
        <h1>{title}</h1>
        {text && <p className="lede">{text}</p>}
        {tone === "error" && (
          <div className="confirmation-actions">
            <a href="/" className="btn btn-solid">
              Volver al inicio
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
