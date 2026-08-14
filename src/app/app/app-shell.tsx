"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Check,
  ChevronsUpDown,
  Inbox,
  LayoutGrid,
  Layers,
  LogOut,
  Menu,
  Plug,
  Plus,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Wordmark } from "@/components/marketing/brand";
import { Avatar } from "@/components/app/avatar";
import { useProject } from "@/components/app/project-context";
import { Tour } from "@/components/app/tour";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/server/actions/auth";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

const nav = [
  { href: "/app", label: "Overview", icon: Sparkles, exact: true, tour: undefined },
  { href: "/app/inbox", label: "Inbox", icon: Inbox, tour: "nav-inbox" },
  { href: "/app/themes", label: "Themes", icon: Layers, tour: "nav-themes" },
  { href: "/app/trends", label: "Trends", icon: BarChart3, tour: "nav-trends" },
  { href: "/app/widget", label: "Widget", icon: LayoutGrid, tour: "nav-widget" },
  { href: "/app/mcp", label: "MCP", icon: Plug, tour: undefined },
  { href: "/app/settings", label: "Settings", icon: Settings, tour: undefined },
];

type Workspace = { id: string; name: string };

export function AppShell({
  orgName,
  orgId,
  workspaces,
  userName,
  userEmail,
  userImage,
  children,
}: {
  orgName: string;
  orgId: string;
  workspaces: Workspace[];
  userName: string;
  userEmail: string;
  userImage: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // The menu closes from the link's own onClick rather than an effect watching
  // the pathname, the click is the actual event, and it avoids a second render.
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-dvh bg-paper">
      {/* Desktop sidebar */}
      {/* Sticky and viewport-height: the nav scrolls inside it, so the usage
          meter and account menu never leave the screen on long pages. */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-paper-2 lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/app" aria-label="Voicebox">
            <Wordmark />
          </Link>
        </div>

        <div className="px-3">
          <ProjectSwitcher />
        </div>

        <nav className="mt-4 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <UsageMeter />
          <AccountMenu
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            orgName={orgName}
            orgId={orgId}
            workspaces={workspaces}
          />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky, because the pages under it are long. The desktop sidebar is
            always on screen; on mobile this bar was the only way to navigate
            and it scrolled away with the content, so getting to another page
            from halfway down the overview meant scrolling back to the top
            first. z-40 keeps it over page content but under the widget. */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-paper-2 px-4 lg:hidden">
          <Link href="/app" aria-label="Voicebox">
            <Wordmark />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex size-11 items-center justify-center"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        {/* Sticky under the bar it drops from, and never taller than what is
            left of the screen. On a short screen, or in landscape, the account
            row at the bottom used to sit below the fold of a panel that gave
            no sign it could scroll. */}
        {mobileOpen && (
          <div className="sticky top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-paper-2 px-3 pb-4 lg:hidden">
            <div className="pt-3">
              <ProjectSwitcher />
            </div>
            <nav className="mt-3 space-y-0.5">
              {nav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={closeMobile}
                />
              ))}
            </nav>
            <div className="mt-3 border-t border-line pt-3">
              <UsageMeter />
              <AccountMenu
                userName={userName}
                userEmail={userEmail}
                userImage={userImage}
                orgName={orgName}
                orgId={orgId}
                workspaces={workspaces}
              />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Desktop only: the tour spotlights the sidebar, which isn't on screen
          at mobile widths, so pointing at it there would highlight nothing. */}
      <div className="hidden lg:block">
        <Tour enabled />
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof nav)[number];
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      data-tour={item.tour}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.875rem] font-medium transition-colors",
        active
          ? "bg-muted text-ink"
          : "text-steel hover:bg-muted/60 hover:text-ink",
      )}
    >
      <item.icon
        className={cn("size-4", active && "text-mint-deep")}
        strokeWidth={1.9}
      />
      {item.label}
    </Link>
  );
}

/**
 * A project's initial in a tinted square.
 *
 * The hue comes from the name, so a project keeps the same mark everywhere and
 * two projects are told apart by colour before anyone reads the label. Fixed
 * saturation and lightness keep every one of them legible on this ground, which
 * a free-running random colour would not.
 */
function ProjectMark({ name }: { name: string }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;

  return (
    <span
      aria-hidden="true"
      className="grid size-6 shrink-0 place-items-center rounded-md text-[0.68rem] font-bold"
      style={{
        backgroundColor: `oklch(0.42 0.07 ${hue})`,
        color: `oklch(0.93 0.04 ${hue})`,
      }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function ProjectSwitcher() {
  const { projects, activeProject, setActiveProjectId } = useProject();

  if (!activeProject) {
    return (
      <div className="h-11 animate-pulse rounded-lg bg-muted" aria-hidden="true" />
    );
  }

  return (
    <DropdownMenu>
      {/* The "Project" caption above the name is gone. It stacked two lines of
          text into a 44px control to say something the menu already says, and
          made the switcher read like a form field. A mark carries the identity
          instead, which is also what makes several projects tellable apart at a
          glance rather than by reading. */}
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Project: ${activeProject.name}. Switch project`}
          className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-line px-2 text-left transition-colors hover:border-line-strong hover:bg-muted/60"
        >
          <ProjectMark name={activeProject.name} />
          <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium text-ink">
            {activeProject.name}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-faint" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <div className="label px-2 py-1.5">Projects</div>
        {projects.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setActiveProjectId(p.id)}
            className="cursor-pointer gap-2.5"
          >
            <ProjectMark name={p.name} />
            <span className="flex-1 truncate">{p.name}</span>
            {p.id === activeProject.id && (
              <Check className="size-3.5 shrink-0 text-mint-deep" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings/projects" className="cursor-pointer">
            Manage projects
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UsageMeter() {
  const { data } = api.org.current.useQuery();
  if (!data) return null;

  const { usage } = data;

  return (
    <Link
      href="/app/settings/billing"
      aria-label={`${usage.plan.toLowerCase()} plan: ${usage.used.toLocaleString()} of ${usage.limit.toLocaleString()} feedback used this period`}
      className="mb-3 block rounded-lg border border-line p-3 transition-colors hover:bg-muted/60"
    >
      <div className="flex items-center justify-between">
        {/* CSS `capitalize` Title-Cases Every Word, so it wraps only the plan
            name; "plan" stays lowercase. */}
        <span className="label text-ink">
          <span className="capitalize">{usage.plan.toLowerCase()}</span> plan
        </span>
        <span className="tnum text-[0.75rem] text-steel">
          {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            usage.percent >= 90 ? "bg-negative" : "bg-mint",
          )}
          style={{ width: `${usage.percent}%` }}
        />
      </div>
    </Link>
  );
}

function AccountMenu({
  userName,
  userEmail,
  userImage,
  orgName,
  orgId,
  workspaces,
}: {
  userName: string;
  userEmail: string;
  userImage: string | null;
  orgName: string;
  orgId: string;
  workspaces: Workspace[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60"
        >
          <Avatar src={userImage} name={userName} email={userEmail} size={28} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.84rem] font-medium text-ink">
              {userName || "Account"}
            </span>
            <span className="block truncate text-[0.75rem] text-steel">
              {orgName}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <div className="truncate text-[0.84rem] font-semibold text-ink">
            {userName || "Signed in"}
          </div>
          <div className="truncate text-[0.78rem] text-steel">{userEmail}</div>
        </div>
        <DropdownMenuSeparator />

        {/* Workspaces. Shown even when there's only one, so the concept and
            the way to add another are discoverable before you need them, and
            so the menu doesn't restructure itself the day you join a team. */}
        <div className="px-2 pt-1.5 pb-1">
          <div className="label">Workspace</div>
        </div>
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} asChild>
            {/* Native POST, not a Server Function: switching tenants has to
                throw away the client cache, and only a real document load
                does that. See the route handler for the full reasoning. */}
            <form
              method="POST"
              action="/api/workspace/switch"
              className="w-full"
            >
              <input type="hidden" name="orgId" value={w.id} />
              <button
                type="submit"
                disabled={w.id === orgId}
                className="flex w-full cursor-pointer items-center gap-2 disabled:cursor-default"
              >
                <span className="flex-1 truncate text-left">{w.name}</span>
                {w.id === orgId && (
                  <Check className="size-3.5 shrink-0 text-mint-deep" />
                )}
              </button>
            </form>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <Link
            href="/onboarding?new=1"
            className="cursor-pointer text-steel"
          >
            <Plus className="mr-2 size-4" />
            New workspace
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings/general" className="cursor-pointer">
            <Settings className="mr-2 size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction} className="w-full">
            <button type="submit" className="flex w-full cursor-pointer items-center">
              <LogOut className="mr-2 size-4" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
