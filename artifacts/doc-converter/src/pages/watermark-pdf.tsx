import { useState, useRef } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
          rotate: { type: "degrees" as const, angle },
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
    const blob = new Blob([result], { type: "application/pdf" });
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
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Add Watermark</h2>
        <p className="text-muted-foreground mt-1">Stamp a diagonal text watermark on every page of your PDF.</p>
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
                  <Stamp className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-medium text-lg">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Configure watermark text and style below</p>
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
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} className="shrink-0">Change File</Button>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="wm-text" className="text-base font-medium">Watermark Text</Label>
                <Input
                  id="wm-text"
                  value={text}
                  onChange={e => { setText(e.target.value); setResult(null); }}
                  placeholder="e.g. CONFIDENTIAL"
                  maxLength={40}
                  data-testid="input-watermark-text"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Font Size — {fontSize}pt</Label>
                <Slider
                  value={[fontSize]}
                  onValueChange={([v]) => { setFontSize(v); setResult(null); }}
                  min={24}
                  max={120}
                  step={4}
                  className="pt-2"
                  data-testid="slider-font-size"
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label className="text-base font-medium">Opacity — {Math.round(opacity * 100)}%</Label>
                <Slider
                  value={[opacity * 100]}
                  onValueChange={([v]) => { setOpacity(v / 100); setResult(null); }}
                  min={5}
                  max={60}
                  step={5}
                  className="pt-2"
                  data-testid="slider-opacity"
                />
                <p className="text-xs text-muted-foreground">Lower opacity = more subtle. Typical range is 10–30%.</p>
              </div>
            </div>

            <div className="p-4 bg-muted/40 rounded-lg border border-dashed flex items-center justify-center min-h-24">
              <p
                className="font-bold text-muted-foreground select-none"
                style={{ fontSize: Math.max(14, fontSize * 0.4), opacity, transform: "rotate(-20deg)" }}
              >
                {text || "WATERMARK"}
              </p>
            </div>

            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">Watermark Applied — {formatSize(result.length)}</p>
                    </div>
                    <Button onClick={download} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 px-6" data-testid="button-download">
                      <Download className="mr-2 h-5 w-5" /> Download PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={process} disabled={isProcessing || !text.trim()} className="w-full h-12 text-base font-medium" data-testid="button-apply">
                {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Applying Watermark...</> : "Apply Watermark"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
