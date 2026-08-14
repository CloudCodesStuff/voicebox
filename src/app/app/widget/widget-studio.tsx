"use client";
import Link from "next/link";

import {
  Check,
  Code2,
  Copy,
  Heart,
  HelpCircle,
  ImageDown,
  Lightbulb,
  Link2,
  Loader2,
  Lock,
  type LucideIcon,
  MessageSquare,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { ColorPicker } from "@/components/app/color-picker";
import { useProject } from "@/components/app/project-context";
import {
  TriggerStage,
  WidgetLivePreview,
} from "@/components/app/widget-live-preview";
import { actionClass, PageHeader } from "@/components/app/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { extractBrandColor, readableOn } from "@/lib/image-color";
import { site } from "@/lib/site";
import {
  feedbackTypes,
  fontKeys,
  fontStacks,
  triggerIconKeys,
  triggerIcons,
  triggerSizeKeys,
  triggerSizes,
  triggerStyleKeys,
  triggerStyles,
  typeCopy,
  type TriggerIcon,
  type WidgetConfig,
  type WidgetPosition,
} from "@/lib/widget-config";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

/** ["a", "b", "c"] -> "a, b, and c". Used to summarise what auto-brand actually found. */
function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const POSITION_LABELS: Record<WidgetPosition, string> = {
  "top-left": "Top left",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
};

/** Same five the runtime can draw, same order. */
const TRIGGER_ICON_COMPONENTS: Record<TriggerIcon, LucideIcon> = {
  message: MessageSquare,
  star: Star,
  lightbulb: Lightbulb,
  heart: Heart,
  help: HelpCircle,
};

const PRESET_COLORS = [
  "#00C48C",
  "#09090B",
  "#5B4BFF",
  "#0EA5E9",
  "#D33C33",
  "#B0770E",
];

/* One selection language for the whole studio: anything that IS the widget's
   current state gets the mint treatment. Neutral ink pills are reserved for
   view controls like the preview tabs, which change what you see, not what
   ships. */
const CHOICE_ON =
  "border-mint bg-mint-wash text-ink";
const CHOICE_OFF =
  "border-line text-steel hover:border-line-strong hover:text-ink";

export function WidgetStudio() {
  const { activeProject } = useProject();
  const projectId = activeProject?.id ?? "";

  const project = api.project.byId.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId) },
  );

  if (project.isLoading || !project.data) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Keyed on the project so switching gives the editor a clean slate rather
  // than syncing query data into local state through an effect.
  return (
    <StudioEditor
      key={project.data.id}
      projectId={project.data.id}
      projectKey={project.data.key}
      projectUrl={project.data.url}
      initialConfig={project.data.widgetConfig}
    />
  );
}

function StudioEditor({
  projectId,
  projectKey,
  projectUrl,
  initialConfig,
}: {
  projectId: string;
  projectKey: string;
  projectUrl: string | null;
  initialConfig: WidgetConfig;
}) {
  const utils = api.useUtils();
  const org = api.org.current.useQuery();

  const [config, setConfig] = useState<WidgetConfig>(initialConfig);
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewState, setPreviewState] = useState<
    "form" | "success" | "trigger"
  >("form");

  const canRemoveBranding =
    org.data?.subscription.plan === "PRO" ||
    org.data?.subscription.plan === "SCALE";

  const save = api.project.updateWidgetConfig.useMutation({
    onSuccess() {
      toast.success("Saved. Live widgets pick this up within a minute.");
      setDirty(false);
      void utils.project.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function set<K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
    setDirty(true);
  }

  /** Applies several fields at once, for the auto-brand guess: colour, font, theme, radius together. */
  function applyBrand(patch: Partial<WidgetConfig>) {
    setConfig((c) => ({ ...c, ...patch }));
    setDirty(true);
  }

  function discard() {
    setConfig(initialConfig);
    setDirty(false);
  }

  // Cmd+S saves. People live in editors all day; the muscle memory is free.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !save.isPending) save.mutate({ id: projectId, config });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Closing the tab with unsaved changes gets one browser-level warning.
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const snippet = `<script async
  src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"
  data-project="${projectKey}"></script>`;

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  // The Button tab disappears when the trigger is hidden, so the selected
  // state falls back rather than pointing at a tab that no longer exists.
  const shownPreview =
    previewState === "trigger" && config.triggerHidden ? "form" : previewState;
  const previewTabs = [
    { key: "form", label: "Panel" },
    { key: "success", label: "Sent" },
    ...(config.triggerHidden
      ? []
      : ([{ key: "trigger", label: "Button" }] as const)),
  ] as const;

  const currentPosition = POSITION_LABELS[config.position];

  /**
   * Anything that changes the launcher pulls the preview onto the Button tab.
   * Otherwise you drag the size slider on the left while the panel, which the
   * slider does not touch, sits unchanged on the right.
   */
  function setTrigger<K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) {
    set(key, value);
    setPreviewState("trigger");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6">
      <PageHeader
        title="Widget"
        description="Design what your visitors see, and get the snippet that puts it on your site."
        subtitle="Changes reach your live widget within a minute"
        actions={
          <a
            href="#install"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[0.84rem] font-medium text-steel transition-colors hover:text-ink"
          >
            <Code2 className="size-4" />
            Install snippet
          </a>
        }
      />

      {/* min-w-0 on both columns. Grid items default to min-width:auto, which
          means they refuse to shrink below their widest content, so the code
          snippet and the preview card were forcing the whole page 200px wider
          than a phone and the studio scrolled sideways. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-4">
          <Panel
            title="Colour"
            hint="Buttons, chips and stars all take this colour."
            current={
              <span className="tnum inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[0.78rem] text-steel">
                <span
                  className="size-3 rounded-full"
                  style={{ background: config.accentColor }}
                  aria-hidden="true"
                />
                {config.accentColor}
              </span>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => {
                const on = config.accentColor.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("accentColor", c)}
                    className={cn(
                      // The inset hairline keeps near-black presets visible
                      // on the dark card instead of dissolving into it.
                      "grid size-9 place-items-center rounded-lg border-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] transition-transform",
                      on ? "scale-110 border-ink" : "border-transparent hover:scale-105",
                    )}
                    style={{ background: c }}
                    aria-label={`Use ${c}`}
                  >
                    {/* The tick means "selected" survives without relying on
                        the ring alone, which colour-blind eyes can miss. */}
                    {on && (
                      <Check
                        className="size-4"
                        strokeWidth={3}
                        style={{ color: readableOn(c) }}
                      />
                    )}
                  </button>
                );
              })}
              <ColorPicker
                value={config.accentColor}
                onChange={(hex) => set("accentColor", hex)}
              />
              <Input
                value={config.accentColor}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  if (/^#[0-9A-F]{0,6}$/.test(v)) {
                    setConfig((c) => ({ ...c, accentColor: v }));
                    setDirty(true);
                  }
                }}
                aria-label="Hex colour"
                className="tnum h-9 w-28 border-line text-[0.84rem]"
              />
            </div>
            <AutoColor
              projectUrl={projectUrl}
              onApply={applyBrand}
              onPickColorOnly={(hex) => set("accentColor", hex)}
            />
          </Panel>

          <Panel
            title="Typeface"
            hint="System fonts only, nothing extra to load."
            current={
              <span className="rounded-full border border-line px-2.5 py-1 text-[0.78rem] text-steel">
                {fontStacks[config.font].label}
              </span>
            }
          >
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {fontKeys.map((key) => {
                const on = config.font === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    // The "Ag" specimen means nothing to a screen reader; the
                    // stack's name is the real label.
                    aria-label={fontStacks[key].label}
                    onClick={() => set("font", key)}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-center transition-colors",
                      on ? CHOICE_ON : CHOICE_OFF,
                    )}
                  >
                    <div
                      className={cn(
                        "text-[1.15rem] leading-none",
                        on && "text-ink",
                      )}
                      style={{
                        fontFamily:
                          fontStacks[key].stack === "inherit"
                            ? undefined
                            : fontStacks[key].stack,
                      }}
                    >
                      Ag
                    </div>
                    <div className="mt-1.5 text-[0.74rem] font-medium">
                      {fontStacks[key].label}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[0.8rem] leading-relaxed text-steel">
              &ldquo;Match my site&rdquo; uses the font your page already has.
            </p>
          </Panel>

          <Panel
            title="Corners and theme"
            current={
              <span className="tnum rounded-full border border-line px-2.5 py-1 text-[0.78rem] text-steel capitalize">
                {config.radius === 0 ? "Sharp" : `${config.radius}px`} ·{" "}
                {config.theme}
              </span>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.84rem] font-medium text-ink">
                    Corner radius
                  </span>
                  <span className="tnum text-[0.78rem] text-steel">
                    {config.radius === 0 ? "Sharp" : `${config.radius}px`}
                  </span>
                </div>
                <Slider
                  aria-label="Corner radius"
                  min={0}
                  max={24}
                  step={1}
                  value={[config.radius]}
                  onValueChange={([v]) => set("radius", v ?? 0)}
                  className="mt-3"
                />
              </div>

              <div>
                <span className="text-[0.84rem] font-medium text-ink">Theme</span>
                <div
                  className="mt-2 flex gap-2"
                  role="group"
                  aria-label="Widget theme"
                >
                  {(["light", "dark", "auto"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={config.theme === t}
                      onClick={() => set("theme", t)}
                      className={cn(
                        "min-h-9 flex-1 rounded-lg border px-3 text-[0.82rem] font-medium capitalize transition-colors",
                        config.theme === t ? CHOICE_ON : CHOICE_OFF,
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-2.5 text-[0.8rem] leading-relaxed text-steel">
                  Auto follows the visitor&apos;s system setting.
                </p>
              </div>
            </div>
          </Panel>

          {/* The launcher used to be spread across three panels: its label was
              filed under Words, its corner under Placement, and switching it
              off lived among the form fields. It is one object on somebody
              else's page, so it gets one place to design it. */}
          <Panel
            title="The button"
            hint="The floating launcher on your site."
            current={
              <span className="rounded-full border border-line px-2.5 py-1 text-[0.78rem] text-steel">
                {config.triggerHidden ? "Hidden" : currentPosition}
              </span>
            }
          >
            <Toggle
              label="Show the floating button"
              // Nothing to say while it is on. Off, there is: you need to know
              // what opens the widget instead.
              hint={
                config.triggerHidden
                  ? "Open it with Voicebox('open') or a [data-voicebox-trigger] element."
                  : undefined
              }
              checked={!config.triggerHidden}
              onChange={(v) => {
                set("triggerHidden", !v);
                setPreviewState(v ? "trigger" : "form");
              }}
            />

            {/* Dimmed rather than unmounted: the settings still exist and come
                back exactly as they were, and you can see what is waiting. */}
            <div
              className={cn(
                "@container mt-5 border-t border-line pt-5 transition-opacity",
                config.triggerHidden && "pointer-events-none opacity-40",
              )}
              inert={config.triggerHidden}
            >
              {/* Container query, not a viewport one. What decides whether
                  this can be two columns is how wide THIS panel is, and the
                  page has already spent 400px of the window on the preview by
                  the time xl hits. Keyed to the viewport it split at 1280 into
                  a 250px column, which crushed the shape tiles and overflowed
                  the size row. */}
              <div className="grid gap-5 @[600px]:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
                <div className="space-y-5">
                  <div role="group" aria-label="Button shape">
                    <span className="text-[0.84rem] font-medium text-ink">
                      Shape
                    </span>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {triggerStyleKeys.map((key) => {
                        const on = config.triggerStyle === key;
                        const Icon =
                          TRIGGER_ICON_COMPONENTS[config.triggerIcon] ??
                          MessageSquare;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={on}
                            aria-label={triggerStyles[key].label}
                            onClick={() => setTrigger("triggerStyle", key)}
                            className={cn(
                              "rounded-lg border px-2 py-3 transition-colors",
                              on ? CHOICE_ON : CHOICE_OFF,
                            )}
                          >
                            {/* Drawn in the real accent, so the choice is a
                                picture of the outcome rather than three
                                phrases you have to imagine. */}
                            <span
                              className="mx-auto flex h-6 items-center justify-center gap-1"
                              style={{
                                width: key === "icon" ? 24 : 58,
                                background: config.accentColor,
                                color: readableOn(config.accentColor),
                                borderRadius: Math.min(config.radius, 12),
                              }}
                              aria-hidden="true"
                            >
                              {key !== "label" && (
                                <Icon className="size-3" strokeWidth={2} />
                              )}
                              {key !== "icon" && (
                                <span className="h-[3px] w-6 rounded-full bg-current opacity-80" />
                              )}
                            </span>
                            <span className="mt-2 block text-[0.74rem] font-medium">
                              {triggerStyles[key].label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {config.triggerStyle !== "label" && (
                    <div role="group" aria-label="Button icon">
                      <span className="text-[0.84rem] font-medium text-ink">
                        Icon
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {triggerIconKeys.map((key) => {
                          const Icon = TRIGGER_ICON_COMPONENTS[key];
                          const on = config.triggerIcon === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              aria-pressed={on}
                              aria-label={triggerIcons[key]}
                              title={triggerIcons[key]}
                              onClick={() => setTrigger("triggerIcon", key)}
                              className={cn(
                                "grid size-10 place-items-center rounded-lg border transition-colors",
                                on ? CHOICE_ON : CHOICE_OFF,
                              )}
                            >
                              <Icon className="size-4" strokeWidth={1.9} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div role="group" aria-label="Button size">
                    <span className="text-[0.84rem] font-medium text-ink">
                      Size
                    </span>
                    <div className="mt-2 flex gap-2">
                      {triggerSizeKeys.map((key) => {
                        const on = config.triggerSize === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setTrigger("triggerSize", key)}
                            className={cn(
                              // The measurement sits under the name rather
                              // than beside it: side by side, "Large 48px"
                              // outgrows a third of a narrow column.
                              "min-h-9 min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-[0.82rem] font-medium transition-colors",
                              on ? CHOICE_ON : CHOICE_OFF,
                            )}
                          >
                            <span className="block truncate">
                              {triggerSizes[key].label}
                            </span>
                            <span className="tnum block text-[0.72rem] text-steel">
                              {triggerSizes[key].height}px
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Field
                      label="Label"
                      value={config.triggerLabel}
                      maxLength={24}
                      onChange={(v) => setTrigger("triggerLabel", v)}
                    />
                    {/* Only worth a line when the label is invisible and you
                        would otherwise wonder why you are typing it. */}
                    {config.triggerStyle === "icon" && (
                      <p className="mt-1.5 text-[0.8rem] leading-relaxed text-steel">
                        Not shown. Used by screen readers and the tooltip.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[0.84rem] font-medium text-ink">
                    Corner
                  </span>
                  <TriggerStage
                    config={config}
                    onPick={(p) => setTrigger("position", p)}
                    offsetScale={0.5}
                    className="mt-2 h-[186px]"
                  />
                  <p className="mt-2 text-[0.8rem] text-steel">
                    Click a corner to move it.
                  </p>

                  <div className="mt-5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[0.84rem] font-medium text-ink">
                        Distance from the edge
                      </span>
                      <span className="tnum text-[0.78rem] text-steel">
                        {config.triggerOffset}px
                      </span>
                    </div>
                    <Slider
                      aria-label="Distance from the edge"
                      min={0}
                      max={160}
                      step={4}
                      value={[config.triggerOffset]}
                      onValueChange={([v]) => setTrigger("triggerOffset", v ?? 20)}
                      className="mt-3"
                    />
                    <p className="mt-2.5 text-[0.8rem] leading-relaxed text-steel">
                      Clears a chat bubble or cookie bar already in that corner.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-5">
                <Toggle
                  label="Hide it on phones"
                  hint="Your own trigger still works there."
                  checked={config.triggerHideOnMobile}
                  onChange={(v) => set("triggerHideOnMobile", v)}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Words" hint="What visitors read inside the panel.">
            <div className="space-y-4">
              <Field
                label="Heading"
                value={config.heading}
                onChange={(v) => set("heading", v)}
              />
              <Field
                label="Subheading"
                value={config.subheading}
                onChange={(v) => set("subheading", v)}
              />
              <Field
                label="Thank-you message"
                value={config.successMessage}
                onChange={(v) => set("successMessage", v)}
                onFocus={() => setPreviewState("success")}
                onBlur={() => setPreviewState("form")}
              />
            </div>
          </Panel>

          <Panel
            title="What you ask for"
            hint="Shorter forms get more responses."
          >
            <div className="space-y-5">
              <div role="group" aria-label="Feedback types">
                <span className="text-[0.84rem] font-medium text-ink">
                  Feedback types
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {feedbackTypes.map((t) => {
                    const on = config.enabledTypes.includes(t);
                    const last = on && config.enabledTypes.length === 1;
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={on}
                        disabled={last}
                        title={last ? "Keep at least one type" : undefined}
                        onClick={() =>
                          set(
                            "enabledTypes",
                            on
                              ? config.enabledTypes.filter((x) => x !== t)
                              : [...config.enabledTypes, t],
                          )
                        }
                        className={cn(
                          "min-h-9 rounded-full border px-3.5 text-[0.82rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                          on ? CHOICE_ON : CHOICE_OFF,
                        )}
                      >
                        {typeCopy[t].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Toggle
                label="Ask for a rating"
                checked={config.askRating}
                onChange={(v) => set("askRating", v)}
              />

              {config.askRating && (
                <div
                  className="ml-0.5 flex gap-2 border-l-[1.5px] border-line pl-4"
                  role="group"
                  aria-label="Rating style"
                >
                  {(["stars", "numbers"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={config.ratingStyle === s}
                      onClick={() => set("ratingStyle", s)}
                      className={cn(
                        "min-h-9 rounded-lg border px-3.5 text-[0.82rem] font-medium capitalize transition-colors",
                        config.ratingStyle === s ? CHOICE_ON : CHOICE_OFF,
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <Toggle
                label="Ask for an email"
                hint="Optional for them, and the only way you can reply."
                checked={config.askEmail}
                onChange={(v) => set("askEmail", v)}
              />
              <Toggle
                label={`Remove ${site.name} branding`}
                hint={canRemoveBranding ? undefined : "Pro and above."}
                checked={config.hideBranding}
                onChange={(v) => set("hideBranding", v)}
                locked={!canRemoveBranding}
              />
            </div>
          </Panel>

          <Panel
            id="install"
            title="Install"
            hint="Paste it once, before the closing body tag."
          >
            <div className="relative overflow-hidden rounded-lg border border-line bg-slab">
              <pre className="overflow-x-auto px-4 py-4 pr-24 font-mono text-[0.78rem] leading-relaxed text-slab-fg/90">
                <code>{snippet}</code>
              </pre>
              <button
                type="button"
                onClick={copySnippet}
                className="absolute top-2.5 right-2.5 inline-flex h-8 items-center gap-1.5 rounded-md bg-slab-fg/10 px-2.5 text-[0.78rem] font-medium text-slab-fg transition-colors hover:bg-slab-fg/20"
              >
                {copied ? (
                  <Check className="size-3.5 text-mint" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {/* Said at the moment the key is copied, which is when it stops
                being abstract: from here on it is public. */}
            <p className="mt-3 text-[0.8rem] leading-relaxed text-steel">
              This key is public and visible in your page source. Lock the
              project to your domains under{" "}
              <Link
                href="/app/settings/projects"
                className="font-medium text-ink underline underline-offset-2"
              >
                Settings → Projects
              </Link>
              , or anyone can post into your inbox from their own site.
            </p>
          </Panel>
        </div>

        {/* Live preview */}
        {/* First on mobile, second on desktop. Stacked in source order the
            preview landed below every control, so on a phone you changed a
            colour and had to scroll a page and a half to see what it did,
            which is the one thing a live preview exists for. On desktop it
            sits beside the controls and sticks, so the order there is right
            already. */}
        <div className="order-first min-w-0 lg:order-none lg:sticky lg:top-8 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[1rem] font-semibold text-ink">Preview</h2>
            <div
              role="group"
              aria-label="Preview state"
              className="flex gap-1 rounded-lg border border-line p-0.5"
            >
              {previewTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={shownPreview === tab.key}
                  onClick={() => setPreviewState(tab.key)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[0.78rem] font-medium transition-colors",
                    shownPreview === tab.key
                      ? "bg-ink text-paper"
                      : "text-steel hover:text-ink",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* One frame, fixed height, so switching tabs never makes the page
              jump. The backdrop follows the WIDGET's theme, not the app's:
              you're looking at your site, not at Voicebox. */}
          {shownPreview === "trigger" ? (
            // The button is judged in place, at its real size, against the
            // corner of a page. Floating in the middle of an empty card it
            // could be any size and any distance from anything.
            <TriggerStage config={config} className="h-[440px]" />
          ) : (
            <div
              className={cn(
                "flex min-h-[440px] items-center justify-center rounded-2xl border border-line p-6 transition-colors",
                config.theme === "dark" ? "bg-slab" : "bg-[#eef0ef]",
              )}
            >
              <WidgetLivePreview config={config} state={shownPreview} />
            </div>
          )}

          {shownPreview !== "trigger" && (
            <p className="mt-3 text-[0.8rem] leading-relaxed text-steel">
              Click the chips and the stars.
            </p>
          )}
        </div>
      </div>

      {/* Unsaved-changes bar. Appears the moment anything diverges and stays
          on screen wherever you are, so saving never requires scrolling back
          to a button. Discard restores exactly what was loaded. */}
      <div
        // `inert` (not just aria-hidden) takes the hidden bar's buttons out
        // of the tab order too; otherwise keyboard users land on invisible
        // Discard/Save controls.
        inert={!dirty}
        className={cn(
          "fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 transition-all duration-200",
          dirty
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <div className="flex items-center gap-3 rounded-xl border border-line-strong bg-paper-2/95 py-2 pr-2 pl-4 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)] backdrop-blur">
          <span className="text-[0.85rem] text-steel">
            Unsaved changes
            <kbd className="tnum ml-2 hidden rounded border border-line px-1.5 py-0.5 text-[0.72rem] text-faint sm:inline">
              ⌘S
            </kbd>
          </span>
          <button
            type="button"
            onClick={discard}
            disabled={save.isPending}
            className="min-h-9 rounded-lg px-3 text-[0.84rem] font-medium text-steel transition-colors hover:text-ink disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate({ id: projectId, config })}
            className={actionClass("primary", "sm")}
          >
            {save.isPending && <Loader2 className="size-3.5 animate-spin" />}
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- auto brand */

const FONT_LABELS: Record<string, string> = {
  sans: "Sans",
  serif: "Serif",
  rounded: "Rounded",
  mono: "Mono",
};

function AutoColor({
  projectUrl,
  onApply,
  onPickColorOnly,
}: {
  projectUrl: string | null;
  /** Colour, and whichever of font/theme/radius the page actually yielded. */
  onApply: (patch: Partial<WidgetConfig>) => void;
  /** A screenshot can only ever tell us a colour, never a font or theme. */
  onPickColorOnly: (hex: string) => void;
}) {
  const [url, setUrl] = useState(projectUrl ?? "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const suggest = api.project.suggestBrand.useMutation({
    onSuccess(result) {
      if (!result || (!result.color && !result.font && !result.theme && result.radius == null)) {
        toast.error("Couldn't find a brand on that page. Try a screenshot for the colour.");
        return;
      }

      const patch: Partial<WidgetConfig> = {};
      const applied: string[] = [];

      if (result.color) {
        patch.accentColor = result.color;
        applied.push(
          result.colorConfidence === "high" ? `colour (${result.color})` : "a best-guess colour",
        );
      }
      if (result.font) {
        patch.font = result.font;
        applied.push(`${FONT_LABELS[result.font] ?? result.font} type`);
      }
      if (result.theme) {
        patch.theme = result.theme;
        applied.push(`${result.theme} theme`);
      }
      if (result.radius != null) {
        patch.radius = result.radius;
        applied.push("corner radius");
      }

      onApply(patch);
      toast.success(`Matched ${joinWithAnd(applied)}. Adjust anything that's off.`);
    },
    onError: () => toast.error("Couldn't reach that page."),
  });

  async function fromScreenshot(file: File) {
    setBusy(true);
    try {
      const result = await extractBrandColor(file);
      if (!result) {
        toast.error("No strong colour in that image. Try one with more of your UI in it.");
        return;
      }
      onPickColorOnly(result.color);
      toast.success(`Pulled ${result.color} from your screenshot.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-dashed border-line-strong bg-muted/40 p-4">
      <div className="flex items-center gap-2">
        <Wand2 className="size-4 text-mint-deep" />
        <span className="text-[0.84rem] font-medium text-ink">
          Or match your brand automatically
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Link2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) suggest.mutate({ url });
            }}
            placeholder="yoursite.com"
            aria-label="Your site's URL"
            className="h-10 border-line bg-paper-2 pl-9 text-[0.85rem]"
          />
        </div>
        <button
          type="button"
          disabled={!url.trim() || suggest.isPending}
          onClick={() => suggest.mutate({ url })}
          className={actionClass("primary", "md")}
        >
          {suggest.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Read site
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-paper-2 px-3.5 text-[0.84rem] font-medium text-steel transition-colors hover:text-ink disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageDown className="size-4" />
          )}
          Screenshot
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void fromScreenshot(file);
            e.target.value = "";
          }}
        />
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ bits */

function Panel({
  id,
  title,
  hint,
  current,
  children,
}: {
  id?: string;
  title: string;
  hint?: string;
  current?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-line bg-paper-2 p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div>
          <h2 className="text-[1rem] font-semibold text-ink">{title}</h2>
          {hint && <p className="mt-1 text-[0.8rem] text-steel">{hint}</p>}
        </div>
        {/* The header answers "what's it set to right now" without reading
            the controls, so the page scans like a summary. */}
        {current}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Mirrors the schema's own cap, so the limit is felt before it is enforced. */
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-[0.84rem] font-medium text-ink">
          {label}
        </Label>
        {maxLength != null && (
          <span className="tnum text-[0.74rem] text-faint">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="mt-1.5 h-10 border-line bg-paper text-[0.875rem]"
      />
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  locked,
}: {
  label: string;
  /** Only where the label leaves something real unsaid. */
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
}) {
  const hintId = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[0.875rem] font-medium text-ink">
          {label}
          {locked && <Lock className="size-3.5 text-steel" aria-label="Pro and above" />}
        </div>
        {hint && (
          <p id={hintId} className="mt-0.5 text-[0.8rem] leading-relaxed text-steel">
            {hint}
          </p>
        )}
      </div>
      <Switch
        checked={checked && !locked}
        disabled={locked}
        onCheckedChange={onChange}
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}
