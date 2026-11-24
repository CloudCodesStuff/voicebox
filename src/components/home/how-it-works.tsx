import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";

const STEPS = [
  {
    n: "01",
    title: "Add the widget",
    body: "One script tag in your layout. Visitors get a small box to type into, and it restyles itself to match your site.",
  },
  {
    n: "02",
    title: "Replies are scored and grouped",
    body: "Each reply gets a tone and a one-line summary. Replies about the same problem are grouped into one theme, however they're worded.",
  },
  {
    n: "03",
    title: "You get a ranked list",
    body: "Themes are ordered by how many people, how unhappy and how recent. The first one is what to fix next.",
  },
];

/** Three plain steps. No demo, because the recording above is the real thing. */
export function Steps() {
  return (
    <div className="grid gap-px border-t border-line bg-line md:grid-cols-3">
      {STEPS.map((s) => (
        <div key={s.n} className="bg-black p-6 sm:p-8">
          <p className="font-mono text-[12px] text-mint">{s.n}</p>
          <h3 className="display mt-3 text-[22px] leading-[1.15] tracking-[-0.03em] text-ink">{s.title}</h3>
          <p className="mt-2.5 text-[15px] font-light leading-[1.6] text-steel">{s.body}</p>
        </div>
      ))}
    </div>
  );
}

/** The install line, shown as the code it is. */
export function Install({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-line p-6 sm:p-8">
      <div className="mx-auto max-w-[720px] overflow-hidden rounded-[12px] border border-line bg-[#09090B]">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="font-mono text-[11.5px] text-faint">Paste before &lt;/body&gt;</span>
          <span className="flex items-center gap-1.5 text-[12px] text-faint">
            <Copy className="size-3.5" />
            Copy from your setup screen
          </span>
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-[1.8] text-ink/85">{children}</pre>
        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[12.5px] text-faint">
          <Check className="size-3.5 text-mint" strokeWidth={3} />
          About 11KB gzipped, in a shadow root, loaded once your page is idle
        </div>
      </div>
    </div>
  );
}
