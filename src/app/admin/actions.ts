"use server";

import { redirect } from "next/navigation";
import { passwordMatches, startSession, endSession } from "@/lib/admin-auth";
import { text } from "./plumbing";
import type { ActionState } from "./ui";

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const password = text(fd, "password");
  const next = text(fd, "next");

  // Never logged, never echoed back.
  if (!password || !passwordMatches(password)) {
    return { error: "That password is not right." };
  }

  await startSession();
  // Only ever bounce back into the console — an attacker-supplied `next` must
  // not turn the login form into an open redirect.
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}
