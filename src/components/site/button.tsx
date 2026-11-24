import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/*
 * The site's button. Every filled variant has a soft top-to-bottom gradient,
 * a lighter inner rim along the top and a dark outer hairline, so it reads as
 * a slightly raised, glossy key rather than a flat rectangle.
 *
 *   primary  white, the quiet default
 *   signal   mint, the one action per screen that matters (Start free)
 *   ghost    glass, the secondary action
 *   outline  a hairline, for the third
 */
export const buttonVariants = cva(
  "relative inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap font-medium tracking-[-0.01em] outline-none transition-[filter,transform,box-shadow,background-color] duration-150 active:translate-y-px focus-visible:ring-2 focus-visible:ring-mint/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "text-[#0E0E12] bg-[linear-gradient(180deg,#FFFFFF_0%,#ECECF1_55%,#DADAE1_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.55),0_8px_20px_-10px_rgba(255,255,255,0.35)] hover:brightness-[1.04]",
        signal:
          "text-[#03231A] bg-[linear-gradient(180deg,#8FF5D2_0%,#34E3A8_45%,#0FB985_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_0_0_1px_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.18),0_0_0_1px_rgba(2,84,60,0.9),0_12px_28px_-10px_rgba(0,229,160,0.6)] hover:brightness-110",
        ghost:
          "text-ink bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.05)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_0_1px_rgba(255,255,255,0.07)] hover:bg-white/[0.06]",
        outline:
          "border border-line text-ink hover:border-line-strong hover:bg-white/[0.04]",
      },
      size: {
        sm: "h-8 rounded-[8px] px-3.5 text-[13.5px] [&_svg]:size-3.5",
        md: "h-10 rounded-[10px] px-[18px] text-sm [&_svg]:size-4",
        lg: "h-12 rounded-[12px] px-5 text-[15px] [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface SiteButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const SiteButton = React.forwardRef<HTMLButtonElement, SiteButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
SiteButton.displayName = "SiteButton";
