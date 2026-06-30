import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  FileImage, FileDown, FileArchive, Combine, Scissors,
  RotateCw, Stamp, Hash, Layers, ImageIcon, Menu, X,
  LockOpen, PenLine, Wrench, Trash2, Code2, Home,
  FileText, FileSpreadsheet, Presentation, ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

type NavItem = { icon: React.ElementType; label: string; href: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Convert to PDF",
    items: [
      { icon: FileImage, label: "JPG to PDF", href: "/image-to-pdf" },
      { icon: FileText, label: "Word to PDF", href: "/word-to-pdf" },
      { icon: Presentation, label: "PowerPoint to PDF", href: "/powerpoint-to-pdf" },
      { icon: FileSpreadsheet, label: "Excel to PDF", href: "/excel-to-pdf" },
      { icon: Code2, label: "HTML to PDF", href: "/html-to-pdf" },
    ],
  },
  {
    title: "Convert from PDF",
    items: [
      { icon: ImageIcon, label: "PDF to JPG", href: "/pdf-to-image" },
      { icon: FileText, label: "PDF to Word", href: "/pdf-to-word" },
      { icon: Presentation, label: "PDF to PowerPoint", href: "/pdf-to-pptx" },
      { icon: FileSpreadsheet, label: "PDF to Excel", href: "/pdf-to-excel" },
    ],
  },
  {
    title: "Organize PDF",
    items: [
      { icon: Combine, label: "Merge PDF", href: "/merge-pdf" },
      { icon: Scissors, label: "Split PDF", href: "/split-pdf" },
      { icon: RotateCw, label: "Rotate PDF", href: "/rotate-pdf" },
      { icon: Layers, label: "Organize PDF", href: "/organize-pdf" },
      { icon: Trash2, label: "Remove Pages", href: "/remove-pages" },
    ],
  },
  {
    title: "Edit PDF",
    items: [
      { icon: Stamp, label: "Add Watermark", href: "/watermark-pdf" },
      { icon: Hash, label: "Add Page Numbers", href: "/page-numbers-pdf" },
      { icon: PenLine, label: "Sign PDF", href: "/sign-pdf" },
    ],
  },
  {
    title: "Optimize",
    items: [
      { icon: FileArchive, label: "Compress PDF", href: "/compress-pdf" },
      { icon: FileDown, label: "Compress Image", href: "/compress-image" },
      { icon: Wrench, label: "Repair PDF", href: "/repair-pdf" },
      { icon: LockOpen, label: "Unlock PDF", href: "/unlock-pdf" },
    ],
  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground px-3"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="text-sm">{isDark ? "Light Mode" : "Dark Mode"}</span>
    </Button>
  );
}

const SidebarItem = ({ icon: Icon, label, href }: NavItem) => {
  const [location] = useLocation();
  const isActive = location === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
};

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const [location] = useLocation();
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
            location === "/" || location === "/home"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={onNavigate}
        >
          <Home className="h-4 w-4 shrink-0" />
          All Tools
        </Link>

        <div className="h-px bg-border" />

        {NAV_GROUPS.map(group => (
          <div key={group.title} onClick={onNavigate}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              {group.title}
            </p>
            <nav className="space-y-0.5">
              {group.items.map(item => (
                <SidebarItem key={item.href} {...item} />
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background">
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-sidebar sticky top-0 z-30">
        <Logo />
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed lg:sticky lg:top-0 z-50 lg:z-auto left-0 top-0 h-screen w-64 shrink-0 border-r bg-sidebar flex flex-col p-4 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="hidden lg:flex h-12 items-center px-2 mb-5 shrink-0">
          <Logo />
        </div>
        <div className="flex-1 min-h-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto min-h-screen">
        <div className="mx-auto max-w-4xl w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
