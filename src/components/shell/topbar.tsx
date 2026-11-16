"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Command,
  Globe,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { formatTime, formatWeekday, relativeTime } from "@/lib/utils";
import type { MemberLite, NotificationView } from "@/lib/types";
import { ALL_NAV_ITEMS } from "@/lib/navigation";
import { markAllNotificationsRead, markNotificationRead } from "@/server/actions";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useRealtime } from "@/hooks/use-realtime";
import { useSoundFx } from "@/hooks/use-sound-fx";
import { useI18n } from "@/components/providers/language-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NOTIFICATION_ICON: Record<string, string> = {
  INFO: "#60A5FA",
  SUCCESS: "#34D399",
  WARNING: "#FBBF24",
  DANGER: "#FB7185",
  MENTION: "#A78BFA",
  ASSIGNMENT: "#22D3EE",
  DEADLINE: "#FFB86B",
};

export function Topbar({
  user,
  notifications: initialNotifications,
}: {
  user: MemberLite & { email: string; level: number };
  notifications: NotificationView[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useCommandPalette();
  const palette = useCommandPalette();
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, t, toggleLocale } = useI18n();
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundFx();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useRealtime(() => router.refresh(), { intervalMs: 45_000 });

  const unread = notifications.filter((notification) => !notification.read).length;

  const title = useMemo(() => {
    const item = ALL_NAV_ITEMS.find(
      (navItem) => pathname === navItem.href || pathname.startsWith(`${navItem.href}/`),
    );
    if (!item) return t("dashboard");
    return locale === "ar" ? item.label : item.labelEn;
  }, [pathname, locale, t]);

  async function markAll() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    await markAllNotificationsRead();
    router.refresh();
  }

  async function openNotification(notification: NotificationView) {
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    );
    if (notification.href) router.push(notification.href);
    await markNotificationRead(notification.id);
  }

  return (
    <header className="sticky top-3 z-30 mb-5 px-3 lg:px-0">
      <div className="glass flex min-h-14 items-center gap-1.5 rounded-2xl px-2.5 py-2 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.9)] sm:gap-2.5 sm:px-3 lg:min-h-16 lg:gap-3">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          <span className="hidden size-1.5 rounded-full bg-primary-2 shadow-[0_0_10px_var(--primary-2)] sm:block" />
          <div className="min-w-0 max-w-[6.5rem] sm:max-w-[9rem] lg:max-w-[12rem]">
            <div className="kicker hidden text-[0.5rem] tracking-[0.18em] xl:block">WORKSPACE</div>
            <h2 className="truncate font-display text-[0.78rem] font-semibold sm:text-sm">{title}</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => palette.setOpen(true)}
          className="flex size-9 min-w-9 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] px-0 text-[0.72rem] text-muted transition hover:border-[color-mix(in_oklab,var(--primary)_40%,transparent)] hover:text-fg sm:h-10 sm:justify-start sm:px-3 lg:max-w-[36rem]"
          aria-label={t("search")}
        >
          <Search className="size-3.5" />
          <span className="hidden min-w-0 flex-1 truncate text-start sm:block">{t("search")}</span>
          <kbd className="mono ms-auto hidden items-center gap-0.5 rounded-md border border-line px-1.5 py-0.5 text-[0.55rem] sm:flex">
            <Command className="size-2.5" />K
          </kbd>
        </button>

        <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-line bg-[color-mix(in_oklab,var(--fg)_3%,transparent)] px-2.5 py-2 xl:flex">
          <span className="live-dot" />
          <span className="mono text-[0.62rem] text-muted">
            {mounted && now ? `${formatWeekday(now)} · ${formatTime(now)}` : "--:--"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-line bg-[color-mix(in_oklab,var(--fg)_3%,transparent)] p-0.5 sm:gap-1 sm:p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLocale}
            aria-label={t("language")}
            className="relative hidden size-8 rounded-lg sm:inline-flex"
          >
            <Globe className="size-4" />
            <span className="mono absolute -bottom-0.5 text-[0.45rem]">{locale.toUpperCase()}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label={t("theme")}
            className="size-8 rounded-lg"
          >
            {mounted && resolvedTheme === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            aria-label="أصوات الواجهة"
            className="hidden size-8 rounded-lg sm:inline-flex"
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative grid size-9 shrink-0 place-items-center rounded-xl border border-transparent text-muted transition hover:border-line hover:bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] hover:text-fg"
              aria-label={t("notifications")}
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.55rem] font-bold text-white shadow-[0_0_10px_var(--danger)]">
                  {unread}
                </span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[340px] p-0">
            <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
              <span className="text-xs font-semibold">{t("notifications")}</span>
              <button
                type="button"
                onClick={markAll}
                className="flex items-center gap-1 text-[0.62rem] text-primary-soft hover:underline"
              >
                <CheckCheck className="size-3" />
                {t("markAllRead")}
              </button>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[0.7rem] text-muted">{t("noNotifications")}</div>
              ) : (
                notifications.slice(0, 8).map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={cn(
                      "flex w-full items-start gap-2.5 border-b border-line/50 px-3 py-2.5 text-start transition last:border-0 hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)]",
                      !notification.read && "bg-[color-mix(in_oklab,var(--primary)_6%,transparent)]",
                    )}
                  >
                    <span
                      className="mt-1 size-1.5 shrink-0 rounded-full"
                      style={{
                        background: NOTIFICATION_ICON[notification.type] ?? "var(--muted)",
                        boxShadow: `0 0 8px ${NOTIFICATION_ICON[notification.type] ?? "transparent"}`,
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.72rem] font-medium">{notification.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[0.64rem] leading-relaxed text-muted">
                        {notification.body}
                      </span>
                      <span className="mono mt-1 block text-[0.55rem] text-muted/70">
                        {relativeTime(notification.createdAt)}
                      </span>
                    </span>
                    {!notification.read ? <span className="mt-2 size-1.5 rounded-full bg-primary-2" /> : null}
                  </button>
                ))
              )}
            </div>
            <Link
              href="/comms"
              className="block border-t border-line px-3 py-2 text-center text-[0.65rem] text-muted transition hover:text-fg"
            >
              {t("viewAll")}
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-line bg-[color-mix(in_oklab,var(--fg)_3%,transparent)] py-1 pe-2.5 ps-1.5 transition hover:border-line-strong"
              aria-label={t("profile")}
            >
              <Avatar name={user.name} hue={user.avatarHue} size="sm" ring={user.role.color} />
              <span className="hidden text-start lg:block">
                <span className="block max-w-24 truncate text-[0.68rem] font-semibold">{user.name.split(" ")[0]}</span>
                <span className="block text-[0.55rem]" style={{ color: user.role.color }}>
                  {user.role.name}
                </span>
              </span>
              <ChevronDown className="hidden size-3 text-muted sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/members/${user.id}`)}>
              <User className="size-3.5" /> {t("profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="size-3.5" /> {t("settings")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/achievements")}>
              <Zap className="size-3.5" /> {t("achievements")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              {resolvedTheme === "light" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
              {t("theme")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleLocale}>
              <Globe className="size-3.5" /> {locale === "ar" ? "English" : "العربية"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger"
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
            >
              <LogOut className="size-3.5" /> {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open ? <span className="sr-only" aria-live="polite">لوحة الأوامر مفتوحة</span> : null}
    </header>
  );
}
