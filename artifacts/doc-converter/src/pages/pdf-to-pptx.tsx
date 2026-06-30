import { useState, useRef } from "react";
import * as pdfjs from "pdfjs-dist";
import pptxgen from "pptxgenjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).href;

export default function PdfToPptx() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f); setDone(false); setProgress(0);
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
    setIsProcessing(true); setDone(false); setProgress(0);
    try {
      const ab = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_16x9";
      const slideW = 10;
      const slideH = 5.625;

      const offscreen = document.createElement("canvas");
      offscreen.style.display = "none";
      document.body.appendChild(offscreen);

      for (let p = 1; p <= pdf.numPages; p++) {
        setProgress(Math.round((p / pdf.numPages) * 100));
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2 });
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;
        const ctx = offscreen.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgData = offscreen.toDataURL("image/jpeg", 0.9);
        const slide = pptx.addSlide();
        slide.background = { fill: "FFFFFF" };
        slide.addImage({ data: imgData, x: 0, y: 0, w: slideW, h: slideH });
      }

      document.body.removeChild(offscreen);
      const fname = file.name.replace(/\.pdf$/i, "") + ".pptx";
      await pptx.writeFile({ fileName: fname });
      setDone(true);
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">PDF to PowerPoint</h2>
        <p className="text-muted-foreground mt-1">Convert each PDF page into a PowerPoint slide as a high-quality image.</p>
      </div>

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Each PDF page is rendered as a slide image. The slides won't have editable text, but will look identical to the original PDF.
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
                <div className={cn("p-4 rounded-full transition-colors", isDragging ? "bg-primary text-primary-foreground" : "bg-orange-500/10 text-orange-600 group-hover:bg-orange-600 group-hover:text-white")}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{isDragging ? "Drop PDF here" : "Click or drag a PDF file"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{pageCount > 0 ? `${pageCount} slides will be created` : "Each page becomes a slide"}</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-5 flex items-center gap-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/40 rounded flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{pageCount} pages → {pageCount} slide{pageCount !== 1 ? "s" : ""} — {formatSize(file.size)}</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setDone(false); setPageCount(0); }} className="shrink-0">Change</Button>
            </Card>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Rendering slides…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>
            )}

            {done && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex items-center gap-2 pl-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">PPTX downloaded — {pageCount} slides created!</p>
                  </div>
                </Card>
              </motion.div>
            )}

            <Button onClick={convert} disabled={isProcessing} className="w-full h-12 text-base font-medium">
              {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Rendering slides… {progress}%</> : <><Download className="mr-2 h-5 w-5" />Convert to PPTX</>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
