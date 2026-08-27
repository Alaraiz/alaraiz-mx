import { db } from "@/lib/db";
import { getMexicoDateKey } from "@/lib/mexico-time";

export type DiscountResult =
  | {
      ok: true;
      code: string;
      label: string | null;
      type: string;
      value: number;
      amount: number;
      total: number;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

export function normalizeDiscountCode(code: unknown) {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function calculateDiscount(code: unknown, subtotal: number): Promise<DiscountResult> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) {
    return { ok: true, code: "", label: null, type: "none", value: 0, amount: 0, total: subtotal };
  }

  const result = await db.execute({
    sql: `SELECT code, label, discount_type, value, is_active, max_uses, used_count, starts_at, expires_at
          FROM discount_codes
          WHERE code = ? COLLATE NOCASE
          LIMIT 1`,
    args: [normalized],
  });
  const discount = result.rows[0];
  if (!discount) return { ok: false, error: "Código de descuento no encontrado.", status: 404 };
  if (Number(discount.is_active) !== 1) return { ok: false, error: "Este código ya no está activo.", status: 409 };

  const today = getMexicoDateKey();
  const startsAt = String(discount.starts_at || "");
  const expiresAt = String(discount.expires_at || "");
  if (startsAt && startsAt > today) return { ok: false, error: "Este código todavía no está vigente.", status: 409 };
  if (expiresAt && expiresAt < today) return { ok: false, error: "Este código ya expiró.", status: 409 };

  const maxUses = discount.max_uses == null ? null : Number(discount.max_uses);
  if (maxUses != null && maxUses > 0 && Number(discount.used_count) >= maxUses) {
    return { ok: false, error: "Este código ya alcanzó su límite de usos.", status: 409 };
  }

  const type = String(discount.discount_type || "percent");
  const value = Math.max(0, Number(discount.value) || 0);
  const rawAmount = type === "fixed" ? value : subtotal * Math.min(value, 100) / 100;
  const amount = Math.min(subtotal, Math.round(rawAmount * 100) / 100);

  return {
    ok: true,
    code: normalized,
    label: discount.label ? String(discount.label) : null,
    type,
    value,
    amount,
    total: Math.max(0, Math.round((subtotal - amount) * 100) / 100),
  };
}

export async function registerDiscountUse(code: string) {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return;
  await db.execute({
    sql: "UPDATE discount_codes SET used_count = used_count + 1, updated_at = datetime('now') WHERE code = ? COLLATE NOCASE",
    args: [normalized],
  });
}
