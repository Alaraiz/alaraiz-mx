"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";

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
  tag: string | null;
  description: string | null;
  price: number;
  duration: string;
  cover_image_url: string | null;
  collection: string | null;
  pace: string | null;
  zone: string | null;
  language: string | null;
  includes: string | null;
  facilitator_name: string | null;
  facilitator_role: string | null;
};

type Customer = {
  name: string;
  email: string;
  phone: string;
  dietaryRestrictions: string;
  accessibilityNeeds: string;
  interests: string;
  referralSource: string;
  company: string;
};

type ClipCard = {
  mount: (id: string) => void;
  cardToken: () => Promise<{ id: string }>;
  setAmount?: (amount: number) => void;
};

type PaymentResult = {
  tone: "success" | "error" | "pending";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
};

type AppliedDiscount = {
  code: string;
  label: string | null;
  type: string;
  value: number;
  amount: number;
  total: number;
};

declare global {
  interface Window {
    ClipSDK?: new (apiKey: string) => {
      element: {
        create: (
          type: "Card",
          options: { theme: "light" | "dark"; locale: "es" | "en"; paymentAmount?: number }
        ) => ClipCard;
      };
    };
  }
}

const CLIP_CARD_CONTAINER_ID = "clip-card-checkout";
const publicPaymentProvider = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "manual").toLowerCase();
const clipPublicKey = process.env.NEXT_PUBLIC_CLIP_API_KEY || "";
const clipCheckoutExpected = publicPaymentProvider === "clip";
const clipCheckoutEnabled = clipCheckoutExpected && isConfiguredClipKey(clipPublicKey);

function isConfiguredClipKey(value: string) {
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized) && !normalized.includes("reemplazar") && !normalized.includes("replace");
}

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  throw new Error(fallbackMessage);
}

export default function ReservarPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [attendees, setAttendees] = useState(1);
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    phone: "",
    dietaryRestrictions: "",
    accessibilityNeeds: "",
    interests: "",
    referralSource: "",
    company: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [clipLoaded, setClipLoaded] = useState(false);
  const [clipCard, setClipCard] = useState<ClipCard | null>(null);
  const [clipRequiresHttps, setClipRequiresHttps] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountMessage, setDiscountMessage] = useState("");
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/public/availability", {
          cache: "no-store",
        });
        const data = await readJson<{ slots?: Slot[]; error?: string }>(
          res,
          "No pudimos cargar la disponibilidad en este momento."
        );
        if (!res.ok) throw new Error(data.error || "No pudimos cargar la disponibilidad.");

        const filtered = (data.slots || []).filter(
          (slot) => slot.slug === slug && slot.remaining > 0
        );

        setSlots(filtered);
        setSelectedSlot(filtered[0] ?? null);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "No pudimos cargar la disponibilidad."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  useEffect(() => {
    if (!selectedSlot) return;
    setAttendees((current) =>
      Math.min(Math.max(current, 1), selectedSlot.remaining)
    );
  }, [selectedSlot]);

  const experience = slots[0] ?? null;
  const subtotalAmount = selectedSlot ? (selectedSlot.price || 0) * attendees : 0;
  const totalAmount = Math.max(0, subtotalAmount - (appliedDiscount?.amount || 0));
  const needsCardPayment = clipCheckoutExpected && totalAmount > 0;

  useEffect(() => {
    if (!clipCheckoutExpected || !needsCardPayment) return;
    if (window.location.protocol !== "https:") {
      setClipRequiresHttps(true);
      setPaymentMessage("");
      return;
    }
    setClipRequiresHttps(false);
    if (!clipCheckoutEnabled) {
      setPaymentMessage("Falta configurar una API Key real de Clip para activar el formulario de tarjeta.");
      return;
    }
    if (!clipLoaded || clipCard || !window.ClipSDK) return;
    const mountTarget = document.getElementById(CLIP_CARD_CONTAINER_ID);
    if (!mountTarget) return;

    try {
      const clip = new window.ClipSDK(clipPublicKey);
      const card = clip.element.create("Card", {
        theme: "dark",
        locale: "es",
        paymentAmount: totalAmount,
      });
      card.mount(CLIP_CARD_CONTAINER_ID);
      setClipCard(card);
      setPaymentMessage("");
    } catch (error) {
      console.error("[Clip SDK mount]", error);
      setPaymentMessage("No pudimos montar el formulario de tarjeta de Clip. Revisa que la API Key de Clip esté activa y autorizada para Checkout Transparente.");
    }
  }, [clipCard, clipLoaded, needsCardPayment, selectedSlot, totalAmount]);

  useEffect(() => {
    if (!clipCard || !totalAmount) return;
    clipCard.setAmount?.(totalAmount);
  }, [clipCard, totalAmount]);

  const priceLabel = useMemo(() => {
    if (!selectedSlot?.price) return "Solicitud sin cobro inmediato";
    return `$${selectedSlot.price.toLocaleString("es-MX")} MXN / persona`;
  }, [selectedSlot]);
  const sortedSlots = useMemo(
    () =>
      [...slots].sort((a, b) => {
        const dateSort = a.date.localeCompare(b.date);
        return dateSort || a.time.localeCompare(b.time);
      }),
    [slots]
  );
  const maxAttendees = Math.max(1, selectedSlot?.remaining || 1);
  const detailItems = [
    ["Duración", experience?.duration],
    ["Ritmo", experience?.pace],
    ["Zona", experience?.zone],
    ["Idioma", experience?.language],
    ["Anfitrión", experience?.facilitator_name],
    ["Colección", experience?.collection],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  useEffect(() => {
    setAppliedDiscount(null);
    setDiscountMessage("");
  }, [attendees, selectedSlot?.id]);

  async function applyDiscount() {
    const code = discountCode.trim();
    if (!code) {
      setAppliedDiscount(null);
      setDiscountMessage("");
      return;
    }
    if (subtotalAmount <= 0) {
      setDiscountMessage("Selecciona una fecha y personas antes de aplicar descuento.");
      return;
    }

    setValidatingDiscount(true);
    setDiscountMessage("");
    try {
      const res = await fetch("/api/public/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: subtotalAmount }),
      });
      const data = await readJson<{ discount?: AppliedDiscount; error?: string }>(
        res,
        "No pudimos validar el descuento."
      );
      if (!res.ok || !data.discount) throw new Error(data.error || "Código inválido.");
      setAppliedDiscount(data.discount);
      setDiscountCode(data.discount.code);
      setDiscountMessage("Descuento aplicado.");
    } catch (error) {
      setAppliedDiscount(null);
      setDiscountMessage(error instanceof Error ? error.message : "Código inválido.");
    } finally {
      setValidatingDiscount(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;

    const cleanName = customer.name.trim();
    const cleanEmail = customer.email.trim().toLowerCase();
    const cleanPhone = customer.phone.trim();

    if (!cleanName || !cleanEmail || (needsCardPayment && !cleanPhone)) {
      setError(clipCheckoutExpected ? "Nombre, correo y teléfono son obligatorios para pagar con Clip." : "Nombre y correo son obligatorios.");
      return;
    }

    if (attendees < 1 || attendees > selectedSlot.remaining) {
      setError(`Elige entre 1 y ${selectedSlot.remaining} persona(s).`);
      return;
    }

    setSubmitting(true);
    setError("");
    setPaymentResult(null);

    try {
      let cardToken = "";
      if (needsCardPayment) {
        if (!clipCheckoutEnabled) {
          throw new Error("Falta configurar una API Key real de Clip para mostrar el formulario de pago.");
        }
        if (!clipCard) {
          throw new Error("El formulario de tarjeta todavía no está listo. Intenta de nuevo en unos segundos.");
        }
        setPaymentMessage("Validando tarjeta de forma segura con Clip...");
        const token = await clipCard.cardToken();
        cardToken = token.id;
      }

      const res = await fetch("/api/public/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceId: selectedSlot.experience_id,
          availabilityId: selectedSlot.id,
          customer: {
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
          },
          attendeesCount: attendees,
          dietaryRestrictions: customer.dietaryRestrictions.trim(),
          accessibilityNeeds: customer.accessibilityNeeds.trim(),
          interests: customer.interests.trim(),
          referralSource: customer.referralSource.trim(),
          company: customer.company.trim(),
          discountCode: appliedDiscount?.code || discountCode.trim(),
          cardToken,
        }),
      });
      const data = await readJson<{
        error?: string;
        paymentStatus?: "paid" | "pending" | "failed";
        pendingActionUrl?: string;
        checkoutUrl?: string;
        reference?: string;
      }>(
        res,
        "No pudimos crear la reserva en este momento."
      );
      if (!res.ok || data.paymentStatus === "failed") {
        setPaymentResult({
          tone: "error",
          title: "Pago no realizado",
          message: data.error || "Clip rechazó la transacción. No se hizo el cobro.",
        });
        throw new Error(data.error || "No se hizo el cobro.");
      }

      const redirectUrl = data.pendingActionUrl || data.checkoutUrl;
      if (!redirectUrl) throw new Error("La reserva se creó, pero no recibimos la liga de confirmación.");

      const isPending = data.paymentStatus === "pending" || Boolean(data.pendingActionUrl);
      setPaymentResult({
        tone: isPending ? "pending" : "success",
        title: isPending ? "Verificación pendiente" : "Pago exitoso",
        message: isPending
          ? "Clip necesita una verificación adicional para completar el pago."
          : "El cargo fue aprobado y tu reserva quedó registrada.",
        actionUrl: redirectUrl,
        actionLabel: isPending ? "Continuar verificación" : "Ver confirmación",
      });
      setSubmitting(false);
      setPaymentMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos crear la reserva.");
      setSubmitting(false);
      setPaymentMessage("");
    }
  }

  return (
    <main className="public-flow public-flow--booking">
      {clipCheckoutExpected && (
        <Script
          src="https://sdk.clip.mx/js/clip-sdk.js"
          strategy="afterInteractive"
          onLoad={() => setClipLoaded(true)}
          onError={() => setPaymentMessage("No pudimos cargar el SDK de Clip. Revisa la conexión e intenta de nuevo.")}
        />
      )}
      <div className="public-shell booking-shell">
        <a className="public-back" href="/">
          Volver al inicio
        </a>

        {loading && (
          <StatusPanel
            eyebrow="Reserva"
            title="Cargando experiencia..."
            text="Estamos consultando fechas y cupos disponibles."
          />
        )}

        {!loading && !experience && (
          <StatusPanel
            eyebrow="Sin disponibilidad"
            title="Experiencia no encontrada"
            text={error || "No hay fechas abiertas para esta experiencia por ahora. Escríbenos y revisamos una alternativa contigo."}
            actionHref="mailto:recreobyraiz@pm.me"
            actionLabel="Contactar a Raíz"
          />
        )}

        {!loading && experience && (
          <form onSubmit={handleSubmit} className="booking-grid">
            <section className="booking-intro" aria-labelledby="booking-title">
              <div className="booking-media">
                {experience.cover_image_url ? (
                  <img src={experience.cover_image_url} alt="" />
                ) : (
                  <div className="booking-media__fallback">re·creo</div>
                )}
              </div>

              <p className="kicker">Reservar lugar</p>
              <h1 id="booking-title">{experience.title}</h1>
              <p className="lede">{experience.description || "Elige una fecha, comparte tus datos y confirma tu lugar. Revisamos cada reserva con cuidado para mantener grupos pequeños."}</p>

              <div className="booking-detail-tags">
                {experience.tag && <span>{experience.tag}</span>}
                {experience.facilitator_role && <span>{experience.facilitator_role}</span>}
              </div>

              <dl className="booking-facts" aria-label="Detalles de la experiencia">
                {detailItems.slice(0, 6).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Precio</dt>
                  <dd>{priceLabel}</dd>
                </div>
                <div>
                  <dt>Grupo</dt>
                  <dd>{selectedSlot ? `${selectedSlot.remaining} lugares disponibles` : "Cupo limitado"}</dd>
                </div>
              </dl>
              {experience.includes && (
                <div className="booking-includes">
                  <span>Incluye</span>
                  <p>{experience.includes}</p>
                </div>
              )}
            </section>

            <section className="booking-card" aria-label="Formulario de reserva">
              <div className="form-section">
                <div className="form-section__head">
                  <span>01</span>
                  <h2>Fecha disponible</h2>
                </div>

                <div className="slot-list">
                  {sortedSlots.map((slot) => (
                    <label
                      key={slot.id}
                      className={`slot-option${selectedSlot?.id === slot.id ? " slot-option--selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={slot.id}
                        checked={selectedSlot?.id === slot.id}
                        onChange={() => setSelectedSlot(slot)}
                      />
                      <span>
                        <strong>{formatDate(slot.date)}</strong>
                        <small>{slot.time}</small>
                      </span>
                      <em>{slot.remaining} cupos</em>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <div className="form-section__head">
                  <span>02</span>
                  <h2>Personas</h2>
                </div>

                <div className="stepper-row">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setAttendees((count) => Math.max(1, count - 1))}
                    aria-label="Restar persona"
                  >
                    -
                  </button>
                  <input
                    className="public-input public-input--center"
                    type="number"
                    min={1}
                    max={maxAttendees}
                    value={attendees}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      setAttendees(Math.min(Math.max(parsed || 1, 1), maxAttendees));
                    }}
                    aria-label="Número de personas"
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setAttendees((count) => Math.min(maxAttendees, count + 1))}
                    aria-label="Sumar persona"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section__head">
                  <span>03</span>
                  <h2>Tus datos</h2>
                </div>

                <div className="field-grid">
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={customer.company}
                    onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
                    aria-hidden="true"
                    style={{ position: "absolute", left: "-9999px" }}
                  />
                  <label className="public-field">
                    <span>Nombre completo *</span>
                    <input
                      className="public-input"
                      type="text"
                      required
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Tu nombre"
                      autoComplete="name"
                    />
                  </label>

                  <label className="public-field">
                    <span>Email *</span>
                    <input
                      className="public-input"
                      type="email"
                      required
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                    />
                  </label>

                  <label className="public-field">
                    <span>Teléfono / WhatsApp</span>
                    <input
                      className="public-input"
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      placeholder="+52 55 1234 5678"
                      autoComplete="tel"
                    />
                  </label>

                  <label className="public-field public-field--wide">
                    <span>Alergias o restricciones alimentarias</span>
                    <textarea
                      className="public-input"
                      value={customer.dietaryRestrictions}
                      onChange={(e) => setCustomer({ ...customer, dietaryRestrictions: e.target.value })}
                      placeholder="Alergias, dieta vegetariana/vegana, ingredientes a evitar..."
                      rows={3}
                    />
                  </label>

                  <label className="public-field public-field--wide">
                    <span>Accesibilidad o necesidades especiales</span>
                    <textarea
                      className="public-input"
                      value={customer.accessibilityNeeds}
                      onChange={(e) => setCustomer({ ...customer, accessibilityNeeds: e.target.value })}
                      placeholder="Movilidad, ritmo, idioma, acompañamiento, cualquier cosa que debamos cuidar."
                      rows={3}
                    />
                  </label>

                  <label className="public-field public-field--wide">
                    <span>¿Qué te interesa vivir o entender?</span>
                    <textarea
                      className="public-input"
                      value={customer.interests}
                      onChange={(e) => setCustomer({ ...customer, interests: e.target.value })}
                      placeholder="Cuéntanos un poco de tu contexto para recibirte mejor."
                      rows={3}
                    />
                  </label>

                  <label className="public-field">
                    <span>¿Cómo llegaste a Raíz?</span>
                    <input
                      className="public-input"
                      value={customer.referralSource}
                      onChange={(e) => setCustomer({ ...customer, referralSource: e.target.value })}
                      placeholder="Instagram, recomendación, Google..."
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section__head">
                  <span>04</span>
                  <h2>Descuento</h2>
                </div>

                <div className="discount-row">
                  <input
                    className="public-input"
                    value={discountCode}
                    onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
                    placeholder="Código"
                  />
                  <button type="button" className="btn btn-ghost" onClick={applyDiscount} disabled={validatingDiscount}>
                    {validatingDiscount ? "Validando..." : "Aplicar"}
                  </button>
                </div>
                {discountMessage && (
                  <p className={`payment-note${appliedDiscount ? " payment-note--success" : ""}`}>
                    {discountMessage}
                  </p>
                )}
              </div>

              <div className="form-section">
                <div className="form-section__head">
                  <span>05</span>
                  <h2>Pago seguro</h2>
                </div>

                <div className="clip-payment-box">
                  {totalAmount <= 0 ? (
                    <p className="payment-note payment-note--success">Tu descuento cubre el total. No se solicitará tarjeta.</p>
                  ) : clipCheckoutEnabled ? (
                    <div className="clip-payment-card">
                      <div className="clip-payment-card__head">
                        <span>Clip Checkout</span>
                        <strong>Seguro</strong>
                      </div>
                      {clipRequiresHttps ? (
                        <div className="clip-https-notice">
                          <strong>Clip requiere HTTPS</strong>
                          <span>Para probar el formulario de tarjeta en local, abre esta página con <code>npm run dev:https</code>.</span>
                        </div>
                      ) : (
                        <div id={CLIP_CARD_CONTAINER_ID} className="clip-card-frame" />
                      )}
                      <p className="payment-note">Tus datos de tarjeta se capturan en el iframe seguro de Clip; Raíz no los recibe ni los guarda.</p>
                    </div>
                  ) : clipCheckoutExpected ? (
                    <p className="payment-note payment-note--warning">
                      Clip queda listo al configurar <code>NEXT_PUBLIC_CLIP_API_KEY</code>, <code>CLIP_API_KEY</code>, <code>NEXT_PUBLIC_PAYMENT_PROVIDER=clip</code> y <code>PAYMENT_PROVIDER=clip</code>.
                    </p>
                  ) : (
                    <p className="payment-note">El pago se completará en el siguiente paso según la pasarela configurada.</p>
                  )}
                  {paymentMessage && <p className="payment-note">{paymentMessage}</p>}
                </div>
              </div>

              {error && <p className="public-error">{error}</p>}

              <div className="booking-summary">
                <div>
                  <span>Total</span>
                  {appliedDiscount && (
                    <small className="booking-summary-discount">
                      Subtotal ${subtotalAmount.toLocaleString("es-MX")} · -${appliedDiscount.amount.toLocaleString("es-MX")}
                    </small>
                  )}
                  <strong>{totalAmount > 0 ? `$${totalAmount.toLocaleString("es-MX")} MXN` : "$0 MXN"}</strong>
                </div>
                <button type="submit" className="btn btn-solid public-submit" disabled={submitting || !selectedSlot}>
                  {submitting ? "Procesando..." : clipCheckoutExpected ? "Pagar y reservar" : "Reservar y continuar"}
                </button>
              </div>
            </section>
          </form>
        )}
      </div>
      {paymentResult && (
        <PaymentResultModal
          result={paymentResult}
          onClose={() => setPaymentResult(null)}
        />
      )}
    </main>
  );
}

function PaymentResultModal({
  result,
  onClose,
}: {
  result: PaymentResult;
  onClose: () => void;
}) {
  return (
    <div className="payment-modal-backdrop" role="presentation" onClick={onClose}>
      <section className={`payment-modal payment-modal--${result.tone}`} role="dialog" aria-modal="true" aria-labelledby="payment-result-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="payment-modal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="payment-modal__mark">
          {result.tone === "success" ? "✓" : result.tone === "pending" ? "..." : "!"}
        </div>
        <p className="kicker">
          {result.tone === "success" ? "Transacción aprobada" : result.tone === "pending" ? "Acción requerida" : "Transacción fallida"}
        </p>
        <h2 id="payment-result-title">{result.title}</h2>
        <p>{result.message}</p>
        <div className="payment-modal__actions">
          {result.actionUrl ? (
            <a className="btn btn-solid" href={result.actionUrl}>
              {result.actionLabel || "Continuar"}
            </a>
          ) : (
            <button type="button" className="btn btn-solid" onClick={onClose}>
              Intentar de nuevo
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusPanel({
  eyebrow,
  title,
  text,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  text: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="status-panel">
      <p className="kicker">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lede">{text}</p>
      {actionHref && actionLabel && (
        <a href={actionHref} className="btn btn-solid">
          {actionLabel}
        </a>
      )}
    </section>
  );
}

function formatDate(dateStr: string): string {
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
