"use client";

import { AppWindow, BookOpen, Images, Library, Search, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import type { LogoIconId } from "@/lib/brand";

const logoIconMap: Partial<Record<LogoIconId, LucideIcon>> = {
  sparkles: Sparkles,
  wrench: Wrench,
  library: Library,
  search: Search,
  app: AppWindow,
  book: BookOpen,
  images: Images,
};

type LogoMarkProps = {
  iconId?: LogoIconId;
  size?: "sm" | "lg";
};

export function LogoMark({ iconId, size = "sm" }: LogoMarkProps) {
  const { logoIconId } = useTheme();
  const activeIconId = iconId || logoIconId;
  const Icon = logoIconMap[activeIconId];
  const frameSize = size === "lg" ? "h-20 w-20 rounded-[24px] p-5" : "h-10 w-10 rounded-full p-2.5";
  const iconSize = size === "lg" ? 30 : 18;

  if (!Icon) {
    return (
      <div className={`grid grid-cols-3 gap-0.5 bg-primary text-primary-foreground shadow-sm ${frameSize}`}>
        {Array.from({ length: 9 }).map((_, index) => (
          <span key={index} className="rounded-full bg-current opacity-90" />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-primary text-primary-foreground shadow-sm ${frameSize}`}>
      <Icon size={iconSize} strokeWidth={2.2} aria-hidden="true" />
    </div>
  );
}
