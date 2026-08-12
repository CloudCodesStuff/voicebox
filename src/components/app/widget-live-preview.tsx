"use client";

import {
  Bug,
  Check,
  Heart,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Send,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";

import { readableOn } from "@/lib/image-color";
import { site } from "@/lib/site";
import {
  fontStacks,
  typeCopy,
  type FeedbackTypeKey,
  type WidgetConfig,
} from "@/lib/widget-config";
import { cn } from "@/lib/utils";

/**
 * A faithful React render of the embeddable widget, driven entirely by config.
 *
 * It deliberately duplicates the runtime's markup rather than iframing the real
 * widget: an iframe would need a saved project and a round trip, so every
 * control would feel laggy and nothing would update until you hit save. Every
 * value below reads straight from the config object, so moving a slider moves
 * the preview on the same frame.
 *
 * Kept visually in step with public/widget.js by hand. When one changes, the
 * other has to.
 */

const ICONS: Record<FeedbackTypeKey, typeof Lightbulb> = {
  IDEA: Lightbulb,
  ISSUE: Bug,
  PRAISE: Heart,
  QUESTION: HelpCircle,
};

const RATE_WORDS = ["", "Awful", "Poor", "Fine", "Good", "Great"];

export function WidgetLivePreview({
  config,
  state = "form",
  initialRating = 0,
}: {
  config: WidgetConfig;
  state?: "form" | "success" | "trigger";
  /**
   * Start with a score already chosen. The studio wants an untouched control
   * so you can see the empty state you actually ship; marketing wants it
   * filled, because a row of five grey stars reads as broken in a still.
   */
  initialRating?: number;
}) {
  const [selectedType, setSelectedType] = useState<FeedbackTypeKey | null>(null);
  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState(0);

  const dark = config.theme === "dark";
  const accent = config.accentColor;
  const onAccent = readableOn(accent);
  const font = fontStacks[config.font].stack;
  const r = config.radius;

  const bg = dark ? "#0e0e11" : "#ffffff";
  const fg = dark ? "#fafafa" : "#09090b";
  const muted = dark ? "#a1a1a8" : "#62626b";
  const faint = dark ? "#71717a" : "#8f8f98";
  const border = dark ? "#1f1f24" : "#ebebed";
  const field = dark ? "#17171b" : "#fafafa";
  const starOff = dark ? "#2c2c33" : "#dcdce0";

  const fontFamily = font === "inherit" ? undefined : font;
  const activeType = selectedType ?? config.enabledTypes[0] ?? null;
  const placeholder = activeType
    ? typeCopy[activeType].placeholder
    : "Tell us what's on your mind…";
  const shown = hovered || rating;

  if (state === "trigger") {
    return (
      <div
        className="inline-flex h-10 items-center gap-[7px] px-[15px] text-[13.5px] font-medium"
        style={{
          background: accent,
          color: onAccent,
          // No floor: radius 0 means genuinely sharp, everywhere.
          borderRadius: r,
          boxShadow:
            "0 4px 12px -3px rgba(9,9,11,.18), 0 1px 3px rgba(9,9,11,.1)",
          letterSpacing: "-0.005em",
          fontFamily,
        }}
      >
        <MessageSquare className="size-[15px]" strokeWidth={1.9} />
        {config.triggerLabel}
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[352px] overflow-hidden"
      style={{
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        borderRadius: r > 0 ? r + 4 : 0,
        boxShadow: dark
          ? "0 12px 32px -8px rgba(0,0,0,.6), 0 2px 8px -2px rgba(0,0,0,.4)"
          : "0 12px 32px -8px rgba(9,9,11,.12), 0 2px 8px -2px rgba(9,9,11,.06)",
        fontFamily,
      }}
    >
      {state === "success" ? (
        <div className="px-[22px] pt-8 pb-7 text-center">
          <div
            className="mx-auto grid size-[38px] place-items-center rounded-full"
            style={{ background: accent, color: onAccent }}
          >
            <Check className="size-[18px]" strokeWidth={2.5} />
          </div>
          <p
            className="mt-3 text-[13.5px] leading-relaxed"
            style={{ color: fg }}
          >
            {config.successMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="relative px-4 pt-4">
            <div
              className="pr-7 text-[14.5px] font-semibold leading-tight"
              style={{ letterSpacing: "-0.015em" }}
            >
              {config.heading}
            </div>
            <p
              className="mt-[5px] pr-7 text-[12.5px] leading-normal"
              style={{ color: muted }}
            >
              {config.subheading}
            </p>
            <div
              className="absolute top-3 right-3 grid size-[26px] place-items-center rounded-md"
              style={{ color: faint }}
            >
              <X className="size-[14px]" />
            </div>
          </div>

          <div className="px-4 pt-3.5 pb-4">
            {config.enabledTypes.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {config.enabledTypes.map((t) => {
                  const Icon = ICONS[t];
                  const on = activeType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className="inline-flex h-[30px] items-center gap-1.5 px-[11px] text-[12.5px] font-medium transition-colors"
                      style={{
                        borderRadius: r > 0 ? 999 : 0,
                        border: `1px solid ${on ? "transparent" : border}`,
                        background: on ? accent : "transparent",
                        color: on ? onAccent : muted,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      <Icon
                        className="size-[14px]"
                        strokeWidth={1.8}
                        style={{ opacity: on ? 1 : 0.75 }}
                      />
                      {typeCopy[t].label}
                    </button>
                  );
                })}
              </div>
            )}

            <div
              className="min-h-[82px] px-[11px] py-2.5 text-[13.5px] leading-relaxed"
              style={{
                border: `1px solid ${border}`,
                borderRadius: Math.max(r - 2, 0),
                background: field,
                color: faint,
                letterSpacing: "-0.005em",
              }}
            >
              {placeholder}
            </div>

            {config.askRating && (
              <div className="mt-3 flex min-h-[26px] items-center gap-[9px]">
                <span className="text-[12.5px]" style={{ color: muted }}>
                  How was it?
                </span>
                <div className="flex gap-px">
                  {[1, 2, 3, 4, 5].map((n) =>
                    config.ratingStyle === "numbers" ? (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className="grid h-7 min-w-[30px] place-items-center text-[12.5px] tabular-nums transition-colors"
                        style={{
                          borderRadius: r > 0 ? 6 : 0,
                          border: `1px solid ${n <= rating ? "transparent" : border}`,
                          background: n <= rating ? accent : "transparent",
                          color: n <= rating ? onAccent : muted,
                        }}
                      >
                        {n}
                      </button>
                    ) : (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        aria-label={`${n} out of 5`}
                        className="grid size-[26px] place-items-center transition-colors"
                        style={{ color: n <= shown ? accent : starOff }}
                      >
                        <Star
                          className="size-[15px]"
                          fill="currentColor"
                          stroke="none"
                        />
                      </button>
                    ),
                  )}
                </div>
                <span
                  className="text-[12px] tabular-nums"
                  style={{ color: faint }}
                >
                  {RATE_WORDS[shown] ?? ""}
                </span>
              </div>
            )}

            {config.askEmail && (
              <div
                className="mt-2 flex h-9 items-center px-[11px] text-[13px]"
                style={{
                  border: `1px solid ${border}`,
                  borderRadius: Math.max(r - 2, 0),
                  background: field,
                  color: faint,
                }}
              >
                Email (optional, if you&apos;d like a reply)
              </div>
            )}

            <div
              className="mt-3 flex h-[38px] items-center justify-center gap-1.5 text-[13.5px] font-medium"
              style={{
                background: accent,
                color: onAccent,
                borderRadius: Math.max(r - 2, 0),
                letterSpacing: "-0.005em",
              }}
            >
              <Send className="size-[14px]" strokeWidth={1.9} />
              Send feedback
            </div>
          </div>
        </>
      )}

      {!config.hideBranding && (
        <div
          className="py-2 text-center text-[11px]"
          style={{ borderTop: `1px solid ${border}`, color: faint }}
        >
          Powered by {site.name}
        </div>
      )}
    </div>
  );
}

/** Frame that shows where the widget sits, so position isn't an abstract word. */
export function PositionPreview({
  config,
  className,
}: {
  config: WidgetConfig;
  className?: string;
}) {
  const [v, h] = config.position.split("-") as ["top" | "bottom", "left" | "right"];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-line bg-sunken",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 top-0 flex h-5 items-center gap-1 border-b border-line bg-paper px-2">
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
      </div>

      <div
        className={cn(
          "absolute flex h-6 items-center gap-1 px-2 text-[9px] font-medium",
          v === "top" ? "top-7" : "bottom-2",
          h === "left" ? "left-2" : "right-2",
        )}
        style={{
          background: config.accentColor,
          color: readableOn(config.accentColor),
          borderRadius:
            config.radius > 0 ? Math.max(config.radius - 4, 4) : 0,
        }}
      >
        <MessageSquare className="size-2.5" strokeWidth={2.2} />
        {config.triggerLabel}
      </div>
    </div>
  );
}
