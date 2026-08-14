"use client";

import {
  Bug,
  Check,
  Heart,
  HelpCircle,
  Lightbulb,
  type LucideIcon,
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
  triggerSizes,
  typeCopy,
  type FeedbackTypeKey,
  type WidgetPosition,
  type TriggerIcon,
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

/** Matches the runtime's icon table one for one. */
const TRIGGER_ICONS: Record<TriggerIcon, LucideIcon> = {
  message: MessageSquare,
  star: Star,
  lightbulb: Lightbulb,
  heart: Heart,
  help: HelpCircle,
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
    const size = triggerSizes[config.triggerSize] ?? triggerSizes.md;
    const Icon = TRIGGER_ICONS[config.triggerIcon] ?? MessageSquare;
    const iconOnly = config.triggerStyle === "icon";

    return (
      <div
        className="inline-flex items-center justify-center font-medium"
        style={{
          height: size.height,
          // A square, so the radius slider runs from a sharp tile all the way
          // to a round bubble without a second control to explain it.
          width: iconOnly ? size.height : undefined,
          padding: iconOnly ? 0 : `0 ${size.padding}px`,
          gap: size.gap,
          fontSize: size.font,
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
        {config.triggerStyle !== "label" && (
          <Icon
            style={{ width: size.icon, height: size.icon, flex: "none" }}
            strokeWidth={1.9}
          />
        )}
        {config.triggerStyle !== "icon" && (
          <span className="truncate">{config.triggerLabel}</span>
        )}
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
              // Mirrors the shipped widget: an even grid, never wrapping
              // ragged. Four types become a 2x2 block, fewer sit on one row.
              <div
                className="mb-3 grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${
                    config.enabledTypes.length === 4
                      ? 2
                      : Math.max(config.enabledTypes.length, 1)
                  }, minmax(0, 1fr))`,
                }}
              >
                {config.enabledTypes.map((t) => {
                  const Icon = ICONS[t];
                  const on = activeType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className="inline-flex h-[30px] min-w-0 items-center justify-center gap-1.5 px-2 text-[12.5px] font-medium transition-colors"
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

            {config.askRating && (
              <div className="mb-2.5 flex min-h-[28px] items-center gap-2.5">
                <span className="text-[12.5px]" style={{ color: muted }}>
                  How was it?
                </span>
                <div
                  className={
                    config.ratingStyle === "numbers"
                      ? "flex flex-1 gap-1.5"
                      : "ml-auto flex gap-px"
                  }
                >
                  {[1, 2, 3, 4, 5].map((n) =>
                    config.ratingStyle === "numbers" ? (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className="grid h-7 flex-1 place-items-center text-[12.5px] tabular-nums transition-colors"
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

const CORNERS: Array<{ key: WidgetPosition; label: string }> = [
  { key: "top-left", label: "Top left" },
  { key: "top-right", label: "Top right" },
  { key: "bottom-left", label: "Bottom left" },
  { key: "bottom-right", label: "Bottom right" },
];

/** Height of the fake browser chrome, so a top-placed button clears it. */
const CHROME = 26;

/**
 * The button where it actually lives: on a page, in a corner, at a distance.
 *
 * This replaces a picker made of four words. A corner is a place, and the size,
 * the shape and the gap from the edge are all things you judge by looking, not
 * by reading "bottom right, 20px". With `onPick` the four corners become the
 * control itself, so choosing a position and seeing the result are one act.
 */
export function TriggerStage({
  config,
  className,
  onPick,
  offsetScale = 1,
}: {
  config: WidgetConfig;
  className?: string;
  onPick?: (position: WidgetPosition) => void;
  /** Shrinks the edge gap in the compact frame, where 1:1 would dominate it. */
  offsetScale?: number;
}) {
  const dark = config.theme === "dark";
  const off = Math.round(config.triggerOffset * offsetScale);

  function place(key: WidgetPosition) {
    const [v, h] = key.split("-") as ["top" | "bottom", "left" | "right"];
    return {
      [v]: v === "top" ? off + CHROME : off,
      [h]: off,
      maxWidth: `calc(100% - ${off * 2 + 8}px)`,
    } as React.CSSProperties;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-line",
        className,
      )}
      style={{ background: dark ? "#0e0e11" : "#ffffff" }}
    >
      {/* A page, not an empty box. Without something to sit on top of, a
          floating button has no scale and no corner to be in. */}
      <div
        className="absolute inset-x-0 top-0 flex items-center gap-1.5 px-2.5"
        style={{
          height: CHROME,
          borderBottom: `1px solid ${dark ? "#1f1f24" : "#ebebed"}`,
          background: dark ? "#141418" : "#f6f6f7",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full"
            style={{ background: dark ? "#33333b" : "#d4d4d8" }}
          />
        ))}
        <span
          className="ml-1.5 h-2.5 flex-1 rounded-full"
          style={{ background: dark ? "#1f1f24" : "#ebebed" }}
        />
      </div>

      <div
        className="absolute inset-x-0 space-y-2 px-5"
        style={{ top: CHROME + 18 }}
        aria-hidden="true"
      >
        {[62, 88, 74, 40].map((w, i) => (
          <span
            key={i}
            className="block rounded-full"
            style={{
              width: `${w}%`,
              height: i === 0 ? 9 : 6,
              background: dark ? "#1c1c21" : "#f0f0f1",
            }}
          />
        ))}
      </div>

      {onPick
        ? CORNERS.map((corner) => {
            const on = config.position === corner.key;
            return (
              <button
                key={corner.key}
                type="button"
                aria-pressed={on}
                aria-label={corner.label}
                title={corner.label}
                onClick={() => onPick(corner.key)}
                className="absolute cursor-pointer"
                style={place(corner.key)}
              >
                {on ? (
                  <WidgetLivePreview config={config} state="trigger" />
                ) : (
                  // A target, not a decoration: same corner, same offset, so
                  // clicking it puts the button exactly where the ghost is.
                  <span
                    className="block size-7 rounded-lg border border-dashed border-line-strong transition-colors hover:border-steel hover:bg-muted"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })
        : !config.triggerHidden && (
            <div className="absolute" style={place(config.position)}>
              <WidgetLivePreview config={config} state="trigger" />
            </div>
          )}
    </div>
  );
}
