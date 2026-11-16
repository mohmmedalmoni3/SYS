import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getDb } from "@/server/db";
import { InitialAdminForm } from "./setup-form";

export const metadata: Metadata = { title: "إعداد مسؤول النظام" };

export default async function InitialSetupPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const db = await getDb();
  if (db.users.length > 0) redirect("/sign-in");

  return <InitialAdminForm />;
}
