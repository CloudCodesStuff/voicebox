"use client";

import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   The hero product video.

   Native controls would put a grey Chrome scrub bar in the middle of the
   landing page, so the chrome is ours: play/pause, a scrubber, mute and
   fullscreen, in an overlay that stays out of the way while the video plays.

   Muted by default and it only plays while on screen: an IntersectionObserver
   starts it when the frame is mostly visible and pauses it when scrolled
   away, except when the visitor paused it themselves, which is a decision we
   don't overrule. Reduced-motion visitors get a poster frame and a play
   button, no autoplay.
--------------------------------------------------------------------------- */

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function HeroVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Set when the visitor pauses by hand, so scrolling away and back doesn't
  // restart a video they chose to stop.
  const userPausedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.intersectionRatio >= 0.4) {
          if (!userPausedRef.current) void video.play().catch(() => undefined);
        } else {
          if (!video.paused) video.pause();
        }
      },
      { threshold: [0, 0.4] },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // The scrubber follows the video via rAF while it plays; `timeupdate` alone
  // fires ~4×/s and makes the bar visibly step.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const video = videoRef.current;
      if (video) setCurrent(video.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      void video.play().catch(() => undefined);
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function seek(value: number) {
    const video = videoRef.current;
    if (!video || !duration) return;
    video.currentTime = value;
    setCurrent(value);
  }

  function fullscreen() {
    const container = containerRef.current;
    if (container?.requestFullscreen) void container.requestFullscreen();
  }

  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn("group/video relative bg-black", className)}
      data-paused={!playing}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Voicebox dashboard, recorded"
        className="absolute inset-0 size-full cursor-pointer object-contain"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      {/* Center play affordance, only while paused. */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform hover:scale-105"
        >
          <Play className="ml-0.5 size-6 fill-current" />
        </button>
      )}

      {/* Control bar: visible on hover, on keyboard focus, and while paused. */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3 transition-opacity duration-200",
          "opacity-0 group-hover/video:opacity-100 focus-within:opacity-100",
          !playing && "opacity-100",
        )}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-white transition-colors hover:bg-white/15"
        >
          {playing ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="ml-0.5 size-4 fill-current" />
          )}
        </button>

        <span className="text-[11px] text-white/85 tabular-nums">
          {formatTime(current)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          style={{
            background: `linear-gradient(to right, var(--mint) ${progress}%, rgba(255,255,255,0.25) ${progress}%)`,
          }}
        />

        <span className="text-[11px] text-white/60 tabular-nums">
          {formatTime(duration)}
        </span>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-white transition-colors hover:bg-white/15"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>

        <button
          type="button"
          onClick={fullscreen}
          aria-label="Fullscreen"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-white transition-colors hover:bg-white/15"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
