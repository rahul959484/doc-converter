import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, Scissors } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type SplitResult = { name: string; bytes: Uint8Array };

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<"all" | "range">("all");
  const [range, setRange] = useState("");
  const [results, setResults] = useState<SplitResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResults([]);
    const ab = await f.arrayBuffer();
    const doc = await PDFDocument.load(ab);
    setPageCount(doc.getPageCount());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") handleFile(f);
  };

  const parseRange = (r: string, total: number): number[][] => {
    const parts = r.split(",").map(s => s.trim()).filter(Boolean);
    const groups: number[][] = [];
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        const s = Math.max(1, start) - 1;
        const e = Math.min(total, end) - 1;
        if (s <= e) groups.push(Array.from({ length: e - s + 1 }, (_, i) => s + i));
      } else {
        const n = Number(part) - 1;
        if (n >= 0 && n < total) groups.push([n]);
      }
    }
    return groups;
  };

  const split = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(ab);
      const total = srcDoc.getPageCount();

      let groups: number[][];
      if (mode === "all") {
        groups = Array.from({ length: total }, (_, i) => [i]);
      } else {
        groups = parseRange(range, total);
      }

      const out: SplitResult[] = [];
      for (let i = 0; i < groups.length; i++) {
        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, groups[i]);
        pages.forEach(p => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const label = mode === "all" ? `page-${groups[i][0] + 1}` : `part-${i + 1}`;
        out.push({ name: `${label}.pdf`, bytes });
      }
      setResults(out);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = () => {
    results.forEach(r => {
      const blob = new Blob([r.bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.name;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const downloadOne = (r: SplitResult) => {
    const blob = new Blob([r.bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = r.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => (bytes / 1024).toFixed(0) + " KB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-pink-500/10 text-pink-600 dark:text-pink-400 mb-1">
          PDF Tools
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Split PDF</h2>
        <p className="text-muted-foreground text-lg">Extract pages from a PDF into separate files.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn(
                "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
                isDragging ? "border-pink-500 bg-pink-500/5 scale-[1.02] shadow-xl shadow-pink-500/10" : "border-border hover:border-pink-500/50 hover:bg-muted/50 hover:shadow-lg cursor-pointer"
              )}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isDragging && <div className="absolute inset-0 bg-pink-500/5 blur-3xl rounded-full" />}
              <div className="flex flex-col items-center justify-center space-y-5 text-center relative z-10">
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300 shadow-sm",
                  isDragging ? "bg-pink-500 text-white scale-110 shadow-pink-500/25 shadow-lg" : "bg-background border shadow-sm text-pink-500 group-hover:bg-pink-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-pink-500/25"
                )}>
                  <Scissors className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-xl">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground/80 font-medium">Select how to split once uploaded</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="options" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl border bg-muted/30">
              <div className="h-14 w-14 bg-pink-500/10 rounded-xl flex items-center justify-center shrink-0 border border-pink-500/20">
                <FileText className="h-7 w-7 text-pink-600 dark:text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-lg text-foreground">{file.name}</p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">{pageCount} pages</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResults([]); }} className="shrink-0 font-semibold border-dashed">Change File</Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-lg font-bold">Split Mode</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "all" | "range")} className="grid gap-4">
                <div 
                  className={cn(
                    "flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all",
                    mode === "all" ? "border-pink-500 bg-pink-500/5 shadow-sm" : "hover:border-pink-500/40 hover:bg-muted/30"
                  )} 
                  onClick={() => setMode("all")}
                >
                  <RadioGroupItem value="all" id="all" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="all" className="cursor-pointer font-bold text-base">Extract all pages</Label>
                    <p className="text-sm text-muted-foreground font-medium">Creates one PDF per page ({pageCount} files)</p>
                  </div>
                </div>
                <div 
                  className={cn(
                    "flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all",
                    mode === "range" ? "border-pink-500 bg-pink-500/5 shadow-sm" : "hover:border-pink-500/40 hover:bg-muted/30"
                  )} 
                  onClick={() => setMode("range")}
                >
                  <RadioGroupItem value="range" id="range" className="mt-1" />
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="range" className="cursor-pointer font-bold text-base">Custom ranges</Label>
                      <p className="text-sm text-muted-foreground font-medium">e.g. 1-3, 4, 5-7 creates 3 separate PDFs</p>
                    </div>
                    {mode === "range" && (
                      <Input
                        value={range}
                        onChange={e => setRange(e.target.value)}
                        placeholder="e.g. 1-3, 4, 5-7"
                        className="max-w-md h-12 bg-background border-2 focus-visible:ring-pink-500"
                        onClick={e => e.stopPropagation()}
                      />
                    )}
                  </div>
                </div>
              </RadioGroup>
            </div>

            {results.length > 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pt-6 border-t">
                <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-2xl -mr-4 -mt-4" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <p className="font-bold text-lg text-emerald-900 dark:text-emerald-100">{results.length} file{results.length !== 1 ? "s" : ""} extracted successfully</p>
                    </div>
                    <Button onClick={downloadAll} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full sm:w-auto h-12 px-6 shadow-md shadow-emerald-600/20">
                      <Download className="mr-2 h-5 w-5" /> Download All ZIP
                    </Button>
                  </div>
                </Card>
                
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-background border rounded-xl hover:border-emerald-200 transition-colors">
                      <FileText className="h-5 w-5 text-pink-500 shrink-0" />
                      <span className="flex-1 text-sm font-semibold truncate text-foreground">{r.name}</span>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">{formatSize(r.bytes.length)}</span>
                      <Button variant="outline" size="sm" onClick={() => downloadOne(r)} className="shrink-0 font-semibold border-dashed">
                        <Download className="h-4 w-4 mr-1.5" /> Save
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <Button onClick={split} disabled={isProcessing || (mode === "range" && !range.trim())} className="w-full h-14 text-lg font-bold shadow-lg shadow-pink-500/20 bg-pink-600 hover:bg-pink-700 text-white transition-all hover:scale-[1.01] mt-6">
                {isProcessing ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" />Splitting PDF...</> : "Split PDF Document"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}