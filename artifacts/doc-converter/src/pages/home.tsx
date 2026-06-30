import { Link } from "wouter";
import { motion } from "framer-motion";

type Tool = { label: string; desc: string; href: string; icon: React.ReactNode };
type Group = { category: string; color: string; items: Tool[] };

function ToolIcon({ bg, accent, children }: { bg: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="relative w-12 h-14 mx-auto mb-3">
      <svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 5C4 2.791 5.791 1 8 1H32L44 13V51C44 53.209 42.209 55 40 55H8C5.791 55 4 53.209 4 51V5Z" fill={bg} />
        <path d="M32 1L44 13H36C33.791 13 32 11.209 32 9V1Z" fill={accent} />
        <rect x="4" y="24" width="40" height="20" rx="3" fill={accent} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pt-5">
        <div className="text-white">{children}</div>
      </div>
    </div>
  );
}

const I = (d: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const GROUPS: Group[] = [
  {
    category: "Convert to PDF",
    color: "#3B82F6",
    items: [
      { label: "JPG to PDF", desc: "Convert images (JPG, PNG, WebP) into a PDF.", href: "/image-to-pdf", icon: <ToolIcon bg="#3B82F6" accent="#1D4ED8">{I("M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z")}</ToolIcon> },
      { label: "Word to PDF", desc: "Convert DOCX files to PDF with formatting.", href: "/word-to-pdf", icon: <ToolIcon bg="#2563EB" accent="#1E40AF"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></ToolIcon> },
      { label: "PowerPoint to PDF", desc: "Convert PPTX presentations to PDF slides.", href: "/powerpoint-to-pdf", icon: <ToolIcon bg="#DC2626" accent="#991B1B"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></ToolIcon> },
      { label: "Excel to PDF", desc: "Convert XLSX spreadsheets to PDF pages.", href: "/excel-to-pdf", icon: <ToolIcon bg="#16A34A" accent="#15803D">{I("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2L14 8 20 8 M8 13h8 M8 17h8 M8 9h2")}</ToolIcon> },
      { label: "HTML to PDF", desc: "Paste HTML content and download as PDF.", href: "/html-to-pdf", icon: <ToolIcon bg="#0891B2" accent="#0E7490"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></ToolIcon> },
    ],
  },
  {
    category: "Convert from PDF",
    color: "#8B5CF6",
    items: [
      { label: "PDF to JPG", desc: "Extract each PDF page as a JPG or PNG image.", href: "/pdf-to-image", icon: <ToolIcon bg="#7C3AED" accent="#5B21B6"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></ToolIcon> },
      { label: "PDF to Word", desc: "Extract PDF text and create a DOCX file.", href: "/pdf-to-word", icon: <ToolIcon bg="#4F46E5" accent="#3730A3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></ToolIcon> },
      { label: "PDF to PowerPoint", desc: "Convert PDF pages into PPTX slide images.", href: "/pdf-to-pptx", icon: <ToolIcon bg="#9333EA" accent="#7E22CE"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></ToolIcon> },
      { label: "PDF to Excel", desc: "Extract PDF text into an XLSX spreadsheet.", href: "/pdf-to-excel", icon: <ToolIcon bg="#059669" accent="#047857"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></ToolIcon> },
    ],
  },
  {
    category: "Organize PDF",
    color: "#EF4444",
    items: [
      { label: "Merge PDF", desc: "Combine multiple PDFs into one document.", href: "/merge-pdf", icon: <ToolIcon bg="#EF4444" accent="#B91C1C"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6H21"/><path d="M8 12H21"/><path d="M8 18H21"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg></ToolIcon> },
      { label: "Split PDF", desc: "Extract pages or split into multiple files.", href: "/split-pdf", icon: <ToolIcon bg="#F97316" accent="#C2410C"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><path d="M21 6H15a3 3 0 0 0-3 3v3"/><path d="M21 6l-3-3-3 3"/><line x1="6" y1="21" x2="6" y2="9"/><path d="M3 18h6a3 3 0 0 0 3-3v-3"/><path d="M3 18l3 3 3-3"/></svg></ToolIcon> },
      { label: "Rotate PDF", desc: "Rotate all or selected pages 90°–270°.", href: "/rotate-pdf", icon: <ToolIcon bg="#EC4899" accent="#BE185D"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"/></svg></ToolIcon> },
      { label: "Organize PDF", desc: "Drag pages to reorder them visually.", href: "/organize-pdf", icon: <ToolIcon bg="#8B5CF6" accent="#6D28D9"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></ToolIcon> },
      { label: "Remove Pages", desc: "Select and delete specific pages from a PDF.", href: "/remove-pages", icon: <ToolIcon bg="#DC2626" accent="#991B1B"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></ToolIcon> },
    ],
  },
  {
    category: "Edit PDF",
    color: "#10B981",
    items: [
      { label: "Add Watermark", desc: "Stamp a text watermark on every page.", href: "/watermark-pdf", icon: <ToolIcon bg="#06B6D4" accent="#0E7490"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></ToolIcon> },
      { label: "Add Page Numbers", desc: "Add page numbering to every page.", href: "/page-numbers-pdf", icon: <ToolIcon bg="#10B981" accent="#047857"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg></ToolIcon> },
      { label: "Sign PDF", desc: "Draw your signature and embed it in the PDF.", href: "/sign-pdf", icon: <ToolIcon bg="#6366F1" accent="#4338CA"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg></ToolIcon> },
    ],
  },
  {
    category: "Optimize & Repair",
    color: "#22C55E",
    items: [
      { label: "Compress PDF", desc: "Reduce file size while keeping quality.", href: "/compress-pdf", icon: <ToolIcon bg="#22C55E" accent="#15803D"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg></ToolIcon> },
      { label: "Compress Image", desc: "Shrink JPG, PNG, WebP without visible loss.", href: "/compress-image", icon: <ToolIcon bg="#F59E0B" accent="#B45309"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></ToolIcon> },
      { label: "Repair PDF", desc: "Recover and rebuild a damaged PDF file.", href: "/repair-pdf", icon: <ToolIcon bg="#78716C" accent="#57534E"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></ToolIcon> },
      { label: "Unlock PDF", desc: "Remove password protection from your PDF.", href: "/unlock-pdf", icon: <ToolIcon bg="#64748B" accent="#475569"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg></ToolIcon> },
    ],
  },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } };

export default function Home() {
  const allTools = GROUPS.flatMap(g => g.items);

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mt-8 mb-10 space-y-4 px-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          100% Local — Files never leave your device
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Every document tool you need,{" "}
          <span className="text-primary">in one place.</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto">
          {allTools.length} powerful tools. All free. All private. Word, Excel, PowerPoint, PDF — all formats supported.
        </p>
      </div>

      {/* Flat tool grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
      >
        {allTools.map((tool) => (
          <motion.div key={tool.href} variants={item}>
            <Link href={tool.href}>
              <div className="group bg-card border border-border/70 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 h-full">
                {tool.icon}
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                  {tool.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  {tool.desc}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Category sections */}
      <div className="mt-14 space-y-10">
        {GROUPS.map((group) => (
          <div key={group.category}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-4 w-1 rounded-full" style={{ background: group.color }} />
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {group.category}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {group.items.map((tool) => (
                <Link key={tool.href} href={tool.href}>
                  <div className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/30 hover:bg-primary/[0.02] cursor-pointer transition-all duration-150">
                    <div className="shrink-0" style={{ transform: "scale(0.65)", transformOrigin: "left center", marginLeft: "-6px", marginRight: "-10px" }}>
                      {tool.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{tool.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{tool.desc}</p>
                    </div>
                    <svg className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
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
