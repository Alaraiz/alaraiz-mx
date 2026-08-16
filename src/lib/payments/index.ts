import type { PaymentGateway } from "./types";
import { ManualGateway } from "./adapters/manual";

export type { PaymentGateway, CheckoutInput, CheckoutResult, WebhookResult } from "./types";

/**
 * Returns the configured payment gateway adapter.
 * Reads PAYMENT_PROVIDER from environment: 'stripe' | 'mercadopago' | 'manual'
 * Defaults to 'manual' if not set.
 */
export function getGateway(): PaymentGateway {
  const provider = (process.env.PAYMENT_PROVIDER || "manual").toLowerCase();

  switch (provider) {
    case "stripe": {
      // Lazy import to avoid loading credentials when not needed
      const { StripeGateway } = require("./adapters/stripe");
      return new StripeGateway();
    }
    case "mercadopago": {
      const { MercadoPagoGateway } = require("./adapters/mercadopago");
      return new MercadoPagoGateway();
    }
    case "manual":
    default:
      return new ManualGateway();
  }
}
