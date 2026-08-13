"use client";
import Link from "next/link";

import {
  Check,
  Code2,
  Copy,
  ImageDown,
  Link2,
  Loader2,
  Lock,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { ColorPicker } from "@/components/app/color-picker";
import { useProject } from "@/components/app/project-context";
import {
  PositionPreview,
  WidgetLivePreview,
} from "@/components/app/widget-live-preview";
import { PageHeader } from "@/components/app/ui";
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
  typeCopy,
  type WidgetConfig,
} from "@/lib/widget-config";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

/** ["a", "b", "c"] -> "a, b, and c". Used to summarise what auto-brand actually found. */
function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const POSITIONS = [
  { key: "top-left", label: "Top left" },
  { key: "top-right", label: "Top right" },
  { key: "bottom-left", label: "Bottom left" },
  { key: "bottom-right", label: "Bottom right" },
] as const;

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

  const currentPosition =
    POSITIONS.find((p) => p.key === config.position)?.label ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6">
      <PageHeader
        title="Widget"
        description="Design the feedback form your visitors see, and get the one line of code that puts it on your site. Everything here updates live in the preview."
        subtitle="Changes save to your live widget within a minute, with no redeploy"
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
            <p className="mt-2.5 text-[0.8rem] text-steel">
              Text on this colour switches to{" "}
              {readableOn(config.accentColor) === "#FFFFFF" ? "white" : "dark"}{" "}
              automatically, so it always stays readable.
            </p>

            <AutoColor
              projectUrl={projectUrl}
              onApply={applyBrand}
              onPickColorOnly={(hex) => set("accentColor", hex)}
            />
          </Panel>

          <Panel
            title="Typeface"
            hint="System fonts only, so your site never loads an extra webfont."
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
              &ldquo;Match my site&rdquo; inherits whatever font the host page
              already uses.
            </p>
          </Panel>

          <Panel
            title="Placement"
            hint="Where the button sits, how round everything is, light or dark."
            current={
              <span className="rounded-full border border-line px-2.5 py-1 text-[0.78rem] text-steel">
                {currentPosition}
              </span>
            }
          >
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div>
                {/* A corner is a spatial choice, so the picker is spatial: a
                    little page with four corner targets, not four labels that
                    make you translate words into places. */}
                <div
                  role="group"
                  aria-label="Widget position"
                  className="relative h-[120px] rounded-lg border border-line bg-sunken"
                >
                  <div className="absolute inset-x-0 top-0 flex h-5 items-center gap-1 rounded-t-lg border-b border-line bg-paper-2 px-2">
                    <span className="size-1.5 rounded-full bg-line-strong" />
                    <span className="size-1.5 rounded-full bg-line-strong" />
                    <span className="size-1.5 rounded-full bg-line-strong" />
                  </div>
                  {POSITIONS.map((p) => {
                    const on = config.position === p.key;
                    const [v, h] = p.key.split("-");
                    return (
                      <button
                        key={p.key}
                        type="button"
                        aria-pressed={on}
                        aria-label={p.label}
                        title={p.label}
                        onClick={() => set("position", p.key)}
                        className={cn(
                          "absolute grid size-10 place-items-center rounded-lg transition-colors",
                          v === "top" ? "top-6" : "bottom-2",
                          h === "left" ? "left-2" : "right-2",
                        )}
                      >
                        <span
                          className={cn(
                            "size-[18px] rounded-md border-2 transition-all",
                            on
                              ? "scale-110 border-mint bg-mint"
                              : "border-line-strong bg-paper-2 hover:border-steel",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[0.8rem] text-steel">{currentPosition}</p>

                <div className="mt-5">
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

                <div className="mt-5 flex gap-2" role="group" aria-label="Widget theme">
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
                <p className="mt-2 text-[0.8rem] text-steel">
                  Auto follows each visitor&apos;s own system setting.
                </p>
              </div>

              <PositionPreview config={config} className="h-full min-h-[120px]" />
            </div>
          </Panel>

          <Panel
            title="Words"
            hint="Everything your visitors read, in your voice."
          >
            <div className="space-y-4">
              <Field
                label="Button label"
                value={config.triggerLabel}
                onChange={(v) => set("triggerLabel", v)}
              />
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
            hint="Fewer questions means more answers. Every field here is a choice."
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
                hint="A quick score above the message box."
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
                hint="Optional for them, but it's the only way you can reply."
                checked={config.askEmail}
                onChange={(v) => set("askEmail", v)}
              />
              <Toggle
                label="Hide the floating button"
                hint="Open it from your own UI with Voicebox('open') instead."
                checked={config.triggerHidden}
                onChange={(v) => {
                  set("triggerHidden", v);
                  if (v && previewState === "trigger") setPreviewState("form");
                }}
              />
              <Toggle
                label={`Remove ${site.name} branding`}
                hint={
                  canRemoveBranding
                    ? "Drops the footer link from your widget."
                    : "Included on Pro and above."
                }
                checked={config.hideBranding}
                onChange={(v) => set("hideBranding", v)}
                locked={!canRemoveBranding}
              />
            </div>
          </Panel>

          <Panel
            id="install"
            title="Install"
            hint="One tag, pasted once, anywhere before the closing body tag."
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
            <p className="mt-3 text-[0.8rem] text-steel">
              Already installed? Everything you save here reaches it within a
              minute, no redeploy.
            </p>

            {/* Said at the moment the key is copied, which is when it stops
                being abstract: from here on it is public. */}
            <p className="mt-2 text-[0.8rem] leading-relaxed text-steel">
              The key in this snippet is public by design and will be visible in
              your page source. Lock the project to your domains under{" "}
              <Link
                href="/app/settings/projects"
                className="font-medium text-ink underline underline-offset-2"
              >
                Settings → Projects
              </Link>
              , or anyone who reads it can post feedback into your inbox from
              their own site.
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
            <h2 className="text-[0.9rem] font-semibold text-ink">Preview</h2>
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
          <div
            className={cn(
              "flex min-h-[440px] items-center justify-center rounded-2xl border border-line p-6 transition-colors",
              config.theme === "dark" ? "bg-slab" : "bg-[#eef0ef]",
            )}
          >
            <WidgetLivePreview config={config} state={shownPreview} />
          </div>

          <p className="mt-3 text-[0.8rem] leading-relaxed text-steel">
            This is the live widget, not a picture. Click the chips and the
            stars.
          </p>
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
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-mint px-4 text-[0.85rem] font-semibold text-mint-ink transition-all hover:brightness-105 disabled:opacity-60"
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
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-[0.84rem] font-semibold text-paper disabled:opacity-40"
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

      <p className="mt-2.5 text-[0.78rem] leading-relaxed text-steel">
        Screenshots are read in your browser and never uploaded anywhere.
      </p>
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
          <h2 className="text-[0.95rem] font-semibold text-ink">{title}</h2>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} className="text-[0.84rem] font-medium text-ink">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
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
  hint: string;
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
        <p id={hintId} className="mt-0.5 text-[0.8rem] leading-relaxed text-steel">
          {hint}
        </p>
      </div>
      <Switch
        checked={checked && !locked}
        disabled={locked}
        onCheckedChange={onChange}
        aria-label={label}
        aria-describedby={hintId}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}
