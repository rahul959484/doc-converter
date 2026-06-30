import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  FileImage, FileDown, FileArchive, Combine, Scissors,
  RotateCw, Stamp, Hash, Layers, ImageIcon, Menu, X, Moon, Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";

type NavItem = { icon: React.ElementType; label: string; href: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Convert",
    items: [
      { icon: FileImage, label: "Image to PDF", href: "/image-to-pdf" },
      { icon: ImageIcon, label: "PDF to Images", href: "/pdf-to-image" },
    ],
  },
  {
    title: "PDF Tools",
    items: [
      { icon: Combine, label: "Merge PDF", href: "/merge-pdf" },
      { icon: Scissors, label: "Split PDF", href: "/split-pdf" },
      { icon: RotateCw, label: "Rotate PDF", href: "/rotate-pdf" },
      { icon: Layers, label: "Organize PDF", href: "/organize-pdf" },
    ],
  },
  {
    title: "Enhance",
    items: [
      { icon: Stamp, label: "Add Watermark", href: "/watermark-pdf" },
      { icon: Hash, label: "Add Page Numbers", href: "/page-numbers-pdf" },
    ],
  },
  {
    title: "Optimize",
    items: [
      { icon: FileArchive, label: "Compress PDF", href: "/compress-pdf" },
      { icon: FileDown, label: "Compress Image", href: "/compress-image" },
    ],
  },
];

const SidebarItem = ({ icon: Icon, label, href }: NavItem) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      data-testid={`nav-${href.replace(/\//g, "").replace(/-/g, "_") || "home"}`}
    >
      <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
      {label}
    </Link>
  );
};

const SidebarContent = () => (
  <div className="space-y-8">
    {NAV_GROUPS.map(group => (
      <div key={group.title}>
        <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
          {group.title}
        </p>
        <nav className="space-y-1">
          {group.items.map(item => (
            <SidebarItem key={item.href} {...item} />
          ))}
        </nav>
      </div>
    ))}
  </div>
);

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="w-full justify-start text-muted-foreground hover:text-foreground mt-4" 
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4 mr-3" />
          Light Mode
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-3" />
          Dark Mode
        </>
      )}
    </Button>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-sidebar/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/">
          <Logo />
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky z-50 lg:z-auto top-0 left-0 h-[100dvh] w-[280px] shrink-0 border-r bg-sidebar p-5 transition-transform duration-300 ease-in-out flex flex-col",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="hidden lg:flex items-center px-1 mb-8">
          <Link href="/">
            <Logo className="hover:opacity-80 transition-opacity cursor-pointer" />
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto mt-14 lg:mt-0 no-scrollbar" onClick={() => setMobileOpen(false)}>
          <SidebarContent />
        </div>
        
        <div className="pt-4 border-t mt-4 border-border/50">
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto w-full bg-muted/20 relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
        <div className="mx-auto max-w-5xl w-full relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}