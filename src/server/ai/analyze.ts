import "server-only";

import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";

import { captureError } from "@/server/lib/errors";

/* ---------------------------------------------------------------------------
   The analysis engine
   ---------------------------------------------------------------------------
   Every call goes through the Vercel AI SDK's `generateObject` with a Zod
   schema, so the model returns validated structured data rather than a string
   we have to parse and pray over. A malformed response fails loudly at the
   boundary instead of writing garbage into the database.

   PRIVACY RULE, enforced by construction: the submitter's email address and
   any identify() traits the host passed are never included in a prompt. Only
   the message body, the type the user picked, and the rating leave our
   infrastructure. This is stated in the privacy policy and the shape of the
   functions below is what makes it true.
--------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------
   Provider selection

   This used to be one hard-coded provider, and that turned out to be a single
   point of failure for the only feature anyone pays for: the DeepSeek balance
   ran out, every model call started returning "Insufficient Balance", and the
   product quietly stopped producing themes while continuing to accept
   feedback. Nothing in the app said so.

   So the provider is now a list. Whichever key is present wins, in the order
   below, and `ANALYSIS_PROVIDER` pins one explicitly when several are set.
   Swapping provider is an environment variable, not a deploy.

   The order is deliberate: Groq first because its free tier is genuinely free
   and it supports strict JSON-schema decoding, which is what `generateObject`
   needs to be reliable. Gemini Flash-Lite second as the cheap paid option
   (~$9/month at 38 customers, measured against this app's own recorded token
   spend). DeepSeek last, because it is the one that just failed.

   DATA-HANDLING NOTE, which is a real constraint and not a formality: the text
   sent here belongs to a customer's end users, and we hold it as a processor.
   Any provider added to this list has to be named in the privacy policy and
   the DPA subprocessor list before it sees customer feedback. Google's *free*
   tier is specifically not eligible — its terms reserve the right to have
   human reviewers read API inputs and outputs and say not to send confidential
   data — so `GOOGLE_GENERATIVE_AI_API_KEY` here is expected to be a paid-tier
   key. Groq treats API traffic as customer data under its own DPA, which is
   why it can be the free default.
--------------------------------------------------------------------------- */

type ProviderId = "groq" | "google" | "deepseek";

type ProviderSpec = {
  id: ProviderId;
  /** Environment variable holding the key. */
  env: string;
  /** Model to use for this provider. */
  model: string;
  build: (apiKey: string, model: string) => LanguageModel;
};

const PROVIDERS: ProviderSpec[] = [
  {
    id: "groq",
    env: "GROQ_API_KEY",
    // Strict structured-output support (constrained decoding), which the two
    // Zod schemas below depend on. Both are fully-required objects with no
    // optional fields, which is exactly what strict mode demands.
    model: "openai/gpt-oss-120b",
    build: (apiKey, model) => createGroq({ apiKey })(model),
  },
  {
    id: "google",
    env: "GOOGLE_GENERATIVE_AI_API_KEY",
    model: "gemini-2.5-flash-lite",
    build: (apiKey, model) => createGoogleGenerativeAI({ apiKey })(model),
  },
  {
    id: "deepseek",
    env: "DEEPSEEK_API_KEY",
    model: "deepseek-v4-flash",
    build: (apiKey, model) => createDeepSeek({ apiKey })(model),
  },
];

function activeProvider(): ProviderSpec | null {
  const pinned = process.env.ANALYSIS_PROVIDER?.trim().toLowerCase();
  const candidates = pinned
    ? PROVIDERS.filter((p) => p.id === pinned)
    : PROVIDERS;
  return candidates.find((p) => Boolean(process.env[p.env])) ?? null;
}

/**
 * Which model is actually running, as `provider/model`.
 *
 * Recorded on every `AnalysisRun` and attached to captured errors, so a
 * provider switch is visible in the history rather than being something you
 * have to remember. Returns a placeholder rather than throwing when nothing is
 * configured, because it is called from logging paths.
 */
export function activeModelId(): string {
  const p = activeProvider();
  return p ? `${p.id}/${p.model}` : "none";
}

const TIMEOUT_MS = 20_000;

/**
 * Clustering gets a much longer budget than per-item enrichment: it produces a
 * large structured object, and 60s was measurably too tight for a 30-item
 * project.
 *
 * But it has to stay UNDER the shortest function limit it can run inside, and
 * it did not. `runClustering` is called from a tRPC mutation as well as from
 * cron — the Regroup button in the app — and this was 150s against a route
 * with no `maxDuration` at all. When the platform kills a function, our catch
 * never runs, so the failure is not recorded anywhere: the exact invisible
 * failure the error capture exists to prevent. Both call sites now cap at 60s
 * and this sits below that, so our own abort fires first and leaves a row.
 */
const CLUSTER_TIMEOUT_MS = 45_000;

function getModel() {
  const provider = activeProvider();
  if (!provider) return null;
  return provider.build(process.env[provider.env] as string, provider.model);
}

export function isAnalysisConfigured(): boolean {
  return activeProvider() !== null;
}

/* --------------------------------------------------------------------------
   Stage 1, per-item enrichment
-------------------------------------------------------------------------- */

const enrichmentSchema = z.object({
  sentiment: z
    .enum(["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"])
    .describe("Overall emotional tone of the feedback."),
  sentimentScore: z
    .number()
    .min(-1)
    .max(1)
    .describe("-1 is furious, 0 is neutral, 1 is delighted."),
  category: z
    .string()
    .max(40)
    .describe(
      "A short lowercase intent label, 1-3 words, e.g. 'billing confusion', 'export bug', 'feature request'.",
    ),
  summary: z
    .string()
    .max(160)
    .describe(
      "One neutral sentence stating what this person wants or experienced. No preamble.",
    ),
});

export type Enrichment = z.infer<typeof enrichmentSchema>;

export type EnrichmentInput = {
  body: string;
  type: string;
  rating: number | null;
};

/**
 * Scores one submission. Returns null rather than throwing when the model is
 * unavailable or misbehaves, feedback must remain usable without analysis.
 */
export async function enrichFeedback(
  input: EnrichmentInput,
): Promise<{ result: Enrichment; tokens: number } | null> {
  const model = getModel();
  if (!model) return null;

  try {
    const { object, usage } = await generateObject({
      model,
      schema: enrichmentSchema,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      system:
        "You analyze product feedback for a SaaS company. Be precise and literal. " +
        "Do not speculate beyond what the text says. Category labels should be " +
        "reusable across many submissions, so prefer general terms over specific ones.",
      prompt: [
        `Feedback type the user selected: ${input.type}`,
        input.rating != null ? `Rating given: ${input.rating}/5` : null,
        "",
        "Feedback text:",
        input.body,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return { result: object, tokens: usage?.totalTokens ?? 0 };
  } catch (error) {
    // Still swallowed: a failed analysis is a retry, not an incident, and
    // feedback has to remain usable without it. But it is recorded, because
    // the reason was previously destroyed here — an expired key, a rate limit
    // and a schema the provider stopped honouring all looked identical from
    // the outside, which is to say invisible. Grouped by fingerprint, so a
    // provider having a bad hour is one row with a count, and `warn` because
    // one of these is noise; a thousand is an outage.
    // Awaited, not fire-and-forget. `captureError` never throws, so there is
    // nothing to gain from letting it float, and plenty to lose: a serverless
    // function can be frozen the moment it returns its response, which kills
    // an un-awaited write. That is how the failure this instrumentation exists
    // to catch would go unrecorded — confirmed locally, where the row only
    // appeared after waiting several seconds before disconnecting.
    await captureError({
      source: "analysis",
      error,
      level: "warn",
      context: { stage: "enrich", model: activeModelId() },
    });
    return null;
  }
}

/* --------------------------------------------------------------------------
   Stage 2, theme clustering
   ------------------------------------------------------------------------
   The differentiator. Sentiment alone is a pie chart; clustering is the thing
   worth paying for. Existing theme titles are passed in as context so the
   model reuses them where it can, otherwise clusters churn every run and the
   trend lines become meaningless.
-------------------------------------------------------------------------- */

const clusterSchema = z.object({
  themes: z
    .array(
      z.object({
        title: z
          .string()
          .max(60)
          .describe(
            "Short, specific, action-oriented. 'Slow CSV export', not 'Performance'.",
          ),
        description: z
          .string()
          .max(240)
          .describe("One or two sentences on what users are saying and why."),
        itemIds: z
          .array(z.number().int())
          .describe(
            "The [n] numbers of the feedback items belonging to this theme.",
          ),
      }),
    )
    .describe("Every provided item must appear in exactly one theme."),
});

export type ClusterResult = z.infer<typeof clusterSchema>;

export type ClusterItem = {
  id: string;
  /** The AI summary if we have it, otherwise a truncated body. */
  text: string;
  sentiment: string | null;
};

/** What callers get back: real feedback ids, not the model's line numbers. */
export type ClusterAssignment = {
  title: string;
  description: string;
  itemIds: string[];
};

export async function clusterFeedback(
  items: ClusterItem[],
  existingThemeTitles: string[],
): Promise<{ themes: ClusterAssignment[]; tokens: number } | null> {
  const model = getModel();
  if (!model || items.length === 0) return null;

  // The model echoes back a line number, not a 25-character cuid. Asking it to
  // reproduce 30 opaque ids exactly is a lot of fragile output tokens and was
  // the difference between this call finishing and timing out.
  const byIndex = new Map(items.map((item, i) => [i + 1, item.id]));

  try {
    const { object, usage } = await generateObject({
      model,
      schema: clusterSchema,
      abortSignal: AbortSignal.timeout(CLUSTER_TIMEOUT_MS),
      system: [
        "You group product feedback into themes a product team can act on.",
        "",
        "Rules, in priority order:",
        "1. A good theme is specific enough to become a ticket. Merge items that",
        "   describe the same underlying problem or request even when the wording",
        "   is completely different.",
        "2. Strongly prefer fewer, larger themes. A theme with one item is almost",
        "   always a failure to spot the connection, look harder before creating one.",
        "3. Group ALL general compliments into a single theme titled",
        '   "Positive feedback" rather than one theme per compliment. Praise is not',
        "   individually actionable, and splitting it buries the real work.",
        "4. Name themes after the problem or request, never the sentiment.",
        '   "CSV export times out on large ranges", not "Export complaints".',
        "5. Every item id must be assigned to exactly one theme.",
      ].join("\n"),
      prompt: [
        existingThemeTitles.length > 0
          ? [
              "Themes that already exist. Reuse these titles verbatim when an item fits,",
              "so counts and trends stay continuous across runs:",
              ...existingThemeTitles.map((t) => `- ${t}`),
              "",
            ].join("\n")
          : "",
        "Feedback items to group:",
        ...items.map(
          (item, i) =>
            `[${i + 1}]${item.sentiment ? ` (${item.sentiment.toLowerCase()})` : ""} ${item.text}`,
        ),
      ]
        .filter(Boolean)
        .join("\n"),
    });

    const themes: ClusterAssignment[] = object.themes
      .map((theme) => ({
        title: theme.title,
        description: theme.description,
        // Drop anything that isn't a line number we actually issued. Models
        // occasionally invent an index, and a silent bad mapping would put
        // someone else's feedback in the wrong theme.
        itemIds: [
          ...new Set(
            theme.itemIds
              .map((n) => byIndex.get(n))
              .filter((id): id is string => Boolean(id)),
          ),
        ],
      }))
      .filter((theme) => theme.itemIds.length > 0);

    return { themes, tokens: usage?.totalTokens ?? 0 };
  } catch (error) {
    // Clustering is the part customers pay for, so a failure here matters
    // more than a single enrichment: `error`, not `warn`.
    await captureError({
      source: "analysis",
      error,
      context: { stage: "cluster", items: items.length, model: activeModelId() },
    });
    return null;
  }
}

/* --------------------------------------------------------------------------
   Stage 3, prioritization
   ------------------------------------------------------------------------
   Deliberately arithmetic, not another model call. A team needs to be able to
   understand and trust the ordering of their own roadmap, and "the AI said so"
   is not a defensible answer. Volume x how unhappy x how recent.
-------------------------------------------------------------------------- */

export function priorityScore(opts: {
  itemCount: number;
  negativeShare: number;
  lastSeenAt: Date;
  now?: Date;
}): number {
  const now = opts.now ?? new Date();
  const daysSince = Math.max(
    0,
    (now.getTime() - opts.lastSeenAt.getTime()) / 86_400_000,
  );

  // Half-life of two weeks: a theme nobody has mentioned in a month drops off
  // the top of the list without disappearing entirely.
  const recency = Math.pow(0.5, daysSince / 14);

  // Volume is log-scaled so one very loud theme can't permanently bury
  // everything else, and negative feeling is weighted but never zeroes a theme
  // out, plenty of high-value requests arrive politely.
  const volume = Math.log2(opts.itemCount + 1);
  const severity = 0.35 + opts.negativeShare * 0.65;

  return Number((volume * severity * recency * 100).toFixed(2));
}

export function dominantSentiment(
  counts: Record<string, number>,
): "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED" {
  const positive = counts.POSITIVE ?? 0;
  const negative = counts.NEGATIVE ?? 0;
  const neutral = counts.NEUTRAL ?? 0;
  const total = positive + negative + neutral + (counts.MIXED ?? 0);
  if (total === 0) return "NEUTRAL";

  // Genuinely split opinion is its own signal, not a rounding decision.
  if (positive > 0 && negative > 0) {
    const ratio = Math.min(positive, negative) / Math.max(positive, negative);
    if (ratio > 0.6) return "MIXED";
  }

  if (negative >= positive && negative >= neutral) return "NEGATIVE";
  if (positive >= negative && positive >= neutral) return "POSITIVE";
  return "NEUTRAL";
}
