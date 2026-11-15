"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

const ttipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  fontSize: 11,
  color: "var(--fg)",
  padding: "8px 10px",
  boxShadow: "0 20px 40px -20px rgba(0,0,0,0.8)",
};

export function VelocityChart({ data }: { data: TrendPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="skeleton h-full w-full" />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.42} />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="deliveryStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#ffb86b" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-code)" }}
          axisLine={false}
          tickLine={false}
          reversed
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-code)" }}
          axisLine={false}
          tickLine={false}
          width={40}
          orientation="right"
        />
        <Tooltip
          contentStyle={ttipStyle}
          labelStyle={{ color: "var(--muted)", fontSize: 9, fontFamily: "var(--font-code)" }}
          formatter={(value, name) => [String(value), name === "value" ? "نشاط" : "التسليم"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#8b6bff"
          strokeWidth={2.2}
          fill="url(#velocityFill)"
          dot={false}
          activeDot={{ r: 4, fill: "#22d3ee", stroke: "none" }}
        />
        <Area
          type="monotone"
          dataKey="secondary"
          stroke="url(#deliveryStroke)"
          strokeWidth={1.4}
          strokeDasharray="4 5"
          fill="transparent"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const WORKLOAD_COLORS = ["#fb7185", "#fb923c", "#fbbf24", "#60a5fa"];

export function WorkloadChart({ data }: { data: TrendPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="skeleton h-full w-full" />;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex h-full items-center gap-3">
      <div className="relative h-full min-h-32 w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={4}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={WORKLOAD_COLORS[index % WORKLOAD_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={ttipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="num text-2xl font-semibold">{total}</div>
            <div className="text-[0.55rem] text-muted">مهمة مفتوحة</div>
          </div>
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((entry, index) => (
          <li key={entry.label} className="flex items-center gap-2 text-[0.68rem]">
            <span
              className="size-2 rounded-full"
              style={{ background: WORKLOAD_COLORS[index % WORKLOAD_COLORS.length], boxShadow: `0 0 8px ${WORKLOAD_COLORS[index % WORKLOAD_COLORS.length]}` }}
            />
            <span className="flex-1 text-muted">{entry.label}</span>
            <span className="num text-fg">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeliveryChart({ data }: { data: TrendPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="skeleton h-full w-full" />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="label"
          width={52}
          tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-code)" }}
          axisLine={false}
          tickLine={false}
          orientation="right"
        />
        <Tooltip contentStyle={ttipStyle} cursor={{ fill: "rgba(124,92,255,0.06)" }} formatter={(value) => [`${String(value)}%`, "الإنجاز"]} />
        <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={12}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.value > 66 ? "#34d399" : entry.value > 33 ? "#22d3ee" : "#fbbf24"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
