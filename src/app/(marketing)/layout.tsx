import { Geist, Geist_Mono } from "next/font/google";

import { ConsoleBanner } from "@/components/marketing/console-banner";
import { SiteFooter } from "@/components/site/footer";
import { MotionRoot } from "@/components/site/motion";
import { SiteNav } from "@/components/site/nav";
import { SmoothScroll } from "@/components/site/smooth-scroll";
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

// The marketing site's own typeface. The app keeps Inter; everything under
// this layout runs on Geist, and `.site` in globals.css points the shared
// font utilities at it.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/**
 * The marketing shell: pure black, a floating glass nav, a framed column
 * whose hairlines run the height of every page, and a footer built from the
 * same frame. The skin lives in `.site` (globals.css), so every page under
 * here (docs, blog, pricing, legal) picks it up without changing.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="top"
      className={`site ${geist.variable} ${geistMono.variable} relative flex min-h-dvh flex-col overflow-x-clip bg-paper text-ink`}
    >
      <SmoothScroll />
      <ConsoleBanner />
      <MotionRoot>
        <SiteNav />
        <main className="flex-1 pt-16">{children}</main>
        <SiteFooter />
      </MotionRoot>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
    </div>
  );
}
