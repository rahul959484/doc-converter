import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2 } from "lucide-react";
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
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Split PDF</h2>
        <p className="text-muted-foreground mt-1">Extract pages from a PDF into separate files.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn("p-12 border-dashed transition-all duration-200 group cursor-pointer", isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "hover:border-primary/50 hover:bg-muted/50")}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className={cn("p-4 rounded-full transition-colors duration-200", isDragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground")}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-medium text-lg">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Select how to split once uploaded</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} data-testid="input-file" />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="options" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 border-primary/20 bg-primary/5">
              <div className="h-12 w-12 bg-primary/20 rounded flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{pageCount} pages</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResults([]); }} className="shrink-0">Change File</Button>
            </Card>

            <div className="space-y-4">
              <Label className="text-base font-medium">Split Mode</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "all" | "range")} className="space-y-3">
                <div className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setMode("all")}>
                  <RadioGroupItem value="all" id="all" className="mt-0.5" />
                  <div>
                    <Label htmlFor="all" className="cursor-pointer font-medium">Extract all pages</Label>
                    <p className="text-sm text-muted-foreground">Creates one PDF per page ({pageCount} files)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setMode("range")}>
                  <RadioGroupItem value="range" id="range" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="range" className="cursor-pointer font-medium">Custom ranges</Label>
                    <p className="text-sm text-muted-foreground mb-2">e.g. 1-3, 4, 5-7 creates 3 separate PDFs</p>
                    {mode === "range" && (
                      <Input
                        value={range}
                        onChange={e => setRange(e.target.value)}
                        placeholder="e.g. 1-3, 4, 5-7"
                        className="max-w-xs"
                        data-testid="input-range"
                        onClick={e => e.stopPropagation()}
                      />
                    )}
                  </div>
                </div>
              </RadioGroup>
            </div>

            {results.length > 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex items-center justify-between pl-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">{results.length} file{results.length !== 1 ? "s" : ""} ready</p>
                    </div>
                    <Button onClick={downloadAll} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-download-all">
                      <Download className="mr-2 h-4 w-4" /> Download All
                    </Button>
                  </div>
                </Card>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-card border rounded-lg" data-testid={`result-${i}`}>
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="flex-1 text-sm font-medium truncate">{r.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatSize(r.bytes.length)}</span>
                      <Button variant="ghost" size="icon" onClick={() => downloadOne(r)} className="shrink-0 h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <Button onClick={split} disabled={isProcessing || (mode === "range" && !range.trim())} className="w-full h-12 text-base font-medium" data-testid="button-split">
                {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Splitting...</> : "Split PDF"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
