// Server Action to clear auth cookie and sign the user out
"use server";

import { clearAuthCookie } from "@/lib/auth";

export async function logoutAction() {
  await clearAuthCookie();
}
