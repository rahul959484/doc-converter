import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Trash2, GripVertical, Loader2, Download, CheckCircle2 } from "lucide-react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedPdf, setMergedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!).filter(f => f.type === "application/pdf")]);
      setMergedPdf(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    setFiles(prev => [...prev, ...dropped]);
    setMergedPdf(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setMergedPdf(null);
  };

  const merge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const ab = await file.arrayBuffer();
        const doc = await PDFDocument.load(ab);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      setMergedPdf(bytes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (!mergedPdf) return;
    const blob = new Blob([mergedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged-document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-1">
          PDF Tools
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Merge PDF</h2>
        <p className="text-muted-foreground text-lg">Combine multiple PDF files into a single document. Drag to reorder.</p>
      </div>

      <AnimatePresence mode="wait">
        {!mergedPdf ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <Card
              className={cn(
                "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
                isDragging ? "border-purple-500 bg-purple-500/5 scale-[1.02] shadow-xl shadow-purple-500/10" : "border-border hover:border-purple-500/50 hover:bg-muted/50 hover:shadow-lg cursor-pointer"
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isDragging && <div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-full" />}
              <div className="flex flex-col items-center justify-center space-y-5 text-center relative z-10">
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300 shadow-sm",
                  isDragging ? "bg-purple-500 text-white scale-110 shadow-purple-500/25 shadow-lg" : "bg-background border shadow-sm text-purple-500 group-hover:bg-purple-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/25"
                )}>
                  <UploadCloud className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-xl">{isDragging ? "Drop PDFs here" : "Click or drag PDFs to upload"}</p>
                  <p className="text-sm text-muted-foreground/80 font-medium">Add at least 2 PDF files to merge</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" multiple onChange={handleFileChange} />
              </div>
            </Card>

            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <Label className="text-base font-semibold">Documents Queue ({files.length})</Label>
                    <Button variant="ghost" size="sm" onClick={() => { setFiles([]); setMergedPdf(null); }} className="text-muted-foreground hover:text-destructive font-medium">Clear all</Button>
                  </div>
                  <Reorder.Group axis="y" values={files} onReorder={(f) => { setFiles(f); setMergedPdf(null); }} className="space-y-3">
                    {files.map((file, i) => (
                      <Reorder.Item key={`${file.name}-${file.size}-${i}`} value={file} className="flex items-center gap-4 p-3 bg-background border rounded-xl shadow-sm hover:border-purple-500/40 hover:shadow-md transition-all group">
                        <div className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground/50 group-hover:text-foreground transition-colors">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0 border border-purple-500/10">
                          <FileText className="h-6 w-6 text-purple-600 dark:text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{file.name}</p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">{formatSize(file.size)}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 shrink-0 mr-1">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>

                <Button onClick={merge} disabled={isProcessing || files.length < 2} className="w-full h-14 text-lg font-bold shadow-lg shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 text-white transition-all hover:scale-[1.01] mt-6">
                  {isProcessing ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" />Merging Files...</> : `Merge ${files.length} PDF${files.length !== 1 ? "s" : ""}`}
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50 relative overflow-hidden shadow-lg shadow-emerald-500/5">
              <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Merge Complete!</h3>
                  <p className="text-emerald-700/80 dark:text-emerald-400/80 max-w-sm mx-auto font-medium">
                    {files.length} PDF files have been successfully combined. ({formatSize(mergedPdf.length)})
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                  <Button variant="outline" onClick={() => {setMergedPdf(null); setFiles([]);}} className="h-12 px-6 font-semibold border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                    Merge More
                  </Button>
                  <Button onClick={download} className="h-12 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-105">
                    <Download className="mr-2 h-5 w-5" /> Download Merged PDF
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}