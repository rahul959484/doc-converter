import { Link } from "wouter";
import { motion } from "framer-motion";

type Tool = {
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
};

type Group = {
  category: string;
  items: Tool[];
};

function PdfIcon({ color, accent, symbol }: { color: string; accent: string; symbol: React.ReactNode }) {
  return (
    <div className="relative w-14 h-16 mx-auto mb-4">
      <svg width="56" height="64" viewBox="0 0 56 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="56" height="64" rx="6" fill={color} />
        <path d="M36 0H20C16.686 0 14 2.686 14 6V58C14 61.314 16.686 64 20 64H50C53.314 64 56 61.314 56 58V20L36 0Z" fill={color} />
        <path d="M36 0L56 20H42C38.686 20 36 17.314 36 14V0Z" fill={accent} />
        <rect x="8" y="28" width="40" height="22" rx="3" fill={accent} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pt-6">
        <div className="text-white font-black text-xs leading-none">{symbol}</div>
      </div>
    </div>
  );
}

const TOOLS: Group[] = [
  {
    category: "Convert",
    items: [
      {
        label: "Image to PDF",
        desc: "Convert JPG, PNG, WebP and more into a PDF document.",
        href: "/image-to-pdf",
        icon: <PdfIcon color="#4F8EF7" accent="#2563EB" symbol={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />,
      },
      {
        label: "PDF to Images",
        desc: "Extract every PDF page as a high-quality PNG or JPG image.",
        href: "/pdf-to-image",
        icon: <PdfIcon color="#7C3AED" accent="#5B21B6" symbol={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>} />,
      },
    ],
  },
  {
    category: "PDF Tools",
    items: [
      {
        label: "Merge PDF",
        desc: "Combine PDFs in the order you want with the easiest merger available.",
        href: "/merge-pdf",
        icon: <PdfIcon color="#EF4444" accent="#B91C1C" symbol={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6H21"/><path d="M8 12H21"/><path d="M8 18H21"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>} />,
      },
      {
        label: "Split PDF",
        desc: "Separate one page or a whole set for easy conversion into independent files.",
        href: "/split-pdf",
        icon: <PdfIcon color="#F97316" accent="#C2410C" symbol={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><path d="M21 6H15a3 3 0 0 0-3 3v3"/><path d="M21 6l-3-3-3 3"/><line x1="6" y1="21" x2="6" y2="9"/><path d="M3 18h6a3 3 0 0 0 3-3v-3"/><path d="M3 18l3 3 3-3"/></svg>} />,
      },
      {
        label: "Rotate PDF",
        desc: "Rotate all or selected pages — 90°, 180°, or 270° in a click.",
        href: "/rotate-pdf",
        icon: <PdfIcon color="#EC4899" accent="#BE185D" symbol={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"/></svg>} />,
      },
      {
        label: "Organize PDF",
        desc: "Reorder or delete pages visually. Drag to rearrange, click to remove.",
        href: "/organize-pdf",
        icon: <PdfIcon color="#8B5CF6" accent="#6D28D9" symbol={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>} />,
      },
    ],
  },
  {
    category: "Enhance",
    items: [
      {
        label: "Add Watermark",
        desc: "Stamp a diagonal text watermark on every page of your PDF.",
        href: "/watermark-pdf",
        icon: <PdfIcon color="#06B6D4" accent="#0E7490" symbol={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} />,
      },
      {
        label: "Add Page Numbers",
        desc: "Stamp page numbers onto every page. Choose format and position.",
        href: "/page-numbers-pdf",
        icon: <PdfIcon color="#10B981" accent="#047857" symbol={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>} />,
      },
    ],
  },
  {
    category: "Optimize",
    items: [
      {
        label: "Compress PDF",
        desc: "Reduce file size while optimizing for maximal PDF quality.",
        href: "/compress-pdf",
        icon: <PdfIcon color="#22C55E" accent="#15803D" symbol={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>} />,
      },
      {
        label: "Compress Image",
        desc: "Shrink JPG, PNG, WebP images without losing visible quality.",
        href: "/compress-image",
        icon: <PdfIcon color="#F59E0B" accent="#B45309" symbol={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />,
      },
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function Home() {
  const allTools = TOOLS.flatMap((g) => g.items.map((t) => ({ ...t, category: g.category })));

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mt-10 mb-12 space-y-4 px-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20 mb-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5"/></svg>
          100% Local Processing — Files never leave your device
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Every PDF tool you need,{" "}
          <span className="text-primary">in one place.</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto">
          Fast, private, and free. All processing happens directly in your browser — nothing is ever uploaded to a server.
        </p>
      </div>

      {/* All Tools Grid — flat, like ilovepdf */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
      >
        {allTools.map((tool) => (
          <motion.div key={tool.href} variants={item}>
            <Link href={tool.href}>
              <div
                className="group bg-card border border-border rounded-xl p-5 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
                data-testid={`tool-card-${tool.href.replace(/\//g, "")}`}
              >
                {tool.icon}
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
                  {tool.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                  {tool.desc}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Category sections below the flat grid */}
      <div className="mt-16 space-y-10">
        {TOOLS.map((group) => (
          <div key={group.category}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">
              {group.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.items.map((tool) => (
                <Link key={tool.href} href={tool.href}>
                  <div className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.03] cursor-pointer transition-all duration-150">
                    <div className="shrink-0 scale-75 origin-left -ml-1">{tool.icon}</div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{tool.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{tool.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
