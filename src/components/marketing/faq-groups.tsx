"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useState } from "react";

import { EASE } from "@/components/site/motion";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   FAQ, grouped.

   One long accordion makes people scan for their question. Grouping by subject
   lets them jump to the right pile first, which matters here because the three
   piles get asked by three different people: the buyer, the engineer, and the
   person who has to sign off on where the data goes.

   Each group is a row of the framed column: the group's name on the left, its
   questions on the right, hairlines between everything.
--------------------------------------------------------------------------- */

export type FaqGroup = {
  heading: string;
  items: Array<{ q: string; a: string }>;
};

export function FaqGroups({ groups }: { groups: FaqGroup[] }) {
  const [open, setOpen] = useState<string | null>(groups[0]?.items[0]?.q ?? null);

  return (
    <div className="border-t border-line">
      {groups.map((group, gi) => (
        <div
          key={group.heading}
          className={cn("grid lg:grid-cols-[280px_1fr]", gi < groups.length - 1 && "border-b border-line")}
        >
          <div className="px-6 pb-2 pt-8 sm:px-10 lg:border-r lg:border-line lg:py-10">
            <h3 className="display text-[22px] leading-[1.15] tracking-[-0.03em] text-ink lg:sticky lg:top-24">
              {group.heading}
            </h3>
          </div>

          <div className="divide-y divide-line">
            {group.items.map((item) => {
              const isOpen = open === item.q;
              return (
                <div key={item.q} className={cn("transition-colors duration-300", isOpen && "bg-white/[0.02]")}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : item.q)}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 px-6 py-5 text-left sm:px-10"
                  >
                    <span
                      className={cn(
                        "text-[16px] font-medium tracking-[-0.01em] transition-colors duration-200 sm:text-[17px]",
                        isOpen ? "text-ink" : "text-ink/80",
                      )}
                    >
                      {item.q}
                    </span>
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border transition-[transform,border-color,background-color,color] duration-300",
                        isOpen ? "rotate-45 border-mint/40 bg-mint/10 text-mint" : "border-line-strong text-faint",
                      )}
                    >
                      <Plus className="size-3.5" />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[62ch] px-6 pb-6 text-[15.5px] font-light leading-[1.65] text-steel sm:px-10">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
