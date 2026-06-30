import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, Wrench, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function RepairPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => { setFile(f); setResult(null); setError(null); setPageCount(0); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") handleFile(f);
  };

  const process = async () => {
    if (!file) return;
    setIsProcessing(true); setError(null); setResult(null);
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, {
        ignoreEncryption: true,
        updateMetadata: false,
      });
      setPageCount(doc.getPageCount());
      const bytes = await doc.save({ useObjectStreams: true });
      setResult(bytes);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Could not repair this PDF. The file may be severely corrupted or in an unsupported format. (${msg.slice(0, 120)})`);
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
    a.download = `repaired-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Repair PDF</h2>
        <p className="text-muted-foreground mt-1">Recover and rebuild a corrupted or damaged PDF file.</p>
      </div>

      <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          This tool works by re-parsing and rebuilding the PDF structure. It fixes structural corruption and malformed cross-reference tables. Severely corrupted files may not be recoverable.
        </p>
      </Card>

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
                  <Wrench className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-medium text-lg">{isDragging ? "Drop PDF here" : "Click or drag a damaged PDF"}</p>
                  <p className="text-sm text-muted-foreground mt-1">We will attempt to parse and rebuild its structure</p>
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
                <p className="text-sm text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); setError(null); }} className="shrink-0">Change File</Button>
            </Card>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-4 border-destructive/40 bg-destructive/5">
                  <p className="text-sm text-destructive">{error}</p>
                </Card>
              </motion.div>
            )}

            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <p className="font-semibold text-emerald-900 dark:text-emerald-300">PDF Repaired Successfully</p>
                      </div>
                      <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-1">{pageCount} page{pageCount !== 1 ? "s" : ""} recovered — {formatSize(result.length)}</p>
                    </div>
                    <Button onClick={download} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 px-6" data-testid="button-download">
                      <Download className="mr-2 h-5 w-5" /> Download Repaired PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={process} disabled={isProcessing} className="w-full h-12 text-base font-medium" data-testid="button-repair">
                {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Repairing PDF...</> : "Repair PDF"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
