"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * User avatar with a fallback that actually fires.
 *
 * Two things break Google profile pictures and both are handled here:
 *
 *  1. `lh3.googleusercontent.com` returns 403 when a referrer is sent, so the
 *     image silently fails and you get an empty circle. `referrerPolicy` fixes
 *     it, and it is the entire reason this component exists.
 *  2. Google occasionally rotates or expires the URL stored at sign-in. An
 *     `onError` fallback to initials means a stale URL degrades to something
 *     deliberate instead of a hole in the layout.
 *
 * A plain <img> rather than next/image: these are third-party URLs on hosts we
 * would otherwise have to allowlist in next.config, and the optimiser buys us
 * nothing on a 32px circle.
 */
export function Avatar({
  src,
  name,
  email,
  size = 28,
  className,
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  const initial = (name?.trim() || email?.trim() || "?")
    .charAt(0)
    .toUpperCase();

  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-sunken",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span
          className="font-medium text-steel"
          style={{ fontSize: Math.max(10, Math.round(size * 0.4)) }}
          aria-hidden="true"
        >
          {initial}
        </span>
      )}
    </span>
  );
}
