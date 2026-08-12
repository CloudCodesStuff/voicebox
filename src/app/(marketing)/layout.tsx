import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/nav";

/**
 * The top bloom lives here, not in the page.
 *
 * It used to sit inside the hero section, which begins below the nav in the
 * document, so the tinted area started at y=64 and left a hard horizontal
 * seam right under the header. Hoisting it to the layout and giving it a
 * negative z-index puts it behind the nav as well, so the header has nothing
 * of its own to paint and the gradient runs unbroken from the very top edge.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[780px] bg-[radial-gradient(ellipse_1100px_620px_at_50%_-14%,rgba(0,229,160,0.13),transparent_68%)]"
      />

      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
