import { useState, useRef } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, Stamp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.2);
  const [fontSize, setFontSize] = useState(60);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => { setFile(f); setResult(null); };

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
    if (!file || !text.trim()) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);
        const angle = Math.atan2(height, width) * (180 / Math.PI);

        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: (height - textHeight) / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(angle),
        });
      }

      setResult(await doc.save());
    } catch (e) {
      console.error(e);
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
    a.download = `watermarked-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-1">
          Enhance
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Add Watermark</h2>
        <p className="text-muted-foreground text-lg">Stamp a diagonal text watermark on every page of your PDF.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn(
                "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
                isDragging ? "border-teal-500 bg-teal-500/5 scale-[1.02] shadow-xl shadow-teal-500/10" : "border-border hover:border-teal-500/50 hover:bg-muted/50 hover:shadow-lg cursor-pointer"
              )}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isDragging && <div className="absolute inset-0 bg-teal-500/5 blur-3xl rounded-full" />}
              <div className="flex flex-col items-center justify-center space-y-5 text-center relative z-10">
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300 shadow-sm",
                  isDragging ? "bg-teal-500 text-white scale-110 shadow-teal-500/25 shadow-lg" : "bg-background border shadow-sm text-teal-500 group-hover:bg-teal-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-teal-500/25"
                )}>
                  <Stamp className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-xl">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground/80 font-medium">Configure watermark text and style after upload</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="options" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl border bg-muted/30">
              <div className="h-14 w-14 bg-teal-500/10 rounded-xl flex items-center justify-center shrink-0 border border-teal-500/20">
                <FileText className="h-7 w-7 text-teal-600 dark:text-teal-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-lg text-foreground">{file.name}</p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">{formatSize(file.size)}</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} className="shrink-0 font-semibold border-dashed">Change File</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
              <div className="space-y-4">
                <Label htmlFor="wm-text" className="text-lg font-bold">Watermark Text</Label>
                <Input
                  id="wm-text"
                  value={text}
                  onChange={e => { setText(e.target.value); setResult(null); }}
                  placeholder="e.g. CONFIDENTIAL"
                  maxLength={40}
                  className="h-14 text-lg font-semibold bg-background border-2 focus-visible:ring-teal-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-bold">Font Size</Label>
                  <span className="font-bold text-teal-600 dark:text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded text-sm">{fontSize}pt</span>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={([v]) => { setFontSize(v); setResult(null); }}
                  min={24}
                  max={120}
                  step={4}
                  className="py-4 cursor-pointer"
                />
              </div>

              <div className="space-y-4 md:col-span-2 border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-bold">Opacity</Label>
                  <span className="font-bold text-teal-600 dark:text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded text-sm">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  value={[opacity * 100]}
                  onValueChange={([v]) => { setOpacity(v / 100); setResult(null); }}
                  min={5}
                  max={60}
                  step={5}
                  className="py-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-8 bg-muted/20 rounded-xl border-2 border-dashed flex items-center justify-center min-h-48 relative overflow-hidden mt-6">
              <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
              <p
                className="font-extrabold text-foreground/80 select-none relative z-10 text-center uppercase tracking-widest leading-none"
                style={{ fontSize: Math.max(16, fontSize * 0.5), opacity, transform: "rotate(-25deg)" }}
              >
                {text || "WATERMARK"}
              </p>
            </div>

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
                        <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Watermark Applied!</h3>
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
              <Button onClick={process} disabled={isProcessing || !text.trim()} className="w-full h-14 text-lg font-bold shadow-lg shadow-teal-500/20 bg-teal-600 hover:bg-teal-700 text-white transition-all hover:scale-[1.01] mt-8">
                {isProcessing ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" />Applying Watermark...</> : "Apply Watermark"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}