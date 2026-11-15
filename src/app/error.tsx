"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("TECTNAL runtime error", error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="glass w-full max-w-lg rounded-[1.6rem] p-8 text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-danger/30 bg-danger/10">
          <AlertTriangle className="size-6 text-danger" />
        </div>
        <div className="kicker mb-2 text-[0.55rem] text-danger">SYSTEM FAULT · 500</div>
        <h1 className="display-section">حدث خلل غير متوقع</h1>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted">
          سجّلنا المشكلة تلقائياً. يمكنك إعادة المحاولة، وإذا استمرت المشكلة تواصل مع مسؤول النظام.
        </p>
        <div className="mono mt-4 rounded-lg border border-line bg-[var(--surface-2)] px-3 py-2 text-[0.6rem] text-muted">
          {error.digest ?? error.message.slice(0, 90)}
        </div>
        <button type="button" onClick={reset} className="btn btn-primary mt-6">
          <RotateCcw className="size-4" />
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
