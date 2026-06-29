import React from "react";
import { Link, useLocation } from "wouter";
import { FileImage, FileDown, FileArchive } from "lucide-react";
import { cn } from "@/lib/utils";

const SidebarItem = ({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) => {
  const [location] = useLocation();
  const isActive = location === href || (href === "/" && location === "/image-to-pdf");

  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}>
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background">
      <aside className="w-full lg:w-64 shrink-0 border-r bg-sidebar p-4 lg:min-h-screen">
        <div className="flex h-12 items-center px-2 mb-8">
          <h1 className="text-xl font-bold tracking-tight text-foreground">DocConvert</h1>
        </div>
        <nav className="space-y-2">
          <SidebarItem icon={FileImage} label="Image to PDF" href="/" />
          <SidebarItem icon={FileDown} label="Compress Image" href="/compress-image" />
          <SidebarItem icon={FileArchive} label="Compress PDF" href="/compress-pdf" />
        </nav>
      </aside>
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-4xl w-full">
          {children}
        </div>
      </main>
    </div>
  );
}