import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { permissionLabel } from "@/lib/permissions";

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ permission?: string }>;
}) {
  const { permission } = await searchParams;

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="glass w-full max-w-lg rounded-[1.6rem] p-8 text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-warning/30 bg-warning/10">
          <LockKeyhole className="size-6 text-warning" />
        </div>
        <div className="kicker mb-2 text-[0.55rem] text-warning">ACCESS DENIED · 403</div>
        <h1 className="display-section">هذه المنطقة خارج صلاحياتك</h1>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted">
          رتبتك الحالية لا تمنحك الوصول إلى هذا القسم. يمكنك طلب ترقية من رئيس اللجنة أو العودة إلى لوحة القيادة.
        </p>
        {permission ? (
          <div className="mono mt-4 rounded-lg border border-line bg-[var(--surface-2)] px-3 py-2 text-[0.62rem] text-muted">
            required: {permission} · {permissionLabel(permission)}
          </div>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link href="/dashboard" className="btn btn-primary">
            <ArrowRight className="size-4" />
            العودة إلى لوحة القيادة
          </Link>
        </div>
      </div>
    </div>
  );
}
