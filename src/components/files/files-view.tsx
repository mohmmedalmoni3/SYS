"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  Download,
  File,
  FileImage,
  FileText,
  Film,
  Folder,
  FolderOpen,
  Grid2X2,
  HardDrive,
  Link2,
  List,
  Palette,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { AssetView } from "@/lib/types";
import { cn, formatDate, formatFileSize } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SpotlightCard } from "@/components/fx/spotlight-card";

const KIND_ICON = {
  document: FileText,
  image: FileImage,
  video: Film,
  archive: Archive,
  design: Palette,
  link: Link2,
} as const;

const KIND_LABEL: Record<string, string> = {
  document: "مستند",
  image: "صورة",
  video: "فيديو",
  archive: "أرشيف",
  design: "تصميم",
  link: "رابط",
};

export function FilesView({
  folders,
  assets,
  canUpload,
}: {
  folders: { id: string; name: string; color: string; fileCount: number }[];
  assets: AssetView[];
  canUpload: boolean;
}) {
  const [folderId, setFolderId] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<AssetView | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (folderId !== "ALL" && asset.folderId !== folderId) return false;
      if (!normalized) return true;
      return asset.name.toLowerCase().includes(normalized) || asset.uploader.name.includes(normalized);
    });
  }, [assets, folderId, query]);

  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
  const activeFolder = folders.find((folder) => folder.id === folderId);

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="FILES · 09"
        title="مدير الملفات"
        description="مستندات، تصاميم، وأرشيف اللجنة — منظمة في مجلدات بصلاحيات واضحة."
        actions={
          canUpload ? (
            <Button
              size="sm"
              className="btn-shimmer"
              onClick={() => toast.info("رفع الملفات جاهز للتوصيل بـ UploadThing/S3 — استخدم متغيرات البيئة.")}
            >
              <Upload className="size-3.5" />
              رفع ملف
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          <SpotlightCard className="p-3">
            <button
              type="button"
              onClick={() => setFolderId("ALL")}
              className={cn(
                "mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-[0.68rem] transition",
                folderId === "ALL" ? "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-fg" : "text-muted hover:text-fg",
              )}
            >
              <HardDrive className="size-3.5" />
              <span className="flex-1">كل الملفات</span>
              <span className="num text-[0.55rem]">{assets.length}</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setFolderId(folder.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-[0.68rem] transition",
                  folderId === folder.id ? "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-fg" : "text-muted hover:text-fg",
                )}
              >
                {folderId === folder.id ? (
                  <FolderOpen className="size-3.5" style={{ color: folder.color }} />
                ) : (
                  <Folder className="size-3.5" />
                )}
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                <span className="num text-[0.55rem]">{folder.fileCount}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => toast.info("إنشاء مجلد جديد متاح للمشرفين")}
              className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-line px-2.5 py-2 text-[0.62rem] text-muted transition hover:text-fg"
            >
              <Plus className="size-3.5" />
              مجلد جديد
            </button>
          </SpotlightCard>

          <SpotlightCard className="p-4">
            <div className="flex items-center gap-2 text-[0.62rem] text-muted">
              <HardDrive className="size-3.5" />
              مساحة التخزين
            </div>
            <div className="num mt-2 text-sm font-semibold">{formatFileSize(totalSize)}</div>
            <Progress value={Math.min(100, (totalSize / (5 * 1024 * 1024 * 1024)) * 100)} className="mt-2" />
            <p className="mt-1.5 text-[0.52rem] text-muted">من 5 جيجابايت متاحة</p>
          </SpotlightCard>
        </aside>

        <div className="space-y-3">
          <div className="glass flex flex-wrap items-center gap-2 rounded-xl p-2">
            <div className="relative min-w-44 flex-1">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-3.5 text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الملفات…" className="field h-9 ps-9 text-xs" />
            </div>
            <span className="text-[0.6rem] text-muted">{activeFolder?.name ?? "كل المجلدات"}</span>
            <div className="flex rounded-lg border border-line p-0.5">
              {[
                { key: "grid" as const, icon: Grid2X2 },
                { key: "list" as const, icon: List },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setLayout(item.key)}
                  className={cn(
                    "grid size-7 place-items-center rounded transition",
                    layout === item.key ? "bg-primary/20 text-fg" : "text-muted",
                  )}
                  aria-label={item.key === "grid" ? "شبكة" : "قائمة"}
                >
                  <item.icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="glass rounded-[var(--radius)] p-12 text-center text-sm text-muted">لا ملفات في هذا المجلد.</div>
          ) : layout === "grid" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((asset) => {
                const Icon = KIND_ICON[asset.kind];
                return (
                  <button key={asset.id} type="button" onClick={() => setPreview(asset)} className="text-start">
                    <SpotlightCard className="h-full p-4">
                      <div className="flex items-start justify-between">
                        <span
                          className="grid size-10 place-items-center rounded-xl"
                          style={{ background: `color-mix(in oklab, ${asset.color} 14%, transparent)`, color: asset.color }}
                        >
                          <Icon className="size-5" />
                        </span>
                        <Badge className="text-[0.5rem]">{KIND_LABEL[asset.kind]}</Badge>
                      </div>
                      <div className="mt-3 line-clamp-2 text-[0.7rem] font-medium leading-relaxed">{asset.name}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[0.52rem] text-muted">
                        <span className="num">{formatFileSize(asset.size)}</span>
                        <span>·</span>
                        <span>{formatDate(asset.createdAt)}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                        <span className="flex items-center gap-1.5 text-[0.52rem] text-muted">
                          <Avatar name={asset.uploader.name} hue={asset.uploader.avatarHue} size="xs" />
                          {asset.uploader.name}
                        </span>
                        <Download className="size-3 text-muted" />
                      </div>
                    </SpotlightCard>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="glass overflow-x-auto rounded-[var(--radius)] p-2">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الملف</th>
                    <th>النوع</th>
                    <th>الحجم</th>
                    <th>المشروع</th>
                    <th>الرافع</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((asset) => {
                    const Icon = KIND_ICON[asset.kind];
                    return (
                      <tr key={asset.id} onClick={() => setPreview(asset)} className="cursor-pointer">
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="grid size-7 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${asset.color} 14%, transparent)`, color: asset.color }}>
                              <Icon className="size-3.5" />
                            </span>
                            <span className="text-[0.68rem]">{asset.name}</span>
                          </div>
                        </td>
                        <td className="text-[0.6rem]">{KIND_LABEL[asset.kind]}</td>
                        <td className="num text-[0.58rem]">{formatFileSize(asset.size)}</td>
                        <td className="text-[0.58rem] text-muted">{asset.projectName ?? "—"}</td>
                        <td className="text-[0.58rem]">{asset.uploader.name}</td>
                        <td className="text-[0.55rem] text-muted">{formatDate(asset.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {preview ? (
        <Dialog open onOpenChange={(open) => !open && setPreview(null)}>
          <DialogContent className="w-[min(94vw,560px)]">
            <DialogHeader>
              <DialogTitle className="leading-relaxed">{preview.name}</DialogTitle>
              <DialogDescription>
                {KIND_LABEL[preview.kind]} · {formatFileSize(preview.size)} · {formatDate(preview.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div
              className="grid h-48 place-items-center rounded-xl border border-line"
              style={{ background: `radial-gradient(circle at 50% 40%, color-mix(in oklab, ${preview.color} 20%, transparent), transparent 70%)` }}
            >
              <div className="text-center">
                {(() => {
                  const Icon = KIND_ICON[preview.kind];
                  return <Icon className="mx-auto size-10" style={{ color: preview.color }} />;
                })()}
                <p className="mt-2 text-[0.6rem] text-muted">معاينة الملفات جاهزة للتوصيل بـ S3 / UploadThing</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[0.6rem]">
              <div className="rounded-lg border border-line p-2.5">
                <div className="text-[0.5rem] text-muted">الرافع</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Avatar name={preview.uploader.name} hue={preview.uploader.avatarHue} size="xs" />
                  {preview.uploader.name}
                </div>
              </div>
              <div className="rounded-lg border border-line p-2.5">
                <div className="text-[0.5rem] text-muted">المشروع</div>
                <div className="mt-1 truncate">{preview.projectName ?? "غير مرتبط"}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button className="flex-1" size="sm" onClick={() => toast.success("بدأ التنزيل (وضع تجريبي)")}>
                <Download className="size-3.5" /> تنزيل
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast.info("الصلاحيات تُدار من لوحة الإدارة")}>
                <File className="size-3.5" /> الصلاحيات
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
