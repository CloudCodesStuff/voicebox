import { Star } from "lucide-react";

/* ---------------------------------------------------------------------------
   The star row beside the hero pill.

   ⚠️  READ BEFORE CHANGING `claim`.

   A star rating and an adoption line are both factual claims about the
   product, not puffery. "Used by companies worldwide" while the customer count
   is zero is exactly the kind of unsubstantiated claim the FTC Rule on
   Consumer Reviews and Testimonials (16 CFR Part 465) and the UK CAP Code
   exist to stop, and it sits above the fold where it does the most work. The
   liability follows the site, so it lands on whoever is running it.

   The copy below says something true about who the product is for. The moment
   you have real customers, swap `claim` for the adoption line you have earned
   and can evidence:

       const claim = "Used by teams worldwide";

   Keep the stars for a rating you can point at (a real review page, a
   directory listing). Until one exists they are decoration for the claim, so
   they ride with it.
--------------------------------------------------------------------------- */

const claim = "Built for teams drowning in feedback";

export function RatingProof() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex gap-0.5"
        role="img"
        aria-label="Five stars"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className="size-4 text-[#F5B301]"
            fill="currentColor"
            stroke="none"
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-[0.82rem] font-medium text-steel">{claim}</span>
    </div>
  );
}
