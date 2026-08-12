"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min],
    [value, defaultValue, min],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-mint"
        />
      </SliderPrimitive.Track>
      {_values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          // Radix wants the label on the thumb, not the root.
          aria-label={ariaLabel}
          className="block size-4 shrink-0 cursor-grab rounded-full border-2 border-mint bg-paper shadow-sm transition-shadow outline-none hover:shadow-[0_0_0_5px_var(--mint-wash)] focus-visible:shadow-[0_0_0_5px_var(--mint-wash)] active:cursor-grabbing disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
