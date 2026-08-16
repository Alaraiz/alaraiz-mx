/**
 * Payment Gateway abstraction layer.
 * Allows swapping between Stripe, MercadoPago, or a manual/test adapter.
 */

export interface CheckoutInput {
  amount: number;
  currency: string;
  description: string;
  reservationId: string;
  customerEmail: string;
  /** Base URL of the site (e.g. https://alaraiz.mx). Used for return/redirect URLs. */
  baseUrl: string;
}

export interface CheckoutResult {
  /** URL to redirect the customer to for payment */
  url: string;
  /** Unique reference for this payment attempt */
  reference: string;
}

export interface WebhookResult {
  /** The payment reference that was completed/failed */
  reference: string;
  /** Final status of the payment */
  status: "paid" | "failed";
}

export interface PaymentGateway {
  /** Create a checkout session and return the redirect URL + reference */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Verify a webhook payload signature and extract payment result */
  verifyWebhook(payload: string, signature: string): Promise<WebhookResult>;
}
