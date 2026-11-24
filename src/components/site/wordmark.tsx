import { BrandMark } from "@/components/marketing/brand";
import { cn } from "@/lib/utils";

/** The mark, then the name in Geist. The mark is mint; the name is ink. */
export function SiteWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-ink", className)}>
      <BrandMark className="text-mint" size={20} />
      <span className="display text-[19px] leading-none tracking-[-0.04em]">Voicebox</span>
    </span>
  );
}
