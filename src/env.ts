import { z } from "zod";

/* ---------------------------------------------------------------------------
   Environment configuration
   ---------------------------------------------------------------------------
   Validation is LAZY on purpose. The marketing site must render with an empty
   .env so you can `npm run dev` and see the landing page before wiring any
   third-party account. Nothing here is read until a module that genuinely
   needs a secret asks for it, and when that happens the failure names the
   exact variable and where to get it.

   Required to boot the product:   DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_*
   Optional, feature-gated:        STRIPE_*, RESEND_*, DEEPSEEK_*, CRON_SECRET
--------------------------------------------------------------------------- */

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // --- Core -----------------------------------------------------------------
  DATABASE_URL: z
    .string()
    .url()
    .describe("Postgres connection string (Neon, Supabase, or local)"),

  AUTH_SECRET: z
    .string()
    .min(32)
    .describe("Random 32+ char string. Generate: openssl rand -base64 32"),

  AUTH_GOOGLE_ID: z
    .string()
    .min(1)
    .describe("Google OAuth client ID from console.cloud.google.com"),

  AUTH_GOOGLE_SECRET: z
    .string()
    .min(1)
    .describe("Google OAuth client secret"),

  // --- Email (Resend) -------------------------------------------------------
  RESEND_API_KEY: z
    .string()
    .startsWith("re_")
    .optional()
    .describe("Resend API key. Without it, emails log to console in dev."),

  EMAIL_FROM: z
    .string()
    .optional()
    .describe('Verified sender, e.g. "Voicebox <hello@yourdomain.com>"'),

  // --- Operator access ------------------------------------------------------
  ADMIN_EMAILS: z
    .string()
    .optional()
    .describe(
      "Comma-separated emails allowed into /admin. Unset means nobody, never everybody.",
    ),

  // --- AI (DeepSeek via Vercel AI SDK) --------------------------------------
  DEEPSEEK_API_KEY: z
    .string()
    .optional()
    .describe("DeepSeek API key. Without it, AI drafting is disabled."),

  // --- Stripe ---------------------------------------------------------------
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),

  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_ANNUAL: z.string().optional(),
  STRIPE_PRICE_SCALE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_SCALE_ANNUAL: z.string().optional(),

  // --- Jobs -----------------------------------------------------------------
  CRON_SECRET: z
    .string()
    .min(16)
    .optional()
    .describe("Shared secret protecting /api/cron/*. Generate any 32-char string."),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .describe(
      "Public origin, no trailing slash. Used in emails and QR codes. " +
        "On Vercel this is auto-detected from the platform's own env vars " +
        "and does not need to be set by hand, see detectAppUrl() below.",
    ),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

function formatIssues(error: z.ZodError, schema: z.ZodObject<z.ZodRawShape>) {
  const shape = schema.shape;
  const lines = error.issues.map((issue) => {
    const key = String(issue.path[0] ?? "?");
    const field = shape[key];
    const hint =
      field && "description" in field && field.description
        ? `\n      ${field.description}`
        : "";
    return `  • ${key}, ${issue.message}${hint}`;
  });

  return [
    "",
    "  ┌─────────────────────────────────────────────────────────────┐",
    "  │  Voicebox: environment is not configured                        │",
    "  └─────────────────────────────────────────────────────────────┘",
    "",
    ...lines,
    "",
    "  Copy .env.example to .env and fill these in.",
    "  Run `npm run env:check` to verify everything at once.",
    "",
  ].join("\n");
}

let serverCache: ServerEnv | null = null;

function loadServerEnv(): ServerEnv {
  if (serverCache) return serverCache;

  if (typeof window !== "undefined") {
    throw new Error(
      "Server environment was read from the browser. Move this call into a " +
        "server component, route handler, or tRPC procedure.",
    );
  }

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(formatIssues(parsed.error, serverSchema));
  }

  serverCache = parsed.data;
  return serverCache;
}

/**
 * Lazily-validated server environment. Reading any property triggers
 * validation of the whole server schema; importing this module does not.
 */
export const env = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    return loadServerEnv()[prop as keyof ServerEnv];
  },
});

/**
 * Vercel already knows the exact URL this app is running at, there's no
 * reason to make a human retype it into a dashboard field, where a stray
 * paste (a markdown link, a trailing slash, the wrong domain) becomes a
 * build-crashing typo instead of a compile error. Vercel injects these
 * automatically on every build and request, no configuration needed:
 *
 *   VERCEL_PROJECT_PRODUCTION_URL   the project's assigned production
 *                                   domain, stable across deploys, and the
 *                                   custom domain if one is configured as
 *                                   primary, not just the *.vercel.app one.
 *   VERCEL_URL                      this specific deployment's own URL,
 *                                   different every deploy, so it's the
 *                                   right choice for previews: each one gets
 *                                   correct absolute links and OG images
 *                                   pointing at itself rather than at prod.
 *
 * An explicit NEXT_PUBLIC_APP_URL always wins over both, so local dev, a
 * non-Vercel host, or an intentional override (a canonical domain that
 * differs from what Vercel assigned) still work exactly as before.
 */
function detectAppUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit;

  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return undefined; // zod's own default(), "http://localhost:3000", takes over.
}

/**
 * Client env is inlined at build time by Next, so it must be read statically.
 *
 * Parsed eagerly (not through the lazy `env` proxy above) so a malformed value
 * fails the build right here, with the variable's name in the message, instead
 * of surfacing later as a cryptic native error wherever the raw string first
 * gets used, e.g. `new URL(process.env.NEXT_PUBLIC_APP_URL)` deep inside
 * layout.tsx failing with just "Invalid URL" and no indication which env var
 * or dashboard field caused it.
 */
function loadClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: detectAppUrl(),
  });
  if (!parsed.success) {
    throw new Error(formatIssues(parsed.error, clientSchema));
  }
  return parsed.data;
}

export const clientEnv: ClientEnv = loadClientEnv();

/* --- Feature availability ---------------------------------------------------
   Every optional integration is checked through one of these. Features degrade
   with an explicit message instead of crashing the app or, worse, silently
   doing nothing.
---------------------------------------------------------------------------- */

export const features = {
  get email(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  },
  get ai(): boolean {
    return Boolean(process.env.DEEPSEEK_API_KEY);
  },
  get billing(): boolean {
    return Boolean(
      process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
    );
  },
  get cron(): boolean {
    return Boolean(process.env.CRON_SECRET);
  },
} as const;

export function requireFeature(
  name: keyof typeof features,
  vars: string[],
): void {
  if (features[name]) return;
  throw new Error(
    `The "${name}" feature is not configured. Set ${vars.join(", ")} in .env, ` +
      `see .env.example for where to get each value.`,
  );
}
