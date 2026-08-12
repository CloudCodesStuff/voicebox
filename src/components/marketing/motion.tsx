"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Fragment, useRef, type ElementType, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ---------------------------------------------------------------------------
   Scroll motion
   ---------------------------------------------------------------------------
   House rules, so the whole site moves like one thing:

   • One gesture only, fade up. No scale, no rotation, no bounce easing.
   • 18px of travel. Enough to read as motion, small enough to never feel
     like the page is assembling itself while you try to read it.
   • Animations run once. Content that re-animates every time it scrolls back
     into view is a toy, not a product page.
   • Everything is wrapped in gsap.matchMedia so `prefers-reduced-motion`
     users get the finished state immediately, not a degraded animation.

   Initial state is set inside useGSAP (which runs pre-paint) rather than in
   CSS, so a visitor with JS disabled sees the content instead of a blank page.
--------------------------------------------------------------------------- */

const EASE = "power2.out";
const DISTANCE = 18;
const DURATION = 0.7;

/**
 * Failsafe for anything we hide before animating in.
 *
 * These reveals set opacity to 0 and animate back, which means a stalled
 * animation leaves the content invisible, and GSAP drives on
 * requestAnimationFrame, which browsers throttle hard in background tabs.
 * Open the site in a background tab and the hero headline can sit at zero
 * opacity indefinitely. That's unacceptable for the largest text on the page.
 *
 * setTimeout is throttled far less aggressively than rAF, so this snaps the
 * final state into place if the tween hasn't finished by the time it should
 * have. When the animation runs normally this fires after it's already
 * complete and is a no-op.
 */
function guarantee(
  targets: Element | Element[] | NodeListOf<Element>,
  afterSeconds: number,
): number {
  return window.setTimeout(
    () => {
      gsap.set(targets, { opacity: 1, y: 0, yPercent: 0, clearProps: "transform" });
    },
    (afterSeconds + 1.2) * 1000,
  );
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  /** Start position relative to the viewport. Later = closer to centre. */
  start?: string;
};

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  start = "top 85%",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      let safety: number;

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(el, { opacity: 0, y: DISTANCE });
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: DURATION,
          delay,
          ease: EASE,
          scrollTrigger: { trigger: el, start, once: true },
        });
        // Only guard content that starts on screen, anything below the fold
        // is legitimately waiting for a scroll that may never come.
        if (el.getBoundingClientRect().top < window.innerHeight) {
          safety = guarantee(el, delay + DURATION);
        }
      });

      return () => {
        clearTimeout(safety);
        mm.revert();
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Staggers direct children. Use for card grids and lists, one ScrollTrigger
 * for the whole group rather than one per card.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  start = "top 85%",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const items = Array.from(el.children) as HTMLElement[];
      if (items.length === 0) return;

      const mm = gsap.matchMedia();

      let safety: number;

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(items, { opacity: 0, y: DISTANCE });
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: DURATION,
          delay,
          ease: EASE,
          stagger,
          scrollTrigger: { trigger: el, start, once: true },
        });
        if (el.getBoundingClientRect().top < window.innerHeight) {
          safety = guarantee(items, delay + DURATION + items.length * stagger);
        }
      });

      return () => {
        clearTimeout(safety);
        mm.revert();
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Hero headline. Reveals per word rather than per character, character
 * animation on a headline is a screen-reader problem and reads as decoration.
 * The full string stays in one accessible node; spans are aria-hidden.
 *
 * Deliberately a fade and a 10px rise, with no overflow mask. The mask version
 * clipped descenders, because the line box at `leading-[1.05]` is shorter than
 * the glyphs, and every fix for that trades one clipping bug for another at
 * some other size. A fade cannot clip anything at any size.
 */
export function WordReveal({
  text,
  className,
  as: Tag = "h1",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: ElementType;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const spans = el.querySelectorAll<HTMLElement>("[data-word]");
      if (spans.length === 0) return;

      const mm = gsap.matchMedia();

      let safety: number;

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hide immediately (useGSAP runs pre-paint) so there is no flash of
        // the finished headline before the reveal starts.
        gsap.set(spans, { y: 10, opacity: 0 });

        // Then wait for the webfont. Inter and the fallback have different
        // metrics, so a swap mid-reveal re-wraps the headline and the words
        // visibly jump between lines. Waiting costs nothing when the font is
        // already cached, and the words are hidden while we wait either way.
        const run = () => {
          gsap.to(spans, {
            y: 0,
            opacity: 1,
            duration: 0.72,
            delay,
            ease: "power3.out",
            stagger: 0.035,
          });
        };

        // Cap the wait: a font that never resolves must not hold the LCP text
        // hostage. Whichever finishes first wins, and the second is a no-op.
        let started = false;
        const start = () => {
          if (started) return;
          started = true;
          run();
        };

        const fontTimeout = window.setTimeout(start, 400);
        if (document.fonts) {
          document.fonts.ready.then(start, start);
        } else {
          start();
        }

        // Belt and braces. The headline is the LCP element and must never be
        // left invisible by a stalled animation or a throttled rAF.
        safety = guarantee(spans, delay + 1.2 + spans.length * 0.035);

        return () => clearTimeout(fontTimeout);
      });

      return () => {
        clearTimeout(safety);
        mm.revert();
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <Fragment key={`${word}-${i}`}>
            <span data-word className="inline-block">
              {word}
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}

/**
 * Counts to a number when scrolled into view. Used for the one statistic on
 * the page, if there were three of these it would feel like a dashboard.
 */
export function CountUp({
  to,
  suffix = "",
  prefix = "",
  duration = 1.4,
  className,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const counter = { value: 0 };
        el.textContent = `${prefix}0${suffix}`;

        gsap.to(counter, {
          value: to,
          duration,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate() {
            el.textContent = `${prefix}${Math.round(counter.value).toLocaleString()}${suffix}`;
          },
        });
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={className}>
      {prefix}
      {to.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * Slow vertical drift as the section passes through the viewport. Used once,
 * on the hero product visual, to give the page a sense of depth without
 * turning scrolling into a ride.
 */
export function Parallax({
  children,
  className,
  amount = 60,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      // Desktop only: parallax on a phone competes with momentum scrolling
      // and reads as jank rather than polish.
      mm.add(
        "(prefers-reduced-motion: no-preference) and (min-width: 1024px)",
        () => {
          gsap.to(el, {
            y: -amount,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        },
      );

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
