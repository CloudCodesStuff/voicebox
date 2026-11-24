"use client";

import { useEffect, useRef } from "react";

/**
 * A dot-matrix spectrum: columns of dots that rise and fall like a voice
 * meter, tallest in the middle and narrowing toward both edges, the same
 * shape as the mark (many in, few out). The top dot of each column is mint,
 * the rest fade as they go down. The pointer lifts the columns near it.
 *
 * Decorative, so it is aria-hidden; it pauses off screen and holds still for
 * reduced motion.
 */

const PITCH = 5; // px between dots, both ways
const GAP = 2; // empty columns between bars

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function Spectrum({
  className,
  height = 220,
  seed = 1,
}: {
  className?: string;
  height?: number;
  seed?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0,
      H = 0,
      bars = 0;
    let mx = -1e9;
    let raf = 0;
    let onScreen = true;
    const t0 = performance.now();
    let boost = 0; // eases toward 1 while the pointer is over the canvas

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bars = Math.floor(W / (PITCH * (GAP + 1)));
    };

    const draw = (now: number, still = false) => {
      const t = still ? 0 : (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      const rowsMax = Math.floor(H / PITCH);
      for (let b = 0; b < bars; b++) {
        const f = bars > 1 ? b / (bars - 1) : 0.5;
        // tallest at the centre, narrowing to the edges
        const envelope = Math.pow(Math.sin(Math.PI * f), 0.8);
        const wob =
          0.5 +
          0.5 *
            Math.sin(t * (0.9 + hash(b + seed) * 1.6) + hash(b * 3 + seed) * 6.28) *
            Math.sin(t * 0.37 + b * 0.21 + seed);
        const x = b * PITCH * (GAP + 1) + PITCH;
        // the pointer lifts the columns around it
        const d = Math.abs(x - mx);
        const lift = boost * Math.exp(-(d * d) / (2 * 70 * 70)) * 0.55;
        const h = Math.min(1, envelope * (0.3 + 0.7 * wob) + lift);
        const n = Math.max(1, Math.round(h * rowsMax));
        for (let k = 0; k < n; k++) {
          const y = H - PITCH * (k + 1);
          const fade = 1 - k / Math.max(1, n);
          if (k === n - 1) {
            ctx.fillStyle = "rgba(0,229,160,0.95)";
            ctx.fillRect(x - 1, y - 1, 3, 3);
          } else {
            ctx.fillStyle = `rgba(255,255,255,${(0.05 + fade * 0.22).toFixed(3)})`;
            ctx.fillRect(x - 0.5, y - 0.5, 2, 2);
          }
        }
      }
    };

    const loop = (now: number) => {
      boost += ((mx > -1e8 ? 1 : 0) - boost) * 0.08;
      draw(now);
      raf = onScreen && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!raf && !reduced && onScreen && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const inside = e.clientY >= r.top - 80 && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right;
      mx = inside ? e.clientX - r.left : -1e9;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0, true);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      wake();
    });
    io.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", wake);
    if (reduced) draw(0, true);
    else wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [seed]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ height, width: "100%" }}
    />
  );
}
