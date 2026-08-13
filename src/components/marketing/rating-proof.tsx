/* ---------------------------------------------------------------------------
   The social-proof strip beside the hero.

   ⚠️  READ BEFORE CHANGING `claim`.

   An adoption line is a factual claim about the product, not puffery. A row of
   avatars next to "Trusted by product teams globally" asserts that named people
   at real teams use this. With the customer count at zero that is exactly the
   unsubstantiated claim the FTC Rule on Consumer Reviews and Testimonials
   (16 CFR Part 465) and the UK CAP Code exist to stop, it sits above the fold
   where it does the most work, and a buyer checks it in about four seconds. The
   liability and the credibility hit both land on whoever is running the site.

   So the avatars are deliberately abstract gradient discs, not stock faces
   posing as customers, and the line below says something true: who the product
   is FOR, not who already uses it. The moment real teams are on it, swap `claim`
   for the adoption line you have earned and can point at:

       const claim = "Trusted by product teams worldwide";

   and, if you want named proof, replace the gradient discs with real logos or
   avatars you have permission to show.
--------------------------------------------------------------------------- */

const claim = "Built for product teams drowning in feedback";

/**
 * Abstract avatars. Two-stop gradients pulled around the palette so the row
 * reads as "people" at a glance without impersonating anyone real. Fixed, not
 * random, so the strip renders identically on server and client.
 */
const avatars = [
  "linear-gradient(135deg,#2AEFB4,#00785A)",
  "linear-gradient(135deg,#5B8CFF,#2A47B4)",
  "linear-gradient(135deg,#F5B301,#B0770E)",
  "linear-gradient(135deg,#FF9E80,#D33C33)",
  "linear-gradient(135deg,#9F8CFF,#5B4BFF)",
];

export function RatingProof() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex" aria-hidden="true">
        {avatars.map((bg, i) => (
          <span
            key={i}
            className="size-7 rounded-full ring-2 ring-paper [&:not(:first-child)]:-ml-2.5"
            style={{ background: bg, zIndex: avatars.length - i }}
          />
        ))}
      </div>
      <span className="text-[0.82rem] font-medium text-steel">{claim}</span>
    </div>
  );
}
