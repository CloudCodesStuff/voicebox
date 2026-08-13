/* ---------------------------------------------------------------------------
   The social-proof strip beside the hero.

   ⚠️  READ BEFORE CHANGING `claim` OR THE FACES.

   An adoption line is a factual claim about the product. A row of faces next to
   "Trusted by product teams globally" asserts that real people at real teams use
   this. With the customer count at zero that is the unsubstantiated claim the
   FTC Rule on Consumer Reviews and Testimonials (16 CFR Part 465) and the UK CAP
   Code exist to stop, it sits above the fold, and a buyer disproves it in about
   four seconds.

   So two deliberate choices hold the line while still giving the avatar-cluster
   look that was asked for:

     • The faces are ILLUSTRATED, generated below as flat SVG characters. They
       are plainly drawings, not photographs of real customers, and they
       impersonate nobody. Do not swap in stock or AI photos of "people": that
       turns a decorative motif into a fabricated testimonial.
     • The line says who the product is FOR, not who already uses it.

   When real teams are on it, swap `claim` for the adoption line you can point at
   and, with permission, replace these illustrations with real avatars or logos:

       const claim = "Trusted by product teams worldwide";
--------------------------------------------------------------------------- */

const claim = "Built for product teams drowning in feedback";

/**
 * Flat illustrated avatars, one <Face> per config. Deterministic (fixed order,
 * no randomness) so server and client render the same markup. Palette is warm
 * and muted to sit with the dark hero rather than shouting a rainbow.
 */
const faces = [
  { bg: "#1c3a34", skin: "#F2C9A0", hair: "#2b2b2b", top: "#00785A" },
  { bg: "#2a2340", skin: "#C68642", hair: "#1a1a1a", top: "#5B4BFF" },
  { bg: "#3a2a1c", skin: "#8D5524", hair: "#0f0f0f", top: "#B0770E" },
  { bg: "#123049", skin: "#F7D7B5", hair: "#6B4423", top: "#2A6FB4" },
  { bg: "#3a1e1c", skin: "#E0A67E", hair: "#d9d9d9", top: "#D3573C" },
];

function Face({
  i,
  bg,
  skin,
  hair,
  top,
}: {
  i: number;
  bg: string;
  skin: string;
  hair: string;
  top: string;
}) {
  const id = `vb-face-${i}`;
  return (
    <svg viewBox="0 0 40 40" className="size-7" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="40" height="40" fill={bg} />
        {/* shoulders */}
        <rect x="7" y="29" width="26" height="16" rx="13" fill={top} />
        {/* hair sits behind the face and peeks at the crown */}
        <circle cx="20" cy="15.5" r="9" fill={hair} />
        {/* face */}
        <circle cx="20" cy="17" r="7.6" fill={skin} />
      </g>
    </svg>
  );
}

export function RatingProof() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex" aria-hidden="true">
        {faces.map((f, i) => (
          <span
            key={i}
            className="rounded-full ring-2 ring-paper [&:not(:first-child)]:-ml-2.5"
            style={{ zIndex: faces.length - i }}
          >
            <Face i={i} {...f} />
          </span>
        ))}
      </div>
      <span className="text-[0.82rem] font-medium text-steel">{claim}</span>
    </div>
  );
}
