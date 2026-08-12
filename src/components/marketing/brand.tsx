import { cn } from "@/lib/utils";

/**
 * The mark: three bars narrowing downward, many comments entering, few themes
 * coming out. It's the product in one glyph.
 */
export function BrandMark({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 5h18M6 12h12M10 19h4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[1.08rem] font-bold tracking-tight",
        className,
      )}
    >
      <BrandMark className={cn("text-mint-deep", markClassName)} size={19} />
      Voicebox
    </span>
  );
}
