import {
  AppWindow,
  BookOpen,
  ExternalLink,
  Images,
  Library,
  Link as LinkIcon,
  NotebookTabs,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  AppWindow,
  BookOpen,
  ExternalLink,
  Images,
  Library,
  Link: LinkIcon,
  NotebookTabs,
  Search,
  Sparkles,
};

export function CardIcon({ name, size = 20 }: { name?: string; size?: number }) {
  const Icon = name ? iconMap[name] || LinkIcon : LinkIcon;
  return <Icon size={size} aria-hidden="true" />;
}

export const iconOptions = Object.keys(iconMap);
