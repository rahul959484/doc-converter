import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

type ImageFormat = "image/png" | "image/jpeg";
type ImageResult = { name: string; dataUrl: string; width: number; height: number };

export default function PdfToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [scale, setScale] = useState(2);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => { setFile(f); setResults([]); };

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
    setResults([]);
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    const total = pdf.numPages;
    setProgress({ current: 0, total });
    const out: ImageResult[] = [];

    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const ext = format === "image/jpeg" ? "jpg" : "png";
      out.push({
        name: `page-${i}.${ext}`,
        dataUrl: canvas.toDataURL(format, 0.92),
        width: viewport.width,
        height: viewport.height,
      });
      setProgress({ current: i, total });
    }

    setResults(out);
    setProgress(null);
  };

  const downloadOne = (r: ImageResult) => {
    const a = document.createElement("a");
    a.href = r.dataUrl;
    a.download = r.name;
    a.click();
  };

  const downloadAll = () => results.forEach(downloadOne);

  const isProcessing = progress !== null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">PDF to Images</h2>
        <p className="text-muted-foreground mt-1">Convert every page of a PDF into a high-quality image file.</p>
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
                  <ImageIcon className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-medium text-lg">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Each page becomes a separate image</p>
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
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResults([]); }} className="shrink-0">Change File</Button>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-base font-medium">Output Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ImageFormat)}>
                  <SelectTrigger data-testid="select-format"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/png">PNG (lossless)</SelectItem>
                    <SelectItem value="image/jpeg">JPG (smaller file)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Resolution — {scale}x ({Math.round(scale * 72)} DPI)</Label>
                <Slider
                  value={[scale]}
                  onValueChange={([v]) => setScale(v)}
                  min={1}
                  max={4}
                  step={0.5}
                  className="pt-2"
                  data-testid="slider-scale"
                />
                <p className="text-xs text-muted-foreground">Higher = sharper, larger file. 2x is ideal for most uses.</p>
              </div>
            </div>

            {isProcessing && progress && (
              <Card className="p-5">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Converting pages...</span>
                    <span className="text-muted-foreground">{progress.current} / {progress.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </Card>
            )}

            {results.length > 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex items-center justify-between pl-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">{results.length} image{results.length !== 1 ? "s" : ""} ready</p>
                    </div>
                    <Button onClick={downloadAll} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-download-all">
                      <Download className="mr-2 h-4 w-4" /> Download All
                    </Button>
                  </div>
                </Card>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {results.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="group relative rounded-lg overflow-hidden border bg-card cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => downloadOne(r)}
                      data-testid={`image-result-${i}`}
                    >
                      <img src={r.dataUrl} alt={r.name} className="w-full object-contain" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Download className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-2 text-xs text-center text-muted-foreground font-medium">{r.name}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : !isProcessing && (
              <Button onClick={process} className="w-full h-12 text-base font-medium" data-testid="button-convert">
                Convert to Images
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
