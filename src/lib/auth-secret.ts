const DEV_AUTH_SECRET = "raiz-local-development-secret-change-before-production";

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET must be configured with at least 32 characters in production."
    );
  }

  if (secret && secret.length < 32) {
    console.warn(
      "[auth] AUTH_SECRET is shorter than 32 characters. Using local development secret."
    );
  }

  return new TextEncoder().encode(DEV_AUTH_SECRET);
}
