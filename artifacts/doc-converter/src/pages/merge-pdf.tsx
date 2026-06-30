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
    a.download = "merged.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Merge PDF</h2>
        <p className="text-muted-foreground mt-1">Combine multiple PDF files into a single document. Drag to reorder.</p>
      </div>

      <Card
        className={cn(
          "p-12 border-dashed transition-all duration-200 group cursor-pointer",
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "hover:border-primary/50 hover:bg-muted/50"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className={cn(
            "p-4 rounded-full transition-colors duration-200",
            isDragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          )}>
            <UploadCloud className="h-8 w-8" />
          </div>
          <div>
            <p className="font-medium text-lg">{isDragging ? "Drop PDFs here" : "Click or drag PDFs to upload"}</p>
            <p className="text-sm text-muted-foreground mt-1">Add at least 2 PDF files</p>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" multiple onChange={handleFileChange} data-testid="input-files" />
        </div>
      </Card>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Files ({files.length})</Label>
                <Button variant="ghost" size="sm" onClick={() => { setFiles([]); setMergedPdf(null); }} className="text-muted-foreground hover:text-destructive">Clear all</Button>
              </div>
              <Reorder.Group axis="y" values={files} onReorder={(f) => { setFiles(f); setMergedPdf(null); }} className="space-y-2">
                {files.map((file, i) => (
                  <Reorder.Item key={`${file.name}-${file.size}-${i}`} value={file} className="flex items-center gap-4 p-3 bg-card border rounded-lg shadow-sm hover:border-primary/30 transition-colors cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" data-testid={`button-remove-${i}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            {mergedPdf ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <p className="font-semibold text-emerald-900 dark:text-emerald-300 text-lg">Merge Complete</p>
                      </div>
                      <p className="text-emerald-700/80 dark:text-emerald-400/80 mt-1 text-sm">{files.length} files combined — {formatSize(mergedPdf.length)}</p>
                    </div>
                    <Button onClick={download} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 px-6" data-testid="button-download">
                      <Download className="mr-2 h-5 w-5" /> Download Merged PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={merge} disabled={isProcessing || files.length < 2} className="w-full h-12 text-base font-medium" data-testid="button-merge">
                {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Merging...</> : `Merge ${files.length} PDF${files.length !== 1 ? "s" : ""}`}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
