import type { Metadata } from "next";
import { requireSession } from "@/server/guard";
import { getDashboard } from "@/server/repository";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "مركز القيادة" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireSession();
  const data = await getDashboard(user.id);
  return <DashboardView data={data} />;
}
