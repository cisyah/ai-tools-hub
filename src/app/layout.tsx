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
    <html lang="zh-CN" data-theme="ardoise" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('ai-tools-hub.theme');if(t==='topaze'){t='orange-topaze';localStorage.setItem('ai-tools-hub.theme',t)}if(['wasabi','orange-topaze','cool-blue','cassis','vert-sauge','ardoise'].includes(t)){document.documentElement.dataset.theme=t}else{document.documentElement.dataset.theme='ardoise'}var l=localStorage.getItem('ai-tools-hub.locale');if(l==='en'||l==='zh-CN'){document.documentElement.lang=l}}catch(e){document.documentElement.dataset.theme='ardoise'}",
          }}
        />
      </head>
      <body>
        <LocaleProvider>
          <ThemeProvider>
          <ToastProvider>
            <div className="min-h-screen bg-page-background text-foreground md:grid md:grid-cols-[272px_1fr]">
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
