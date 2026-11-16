"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { createInitialAdmin } from "@/server/actions";
import { Button } from "@/components/ui/button";

export function InitialAdminForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    startTransition(async () => {
      try {
        const result = await createInitialAdmin({ name, email, password });
        if (!result.ok) {
          setError(result.error ?? "تم إعداد مسؤول النظام مسبقاً");
          return;
        }
        router.replace("/sign-in");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "تعذر إنشاء الحساب");
      }
    });
  }

  return (
    <main className="signin-scene relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <video className="signin-video" autoPlay muted loop playsInline preload="metadata" poster="/signin-background-poster.jpg" aria-hidden="true" tabIndex={-1}>
        <source src="/signin-background.mp4" type="video/mp4" />
      </video>
      <div className="signin-video-overlay" aria-hidden="true" />
      <section className="signin-panel glass relative z-10 w-full max-w-md rounded-[1.6rem] p-5 sm:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="font-display text-sm font-bold tracking-wide">تكنيكال</div>
        </div>
        <h1 className="display-section mb-2 text-center">إعداد مسؤول النظام</h1>
        <p className="mb-6 text-center text-xs leading-6 text-muted">
          أنشئ الحساب الرئيسي. سيحصل على صلاحيات إدارة النظام كاملة، ولن يتاح إعداد مسؤول آخر بعد ذلك.
        </p>
        <form action={submit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted">الاسم الرسمي</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" />
              <input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="field signin-field ps-9" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" />
              <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="field signin-field ps-9" placeholder="name@example.com" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">كلمة مرور قوية (12 حرفاً على الأقل)</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" />
              <input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={12} maxLength={128} autoComplete="new-password" className="field signin-field px-9" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 end-3 my-auto grid size-6 place-items-center text-muted transition hover:text-fg" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {error ? <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</div> : null}
          <Button type="submit" size="lg" className="w-full signin-submit" loading={pending}>
            {pending ? "جارٍ إنشاء الحساب…" : "إنشاء مسؤول النظام الرئيسي"}
          </Button>
        </form>
      </section>
    </main>
  );
}
