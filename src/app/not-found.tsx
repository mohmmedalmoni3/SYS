import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <div className="kicker mb-3">SIGNAL LOST · 404</div>
        <h1 className="display-hero relative">
          <span className="text-gradient">404</span>
        </h1>
        <h2 className="mt-2 font-display text-xl font-semibold">الصفحة غير موجودة</h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted">
          ربما تم نقل الصفحة أو أن الرابط غير صحيح. لنعد إلى مركز القيادة ونكمل العمل.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link href="/dashboard" className="btn btn-primary">
            <Home className="size-4" />
            مركز القيادة
          </Link>
          <Link href="/projects" className="btn btn-ghost">
            <Compass className="size-4" />
            استعراض المشاريع
          </Link>
        </div>
      </div>
    </div>
  );
}
