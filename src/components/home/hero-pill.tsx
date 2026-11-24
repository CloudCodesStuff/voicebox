import { ChevronRight } from "lucide-react";
import Link from "next/link";

/** The pill above the headline: the one thing that is new, linking to where it is explained. */
export function HeroPill() {
  return (
    <Link
      href="/docs/api#model-context-protocol"
      className="group inline-flex h-9 items-center gap-2.5 rounded-full border border-mixed/35 bg-[linear-gradient(180deg,rgba(232,176,75,0.14),rgba(232,176,75,0.04))] pl-3.5 pr-2 text-[13.5px] shadow-[inset_0_1px_0_rgba(252,211,77,0.16),0_0_32px_-10px_rgba(232,176,75,0.6)] backdrop-blur transition-[border-color,box-shadow] duration-300 hover:border-mixed/65 hover:shadow-[inset_0_1px_0_rgba(252,211,77,0.24),0_0_40px_-8px_rgba(232,176,75,0.75)]"
    >
      <span className="relative grid size-2 place-items-center" aria-hidden>
        <span className="absolute inset-0 animate-ping rounded-full bg-mixed/60 [animation-duration:2.4s]" />
        <span className="relative size-2 rounded-full bg-mixed shadow-[0_0_8px_rgba(232,176,75,0.9)]" />
      </span>
      <span className="font-medium text-mixed">New in v0.3</span>
      <span aria-hidden className="h-3.5 w-px bg-mixed/30" />
      <span className="whitespace-nowrap text-ink/90">MCP for coding agents</span>
      <span className="grid size-5 place-items-center rounded-full bg-mixed/15 text-mixed transition-transform duration-300 group-hover:translate-x-0.5">
        <ChevronRight className="size-3" />
      </span>
    </Link>
  );
}
