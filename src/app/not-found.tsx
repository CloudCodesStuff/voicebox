import Link from "next/link";

import { Wordmark } from "@/components/marketing/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="px-6 py-6">
        <Link href="/">
          <Wordmark />
        </Link>
      </header>

      <main className="flex flex-1 items-center px-6 pb-32">
        <div className="mx-auto w-full max-w-[46ch]">
          <div className="text-[0.8rem] font-medium text-mint-deep">
            404
          </div>
          <h1 className="mt-4 text-[clamp(2rem,4vw,2.8rem)] font-bold leading-tight tracking-[-0.02em] text-ink">
            Nothing here.
          </h1>
          <p className="mt-4 text-[0.98rem] leading-relaxed text-steel">
            That page doesn&apos;t exist, or it moved. Everything else is still
            where you left it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center rounded-lg bg-ink px-6 text-[0.92rem] font-semibold text-paper"
            >
              Back to the site
            </Link>
          </div>

          {/* Recovery map, for people and for agents that landed here from a
              dead link. The HTTP status on this page is a real 404. */}
          <nav aria-label="Where to look instead" className="mt-10">
            <p className="text-[0.8rem] font-medium text-steel">
              Where to look instead
            </p>
            <ul className="mt-3 space-y-1.5 text-[0.88rem] text-steel">
              <li>
                <Link href="/docs" className="text-ink hover:underline">
                  /docs
                </Link>{" "}
                — documentation index
              </li>
              <li>
                <Link href="/pricing" className="text-ink hover:underline">
                  /pricing
                </Link>{" "}
                — plans and limits
              </li>
              <li>
                <a href="/sitemap.xml" className="text-ink hover:underline">
                  /sitemap.xml
                </a>{" "}
                — every page on this site
              </li>
              <li>
                <a href="/llms.txt" className="text-ink hover:underline">
                  /llms.txt
                </a>{" "}
                — orientation for agents ·{" "}
                <a href="/openapi.json" className="text-ink hover:underline">
                  /openapi.json
                </a>{" "}
                — API spec
              </li>
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
}
