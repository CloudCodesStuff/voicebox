import { SettingsNav } from "./settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6">
      <h1 className="text-[1.55rem] font-bold tracking-tight text-ink">
        Settings
      </h1>
      <SettingsNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
