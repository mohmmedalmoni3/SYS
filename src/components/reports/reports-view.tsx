"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
  FileSpreadsheet,
  Printer,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/empty-state";
import { SpotlightCard } from "@/components/fx/spotlight-card";

interface MemberRow {
  id: string;
  name: string;
  avatarHue: number;
  role: string;
  roleColor: string;
  tasksDone: number;
  tasksOpen: number;
  hours: number;
  attendance: number;
  points: number;
  efficiency: number;
}

interface ReportProps {
  memberPerformance: MemberRow[];
  funnel: { status: string; count: number }[];
  budget: { name: string; code: string; color: string; budget: number; spent: number; progress: number }[];
  attendanceByMeeting: { name: string; present: number; late: number; absent: number; excused: number }[];
  totals: {
    members: number;
    projects: number;
    tasksDone: number;
    tasksOpen: number;
    proposals: number;
    acceptanceRate: number;
    budget: number;
    spent: number;
  };
  canExport: boolean;
}

const FUNNEL_LABEL: Record<string, string> = {
  NEW: "جديد",
  UNDER_REVIEW: "قيد المراجعة",
  ACCEPTED: "مقبول",
  CONVERTED: "تحوّل لمشروع",
  REJECTED: "مرفوض",
};

export function ReportsView({ memberPerformance, funnel, budget, attendanceByMeeting, totals, canExport }: ReportProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function exportCsv() {
    if (!canExport) {
      toast.error("لا تملك صلاحية التصدير");
      return;
    }
    const header = ["العضو", "الرتبة", "مهام منجزة", "مهام مفتوحة", "ساعات مسجلة", "الالتزام%", "النقاط", "الكفاءة%"];
    const rows = memberPerformance.map((member) => [
      member.name,
      member.role,
      member.tasksDone,
      member.tasksOpen,
      member.hours,
      member.attendance,
      member.points,
      member.efficiency,
    ]);
    const csv = "\uFEFF" + [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tectnal-performance.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("صُدّر التقرير بصيغة CSV");
  }

  const maxFunnel = Math.max(1, ...funnel.map((item) => item.count));

  return (
    <div className="print-area space-y-5">
      <SectionHeader
        kicker="REPORTS · 11"
        title="التقارير والتحليلات"
        description="أداء الأعضاء، صحة المشاريع، وقمع الاقتراحات — أرقام تتخذ قرارات."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="size-3.5" />
              طباعة
            </Button>
            <Button size="sm" onClick={exportCsv} className="no-print">
              <Download className="size-3.5" />
              تصدير CSV
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "الأعضاء", value: formatNumber(totals.members), icon: Users, color: "#A78BFA" },
          { label: "المهام المنجزة", value: formatNumber(totals.tasksDone), icon: Target, color: "#34D399" },
          { label: "معدل قبول الاقتراحات", value: `${totals.acceptanceRate}%`, icon: TrendingUp, color: "#22D3EE" },
          { label: "الميزانية المستهلكة", value: formatCurrency(totals.spent), icon: Wallet, color: "#FFB86B" },
        ].map((stat) => (
          <div key={stat.label} className="glass flex items-center gap-3 rounded-xl p-3.5">
            <span className="grid size-9 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${stat.color} 14%, transparent)`, color: stat.color }}>
              <stat.icon className="size-4" />
            </span>
            <div>
              <div className="num text-base font-semibold">{stat.value}</div>
              <div className="text-[0.55rem] text-muted">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <SpotlightCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
              <Users className="size-4 text-primary-soft" /> أداء الأعضاء
            </h2>
            <Badge className="text-[0.5rem]">{memberPerformance.length} عضواً</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العضو</th>
                  <th>المنجز</th>
                  <th>المفتوح</th>
                  <th>الساعات</th>
                  <th>الالتزام</th>
                  <th>الكفاءة</th>
                </tr>
              </thead>
              <tbody>
                {memberPerformance.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={member.name} hue={member.avatarHue} size="xs" />
                        <div>
                          <div className="text-[0.65rem] font-medium">{member.name}</div>
                          <div className="text-[0.48rem]" style={{ color: member.roleColor }}>{member.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num text-[0.62rem]">{member.tasksDone}</td>
                    <td className="num text-[0.62rem]">{member.tasksOpen}</td>
                    <td className="num text-[0.62rem]">{member.hours}</td>
                    <td>
                      <div className="flex w-16 items-center gap-1">
                        <Progress value={member.attendance} className="h-1" />
                        <span className="num text-[0.48rem]">{member.attendance}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn("num text-[0.6rem]", member.efficiency > 60 ? "text-success" : member.efficiency > 35 ? "text-warning" : "text-danger")}>
                        {member.efficiency}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SpotlightCard>

        <div className="space-y-4">
          <SpotlightCard className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
              <FileSpreadsheet className="size-4 text-primary-soft" /> قمع الاقتراحات
            </h2>
            <div className="space-y-2">
              {funnel.map((stage) => (
                <div key={stage.status}>
                  <div className="mb-1 flex items-center justify-between text-[0.6rem]">
                    <span className="text-muted">{FUNNEL_LABEL[stage.status] ?? stage.status}</span>
                    <span className="num">{stage.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-primary to-primary-2"
                      style={{ width: `${(stage.count / maxFunnel) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
              <Wallet className="size-4 text-warning" /> الميزانية مقابل المصروف
            </h2>
            <div className="space-y-3">
              {budget.slice(0, 5).map((project) => (
                <div key={project.code}>
                  <div className="mb-1 flex items-center justify-between text-[0.58rem]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="size-1.5 rounded-full" style={{ background: project.color }} />
                      {project.name}
                    </span>
                    <span className="num text-muted">{Math.round((project.spent / Math.max(1, project.budget)) * 100)}%</span>
                  </div>
                  <Progress value={(project.spent / Math.max(1, project.budget)) * 100} color={project.color} className="h-1.5" />
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
      </div>

      <SpotlightCard className="p-5">
        <h2 className="mb-3 font-display text-sm font-semibold">الالتزام بالحضور</h2>
        {mounted ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceByMeeting} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-code)" }} axisLine={false} tickLine={false} reversed />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 9 }} axisLine={false} tickLine={false} orientation="right" />
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, fontSize: 11 }}
                  cursor={{ fill: "rgba(124,92,255,0.05)" }}
                />
                <Legend wrapperStyle={{ fontSize: 10, color: "var(--muted)" }} />
                <Bar dataKey="present" name="حاضر" stackId="a" fill="#34D399" radius={[0, 0, 0, 0]} barSize={26} />
                <Bar dataKey="late" name="متأخر" stackId="a" fill="#FBBF24" barSize={26} />
                <Bar dataKey="excused" name="بعذر" stackId="a" fill="#94A3B8" barSize={26} />
                <Bar dataKey="absent" name="غائب" stackId="a" fill="#FB7185" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="skeleton h-64 w-full" />
        )}
      </SpotlightCard>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[0.55rem] text-muted">
        <span>تقرير تجريبي مبني على بيانات اللجنة الحالية · {new Date().toLocaleDateString("ar-EG")}</span>
        <span className="mono">TECTNAL ANALYTICS</span>
      </div>
    </div>
  );
}
