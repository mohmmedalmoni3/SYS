"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const schema = z.object({
  email: z.string().email("أدخل بريداً إلكترونياً صالحاً"),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
});

type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { email: "ahmed@tectnal.sa", name: "أحمد الحربي", role: "رئيس اللجنة", color: "#F5C451", hue: 265 },
  { email: "noura@tectnal.sa", name: "نورة القحطاني", role: "نائبة الرئيس", color: "#A78BFA", hue: 190 },
  { email: "reem@tectnal.sa", name: "ريم الشمري", role: "قائدة مشروع", color: "#34D399", hue: 320 },
  { email: "abdullah@tectnal.sa", name: "عبدالله الغامدي", role: "عضو أساسي", color: "#60A5FA", hue: 30 },
  { email: "faisal@tectnal.sa", name: "فيصل السبيعي", role: "عضو متدرب", color: "#FBBF24", hue: 20 },
];

const DEMO_PASSWORD = "Tectnal@2026";

export function SignInForm({ discordEnabled }: { discordEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "ahmed@tectnal.sa", password: DEMO_PASSWORD },
  });

  const onSubmit = async (values: FormValues) => {
    setPending(true);
    setError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }
    toast.success("تم تسجيل الدخول بنجاح");
    router.push(callbackUrl);
    router.refresh();
  };

  const quickFill = (email: string) => {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <main className="signin-scene relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <video
        className="signin-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/signin-background-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/signin-background.mp4" type="video/mp4" />
      </video>
      <div className="signin-video-overlay" aria-hidden="true" />
      <section className="signin-panel glass relative z-10 w-full max-w-md rounded-[1.6rem] p-5 sm:p-8">
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="font-display text-sm font-bold tracking-wide">تكنيكال</div>
            </div>
            <div className="mb-6">
              <h1 className="display-section text-center">تسجيل الدخول</h1>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="field signin-field ps-9"
                    placeholder="name@tectnal.sa"
                    aria-invalid={Boolean(form.formState.errors.email)}
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email ? (
                  <p className="mt-1 text-[0.7rem] text-danger">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="field signin-field px-9"
                    placeholder="••••••••"
                    aria-invalid={Boolean(form.formState.errors.password)}
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 end-3 my-auto grid size-6 place-items-center text-muted transition hover:text-fg"
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {form.formState.errors.password ? (
                  <p className="mt-1 text-[0.7rem] text-danger">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[0.72rem] text-danger">
                  {error}
                </div>
              ) : null}

              <Button type="submit" size="lg" className="w-full signin-submit" loading={pending}>
                {pending ? "جارٍ التحقق…" : "دخول إلى مساحة العمل"}
                {!pending ? <ArrowLeft className="size-4" /> : null}
              </Button>

              {discordEnabled ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  onClick={() => signIn("discord", { callbackUrl })}
                >
                  الدخول عبر Discord
                </Button>
              ) : null}
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[0.6rem] text-muted">حسابات تجريبية</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => quickFill(account.email)}
                  className={cn(
                    "signin-demo-account flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 text-start transition",
                    form.watch("email") === account.email && "signin-demo-account-active",
                  )}
                >
                  <Avatar name={account.name} hue={account.hue} size="xs" ring={account.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.7rem] font-medium">{account.name}</span>
                    <span className="block text-[0.58rem]" style={{ color: account.color }}>
                      {account.role}
                    </span>
                  </span>
                  <span className="mono text-[0.55rem] text-muted/60" dir="ltr">
                    {account.email.split("@")[0]}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[0.6rem] text-muted/70">
              <KeyRound className="size-3" />
              كلمة المرور الموحّدة للعرض: <span className="mono text-fg/80">Tectnal@2026</span>
            </p>
      </section>
    </main>
  );
}
