import { useState, useRef } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ROTATION_OPTIONS = [
  { label: "90° Clockwise", value: 90 },
  { label: "180° Half Turn", value: 180 },
  { label: "90° Counter-clockwise", value: 270 },
];

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotation, setRotation] = useState(90);
  const [target, setTarget] = useState<"all" | "odd" | "even">("all");
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
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

  const process = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const pages = doc.getPages();
      pages.forEach((page, i) => {
        const apply = target === "all" || (target === "odd" && i % 2 === 0) || (target === "even" && i % 2 === 1);
        if (apply) {
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + rotation) % 360));
        }
      });
      setResult(await doc.save());
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    const blob = new Blob([result.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotated-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-1">
          PDF Tools
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Rotate PDF</h2>
        <p className="text-muted-foreground text-lg">Rotate all or selected pages of a PDF document instantly.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn(
                "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
                isDragging ? "border-rose-500 bg-rose-500/5 scale-[1.02] shadow-xl shadow-rose-500/10" : "border-border hover:border-rose-500/50 hover:bg-muted/50 hover:shadow-lg cursor-pointer"
              )}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isDragging && <div className="absolute inset-0 bg-rose-500/5 blur-3xl rounded-full" />}
              <div className="flex flex-col items-center justify-center space-y-5 text-center relative z-10">
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300 shadow-sm",
                  isDragging ? "bg-rose-500 text-white scale-110 shadow-rose-500/25 shadow-lg" : "bg-background border shadow-sm text-rose-500 group-hover:bg-rose-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-rose-500/25"
                )}>
                  <RotateCw className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-xl">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground/80 font-medium">Choose rotation options after upload</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="options" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl border bg-muted/30">
              <div className="h-14 w-14 bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0 border border-rose-500/20">
                <FileText className="h-7 w-7 text-rose-600 dark:text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-lg text-foreground">{file.name}</p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">{pageCount} pages</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} className="shrink-0 font-semibold border-dashed">Change File</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
              <div className="space-y-4">
                <Label className="text-lg font-bold">Rotation Angle</Label>
                <div className="space-y-3">
                  {ROTATION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setRotation(opt.value); setResult(null); }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                        rotation === opt.value ? "border-rose-500 bg-rose-500/5 text-rose-700 dark:text-rose-400 shadow-sm" : "hover:border-rose-500/40 hover:bg-muted/30"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", rotation === opt.value ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground")}>
                        <RotateCw className="h-5 w-5 shrink-0" style={{ transform: `rotate(${opt.value}deg)` }} />
                      </div>
                      <span className="text-base font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-bold">Apply To Pages</Label>
                <div className="space-y-3">
                  {[{ value: "all", label: "All pages in document" }, { value: "odd", label: "Odd pages only (1, 3, 5...)" }, { value: "even", label: "Even pages only (2, 4, 6...)" }].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setTarget(opt.value as "all" | "odd" | "even"); setResult(null); }}
                      className={cn(
                        "w-full flex items-center p-4 rounded-xl border-2 text-left transition-all",
                        target === opt.value ? "border-rose-500 bg-rose-500/5 text-rose-700 dark:text-rose-400 shadow-sm" : "hover:border-rose-500/40 hover:bg-muted/30"
                      )}
                    >
                      <span className="text-base font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-6 border-t mt-6">
                <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50 relative overflow-hidden shadow-lg shadow-emerald-500/5">
                  <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Rotation Applied!</h3>
                      <p className="text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                        The PDF has been rotated ({formatSize(result.length)})
                      </p>
                    </div>
                    
                    <Button onClick={download} className="h-14 px-10 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-105">
                      <Download className="mr-2 h-6 w-6" /> Download Rotated PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={process} disabled={isProcessing} className="w-full h-14 text-lg font-bold shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 text-white transition-all hover:scale-[1.01] mt-8">
                {isProcessing ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" />Applying Rotation...</> : "Rotate Document"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}