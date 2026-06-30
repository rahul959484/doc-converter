import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function RemovePages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f); setResult(null); setSelected(new Set());
    const ab = await f.arrayBuffer();
    const doc = await PDFDocument.load(ab);
    setPageCount(doc.getPageCount());
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") handleFile(f);
  };

  const togglePage = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
    setResult(null);
  };

  const selectAll = () => {
    setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i)));
    setResult(null);
  };

  const clearAll = () => { setSelected(new Set()); setResult(null); };

  const process = async () => {
    if (!file || selected.size === 0 || selected.size === pageCount) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const src = await PDFDocument.load(ab);
      const newDoc = await PDFDocument.create();
      const keep = Array.from({ length: pageCount }, (_, i) => i).filter(i => !selected.has(i));
      const pages = await newDoc.copyPages(src, keep);
      pages.forEach(p => newDoc.addPage(p));
      setResult(await newDoc.save());
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    const blob = new Blob([result], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trimmed-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";
  const remaining = pageCount - selected.size;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Remove Pages</h2>
        <p className="text-muted-foreground mt-1">Select the pages you want to delete, then download the trimmed PDF.</p>
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
                  <Trash2 className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-medium text-lg">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Select pages to remove after upload</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} data-testid="input-file" />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 border-primary/20 bg-primary/5">
              <div className="h-12 w-12 bg-primary/20 rounded flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{pageCount} pages — {formatSize(file.size)}</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} className="shrink-0">Change File</Button>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Select pages to remove
                  {selected.size > 0 && (
                    <span className="ml-2 text-sm font-normal text-destructive">({selected.size} selected — {remaining} will remain)</span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs text-muted-foreground">Select all</Button>
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground">Deselect all</Button>
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => togglePage(i)}
                    className={cn(
                      "aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center text-xs font-semibold transition-all duration-150 relative overflow-hidden",
                      selected.has(i)
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-muted-foreground"
                    )}
                    data-testid={`page-${i + 1}`}
                  >
                    {selected.has(i) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </div>
                    )}
                    <span className="relative z-10">{i + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {selected.size === pageCount && (
              <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <p className="text-sm text-amber-800 dark:text-amber-200">You cannot remove all pages. Deselect at least one page to keep.</p>
              </Card>
            )}

            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">{remaining} pages remaining — {formatSize(result.length)}</p>
                    </div>
                    <Button onClick={download} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 px-6" data-testid="button-download">
                      <Download className="mr-2 h-5 w-5" /> Download PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button
                onClick={process}
                disabled={isProcessing || selected.size === 0 || selected.size === pageCount}
                className="w-full h-12 text-base font-medium"
                variant={selected.size > 0 ? "destructive" : "default"}
                data-testid="button-remove"
              >
                {isProcessing
                  ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Removing Pages...</>
                  : selected.size === 0 ? "Select pages to remove" : `Remove ${selected.size} Page${selected.size !== 1 ? "s" : ""}`}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
