"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   FAQ, grouped.

   One long accordion makes people scan for their question. Grouping by subject
   lets them jump to the right pile first, which matters here because the three
   piles get asked by three different people: the buyer, the engineer, and the
   person who has to sign off on where the data goes.
--------------------------------------------------------------------------- */

export type FaqGroup = {
  heading: string;
  items: Array<{ q: string; a: string }>;
};

export function FaqGroups({ groups }: { groups: FaqGroup[] }) {
  const [open, setOpen] = useState<string | null>(groups[0]?.items[0]?.q ?? null);

  return (
    <div className="relative mt-16 flex flex-col gap-12">
      {groups.map((group) => (
        <div key={group.heading}>
          <h3 className="mb-5 text-[1.05rem] font-medium text-ink">
            {group.heading}
          </h3>

          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const isOpen = open === item.q;
              return (
                <div
                  key={item.q}
                  className={cn(
                    "rounded-lg transition-colors duration-200",
                    isOpen ? "bg-paper-2" : "hover:bg-paper-2",
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : item.q)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left"
                  >
                    <span className="text-[0.9rem] font-medium text-ink md:text-[0.98rem]">
                      {item.q}
                    </span>
                    <span className="ml-4 shrink-0 text-steel">
                      {isOpen ? (
                        <Minus className="size-[18px]" />
                      ) : (
                        <Plus className="size-[18px]" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <p className="px-4 pb-4 text-[0.9rem] leading-relaxed text-steel">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
