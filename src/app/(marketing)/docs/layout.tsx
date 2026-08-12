import { DocsPager, DocsSidebar } from "@/components/marketing/docs";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <DocsSidebar />
        </aside>
        <article className="min-w-0 max-w-[68ch]">
          {children}
          {/* In the layout rather than on each page, so a new page can never
              ship as a dead end by forgetting to add it. */}
          <DocsPager />
        </article>
      </div>
    </div>
  );
}
