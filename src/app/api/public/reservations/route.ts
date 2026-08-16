import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";
import { getGateway } from "@/lib/payments";

/**
 * POST /api/public/reservations
 * Creates a public reservation and initiates checkout.
 *
 * Body: { experienceId, availabilityId, customer: { name, email, phone }, attendeesCount }
 * Returns: { checkoutUrl, reference }
 */
export async function POST(request: NextRequest) {
  await ensureMigrated();

  try {
    const body = await request.json();
    const { experienceId, availabilityId, customer, attendeesCount = 1 } = body;

    // Validate required fields
    if (!experienceId || !availabilityId || !customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: experienceId, availabilityId, customer (name, email)." },
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

    // Check availability and capacity
    const avResult = await db.execute({
      sql: "SELECT id, capacity, booked, status FROM availability WHERE id = ? AND experience_id = ?",
      args: [availabilityId, experienceId],
    });
    if (avResult.rows.length === 0) {
      return NextResponse.json({ error: "Fecha no disponible." }, { status: 404 });
    }
    const availability = avResult.rows[0];

    if (availability.status !== "open") {
      return NextResponse.json({ error: "Esta fecha ya no está disponible." }, { status: 409 });
    }

    const currentBooked = Number(availability.booked) || 0;
    const maxCapacity = Number(availability.capacity) || 12;
    if (currentBooked + attendeesCount > maxCapacity) {
      return NextResponse.json(
        { error: `No hay suficientes cupos. Disponibles: ${maxCapacity - currentBooked}.` },
        { status: 409 }
      );
    }

    // Find or create customer
    let customerId: string;
    const existingCustomer = await db.execute({
      sql: "SELECT id FROM customers WHERE email = ?",
      args: [customer.email],
    });

    if (existingCustomer.rows.length > 0) {
      customerId = String(existingCustomer.rows[0].id);
      // Update phone/name if provided
      await db.execute({
        sql: "UPDATE customers SET name = ?, phone = COALESCE(?, phone), updated_at = datetime('now') WHERE id = ?",
        args: [customer.name, customer.phone || null, customerId],
      });
    } else {
      const insertResult = await db.execute({
        sql: `INSERT INTO customers (name, email, phone, source, stage) VALUES (?, ?, ?, 'reserva', 'reserva_pendiente') RETURNING id`,
        args: [customer.name, customer.email, customer.phone || null],
      });
      customerId = String(insertResult.rows[0].id);
    }

    // Calculate amount
    const pricePerPerson = Number(experience.price) || 0;
    const totalAmount = pricePerPerson * attendeesCount;

    // Create reservation
    const resResult = await db.execute({
      sql: `INSERT INTO reservations (customer_id, experience_id, availability_id, attendees_count, amount, status, payment_status, payment_method)
            VALUES (?, ?, ?, ?, ?, 'pending', 'unpaid', 'pending') RETURNING id`,
      args: [customerId, experienceId, availabilityId, attendeesCount, totalAmount],
    });
    const reservationId = String(resResult.rows[0].id);

    // Update availability booked count
    await db.execute({
      sql: "UPDATE availability SET booked = booked + ? WHERE id = ?",
      args: [attendeesCount, availabilityId],
    });

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
      customerEmail: customer.email,
      baseUrl,
    });

    // Store payment reference
    await db.execute({
      sql: "UPDATE reservations SET payment_reference = ? WHERE id = ?",
      args: [checkout.reference, reservationId],
    });

    return NextResponse.json({
      checkoutUrl: checkout.url,
      reference: checkout.reference,
      reservationId,
    });
  } catch (error) {
    console.error("[POST /api/public/reservations]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear la reserva." },
      { status: 500 }
    );
  }
}
