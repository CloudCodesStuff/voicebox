"use server";

import { signOut } from "@/server/auth";

/**
 * Sign-out must be a POST, a plain link to the signout endpoint is both a
 * lint error and a CSRF footgun, since anything that can make the browser
 * issue a GET could log the user out.
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
