import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuroraBackground } from "@/components/fx/aurora-background";
import { Preloader } from "@/components/fx/preloader";
import { SmoothScroll } from "@/components/fx/smooth-scroll";
import { ScrollProgressBar } from "@/components/fx/scroll-progress";

export const metadata: Metadata = {
  title: {
    default: "تكتنال — نظام إدارة لجنة التقنية",
    template: "%s · تكتنال",
  },
  description:
    "تكتنال: منصة داخلية متكاملة لإدارة لجنة التقنية — الأعضاء، الرتب، المشاريع، المهام، الاقتراحات والإنجازات في مكان واحد.",
  applicationName: "TECTNAL",
  keywords: ["لجنة تقنية", "إدارة مشاريع", "تكتنال", "TECTNAL", "إدارة مهام", "لوحة قيادة"],
  authors: [{ name: "TECTNAL" }],
  openGraph: {
    title: "تكتنال — نظام إدارة لجنة التقنية",
    description: "حيث تُدار الأفكار، وتُنجَز المشاريع، ويُصنَع الأثر.",
    type: "website",
    locale: "ar_SA",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05060f" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6fc" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <AuroraBackground />
          <Preloader />
          <SmoothScroll />
          <ScrollProgressBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
