"use client";

import { Pipette } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   A colour picker that is ours, not the browser's.

   The native <input type="color"> opens a different OS dialog on every
   platform, none of which match the app. This one is a popover: a
   saturation/brightness pad, a hue rail, a hex field, and, where the browser
   has one, an eyedropper that can lift a colour straight off the screen.

   State is HSV rather than hex because hex forgets. Drag brightness to black
   and back and a hex-based picker loses your hue; HSV keeps it.
--------------------------------------------------------------------------- */

type Hsv = { h: number; s: number; v: number };

function hexToHsv(hex: string): Hsv | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`.toUpperCase();
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

interface EyeDropperCtor {
  new (): { open: () => Promise<{ sRGBHex: string }> };
}

export function ColorPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  const [hsv, setHsv] = useState<Hsv>(
    () => hexToHsv(value) ?? { h: 160, s: 1, v: 0.77 },
  );
  // Non-null only while the hex field holds a partial entry like "#00C".
  const [draftOverride, setDraftOverride] = useState<string | null>(null);

  // Follow outside changes (presets, brand match, the inline hex field)
  // without losing the hue when the colour passes through grey or black.
  // This is React's documented render-adjust pattern: `synced` remembers the
  // last value this picker has seen, so parent echoes of our own onChange
  // don't loop, while genuinely external changes re-seed the pad.
  const [synced, setSynced] = useState(value.toUpperCase());
  if (value.toUpperCase() !== synced) {
    setSynced(value.toUpperCase());
    const parsed = hexToHsv(value);
    if (parsed) {
      setHsv((prev) => ({ ...parsed, h: parsed.s === 0 ? prev.h : parsed.h }));
      setDraftOverride(null);
    }
  }

  function commit(next: Hsv) {
    const hex = hsvToHex(next);
    setHsv(next);
    setSynced(hex);
    setDraftOverride(null);
    onChange(hex);
  }

  const padRef = useRef<HTMLDivElement>(null);

  function padFromPointer(e: React.PointerEvent) {
    const rect = padRef.current!.getBoundingClientRect();
    commit({
      ...hsv,
      s: clamp01((e.clientX - rect.left) / rect.width),
      v: clamp01(1 - (e.clientY - rect.top) / rect.height),
    });
  }

  function padFromKey(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 0.1 : 0.02;
    const { h, s, v } = hsv;
    if (e.key === "ArrowLeft") commit({ h, v, s: clamp01(s - step) });
    else if (e.key === "ArrowRight") commit({ h, v, s: clamp01(s + step) });
    else if (e.key === "ArrowUp") commit({ h, s, v: clamp01(v + step) });
    else if (e.key === "ArrowDown") commit({ h, s, v: clamp01(v - step) });
    else return;
    e.preventDefault();
  }

  // Hydration-safe feature detect: false on the server, real answer on the
  // client, no effect and no flash of wrong state.
  const canEyedrop = useSyncExternalStore(
    () => () => {},
    () => "EyeDropper" in window,
    () => false,
  );

  async function eyedrop() {
    try {
      const Dropper = (window as unknown as { EyeDropper: EyeDropperCtor })
        .EyeDropper;
      const picked = (await new Dropper().open()).sRGBHex.toUpperCase();
      const parsed = hexToHsv(picked);
      if (parsed) commit(parsed);
    } catch {
      // Closed without picking; nothing to do.
    }
  }

  const hex = hsvToHex(hsv);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Custom colour"
          title="Custom colour"
          className={cn(
            "grid size-9 place-items-center rounded-lg border border-line transition-transform hover:scale-105",
            className,
          )}
          style={{
            background:
              "conic-gradient(from 180deg, #f43f5e, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #f43f5e)",
          }}
        >
          <span className="grid size-5 place-items-center rounded-full bg-paper">
            <Pipette className="size-3 text-ink" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-3">
        <div
          ref={padRef}
          role="slider"
          tabIndex={0}
          aria-label="Saturation and brightness"
          aria-valuenow={Math.round(hsv.v * 100)}
          aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
          onPointerDown={(e) => {
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Capture is a nicety; the drag still works without it.
            }
            padFromPointer(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons & 1) padFromPointer(e);
          }}
          onKeyDown={padFromKey}
          className="relative h-36 w-full cursor-crosshair touch-none rounded-lg border border-line outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          style={{
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              background: hex,
            }}
          />
        </div>

        <SliderPrimitive.Root
          min={0}
          max={360}
          step={1}
          value={[hsv.h]}
          onValueChange={([h]) => commit({ ...hsv, h: h ?? 0 })}
          className="relative mt-3 flex h-4 w-full touch-none items-center select-none"
        >
          <SliderPrimitive.Track
            className="relative h-2.5 w-full grow rounded-full"
            style={{
              background:
                "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
            }}
          >
            <SliderPrimitive.Range className="absolute h-full" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            aria-label="Hue"
            className="block size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            style={{ background: `hsl(${hsv.h} 100% 50%)` }}
          />
        </SliderPrimitive.Root>

        <div className="mt-3 flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-9 shrink-0 rounded-lg border border-line shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
            style={{ background: hex }}
          />
          <Input
            value={draftOverride ?? hex}
            onChange={(e) => {
              const v = e.target.value.toUpperCase();
              if (!/^#[0-9A-F]{0,6}$/.test(v)) return;
              const parsed = hexToHsv(v);
              if (parsed) commit(parsed);
              else setDraftOverride(v);
            }}
            onBlur={() => setDraftOverride(null)}
            aria-label="Hex colour"
            className="tnum h-9 flex-1 border-line text-[0.84rem]"
          />
          {canEyedrop && (
            <button
              type="button"
              onClick={eyedrop}
              aria-label="Pick a colour from the screen"
              title="Pick a colour from the screen"
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-steel transition-colors hover:text-ink"
            >
              <Pipette className="size-4" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
