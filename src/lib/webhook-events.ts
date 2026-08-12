/**
 * The event catalogue, in a file with no server imports.
 *
 * The delivery code in `src/server/lib/webhooks.ts` is `server-only`, and the
 * settings UI needs the same list to render checkboxes. Keeping the names here
 * means the picker and the dispatcher can never drift, without dragging
 * node:crypto into a client bundle.
 */

export const WEBHOOK_EVENTS = [
  "feedback.created",
  "feedback.analyzed",
  "theme.created",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Written as "when this happens", because that is how you pick one. */
export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  "feedback.created": "Feedback arrives",
  "feedback.analyzed": "Sentiment and summary are ready",
  "theme.created": "A new theme is identified",
};
