import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Tools Hub",
  description: "A personal AI tools directory for local and intranet deployment.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-theme="mist" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('ai-tools-hub.theme');if(['mist','clay','ink','moss','sage','linen'].includes(t)){document.documentElement.dataset.theme=t}else{document.documentElement.dataset.theme='mist'}}catch(e){document.documentElement.dataset.theme='mist'}",
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[272px_1fr]">
              <Sidebar />
              <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
