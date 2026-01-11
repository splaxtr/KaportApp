// Server Action to clear auth cookie and sign the user out
"use server";

import { cookies } from "next/headers";

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.set("kaporta_auth", "", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
