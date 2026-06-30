import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, Trash2, GripVertical, Layers } from "lucide-react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type PageItem = { id: number; originalIndex: number };

export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const counterRef = useRef(0);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
    const ab = await f.arrayBuffer();
    const doc = await PDFDocument.load(ab);
    const count = doc.getPageCount();
    setPages(Array.from({ length: count }, (_, i) => ({ id: counterRef.current++, originalIndex: i })));
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

  const removePage = (id: number) => {
    setPages(prev => prev.filter(p => p.id !== id));
    setResult(null);
  };

  const process = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(ab);
      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(srcDoc, pages.map(p => p.originalIndex));
      copied.forEach(p => newDoc.addPage(p));
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
    a.download = `organized-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-1">
          PDF Tools
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Organize PDF</h2>
        <p className="text-muted-foreground text-lg">Reorder or delete pages from a PDF. Drag to rearrange.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn(
                "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
                isDragging ? "border-orange-500 bg-orange-500/5 scale-[1.02] shadow-xl shadow-orange-500/10" : "border-border hover:border-orange-500/50 hover:bg-muted/50 hover:shadow-lg cursor-pointer"
              )}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isDragging && <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full" />}
              <div className="flex flex-col items-center justify-center space-y-5 text-center relative z-10">
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300 shadow-sm",
                  isDragging ? "bg-orange-500 text-white scale-110 shadow-orange-500/25 shadow-lg" : "bg-background border shadow-sm text-orange-500 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-orange-500/25"
                )}>
                  <Layers className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-xl">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground/80 font-medium">Reorder and remove pages visually</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl border bg-muted/30">
              <div className="h-14 w-14 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0 border border-orange-500/20">
                <FileText className="h-7 w-7 text-orange-600 dark:text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-lg text-foreground">{file.name}</p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">{pages.length} of {pages.length + (result ? 0 : 0)} pages selected</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setPages([]); setResult(null); }} className="shrink-0 font-semibold border-dashed">Change File</Button>
            </div>

            {pages.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground border-dashed bg-muted/20 border-2">
                <p className="font-semibold">All pages have been removed.</p>
                <p className="text-sm mt-1">Change the file or the PDF will be empty.</p>
              </Card>
            ) : (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between border-b pb-4">
                  <Label className="text-base font-semibold">{pages.length} page{pages.length !== 1 ? "s" : ""} — drag to reorder</Label>
                  <Button variant="ghost" size="sm" onClick={() => { setPages([]); setResult(null); }} className="text-muted-foreground hover:text-destructive font-medium">Remove all</Button>
                </div>
                <Reorder.Group
                  axis="y"
                  values={pages}
                  onReorder={p => { setPages(p); setResult(null); }}
                  className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                >
                  <AnimatePresence>
                    {pages.map((page, i) => (
                      <Reorder.Item
                        key={page.id}
                        value={page}
                        className="flex items-center gap-4 p-3 bg-background border rounded-xl shadow-sm hover:border-orange-500/40 hover:shadow-md transition-all group"
                      >
                        <div className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground/50 group-hover:text-foreground transition-colors">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="h-12 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0 border border-orange-500/10">
                          <span className="font-bold text-orange-600 dark:text-orange-500">{page.originalIndex + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">Page {page.originalIndex + 1}</p>
                          <p className="text-xs font-medium text-muted-foreground">Position {i + 1}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePage(page.id)}
                          className="text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 shrink-0 mr-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              </div>
            )}

            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-6 border-t mt-6">
                <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50 relative overflow-hidden shadow-lg shadow-emerald-500/5">
                  <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-5 text-center md:text-left">
                      <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner shrink-0 mx-auto md:mx-0">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Document Reorganized!</h3>
                        <p className="text-emerald-700/80 dark:text-emerald-400/80 font-medium mt-1">Ready to download ({formatSize(result.length)})</p>
                      </div>
                    </div>
                    <Button onClick={download} className="h-14 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 w-full md:w-auto text-lg">
                      <Download className="mr-2 h-5 w-5" /> Download PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={process} disabled={isProcessing || pages.length === 0} className="w-full h-14 text-lg font-bold shadow-lg shadow-orange-500/20 bg-orange-600 hover:bg-orange-700 text-white transition-all hover:scale-[1.01] mt-8">
                {isProcessing ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" />Building PDF...</> : "Apply & Download"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}