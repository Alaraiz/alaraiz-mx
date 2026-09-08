"use client";

import { FormEvent, useState } from "react";

type ReservationContext = {
  id: string;
  customerName: string;
  customerEmail: string;
  experienceTitle: string;
  date?: string | null;
  time?: string | null;
};

type Props = {
  reservation?: ReservationContext | null;
};

export default function ExitSurveyForm({ reservation }: Props) {
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const personalized = Boolean(reservation?.id);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setNotice("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/public/exit-surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          reservationId: reservation?.id || "",
          testimonialPermission: Boolean(data.testimonialPermission),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No pudimos guardar tus respuestas.");
      setNotice("Gracias. Tus respuestas ya quedaron registradas para el equipo de Raíz.");
      form.reset();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No pudimos guardar tus respuestas.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="booking-card survey-card" onSubmit={submit}>
      <p className="kicker">Raíz · encuesta de salida</p>
      <h1>{personalized ? "Cuéntanos cómo se sintió tu salida." : "Cuéntanos cómo se sintió la experiencia."}</h1>
      <p className="lede">
        Tus respuestas entran directo al CRM del equipo para mejorar operación, cuidado y diseño de futuras salidas.
      </p>

      {reservation && (
        <div className="booking-summary-card survey-context">
          <strong>{reservation.experienceTitle}</strong>
          <span>
            {reservation.customerName}
            {reservation.date ? ` · ${formatSurveyDate(reservation.date)}` : ""}
            {reservation.time ? ` · ${reservation.time}` : ""}
          </span>
        </div>
      )}

      <div className="field-grid">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px" }}
        />
        <label className="public-field">
          <span>Nombre *</span>
          <input
            className="public-input"
            name="name"
            required
            autoComplete="name"
            defaultValue={reservation?.customerName || ""}
            readOnly={personalized}
          />
        </label>
        <label className="public-field">
          <span>Correo *</span>
          <input
            className="public-input"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={reservation?.customerEmail || ""}
            readOnly={personalized}
          />
        </label>
        <label className="public-field">
          <span>Experiencia</span>
          <input
            className="public-input"
            name="experienceTitle"
            placeholder="Nombre de la experiencia"
            defaultValue={reservation?.experienceTitle || ""}
            readOnly={personalized}
          />
        </label>
        <label className="public-field">
          <span>Satisfacción general</span>
          <select className="public-input" name="rating" defaultValue="">
            <option value="" disabled>Selecciona una opción</option>
            <option>5 · Extraordinaria</option>
            <option>4 · Muy buena</option>
            <option>3 · Correcta</option>
            <option>2 · Puede mejorar</option>
            <option>1 · Mala experiencia</option>
          </select>
        </label>
        <label className="public-field">
          <span>¿La recomendarías?</span>
          <select className="public-input" name="nps" defaultValue="">
            <option value="" disabled>Selecciona una opción</option>
            <option>10 · Sin duda</option>
            <option>9</option>
            <option>8</option>
            <option>7</option>
            <option>6 o menos</option>
          </select>
        </label>
        <label className="public-field">
          <span>¿Volverías a otra salida?</span>
          <select className="public-input" name="repeatIntent" defaultValue="">
            <option value="" disabled>Selecciona una opción</option>
            <option>Sí, quiero repetir</option>
            <option>Tal vez</option>
            <option>No por ahora</option>
          </select>
        </label>
        <label className="public-field public-field--wide">
          <span>Momento más memorable</span>
          <textarea className="public-input" name="highlight" rows={4} />
        </label>
        <label className="public-field public-field--wide">
          <span>¿Qué mejorarías?</span>
          <textarea className="public-input" name="improve" rows={4} />
        </label>
        <label className="public-checkbox public-field--wide">
          <input type="checkbox" name="testimonialPermission" />
          <span>Raíz puede usar un fragmento de mi respuesta como testimonio, sin publicar mi correo.</span>
        </label>
      </div>

      {notice && <p className="send-note send-note--notice">{notice}</p>}

      <div className="booking-summary">
        <span className="form-note">Gracias por ayudarnos a cuidar mejor cada salida.</span>
        <button className="btn btn-solid public-submit" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar respuestas"}
        </button>
      </div>
    </form>
  );
}

function formatSurveyDate(value: string) {
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}
