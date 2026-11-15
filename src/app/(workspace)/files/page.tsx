import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getAssets, getFolders } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { FilesView } from "@/components/files/files-view";

export const metadata: Metadata = { title: "الملفات" };
export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const user = await requirePermission("files.view");
  const [folders, assets] = await Promise.all([getFolders(), getAssets()]);

  return (
    <FilesView
      folders={folders}
      assets={assets}
      canUpload={hasPermission(user.permissions, "files.upload")}
    />
  );
}
