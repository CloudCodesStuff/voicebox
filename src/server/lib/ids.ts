import { createHash, randomBytes } from "node:crypto";

/**
 * Public project key. This is the only identifier the widget carries, so it is
 * generated from a CSPRNG and never derived from anything guessable. The
 * `pk_` prefix makes it obvious in a customer's HTML that it's a publishable
 * key rather than a secret.
 */
export function projectKey(): string {
  return `pk_${randomBytes(18).toString("base64url")}`;
}

/**
 * Secret API key. Returned in plaintext exactly once; only the hash is stored.
 */
export function apiKey(): { plaintext: string; hashed: string; prefix: string } {
  const plaintext = `sk_${randomBytes(24).toString("base64url")}`;
  return {
    plaintext,
    hashed: hashApiKey(plaintext),
    // Enough to identify the key in a list without being usable.
    prefix: plaintext.slice(0, 11),
  };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function webhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export function inviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Appends a short random suffix. Used when a preferred slug is taken, cheaper
 * and more predictable than a read-check-retry loop against a unique index.
 */
export function withSuffix(slug: string): string {
  return `${slug || "org"}-${randomBytes(3).toString("hex")}`;
}
