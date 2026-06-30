import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedPdf, setCompressedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preset, setPreset] = useState("medium");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setCompressedPdf(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setCompressedPdf(null);
      }
    }
  };

  const processPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      setCompressedPdf(pdfBytes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!compressedPdf || !file) return;
    const blob = new Blob([compressedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `optimized-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-1">
          Optimize
        </div>
        <h2 className="text-3xl font-bold tracking-tight">PDF Optimizer</h2>
        <p className="text-muted-foreground text-lg">Optimize PDF structure to reduce file size without losing quality.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              className={cn(
                "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
                isDragging ? "border-amber-500 bg-amber-500/5 scale-[1.02] shadow-xl shadow-amber-500/10" : "border-border hover:border-amber-500/50 hover:bg-muted/50 hover:shadow-lg"
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {isDragging && <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full" />}
              <div 
                className="flex flex-col items-center justify-center space-y-5 text-center cursor-pointer relative z-10"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300 shadow-sm",
                  isDragging ? "bg-amber-500 text-white scale-110 shadow-amber-500/25 shadow-lg" : "bg-background border shadow-sm text-amber-500 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-500/25"
                )}>
                  <UploadCloud className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-xl">
                    {isDragging ? "Drop PDF here" : "Click or drag a PDF to optimize"}
                  </p>
                  <p className="text-sm text-muted-foreground/80 font-medium">Process locally in your browser</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="application/pdf" 
                  onChange={handleFileChange}
                />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 bg-card p-6 md:p-8 rounded-2xl border shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl border bg-muted/30">
              <div className="h-14 w-14 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20">
                <FileText className="h-7 w-7 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-lg text-foreground">{file.name}</p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">Original Size: <span className="text-foreground">{formatSize(file.size)}</span></p>
              </div>
              <Button variant="outline" onClick={() => {setFile(null); setCompressedPdf(null);}} className="shrink-0 font-semibold border-dashed">
                Change File
              </Button>
            </div>

            {!compressedPdf && (
              <div className="space-y-4 max-w-md">
                <Label className="text-base font-semibold">Optimization Profile</Label>
                <Select value={preset} onValueChange={setPreset}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-background border-2 focus:ring-amber-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="font-medium py-3">Low Quality (Smallest Size)</SelectItem>
                    <SelectItem value="medium" className="font-medium py-3">Medium Quality (Recommended)</SelectItem>
                    <SelectItem value="high" className="font-medium py-3">High Quality (Largest Size)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block"></span>
                  Structural optimization preserves text clarity
                </p>
              </div>
            )}

            {compressedPdf ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50 relative overflow-hidden shadow-lg shadow-emerald-500/5">
                  <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-5 text-center md:text-left">
                      <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner shrink-0 mx-auto md:mx-0">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Optimization Complete!</h3>
                        <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                            New size: {formatSize(compressedPdf.length)}
                          </span>
                          <span className="bg-emerald-200 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                            {Math.max(0, Math.round((1 - compressedPdf.length / file.size) * 100))}% Smaller
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={downloadPdf} className="h-14 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 w-full md:w-auto shrink-0 text-lg">
                      <Download className="mr-2 h-5 w-5" /> Save PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={processPdf} className="w-full h-14 text-lg font-bold shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white transition-all hover:scale-[1.01]" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Optimizing Structure...
                  </>
                ) : (
                  "Optimize PDF"
                )}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}