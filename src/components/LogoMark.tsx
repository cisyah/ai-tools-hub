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
  size?: "sm" | "md" | "lg";
};

export function LogoMark({ iconId, size = "sm" }: LogoMarkProps) {
  const { logoIconId } = useTheme();
  const activeIconId = iconId || logoIconId;
  const Icon = logoIconMap[activeIconId];
  const frameSize =
    size === "lg" ? "h-16 w-16 rounded-[16px] p-4" : size === "md" ? "h-12 w-12 rounded-[14px] p-3" : "h-8 w-8 rounded-full p-2";
  const iconSize = size === "lg" ? 24 : size === "md" ? 20 : 16;

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
