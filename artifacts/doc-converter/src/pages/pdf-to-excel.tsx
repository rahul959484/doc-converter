import { useState, useRef } from "react";
import * as pdfjs from "pdfjs-dist";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).href;

export default function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f); setDone(false);
    const ab = await f.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
    setPageCount(pdf.numPages);
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

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true); setDone(false);
    try {
      const ab = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
      const wb = XLSX.utils.book_new();

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();

        const rows: string[][] = [];
        let currentRow: string[] = [];
        let lastY: number | null = null;

        for (const item of content.items) {
          if ("str" in item) {
            const textItem = item as { str: string; transform: number[] };
            const y = Math.round(textItem.transform[5]);
            if (lastY !== null && Math.abs(y - lastY) > 3) {
              if (currentRow.some(c => c.trim())) rows.push(currentRow);
              currentRow = [textItem.str];
            } else {
              currentRow.push(textItem.str);
            }
            lastY = y;
          }
        }
        if (currentRow.some(c => c.trim())) rows.push(currentRow);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, `Page ${p}`);
      }

      const xlsxBytes = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([xlsxBytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + ".xlsx";
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">PDF to Excel</h2>
        <p className="text-muted-foreground mt-1">Extract text content from PDF pages into an XLSX spreadsheet — no uploads.</p>
      </div>

      <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Each PDF page becomes a spreadsheet tab with extracted text. Complex merged cells and precise table layouts require server-side processing.
        </p>
      </Card>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn("p-14 border-dashed cursor-pointer group transition-all duration-200", isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "hover:border-primary/50 hover:bg-muted/50")}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className={cn("p-4 rounded-full transition-colors", isDragging ? "bg-primary text-primary-foreground" : "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white")}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{isDragging ? "Drop PDF here" : "Click or drag a PDF file"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Each page becomes a spreadsheet tab</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-5 flex items-center gap-4 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/40 rounded flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{pageCount} pages → {pageCount} sheet{pageCount !== 1 ? "s" : ""} — {formatSize(file.size)}</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setDone(false); setPageCount(0); }} className="shrink-0">Change</Button>
            </Card>

            {done && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex items-center gap-2 pl-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">XLSX downloaded successfully!</p>
                  </div>
                </Card>
              </motion.div>
            )}

            <Button onClick={convert} disabled={isProcessing} className="w-full h-12 text-base font-medium">
              {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing {pageCount} pages...</> : <><Download className="mr-2 h-5 w-5" />Convert to XLSX</>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
