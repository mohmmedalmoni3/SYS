"use client";

import type { CSSProperties } from "react";
import { Sidebar, MobileNav } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette, type PaletteItem } from "./command-palette";
import { useUI } from "@/hooks/use-command-palette";
import { PageTransition } from "@/components/fx/page-transition";
import type { MemberLite, NotificationView } from "@/lib/types";

interface AppShellProps {
  user: MemberLite & { email: string; level: number };
  points: number;
  permissions: string[];
  notifications: NotificationView[];
  searchItems: PaletteItem[];
  children: React.ReactNode;
}

export function AppShell({ user, points, permissions, notifications, searchItems, children }: AppShellProps) {
  const collapsed = useUI((state) => state.sidebarCollapsed);

  return (
    <div
      className="relative min-h-screen"
      style={{ "--sb": collapsed ? "82px" : "248px" } as CSSProperties}
    >
      <Sidebar user={user} points={points} level={user.level} permissions={permissions} />

      <div className="transition-[padding] duration-300 lg:pe-[calc(var(--sb)+28px)]">
        <Topbar user={user} notifications={notifications} />
        <main className="mx-auto w-full max-w-[1560px] px-3 pb-32 pt-1 lg:px-5 lg:pb-12">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <MobileNav permissions={permissions} />
      <CommandPalette items={searchItems} permissions={permissions} />
    </div>
  );
}
