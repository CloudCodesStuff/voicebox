/**
 * Title and purpose for one settings tab.
 *
 * An `h2`, not an `h1`: the layout already titles the page "Settings", and the
 * tabs are sections within it. Every tab carries one so nobody lands on a
 * screen of switches and has to infer what it controls from the switch labels
 * alone, which is what "Developers" and "General" both used to ask of people.
 */
export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-[1.15rem] font-bold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-1.5 max-w-[64ch] text-[0.88rem] leading-relaxed text-steel">
        {description}
      </p>
    </div>
  );
}
