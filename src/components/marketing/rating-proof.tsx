import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * The badge above the hero headline.
 *
 * Says the one thing that is both new and true, and links to the page that
 * proves it. The sweep is the same working-sweep the dashboard's Regroup
 * button uses, recoloured through the amber token; it reads as "this thing
 * is alive" without claiming anyone uses it.
 */
export function HeroBadge() {
  return (
    <Link
      href="/changelog"
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-mixed/35 bg-mixed-wash/60 py-1.5 pr-3 pl-2.5 text-[0.8rem] font-medium text-ink transition-colors hover:border-mixed/60"
    >
      {/* Same keyframes as WorkingButton, amber instead of mint, slower:
          a badge idles, it isn't working. Hidden under reduced motion. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full animate-[working-sweep_2.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-mixed/15 to-transparent motion-reduce:hidden"
      />
      <Sparkles className="size-3.5 text-mixed" aria-hidden="true" />
      <span>
        New in v0.3 · MCP for coding agents
      </span>
      <ArrowRight
        className="size-3 text-mixed transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
