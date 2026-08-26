import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";
import { getGateway } from "@/lib/payments";
import { toPositiveInteger } from "@/lib/reservations";
import { clientIp, hasSpamTrap, isValidEmail, rateLimit } from "@/lib/public-forms";

export const dynamic = "force-dynamic";

/**
 * POST /api/public/reservations
 * Creates a public reservation and initiates checkout.
 *
 * Body: { experienceId, availabilityId, customer: { name, email, phone }, attendeesCount }
 * Returns: { checkoutUrl, reference }
 */
export async function POST(request: NextRequest) {
  await ensureMigrated();

  const limited = rateLimit(`reservation:${clientIp(request)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Recibimos demasiadas solicitudes desde esta conexión. Intenta más tarde." },
      { status: 429 }
    );
  }

  let heldAvailabilityId: string | null = null;
  let heldAttendeesCount = 0;

  try {
    const body = await request.json();
    if (hasSpamTrap(body)) return NextResponse.json({ ok: true });

    const { experienceId, availabilityId, customer } = body;
    const attendeesCount = toPositiveInteger(body.attendeesCount, 1);
    const intake = {
      dietaryRestrictions: String(body.dietaryRestrictions || "").trim(),
      accessibilityNeeds: String(body.accessibilityNeeds || "").trim(),
      interests: String(body.interests || "").trim(),
      referralSource: String(body.referralSource || "").trim(),
    };

    // Validate required fields
    const customerName = String(customer?.name || "").trim();
    const customerEmail = String(customer?.email || "").trim().toLowerCase();
    const customerPhone = String(customer?.phone || "").trim();

    if (!experienceId || !availabilityId || !customerName || !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios o el correo no es válido." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(attendeesCount)) {
      return NextResponse.json(
        { error: "La cantidad de personas debe ser un entero mayor a cero." },
        { status: 400 }
      );
    }

    // Get experience for pricing
    const expResult = await db.execute({
      sql: "SELECT id, title, price, capacity FROM experiences WHERE id = ?",
      args: [experienceId],
    });
    if (expResult.rows.length === 0) {
      return NextResponse.json({ error: "Experiencia no encontrada." }, { status: 404 });
    }
    const experience = expResult.rows[0];

    const capacityHold = await db.execute({
      sql: `UPDATE availability
            SET booked = booked + ?
            WHERE id = ?
              AND experience_id = ?
              AND status = 'open'
              AND capacity >= 1
              AND booked + ? <= capacity`,
      args: [attendeesCount, availabilityId, experienceId, attendeesCount],
    });
    if (capacityHold.rowsAffected === 0) {
      const avResult = await db.execute({
        sql: "SELECT id, capacity, booked, status FROM availability WHERE id = ? AND experience_id = ?",
        args: [availabilityId, experienceId],
      });
      const availability = avResult.rows[0];
      if (!availability) {
        return NextResponse.json({ error: "Fecha no disponible." }, { status: 404 });
      }
      if (availability.status !== "open") {
        return NextResponse.json({ error: "Esta fecha ya no está disponible." }, { status: 409 });
      }
      const remaining = Math.max(Number(availability.capacity) - Number(availability.booked), 0);
      return NextResponse.json(
        { error: `No hay suficientes cupos. Disponibles: ${remaining}.` },
        { status: 409 }
      );
    }
    heldAvailabilityId = String(availabilityId);
    heldAttendeesCount = attendeesCount;

    const avResult = await db.execute({
      sql: "SELECT id, capacity, booked, status FROM availability WHERE id = ? AND experience_id = ?",
      args: [availabilityId, experienceId],
    });
    if (avResult.rows.length === 0) {
      return NextResponse.json({ error: "Fecha no disponible." }, { status: 404 });
    }
    const availability = avResult.rows[0];

    const maxCapacity = Number(availability.capacity) || 12;
    if (maxCapacity < 1) {
      return NextResponse.json({ error: "La fecha no tiene cupos configurados." }, { status: 409 });
    }
    if (attendeesCount > maxCapacity) {
      return NextResponse.json(
        { error: `La cantidad solicitada excede la capacidad máxima de esta fecha (${maxCapacity}).` },
        { status: 409 }
      );
    }

    // Find or create customer
    let customerId: string;
    const existingCustomer = await db.execute({
      sql: "SELECT id FROM customers WHERE email = ? COLLATE NOCASE",
      args: [customerEmail],
    });

    if (existingCustomer.rows.length > 0) {
      customerId = String(existingCustomer.rows[0].id);
      // Update phone/name if provided
      await db.execute({
        sql: `UPDATE customers
              SET name = ?, phone = COALESCE(?, phone),
                  stage = CASE WHEN stage = 'nuevo' THEN 'reserva_pendiente' ELSE stage END,
                  updated_at = datetime('now')
              WHERE id = ?`,
        args: [customerName, customerPhone || null, customerId],
      });
    } else {
      const insertResult = await db.execute({
        sql: `INSERT INTO customers (name, email, phone, source, stage) VALUES (?, ?, ?, 'reserva', 'reserva_pendiente') RETURNING id`,
        args: [customerName, customerEmail, customerPhone || null],
      });
      customerId = String(insertResult.rows[0].id);
    }

    // Calculate amount
    const pricePerPerson = Number(experience.price) || 0;
    const totalAmount = pricePerPerson * attendeesCount;

    // Create reservation
    const resResult = await db.execute({
      sql: `INSERT INTO reservations (
              customer_id, experience_id, availability_id, attendees_count, amount,
              status, payment_status, payment_method, capacity_held,
              dietary_restrictions, accessibility_needs, interests, referral_source, notes
            )
            VALUES (?, ?, ?, ?, ?, 'pending', 'unpaid', 'pending', 1, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        customerId,
        experienceId,
        availabilityId,
        attendeesCount,
        totalAmount,
        intake.dietaryRestrictions || null,
        intake.accessibilityNeeds || null,
        intake.interests || null,
        intake.referralSource || null,
        buildReservationNote(intake),
      ],
    });
    const reservationId = String(resResult.rows[0].id);

    // Create checkout via payment gateway
    const gateway = getGateway();

    // Determine base URL: prefer env var, then derive from request host
    const host = request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : "http://localhost:3000");

    const checkout = await gateway.createCheckout({
      amount: totalAmount,
      currency: "mxn",
      description: `${experience.title} — ${attendeesCount} persona(s)`,
      reservationId,
      customerEmail,
      baseUrl,
    });

    // Store payment reference
    await db.execute({
      sql: "UPDATE reservations SET payment_reference = ? WHERE id = ?",
      args: [checkout.reference, reservationId],
    });
    heldAvailabilityId = null;

    return NextResponse.json({
      checkoutUrl: checkout.url,
      reference: checkout.reference,
      reservationId,
    });
  } catch (error) {
    if (heldAvailabilityId && heldAttendeesCount > 0) {
      await db.execute({
        sql: "UPDATE availability SET booked = MAX(booked - ?, 0) WHERE id = ?",
        args: [heldAttendeesCount, heldAvailabilityId],
      }).catch(() => {});
    }
    console.error("[POST /api/public/reservations]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear la reserva." },
      { status: 500 }
    );
  }
}

function buildReservationNote(intake: {
  dietaryRestrictions: string;
  accessibilityNeeds: string;
  interests: string;
  referralSource: string;
}) {
  const lines = [
    intake.dietaryRestrictions ? `Alergias/restricciones: ${intake.dietaryRestrictions}` : "",
    intake.accessibilityNeeds ? `Accesibilidad: ${intake.accessibilityNeeds}` : "",
    intake.interests ? `Intereses/contexto: ${intake.interests}` : "",
    intake.referralSource ? `Cómo llegó: ${intake.referralSource}` : "",
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : null;
}
