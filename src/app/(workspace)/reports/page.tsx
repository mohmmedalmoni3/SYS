import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getReportData } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata: Metadata = { title: "التقارير" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requirePermission("reports.view");
  const data = await getReportData();

  return (
    <ReportsView
      memberPerformance={data.memberPerformance}
      funnel={data.funnel}
      budget={data.budget}
      attendanceByMeeting={data.attendanceByMeeting}
      totals={data.totals}
      canExport={hasPermission(user.permissions, "reports.export")}
    />
  );
}
