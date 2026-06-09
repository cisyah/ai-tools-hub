import type { Metadata } from "next";
import { Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { LocaleProvider } from "@/components/LocaleProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Tools Hub",
  description: "A personal AI tools directory for local and intranet deployment.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-theme="old-burgundy" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('ai-tools-hub.theme');if(['buttermilk','pink','pastel-blue','rust','navy','old-burgundy'].includes(t)){document.documentElement.dataset.theme=t}else if(t==='butter'){document.documentElement.dataset.theme='pink'}else{document.documentElement.dataset.theme='old-burgundy'}var l=localStorage.getItem('ai-tools-hub.locale');if(l==='en'||l==='zh-CN'){document.documentElement.lang=l}}catch(e){document.documentElement.dataset.theme='old-burgundy'}",
          }}
        />
      </head>
      <body>
        <LocaleProvider>
          <ThemeProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[272px_1fr]">
              <Suspense fallback={null}>
                <Sidebar />
              </Suspense>
              <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
            </div>
          </ToastProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
