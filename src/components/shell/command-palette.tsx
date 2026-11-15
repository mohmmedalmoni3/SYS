"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  CheckSquare,
  Command,
  CornerDownLeft,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Moon,
  Search,
  Sun,
  User,
  Users,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useI18n } from "@/components/providers/language-provider";
import { ALL_NAV_ITEMS } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export interface PaletteItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
  color: string;
}

const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  page: { label: "الصفحات", icon: LayoutDashboard },
  project: { label: "المشاريع", icon: FolderKanban },
  task: { label: "المهام", icon: CheckSquare },
  member: { label: "الأعضاء", icon: User },
  proposal: { label: "الاقتراحات", icon: Lightbulb },
  article: { label: "مركز المعرفة", icon: FileText },
  meeting: { label: "الاجتماعات", icon: CalendarDays },
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u0652]/g, "")
    .trim();
}

export function CommandPalette({
  items,
  permissions,
}: {
  items: PaletteItem[];
  permissions: string[];
}) {
  const { open, setOpen, toggle } = useCommandPalette();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useHotkeys({
    "mod+k": toggle,
    "/": () => setOpen(true),
    escape: () => setOpen(false),
  });

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    } else {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const pages: PaletteItem[] = useMemo(
    () =>
      ALL_NAV_ITEMS.filter((item) => hasPermission(permissions, item.permission)).map((item) => ({
        id: `page-${item.key}`,
        type: "page",
        title: item.label,
        subtitle: item.labelEn,
        href: item.href,
        color: "var(--primary-soft)",
      })),
    [permissions],
  );

  const results = useMemo(() => {
    const normalized = normalize(query);
    const pool = [...pages, ...items];
    if (!normalized) {
      return {
        pages: pages.slice(0, 5),
        grouped: [] as { type: string; entries: PaletteItem[] }[],
        flat: pages.slice(0, 5),
      };
    }
    const matched = pool.filter(
      (item) =>
        normalize(item.title).includes(normalized) ||
        normalize(item.subtitle).includes(normalized) ||
        normalize(item.type).includes(normalized),
    );
    const groups = new Map<string, PaletteItem[]>();
    for (const item of matched) {
      const list = groups.get(item.type) ?? [];
      if (list.length < 5) list.push(item);
      groups.set(item.type, list);
    }
    const grouped = Array.from(groups.entries()).map(([type, entries]) => ({ type, entries }));
    return { pages: [], grouped, flat: grouped.flatMap((group) => group.entries) };
  }, [query, pages, items]);

  const flat = results.flat;

  const run = (item: PaletteItem) => {
    setOpen(false);
    router.push(item.href);
  };

  const actions = [
    {
      id: "action-theme",
      label: resolvedTheme === "light" ? "التبديل إلى المظهر الداكن" : "التبديل إلى المظهر الفاتح",
      icon: resolvedTheme === "light" ? Moon : Sun,
      run: () => {
        setTheme(resolvedTheme === "light" ? "dark" : "light");
        setOpen(false);
      },
    },
    {
      id: "action-tasks",
      label: "فتح لوحة مهامي",
      icon: CheckSquare,
      run: () => {
        setOpen(false);
        router.push("/tasks");
      },
    },
    {
      id: "action-members",
      label: "استعراض أعضاء اللجنة",
      icon: Users,
      run: () => {
        setOpen(false);
        router.push("/members");
      },
    },
  ];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[rgba(3,4,12,0.7)] backdrop-blur-md data-[state=open]:animate-[rise_0.15s_ease]" />
        <DialogPrimitive.Content
          className="glass fixed left-1/2 top-[8vh] z-[71] w-[min(94vw,640px)] -translate-x-1/2 overflow-hidden rounded-[1.3rem] p-0 data-[state=open]:animate-[rise_0.25s_cubic-bezier(0.22,1,0.36,1)]"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{t("commandPalette")}</DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Search className="size-4 text-primary-2" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((current) => (flat.length === 0 ? 0 : (current + 1) % flat.length));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((current) => (flat.length === 0 ? 0 : (current - 1 + flat.length) % flat.length));
                } else if (event.key === "Enter" && flat[active]) {
                  event.preventDefault();
                  run(flat[active]);
                }
              }}
              placeholder={t("searchHint")}
              className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted/70"
              aria-label={t("search")}
            />
            <kbd className="mono rounded border border-line px-1.5 py-0.5 text-[0.55rem] text-muted">ESC</kbd>
          </div>

          <div ref={listRef} className="max-h-[56vh] overflow-y-auto p-2">
            {query.length === 0 ? (
              <>
                <div className="px-2 py-2">
                  <div className="kicker mb-2 text-[0.52rem]">{t("quickActions")}</div>
                  <div className="space-y-0.5">
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={action.run}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-xs text-muted transition hover:bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] hover:text-fg"
                      >
                        <action.icon className="size-3.5" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-2 py-2">
                  <div className="kicker mb-2 text-[0.52rem]">{t("navigate")}</div>
                  <div className="space-y-0.5">
                    {results.pages.map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => run(page)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-xs text-muted transition hover:bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] hover:text-fg"
                      >
                        <LayoutDashboard className="size-3.5" />
                        <span className="flex-1">{page.title}</span>
                        <span className="text-[0.6rem] text-muted/60">{page.subtitle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : results.flat.length === 0 ? (
              <div className="px-4 py-12 text-center text-xs text-muted">{t("noResults")}</div>
            ) : (
              results.grouped.map((group) => {
                const meta = TYPE_META[group.type] ?? TYPE_META.page;
                return (
                  <div key={group.type} className="mb-1">
                    <div className="kicker px-2.5 py-1.5 text-[0.52rem]">{meta.label}</div>
                    {group.entries.map((entry) => {
                      const index = flat.indexOf(entry);
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onMouseEnter={() => setActive(index)}
                          onClick={() => run(entry)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition",
                            index === active
                              ? "bg-[color-mix(in_oklab,var(--primary)_18%,transparent)] text-fg"
                              : "text-muted hover:text-fg",
                          )}
                        >
                          <span
                            className="grid size-6 shrink-0 place-items-center rounded-md"
                            style={{ background: `color-mix(in oklab, ${entry.color} 18%, transparent)`, color: entry.color }}
                          >
                            <meta.icon className="size-3" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[0.74rem]">{entry.title}</span>
                            <span className="block truncate text-[0.58rem] text-muted/70">{entry.subtitle}</span>
                          </span>
                          <ArrowLeft className="size-3 opacity-40" />
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[0.58rem] text-muted">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <CornerDownLeft className="size-3" /> {t("open")}
              </span>
              <span className="flex items-center gap-1">
                <Command className="size-3" /> K
              </span>
            </span>
            <span className="mono">TECTNAL · {items.length + pages.length}</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
