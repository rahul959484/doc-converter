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
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Organize PDF</h2>
        <p className="text-muted-foreground mt-1">Reorder or delete pages from a PDF. Drag to rearrange.</p>
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
                  <Layers className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-medium text-lg">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Reorder and remove pages visually</p>
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
                <p className="text-sm text-muted-foreground">{pages.length} of {pages.length + (result ? 0 : 0)} pages selected</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setPages([]); setResult(null); }} className="shrink-0">Change File</Button>
            </Card>

            {pages.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground border-dashed">
                All pages have been removed. Change the file or the PDF will be empty.
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">{pages.length} page{pages.length !== 1 ? "s" : ""} — drag to reorder</Label>
                  <Button variant="ghost" size="sm" onClick={() => { setPages([]); setResult(null); }} className="text-muted-foreground hover:text-destructive">Remove all</Button>
                </div>
                <Reorder.Group
                  axis="y"
                  values={pages}
                  onReorder={p => { setPages(p); setResult(null); }}
                  className="space-y-2 max-h-96 overflow-y-auto pr-1"
                >
                  <AnimatePresence>
                    {pages.map((page, i) => (
                      <Reorder.Item
                        key={page.id}
                        value={page}
                        className="flex items-center gap-4 p-3 bg-card border rounded-lg shadow-sm hover:border-primary/30 transition-colors cursor-grab active:cursor-grabbing"
                        data-testid={`page-item-${i}`}
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="h-10 w-8 bg-primary/10 rounded flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                          {page.originalIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Page {page.originalIndex + 1}</p>
                          <p className="text-xs text-muted-foreground">Position {i + 1}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePage(page.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          data-testid={`button-remove-page-${i}`}
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
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">{pages.length} pages — {formatSize(result.length)}</p>
                    </div>
                    <Button onClick={download} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 px-6" data-testid="button-download">
                      <Download className="mr-2 h-5 w-5" /> Download PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={process} disabled={isProcessing || pages.length === 0} className="w-full h-12 text-base font-medium" data-testid="button-apply">
                {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Building PDF...</> : "Apply & Download"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
