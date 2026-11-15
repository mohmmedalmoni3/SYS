"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  CheckCheck,
  Hash,
  Lock,
  Megaphone,
  MessageSquare,
  Pin,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { AnnouncementView, ChannelView, NotificationView } from "@/lib/types";
import { cn, formatDate, formatTime, relativeTime } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead, sendMessage } from "@/server/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpotlightCard } from "@/components/fx/spotlight-card";

const NOTIFICATION_TONE: Record<string, string> = {
  INFO: "#60A5FA",
  SUCCESS: "#34D399",
  WARNING: "#FBBF24",
  DANGER: "#FB7185",
  MENTION: "#A78BFA",
  ASSIGNMENT: "#22D3EE",
  DEADLINE: "#FFB86B",
};

export function CommsView({
  channels,
  announcements,
  notifications: initialNotifications,
  currentUserId,
  canAnnounce,
}: {
  channels: ChannelView[];
  announcements: AnnouncementView[];
  notifications: NotificationView[];
  currentUserId: string;
  canAnnounce: boolean;
}) {
  const router = useRouter();
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [messages, setMessages] = useState(channels[0]?.messages ?? []);
  const [draft, setDraft] = useState("");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const activeChannel = useMemo(() => channels.find((channel) => channel.id === channelId), [channels, channelId]);
  const unread = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const channel = channels.find((item) => item.id === channelId);
    setMessages(channel?.messages ?? []);
  }, [channelId, channels]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function send() {
    const body = draft.trim();
    if (!body || !activeChannel) return;
    const temporary = {
      id: `tmp-${Date.now()}`,
      body,
      author: { id: currentUserId, name: "أنت", title: "", avatarHue: 265, role: { id: "me", name: "أنا", nameEn: "Me", color: "#7C5CFF", icon: "user", level: 1 } },
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, temporary]);
    setDraft("");
    startTransition(async () => {
      try {
        await sendMessage(activeChannel.id, body);
        router.refresh();
      } catch (error) {
        setMessages((current) => current.filter((message) => message.id !== temporary.id));
        setDraft(body);
        toast.error(error instanceof Error ? error.message : "تعذّر إرسال الرسالة");
      }
    });
  }

  async function readAll() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    await markAllNotificationsRead();
    router.refresh();
  }

  async function readOne(notification: NotificationView) {
    setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
    await markNotificationRead(notification.id);
    if (notification.href) router.push(notification.href);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="COMMS · 10"
        title="مركز التواصل"
        description="إعلانات رسمية، قنوات الفريق، ومركز إشعارات واحد — بلا تشتت."
        actions={
          <Badge tone={unread > 0 ? "danger" : "success"} className="py-1.5">
            <BellRing className="size-3" />
            {unread} غير مقروء
          </Badge>
        }
      />

      <Tabs defaultValue="announcements">
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger value="announcements">الإعلانات</TabsTrigger>
          <TabsTrigger value="channels">القنوات</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات ({unread})</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="space-y-3">
          {announcements.map((announcement) => (
            <SpotlightCard key={announcement.id} className="p-5">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl"
                  style={{
                    background: `color-mix(in oklab, ${announcement.priority === "CRITICAL" ? "#FB7185" : "#7C5CFF"} 14%, transparent)`,
                    color: announcement.priority === "CRITICAL" ? "#FB7185" : "#A78BFA",
                  }}
                >
                  <Megaphone className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {announcement.pinned ? <Badge tone="primary" className="text-[0.5rem]"><Pin className="size-2.5" /> مثبّت</Badge> : null}
                    <h3 className="font-display text-sm font-semibold">{announcement.title}</h3>
                    <span className="mono ms-auto text-[0.52rem] text-muted">{relativeTime(announcement.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-[0.68rem] leading-relaxed text-muted">{announcement.body}</p>
                  <div className="mt-2.5 flex items-center gap-2 text-[0.55rem] text-muted">
                    <Avatar name={announcement.author.name} hue={announcement.author.avatarHue} size="xs" />
                    {announcement.author.name} · {formatDate(announcement.createdAt)}
                  </div>
                </div>
              </div>
            </SpotlightCard>
          ))}
          {canAnnounce ? (
            <Button variant="ghost" size="sm" onClick={() => toast.info("نشر إعلان جديد متاح للمشرفين")}>
              <Megaphone className="size-3.5" /> نشر إعلان
            </Button>
          ) : null}
        </TabsContent>

        <TabsContent value="channels">
          <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
            <SpotlightCard className="p-2">
              <div className="mb-2 px-2 pt-1 text-[0.55rem] text-muted">قنوات الفريق</div>
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setChannelId(channel.id)}
                  className={cn(
                    "mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-[0.66rem] transition",
                    channelId === channel.id ? "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {channel.isPrivate ? <Lock className="size-3" /> : <Hash className="size-3" />}
                  <span className="min-w-0 flex-1 truncate">{channel.name}</span>
                  <span className="num text-[0.5rem]">{channel.memberCount}</span>
                </button>
              ))}
              <div className="mt-2 flex items-center gap-1.5 px-2 py-1 text-[0.5rem] text-muted">
                <Users className="size-3" /> {activeChannel?.memberCount ?? 0} عضواً في القناة
              </div>
            </SpotlightCard>

            <SpotlightCard className="flex h-[540px] flex-col p-0">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-[0.72rem] font-semibold">
                    {activeChannel?.isPrivate ? <Lock className="size-3" /> : <Hash className="size-3" />}
                    {activeChannel?.name}
                  </div>
                  <div className="text-[0.52rem] text-muted">{activeChannel?.description}</div>
                </div>
                <span className="chip text-[0.5rem]"><span className="live-dot" /> مباشر</span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => {
                  const own = message.author.id === currentUserId;
                  return (
                    <div key={message.id} className={cn("flex gap-2", own && "flex-row-reverse")}>
                      <Avatar name={message.author.name} hue={message.author.avatarHue} size="xs" />
                      <div className={cn("max-w-[78%]", own && "text-end")}>
                        <div className={cn("flex items-center gap-2", own && "flex-row-reverse")}>
                          <span className="text-[0.58rem] font-medium">{message.author.name}</span>
                          <span className="mono text-[0.46rem] text-muted">{formatTime(message.createdAt)}</span>
                        </div>
                        <div
                          className={cn(
                            "mt-1 whitespace-pre-line rounded-xl px-3 py-2 text-start text-[0.66rem] leading-relaxed",
                            own
                              ? "bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] text-fg"
                              : "border border-line bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] text-fg/90",
                          )}
                        >
                          {message.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-line p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder={`رسالة إلى #${activeChannel?.name ?? ""}…`}
                    className="field max-h-24 flex-1 resize-none py-2 text-[0.7rem]"
                  />
                  <Button size="icon" onClick={send} loading={pending} aria-label="إرسال">
                    <Send className="size-4" />
                  </Button>
                </div>
                <p className="mt-1 text-[0.48rem] text-muted/70">Enter للإرسال · Shift+Enter لسطر جديد</p>
              </div>
            </SpotlightCard>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <SpotlightCard className="p-2">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="flex items-center gap-1.5 text-[0.7rem] font-medium">
                <Bell className="size-3.5" /> كل الإشعارات
              </span>
              <button type="button" onClick={readAll} className="flex items-center gap-1 text-[0.6rem] text-primary-soft hover:underline">
                <CheckCheck className="size-3" /> تعليم الكل كمقروء
              </button>
            </div>
            <div className="divide-y divide-line/50">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => readOne(notification)}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-3 py-2.5 text-start transition hover:bg-white/[0.03]",
                    !notification.read && "bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]",
                  )}
                >
                  <span
                    className="mt-1 size-1.5 shrink-0 rounded-full"
                    style={{
                      background: NOTIFICATION_TONE[notification.type] ?? "var(--muted)",
                      boxShadow: `0 0 8px ${NOTIFICATION_TONE[notification.type] ?? "transparent"}`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.68rem] font-medium">{notification.title}</span>
                      <span className="mono ms-auto text-[0.48rem] text-muted">{relativeTime(notification.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-[0.6rem] leading-relaxed text-muted">{notification.body}</p>
                  </div>
                  <MessageSquare className="mt-1 size-3 shrink-0 text-muted/40" />
                </button>
              ))}
              {notifications.length === 0 ? <p className="py-10 text-center text-xs text-muted">لا إشعارات.</p> : null}
            </div>
          </SpotlightCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
