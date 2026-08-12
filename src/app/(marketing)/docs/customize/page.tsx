import type { Metadata } from "next";

import { CodeBlock } from "@/components/marketing/docs";

export const metadata: Metadata = {
  title: "Customization",
  description:
    "Every option on the {site.name} widget: colors, position, theme, copy, feedback types, rating, and branding.",
  alternates: { canonical: "/docs/customize" },
};

const options: Array<[string, string, string]> = [
  ["accentColor", "#00C48C", "Trigger, focus rings, and the submit button."],
  ["position", "bottom-right", "bottom-right · bottom-left · top-right · top-left"],
  ["theme", "auto", "light · dark · auto (follows the visitor's system setting)"],
  ["radius", "12", "Corner radius in px, 0 to 24."],
  ["triggerLabel", "Feedback", "Text on the floating button."],
  ["triggerHidden", "false", "Hide the button and open it yourself instead."],
  ["heading", "Share your feedback", "Panel title."],
  ["subheading", "We read everything…", "One line under the title."],
  ["enabledTypes", "all four", "Which of Idea / Issue / Praise / Question to show."],
  ["askRating", "true", "Show the 1 to 5 scale."],
  ["askEmail", "true", "Show the optional email field."],
  ["successMessage", "Thank you…", "Shown after a submission lands."],
  ["hideBranding", "false", "Remove the footer link. Pro and above."],
];

export default function CustomizeDocs() {
  return (
    <>
      <h1 className="text-[2.1rem] font-bold tracking-[-0.025em] text-ink">
        Customization
      </h1>
      <p className="mt-4 text-[1rem] leading-relaxed text-steel">
        Everything is configured from the{" "}
        <strong className="text-ink">Widget</strong> page in the dashboard,
        with a live preview beside the controls. Deployed widgets pick up
        changes within about a minute, no redeploy on your side.
      </p>

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Options
      </h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-paper-2">
              <th className="label px-4 py-3">Option</th>
              <th className="label px-4 py-3">Default</th>
              <th className="label px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-paper-2">
            {options.map(([name, def, note]) => (
              <tr key={name} className="border-b border-line last:border-0">
                <td className="px-4 py-3 tnum text-[0.8rem] text-ink">
                  {name}
                </td>
                <td className="px-4 py-3 tnum text-[0.8rem] text-steel">
                  {def}
                </td>
                <td className="px-4 py-3 text-[0.82rem] text-steel">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Why it can&apos;t break your styles
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        The widget mounts into a Shadow DOM root with{" "}
        <code className="font-mono">:host &#123; all: initial &#125;</code>.
        Your page&apos;s CSS, including <code className="font-mono">!important</code>{" "}
        rules on <code className="font-mono">button</code>,{" "}
        <code className="font-mono">input</code>, or{" "}
        <code className="font-mono">*</code>, cannot reach inside it, and
        nothing we ship leaks out onto your page.
      </p>

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Keyboard
      </h2>
      <ul className="mt-3 space-y-2 text-[0.9rem] leading-relaxed text-steel">
        <li>
          <code className="font-mono">Esc</code> closes the panel.
        </li>
        <li>
          <code className="font-mono">⌘/Ctrl + Enter</code> submits from the
          message box.
        </li>
      </ul>

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Accessibility & motion
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Animations are skipped entirely for visitors with{" "}
        <code className="font-mono">prefers-reduced-motion: reduce</code>, and
        the panel is fully keyboard operable.
      </p>

      <CodeBlock
        className="mt-8"
        filename="stored config (read-only)"
        code={`{
  "accentColor": "#00C48C",
  "position": "bottom-right",
  "theme": "auto",
  "radius": 12,
  "enabledTypes": ["IDEA", "ISSUE", "PRAISE", "QUESTION"],
  "askRating": true,
  "askEmail": true,
  "hideBranding": false
}`}
      />
    </>
  );
}
