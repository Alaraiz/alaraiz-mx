import ExitSurveyForm from "../survey-form";
import { getReservationByPaymentReference } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export default async function EncuestaSalidaReservaPage({
  params,
}: {
  params: { reservationId: string };
}) {
  const reservation = await getReservationByPaymentReference(params.reservationId);

  return (
    <main className="public-flow">
      <div className="public-shell">
        <a className="public-back" href="/">
          Volver al inicio
        </a>
        {reservation ? (
          <ExitSurveyForm
            reservation={{
              id: String(reservation.id),
              customerName: String(reservation.name || ""),
              customerEmail: String(reservation.email || ""),
              experienceTitle: String(reservation.title || "Tu experiencia"),
              date: reservation.date ? String(reservation.date) : null,
              time: reservation.time ? String(reservation.time) : null,
            }}
          />
        ) : (
          <section className="booking-card survey-card">
            <p className="kicker">Raíz · encuesta de salida</p>
            <h1>No encontramos esta reserva.</h1>
            <p className="lede">
              Revisa que la liga esté completa o pide al equipo de Raíz que te reenvíe el cuestionario.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
