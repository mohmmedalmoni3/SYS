import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/server/db";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const db = await getDb();
  if (db.users.length === 0) redirect("/setup");

  const discordEnabled = Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET);

  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted">جارٍ التحميل…</div>}>
      <SignInForm discordEnabled={discordEnabled} />
    </Suspense>
  );
}
