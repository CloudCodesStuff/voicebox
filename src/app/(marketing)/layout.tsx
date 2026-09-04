import { ConsoleBanner } from "@/components/marketing/console-banner";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/nav";
import { site } from "@/lib/site";

/**
 * Organization JSON-LD, on every marketing page.
 *
 * contactPoint carries the email; there is deliberately no PostalAddress —
 * the only address a one-person company has is a home address, and this
 * site never publishes one (see the note in src/lib/site.ts).
 */
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${site.url}/#organization`,
  name: site.name,
  legalName: site.legalEntity,
  url: site.url,
  logo: `${site.url}/icon.svg`,
  description: site.description,
  email: site.supportEmail,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: site.supportEmail,
    url: `${site.url}/contact`,
    availableLanguage: "English",
  },
  sameAs: [`https://x.com/${site.twitter.replace(/^@/, "")}`],
};

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

      <ConsoleBanner />
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
    </div>
  );
}
