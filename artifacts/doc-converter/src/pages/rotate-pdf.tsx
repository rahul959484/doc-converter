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
  { label: "180°", value: 180 },
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
    const blob = new Blob([result], { type: "application/pdf" });
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
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Rotate PDF</h2>
        <p className="text-muted-foreground mt-1">Rotate all or selected pages of a PDF document.</p>
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
                  <RotateCw className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-medium text-lg">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Choose rotation options after upload</p>
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
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} className="shrink-0">Change File</Button>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Rotation Angle</Label>
                <div className="space-y-2">
                  {ROTATION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setRotation(opt.value); setResult(null); }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                        rotation === opt.value ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/40 hover:bg-muted/40"
                      )}
                      data-testid={`button-rotation-${opt.value}`}
                    >
                      <RotateCw className="h-4 w-4 shrink-0" style={{ transform: `rotate(${opt.value}deg)` }} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Apply To</Label>
                <div className="space-y-2">
                  {[{ value: "all", label: "All pages" }, { value: "odd", label: "Odd pages only" }, { value: "even", label: "Even pages only" }].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setTarget(opt.value as "all" | "odd" | "even"); setResult(null); }}
                      className={cn(
                        "w-full flex items-center p-3 rounded-lg border text-left transition-colors",
                        target === opt.value ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/40 hover:bg-muted/40"
                      )}
                      data-testid={`button-target-${opt.value}`}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">Rotation Applied — {formatSize(result.length)}</p>
                    </div>
                    <Button onClick={download} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 px-6" data-testid="button-download">
                      <Download className="mr-2 h-5 w-5" /> Download PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={process} disabled={isProcessing} className="w-full h-12 text-base font-medium" data-testid="button-rotate">
                {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Rotating...</> : "Rotate PDF"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
