"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  MapPin,
  Save,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import type { MeetingView } from "@/lib/types";
import {
  ATTENDANCE_META,
  MEETING_STATUS_META,
  cn,
  formatDate,
  formatTime,
  relativeTime,
} from "@/lib/utils";
import { saveMeetingMinutes, toggleAttendance } from "@/server/actions";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpotlightCard } from "@/components/fx/spotlight-card";

export function MeetingsView({
  meetings,
  canAttendance,
  canMinutes,
}: {
  meetings: MeetingView[];
  canAttendance: boolean;
  canMinutes: boolean;
}) {
  const router = useRouter();
  const upcoming = meetings.filter((meeting) => meeting.status === "SCHEDULED" || meeting.status === "LIVE");
  const past = meetings.filter((meeting) => meeting.status === "COMPLETED").sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const [selectedId, setSelectedId] = useState(upcoming[0]?.id ?? past[0]?.id ?? meetings[0]?.id);
  const selected = meetings.find((meeting) => meeting.id === selectedId) ?? meetings[0];
  const [minutes, setMinutes] = useState(selected?.minutes ?? "");
  const [pending, startTransition] = useTransition();
  const [month, setMonth] = useState(() => {
    const base = selected ? new Date(selected.startsAt) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  function select(meeting: MeetingView) {
    setSelectedId(meeting.id);
    setMinutes(meeting.minutes);
    setMonth(new Date(new Date(meeting.startsAt).getFullYear(), new Date(meeting.startsAt).getMonth(), 1));
  }

  const days = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let index = 0; index < firstDay; index += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    return cells;
  }, [month]);

  const meetingByDay = useMemo(() => {
    const map = new Map<string, MeetingView[]>();
    for (const meeting of meetings) {
      const key = meeting.startsAt.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), meeting]);
    }
    return map;
  }, [meetings]);

  function updateAttendance(meeting: MeetingView, userId: string, status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED") {
    startTransition(async () => {
      try {
        await toggleAttendance(meeting.id, userId, status);
        toast.success("حُدّث الحضور");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر تحديث الحضور");
      }
    });
  }

  function saveMinutes() {
    if (!selected) return;
    startTransition(async () => {
      try {
        await saveMeetingMinutes(selected.id, minutes);
        toast.success("حُفظ المحضر");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر حفظ المحضر");
      }
    });
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="MEETINGS · 06"
        title="الاجتماعات والمحاضر"
        description="جدولة، حضور، قرارات — وكل قرار يتحول إلى مهمة."
        actions={
          <Badge tone="primary" className="py-1.5">
            <CalendarDays className="size-3" />
            {upcoming.length} اجتماع قادم
          </Badge>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="space-y-3">
          <SpotlightCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">{month.toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="السابق">
                  <ChevronRight className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="التالي">
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"].map((day) => (
                <div key={day} className="pb-1 text-center text-[0.5rem] text-muted">{day}</div>
              ))}
              {days.map((day, index) => {
                if (!day) return <div key={`e-${index}`} />;
                const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const list = meetingByDay.get(key) ?? [];
                const isToday = new Date().toDateString() === new Date(month.getFullYear(), month.getMonth(), day).toDateString();
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => list[0] && select(list[0])}
                    className={cn(
                      "relative grid aspect-square place-items-center rounded-lg border text-[0.6rem] transition",
                      isToday ? "border-primary/50 bg-primary/10 text-primary-soft" : "border-transparent text-muted hover:border-line hover:text-fg",
                      list.length > 0 && "border-line bg-[color-mix(in_oklab,var(--primary-2)_8%,transparent)]",
                    )}
                  >
                    {day}
                    {list.length > 0 ? <span className="absolute bottom-1 size-1 rounded-full bg-primary-2 shadow-[0_0_6px_var(--primary-2)]" /> : null}
                  </button>
                );
              })}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
              <Clock3 className="size-4 text-primary-soft" />
              القادمة
            </h3>
            <div className="space-y-2">
              {upcoming.length === 0 ? <p className="py-3 text-[0.62rem] text-muted">لا اجتماعات قادمة</p> : null}
              {upcoming.map((meeting) => (
                <button
                  key={meeting.id}
                  type="button"
                  onClick={() => select(meeting)}
                  className={cn(
                    "flex w-full gap-2.5 rounded-xl border p-2.5 text-start transition",
                    selectedId === meeting.id ? "border-primary/40 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]" : "border-line/60 hover:border-line",
                  )}
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-center">
                    <span className="num text-[0.78rem] font-semibold">{new Date(meeting.startsAt).getDate()}</span>
                    <span className="text-[0.4rem] text-muted">{formatDate(meeting.startsAt).split(" ")[1]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.68rem] font-medium">{meeting.title}</div>
                    <div className="mt-0.5 text-[0.52rem] text-muted">
                      {formatTime(meeting.startsAt)} · {meeting.durationMinutes} دقيقة
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="mb-2 mt-4 flex items-center gap-2 font-display text-sm font-semibold">
              <FileText className="size-4 text-muted" />
              المنتهية
            </h3>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {past.map((meeting) => (
                <button
                  key={meeting.id}
                  type="button"
                  onClick={() => select(meeting)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-start text-[0.62rem] transition",
                    selectedId === meeting.id ? "bg-white/5 text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <span className="truncate">{meeting.title}</span>
                  <span className="mono shrink-0 text-[0.48rem]">{formatDate(meeting.startsAt)}</span>
                </button>
              ))}
            </div>
          </SpotlightCard>
        </div>

        {selected ? (
          <div className="space-y-3">
            <SpotlightCard className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selected.status} />
                    <Badge>{selected.type}</Badge>
                    <span className="mono text-[0.55rem] text-muted">{relativeTime(selected.startsAt)}</span>
                  </div>
                  <h2 className="mt-2 font-display text-lg font-bold">{selected.title}</h2>
                  <p className="mt-1 max-w-2xl text-[0.68rem] leading-relaxed text-muted">{selected.description}</p>
                </div>
                {selected.meetUrl ? (
                  <a href={selected.meetUrl} target="_blank" rel="noreferrer" className="btn btn-primary h-9 text-[0.7rem]">
                    <Video className="size-3.5" />
                    الانضمام
                  </a>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  { label: "التاريخ", value: formatDate(selected.startsAt), icon: CalendarDays },
                  { label: "الوقت", value: `${formatTime(selected.startsAt)} — ${formatTime(selected.endsAt)}`, icon: Clock3 },
                  { label: "المكان", value: selected.location, icon: MapPin },
                  { label: "الحضور", value: `${selected.attendedCount}/${selected.totalMembers}`, icon: Users },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-line px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[0.5rem] text-muted">
                      <item.icon className="size-2.5" /> {item.label}
                    </div>
                    <div className="mt-0.5 truncate text-[0.65rem] font-medium">{item.value}</div>
                  </div>
                ))}
              </div>
            </SpotlightCard>

            <Tabs defaultValue="agenda">
              <TabsList>
                <TabsTrigger value="agenda">جدول الأعمال</TabsTrigger>
                <TabsTrigger value="attendance">الحضور ({selected.attendedCount})</TabsTrigger>
                <TabsTrigger value="minutes">المحضر</TabsTrigger>
              </TabsList>

              <TabsContent value="agenda">
                <SpotlightCard className="p-5">
                  {selected.agenda.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted">لا بنود لهذا الاجتماع.</p>
                  ) : (
                    <ol className="space-y-3">
                      {selected.agenda.map((item, index) => (
                        <li key={item.id} className="flex gap-3">
                          <span className="mono grid size-6 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[0.55rem] text-primary-soft">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1 border-b border-line/50 pb-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[0.72rem] font-medium">{item.title}</span>
                              <span className="num text-[0.52rem] text-muted">{item.duration} د</span>
                            </div>
                            {item.notes ? <p className="mt-0.5 text-[0.6rem] text-muted">{item.notes}</p> : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </SpotlightCard>
              </TabsContent>

              <TabsContent value="attendance">
                <SpotlightCard className="p-4">
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {selected.attendance.length === 0 ? (
                      <p className="col-span-2 py-6 text-center text-xs text-muted">لم يُسجَّل الحضور بعد.</p>
                    ) : (
                      selected.attendance.map((record) => {
                        const meta = ATTENDANCE_META[record.status];
                        return (
                          <div key={record.member.id} className="flex items-center gap-2 rounded-lg border border-line/60 px-2.5 py-2">
                            <Avatar name={record.member.name} hue={record.member.avatarHue} size="xs" />
                            <span className="min-w-0 flex-1 truncate text-[0.65rem]">{record.member.name}</span>
                            {canAttendance ? (
                              <select
                                value={record.status}
                                onChange={(event) =>
                                  updateAttendance(selected, record.member.id, event.target.value as "PRESENT" | "LATE" | "ABSENT" | "EXCUSED")
                                }
                                className="rounded-md border border-line bg-[var(--surface-2)] px-1.5 py-0.5 text-[0.55rem]"
                                style={{ color: meta.color }}
                                aria-label={`حضور ${record.member.name}`}
                              >
                                {Object.entries(ATTENDANCE_META).map(([key, value]) => (
                                  <option key={key} value={key}>
                                    {value.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="chip text-[0.5rem]" style={{ color: meta.color }}>{meta.label}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </SpotlightCard>
              </TabsContent>

              <TabsContent value="minutes">
                <SpotlightCard className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                      <ClipboardList className="size-4 text-primary-soft" />
                      محضر الاجتماع
                    </h3>
                    {canMinutes ? (
                      <Button size="sm" onClick={saveMinutes} loading={pending} disabled={minutes === selected.minutes}>
                        <Save className="size-3.5" />
                        حفظ المحضر
                      </Button>
                    ) : null}
                  </div>
                  {canMinutes ? (
                    <textarea
                      value={minutes}
                      onChange={(event) => setMinutes(event.target.value)}
                      rows={14}
                      placeholder="اكتب المحضر هنا: الحضور، النقاش، القرارات، والمهام المترتبة…"
                      className="field min-h-64 leading-relaxed"
                    />
                  ) : (
                    <div className="tectnal-prose whitespace-pre-line rounded-xl border border-line p-4 text-[0.72rem]">
                      {selected.minutes || "لم يُحرَّر المحضر بعد."}
                    </div>
                  )}
                  {selected.agenda.length > 0 ? (
                    <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-[0.6rem] text-muted">
                      <span className="flex items-center gap-1 text-primary-soft">
                        <Check className="size-3" /> قرارات مقترحة
                      </span>
                      <p className="mt-1">
                        حوّل كل قرار إلى مهمة من قسم المهام — هذا يضمن ألا يبقى القرار نصاً فقط.
                      </p>
                    </div>
                  ) : null}
                </SpotlightCard>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </div>
  );
}
