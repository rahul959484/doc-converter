import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  FileImage, FileDown, FileArchive, Combine, Scissors,
  RotateCw, Stamp, Hash, Layers, ImageIcon, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = { icon: React.ElementType; label: string; href: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Convert",
    items: [
      { icon: FileImage, label: "Image to PDF", href: "/" },
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
  const isActive = location === href || (href === "/" && location === "/image-to-pdf");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      data-testid={`nav-${href.replace(/\//g, "").replace(/-/g, "_") || "home"}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
};

const SidebarContent = () => (
  <div className="space-y-6">
    {NAV_GROUPS.map(group => (
      <div key={group.title}>
        <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
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
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-sidebar">
        <h1 className="text-lg font-bold tracking-tight">DocConvert</h1>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-50 lg:z-auto top-0 left-0 h-full lg:h-auto w-64 shrink-0 border-r bg-sidebar p-4 lg:min-h-screen transition-transform duration-300",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="hidden lg:flex h-12 items-center px-2 mb-8">
          <h1 className="text-xl font-bold tracking-tight text-foreground">DocConvert</h1>
        </div>
        <div className="mt-14 lg:mt-0" onClick={() => setMobileOpen(false)}>
          <SidebarContent />
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-4xl w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
