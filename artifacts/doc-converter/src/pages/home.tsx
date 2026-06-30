import { Link } from "wouter";
import {
  FileImage, FileDown, FileArchive, Combine, Scissors,
  RotateCw, Stamp, Hash, Layers, ImageIcon, ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    category: "Convert",
    items: [
      { icon: FileImage, label: "Image to PDF", desc: "Convert JPG, PNG, and more to PDF", href: "/image-to-pdf", color: "text-blue-500", bg: "bg-blue-500/10" },
      { icon: ImageIcon, label: "PDF to Images", desc: "Extract pages as high-quality images", href: "/pdf-to-image", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    ]
  },
  {
    category: "PDF Tools",
    items: [
      { icon: Combine, label: "Merge PDF", desc: "Combine multiple PDFs into one", href: "/merge-pdf", color: "text-purple-500", bg: "bg-purple-500/10" },
      { icon: Scissors, label: "Split PDF", desc: "Extract pages or split into multiple files", href: "/split-pdf", color: "text-pink-500", bg: "bg-pink-500/10" },
      { icon: RotateCw, label: "Rotate PDF", desc: "Rotate pages individually or all at once", href: "/rotate-pdf", color: "text-rose-500", bg: "bg-rose-500/10" },
      { icon: Layers, label: "Organize PDF", desc: "Reorder or delete pages visually", href: "/organize-pdf", color: "text-orange-500", bg: "bg-orange-500/10" },
    ]
  },
  {
    category: "Enhance",
    items: [
      { icon: Stamp, label: "Add Watermark", desc: "Stamp text on your document", href: "/watermark-pdf", color: "text-teal-500", bg: "bg-teal-500/10" },
      { icon: Hash, label: "Page Numbers", desc: "Add numbering to every page", href: "/page-numbers-pdf", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    ]
  },
  {
    category: "Optimize",
    items: [
      { icon: FileArchive, label: "Compress PDF", desc: "Reduce file size significantly", href: "/compress-pdf", color: "text-amber-500", bg: "bg-amber-500/10" },
      { icon: FileDown, label: "Compress Image", desc: "Shrink images directly in browser", href: "/compress-image", color: "text-yellow-500", bg: "bg-yellow-500/10" },
    ]
  }
];

export default function Home() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="text-center max-w-2xl mx-auto mt-8 md:mt-12 space-y-4">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-2">
          100% Local Processing
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Precision document tools, <br className="hidden md:block"/>
          <span className="text-muted-foreground">right in your browser.</span>
        </h1>
        <p className="text-lg text-muted-foreground pt-2">
          Fast, private, and secure. No files are ever uploaded to a server. 
          Everything happens directly on your device.
        </p>
      </div>

      <div className="space-y-12">
        {TOOLS.map((group) => (
          <div key={group.category} className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight border-b pb-2">{group.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((tool) => (
                <Link key={tool.href} href={tool.href}>
                  <Card className="group relative overflow-hidden p-6 hover:shadow-md transition-all duration-300 border-border/60 hover:border-primary/30 bg-card/50 hover:bg-card cursor-pointer h-full flex flex-col justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-xl shrink-0 transition-colors", tool.bg, tool.color)}>
                        <tool.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{tool.label}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
                      </div>
                    </div>
                    <div className="absolute top-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}