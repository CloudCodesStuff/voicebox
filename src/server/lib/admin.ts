import { auth } from "@/server/auth";

/**
 * Operator access.
 *
 * Admin identity lives in an environment variable, not in the database, and
 * that is the whole security design:
 *
 *   • No column means no bug, no injection and no restored backup can grant it.
 *     Changing who is an operator requires the ability to deploy.
 *   • No screen anywhere in the product grants it, so it cannot be reached by
 *     escalation from a normal account.
 *   • It fails closed. An unset or empty variable means nobody is an admin,
 *     which is the opposite of how a staging environment usually ends up open.
 *
 * The cost is that revoking access needs a redeploy. At this size that is the
 * right trade.
 *
 * Everything this gate protects reads across tenants, which every other query
 * in the codebase is written to make impossible. That is why the admin router
 * is a separate file and why it returns aggregates rather than the feedback
 * customers' users wrote.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = adminEmails();
  // Empty list means nobody, never everybody.
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

/** True when the current session belongs to an operator. */
export async function isAdminRequest(): Promise<boolean> {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}
