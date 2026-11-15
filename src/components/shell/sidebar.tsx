"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, Menu, Sparkles, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { NAV_SECTIONS, APP, type NavItem } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useUI } from "@/hooks/use-command-palette";
import { useI18n } from "@/components/providers/language-provider";
import { RoleIcon } from "@/lib/icons";
import { Avatar } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/ui/progress";
import type { MemberLite } from "@/lib/types";

interface SidebarProps {
  user: MemberLite;
  points: number;
  level: number;
  permissions: string[];
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ user, points, level, permissions }: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useUI((state) => state.sidebarCollapsed);
  const toggleSidebar = useUI((state) => state.toggleSidebar);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();

  const sections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => hasPermission(permissions, item.permission)),
      })).filter((section) => section.items.length > 0),
    [permissions],
  );

  const nextLevelPoints = 400;
  const levelProgress = ((points % nextLevelPoints) / nextLevelPoints) * 100;

  return (
    <>
      {/* mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-20 end-4 z-40 grid size-12 place-items-center rounded-2xl border border-line bg-[var(--surface-2)] text-fg shadow-xl lg:hidden"
        aria-label={t("menu")}
      >
        <Menu className="size-5" />
      </button>

      <aside
        className={cn(
          "fixed inset-y-3 end-3 z-40 hidden flex-col overflow-hidden rounded-[1.6rem] border border-line bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] backdrop-blur-2xl lg:flex",
          "shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]",
        )}
        style={{ width: collapsed ? "82px" : "248px", transition: "width 0.35s cubic-bezier(0.22,1,0.36,1)" }}
        aria-label="التنقل الرئيسي"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_65%)]" />

        <div className={cn("flex items-center gap-3 px-4 pb-4 pt-5", collapsed && "justify-center px-2")}>
          <Link href="/dashboard" className="group relative grid size-10 shrink-0 place-items-center" aria-label={APP.name}>
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 to-primary-2/25 opacity-80 blur-[6px] transition group-hover:opacity-100" />
            <span className="relative grid size-10 place-items-center rounded-2xl border border-white/15 bg-[var(--surface)] font-display text-lg font-bold text-gradient">
              ت
            </span>
          </Link>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tracking-wide">{APP.name}</div>
              <div className="truncate text-[0.58rem] text-muted">لجنة التقنية</div>
            </div>
          ) : null}
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-2.5 pb-2">
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              {!collapsed ? <div className="kicker mb-2 px-2 text-[0.55rem]">{section.title}</div> : <div className="mx-auto mb-2 h-px w-6 bg-line" />}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className={cn("nav-item", collapsed && "justify-center px-0")}
                        data-active={active}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className={cn("size-[18px] shrink-0", active ? "text-primary-2" : "")} />
                        {!collapsed ? (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.shortcut ? (
                              <kbd className="mono hidden rounded border border-line px-1 py-0.5 text-[0.55rem] text-muted/70 xl:inline-block">
                                {item.shortcut}
                              </kbd>
                            ) : null}
                          </>
                        ) : null}
                        {active ? (
                          <motion.span
                            layoutId="nav-active"
                            className="pointer-events-none absolute inset-0 -z-10 rounded-[0.9rem]"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-line p-3">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl p-2 transition hover:bg-[color-mix(in_oklab,var(--fg)_5%,transparent)]",
              collapsed && "justify-center",
            )}
          >
            <ProgressRing
              value={levelProgress}
              size={collapsed ? 38 : 44}
              stroke={4}
              color={user.role.color}
            >
              <span className="mono text-[0.62rem] font-semibold">{level}</span>
            </ProgressRing>
            {!collapsed ? (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold" style={{ color: user.role.color }}>
                  <RoleIcon icon={user.role.icon} className="size-3.5" />
                  {user.role.name}
                </div>
                <div className="mono text-[0.6rem] text-muted">{points.toLocaleString("en-US")} نقطة</div>
              </div>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              "mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[0.65rem] text-muted transition hover:bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] hover:text-fg",
              collapsed && "justify-center",
            )}
            aria-label={collapsed ? t("expand") : t("collapse")}
          >
            {collapsed ? <ChevronsLeft className="size-4" /> : <ChevronsRight className="size-4" />}
            {!collapsed ? <span>{t("collapse")}</span> : null}
          </button>
        </div>
      </aside>

      {/* mobile drawer */}
      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed inset-y-0 end-0 z-50 flex w-[82%] max-w-sm flex-col border-s border-line bg-[var(--surface)] p-4 data-[state=open]:animate-[rise_0.3s_ease]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar name={user.name} hue={user.avatarHue} size="sm" ring={user.role.color} />
                <div>
                  <div className="text-xs font-semibold">{user.name}</div>
                  <div className="text-[0.6rem] text-muted">{user.role.name}</div>
                </div>
              </div>
              <DialogPrimitive.Close className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white/5">
                <X className="size-4" />
                <span className="sr-only">{t("close")}</span>
              </DialogPrimitive.Close>
            </div>
            <nav className="no-scrollbar flex-1 overflow-y-auto">
              {sections.map((section) => (
                <div key={section.title} className="mb-4">
                  <div className="kicker mb-2 text-[0.55rem]">{section.title}</div>
                  <ul className="space-y-1">
                    {section.items.map((item: NavItem) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="nav-item"
                          data-active={isActive(pathname, item.href)}
                        >
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="rounded-xl border border-line bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] p-3 text-[0.65rem] text-muted">
              <Sparkles className="mb-1 size-3.5 text-primary-soft" />
              {APP.tagline}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

export function MobileNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const items: NavItem[] = [];
  const seen = new Set<string>();
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (["dashboard", "projects", "tasks", "members", "comms"].includes(item.key) && !seen.has(item.key)) {
        if (hasPermission(permissions, item.permission)) {
          items.push(item);
          seen.add(item.key);
        }
      }
    }
  }

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-line bg-[color-mix(in_oklab,var(--surface)_82%,transparent)] p-1.5 backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[0.58rem] transition",
              active ? "text-fg" : "text-muted",
            )}
          >
            {active ? (
              <motion.span
                layoutId="mobile-active"
                className="absolute inset-0 -z-10 rounded-xl bg-[color-mix(in_oklab,var(--primary)_18%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_30%,transparent)]"
              />
            ) : null}
            <item.icon className={cn("size-[18px]", active && "text-primary-2")} />
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
