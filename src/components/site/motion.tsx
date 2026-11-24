"use client";

import {
  MotionConfig,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * The site's motion vocabulary. One ease everywhere (a quick start, a long
 * settle), reveals that play once as things scroll in, and a few scroll-
 * linked moves. Everything stands still for people who ask for less motion.
 */

export const EASE = [0.16, 1, 0.3, 1] as const;

export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// an accent word is coloured, its trailing punctuation is not
function Word({ w, accent }: { w: string; accent: string[] }) {
  const [, core, punct] = w.match(/^(.*?)([.,;:!?]*)$/) ?? [w, w, ""];
  if (!accent.includes(core)) return <>{w}</>;
  return (
    <>
      <span className="text-mint">{core}</span>
      {punct}
    </>
  );
}

/** A headline whose words rise into place through a mask, one after another. */
export function RevealWords({
  text,
  accent = [],
  className,
  delay = 0,
  as: Tag = "h2",
  onLoad = false,
}: {
  text: string;
  accent?: string[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p";
  /** play on mount (above the fold) instead of when scrolled into view */
  onLoad?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const on = onLoad || seen;
  // a lone "|" is a forced line break, so a headline can choose its own lines
  const words = text.split(" ");
  const label = text.replace(/ ?\| ?/g, " ");
  const MTag = motion[Tag];
  return (
    <MTag ref={ref} className={className} aria-label={label}>
      {words.map((w, i) =>
        w === "|" ? (
          <br key={i} aria-hidden />
        ) : (
        <span key={i}>
          <span
            aria-hidden
            className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-top"
          >
            <motion.span
              className="inline-block will-change-transform"
              initial={{ y: "105%", rotate: 3 }}
              animate={on ? { y: "0%", rotate: 0 } : undefined}
              transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.045 }}
            >
              <Word w={w} accent={accent} />
            </motion.span>
          </span>
          {/* a plain space between words: it wraps and collapses at line ends, so centred lines stay centred */}
          {i < words.length - 1 && words[i + 1] !== "|" && " "}
        </span>
        ),
      )}
    </MTag>
  );
}

/** Fades and rises into place once it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  onLoad = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  onLoad?: boolean;
}) {
  const shown = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={onLoad ? shown : undefined}
      whileInView={onLoad ? undefined : shown}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const group: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.07 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Children wrapped in StaggerItem come in one after another. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={group}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/** The hero copy eases up and dims as the page scrolls away from it. */
export function HeroDrift({ children, className }: { children: ReactNode; className?: string }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -70]);
  const opacity = useTransform(scrollY, [0, 520], [1, 0.15]);
  return (
    <motion.div className={className} style={{ y, opacity }}>
      {children}
    </motion.div>
  );
}

/** A hairline along the bottom of the header that fills as you read. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-px origin-left bg-mint/80"
      style={{ scaleX }}
    />
  );
}

/** The little cross at a frame joint; it turns into place as its band arrives. */
export function TickMark({ className }: { className?: string }) {
  return (
    <motion.svg
      width="9"
      height="9"
      viewBox="0 0 9 9"
      aria-hidden
      className={cn("pointer-events-none absolute z-10 text-white/25", className)}
      initial={{ rotate: -90, opacity: 0, scale: 0.4 }}
      whileInView={{ rotate: 0, opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1" />
    </motion.svg>
  );
}

/** Pulls its child a few pixels toward the cursor, with spring resistance. */
export function Magnetic({
  children,
  strength = 0.28,
  max = 6,
  className,
}: {
  children: ReactNode;
  strength?: number;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 380, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 380, damping: 22, mass: 0.6 });
  const clamp = (v: number) => Math.max(-max, Math.min(max, v));

  return (
    <motion.div
      ref={ref}
      className={className ?? "inline-flex"}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength));
        y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength));
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
    >
      {children}
    </motion.div>
  );
}
