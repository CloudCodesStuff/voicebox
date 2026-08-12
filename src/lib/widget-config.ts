import { z } from "zod";

/* ---------------------------------------------------------------------------
   Widget configuration
   ---------------------------------------------------------------------------
   One definition, three consumers: the Widget Studio controls, the live
   preview, and the runtime bundle served to customers' sites. Keeping the
   shape here means a new option can never be added to the studio without the
   runtime understanding it.
--------------------------------------------------------------------------- */

export const feedbackTypes = ["IDEA", "ISSUE", "PRAISE", "QUESTION"] as const;
export type FeedbackTypeKey = (typeof feedbackTypes)[number];

/**
 * Font stacks, not webfonts.
 *
 * Loading a Google Font from inside someone else's page costs a network
 * request, a layout shift, and a privacy conversation we don't want to have on
 * their behalf. These all resolve instantly from fonts already on the device.
 */
export const fontStacks = {
  sans: {
    label: "Sans",
    stack:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  serif: {
    label: "Serif",
    stack:
      "ui-serif, 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
  },
  rounded: {
    label: "Rounded",
    stack:
      "ui-rounded, 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Quicksand, Nunito, system-ui, sans-serif",
  },
  mono: {
    label: "Mono",
    stack:
      "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  },
  inherit: {
    label: "Match my site",
    stack: "inherit",
  },
} as const;

export type FontKey = keyof typeof fontStacks;
export const fontKeys = Object.keys(fontStacks) as FontKey[];

export const widgetConfigSchema = z.object({
  /** Accent used for the trigger, focus rings, and the submit button. */
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#00C48C"),

  font: z.enum(fontKeys as [FontKey, ...FontKey[]]).default("sans"),

  position: z
    .enum(["bottom-right", "bottom-left", "top-right", "top-left"])
    .default("bottom-right"),

  /** Auto follows the host page's prefers-color-scheme. */
  theme: z.enum(["light", "dark", "auto"]).default("auto"),

  radius: z.number().int().min(0).max(24).default(12),

  triggerLabel: z.string().max(24).default("Feedback"),

  /** Hides the floating button entirely; host opens it via Voicebox('open'). */
  triggerHidden: z.boolean().default(false),

  heading: z.string().max(60).default("Share your feedback"),
  subheading: z
    .string()
    .max(120)
    .default("We read every one of these. It's how we pick what to build."),

  enabledTypes: z
    .array(z.enum(feedbackTypes))
    .min(1)
    .default([...feedbackTypes]),

  askRating: z.boolean().default(true),

  /** Stars read as a rating instantly. Numbered boxes read as a phone keypad. */
  ratingStyle: z.enum(["stars", "numbers"]).default("stars"),

  askEmail: z.boolean().default(true),

  successMessage: z.string().max(120).default("Got it. Thank you."),

  /** Paid feature. Enforced server-side when serving the runtime config. */
  hideBranding: z.boolean().default(false),

  logoUrl: z.string().url().nullable().default(null),
});

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;

export const defaultWidgetConfig: WidgetConfig = widgetConfigSchema.parse({});

/**
 * Placeholder copy tuned per feedback type. A generic "Your message" box gets
 * generic messages; asking the right question is most of what produces useful
 * feedback.
 */
export const typeCopy: Record<
  FeedbackTypeKey,
  { label: string; placeholder: string; icon: string }
> = {
  IDEA: {
    label: "Idea",
    placeholder: "What would you love to see us build?",
    icon: "lightbulb",
  },
  ISSUE: {
    label: "Issue",
    placeholder: "What went wrong? What were you trying to do?",
    icon: "bug",
  },
  PRAISE: {
    label: "Praise",
    placeholder: "What's working well for you?",
    icon: "heart",
  },
  QUESTION: {
    label: "Question",
    placeholder: "What can we help you with?",
    icon: "help",
  },
};

/** Parses stored JSON defensively, an older row must never break the studio. */
export function parseWidgetConfig(value: unknown): WidgetConfig {
  const result = widgetConfigSchema.safeParse(value);
  return result.success ? result.data : defaultWidgetConfig;
}
