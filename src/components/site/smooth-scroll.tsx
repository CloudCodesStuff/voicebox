"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Inertial smooth scrolling (Lenis). The page still scrolls natively
 * underneath, so scroll-linked animations read the real position. In-page
 * links glide to their section, clearing the floating header.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.14,
      wheelMultiplier: 1,
      anchors: {
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      },
      autoRaf: true,
      prevent: (node: Element) => !!node.closest("[role=dialog]"),
    });
    return () => lenis.destroy();
  }, []);
  return null;
}
