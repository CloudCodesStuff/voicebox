import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import { site } from "@/lib/site";
import "./globals.css";

// One typeface across the whole product. Hierarchy comes from size, weight and
// tracking rather than from a second, more decorative face.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Reserved for code blocks and project keys. Never for labels or timestamps.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // Feed discovery. Without this a reader has to guess the URL.
  alternates: {
    types: { "application/rss+xml": `${site.url}/blog/rss.xml` },
  },
  title: {
    default: `${site.name}, ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "user feedback widget",
    "feedback widget for websites",
    "customer feedback analysis",
    "feedback sentiment analysis",
    "product feedback tool",
    "feature request tracking",
  ],
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name}, ${site.tagline}`,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}, ${site.tagline}`,
    description: site.description,
    creator: site.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#080A0A",
  width: "device-width",
  initialScale: 1,
  // Never trap anyone at a zoom level they can't escape.
  maximumScale: 5,
};

/**
 * Providers live here, not per-route.
 *
 * They used to be mounted inside /app and /onboarding, which meant any page
 * added outside those trees came up without a tRPC client. The invite page did
 * exactly that and crashed on its first mutation. One provider at the root
 * makes that class of mistake impossible, and costs nothing: the tRPC client
 * is lazy and marketing pages never call it.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // Dark is the product, not a preference. The light tokens stay in
      // globals.css as the `:root` fallback so a future toggle is a one-line
      // change, but nothing ships pointing at them.
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
