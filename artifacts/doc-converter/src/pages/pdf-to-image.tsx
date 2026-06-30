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
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-1">
          Convert
        </div>
        <h2 className="text-3xl font-bold tracking-tight">PDF to Images</h2>
        <p className="text-muted-foreground text-lg">Convert every page of a PDF into a high-quality image file.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn(
                "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
                isDragging ? "border-indigo-500 bg-indigo-500/5 scale-[1.02] shadow-xl shadow-indigo-500/10" : "border-border hover:border-indigo-500/50 hover:bg-muted/50 hover:shadow-lg cursor-pointer"
              )}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isDragging && <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full" />}
              <div className="flex flex-col items-center justify-center space-y-5 text-center relative z-10">
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300 shadow-sm",
                  isDragging ? "bg-indigo-500 text-white scale-110 shadow-indigo-500/25 shadow-lg" : "bg-background border shadow-sm text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/25"
                )}>
                  <ImageIcon className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-xl">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground/80 font-medium">Each page becomes a separate image</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="options" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl border bg-muted/30">
              <div className="h-14 w-14 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-lg text-foreground">{file.name}</p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResults([]); }} className="shrink-0 font-semibold border-dashed">Change File</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t">
              <div className="space-y-4">
                <Label className="text-lg font-bold">Output Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ImageFormat)}>
                  <SelectTrigger className="h-14 text-base font-semibold border-2 focus:ring-indigo-500"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/png" className="py-2.5 font-medium">PNG (lossless)</SelectItem>
                    <SelectItem value="image/jpeg" className="py-2.5 font-medium">JPG (smaller file)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">Resolution</Label>
                  <span className="font-bold text-indigo-600 dark:text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded text-sm">{scale}x ({Math.round(scale * 72)} DPI)</span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={([v]) => setScale(v)}
                  min={1}
                  max={4}
                  step={0.5}
                  className="py-4 cursor-pointer"
                />
                <p className="text-xs font-medium text-muted-foreground">Higher = sharper, larger file. 2x is ideal for most uses.</p>
              </div>
            </div>

            {isProcessing && progress && (
              <Card className="p-6 border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800/50">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Converting pages...
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{progress.current} / {progress.total}</span>
                  </div>
                  <div className="h-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </Card>
            )}

            {results.length > 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-6 border-t mt-6 space-y-6">
                <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-2xl -mr-4 -mt-4" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <p className="font-bold text-xl text-emerald-900 dark:text-emerald-100">{results.length} image{results.length !== 1 ? "s" : ""} ready</p>
                    </div>
                    <Button onClick={downloadAll} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full sm:w-auto h-12 px-6 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105">
                      <Download className="mr-2 h-5 w-5" /> Download All ZIP
                    </Button>
                  </div>
                </Card>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border">
                  {results.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="group relative rounded-xl overflow-hidden border-2 bg-card cursor-pointer hover:border-indigo-400 transition-all shadow-sm hover:shadow-md"
                      onClick={() => downloadOne(r)}
                    >
                      <div className="aspect-[1/1.414] bg-white relative">
                        <img src={r.dataUrl} alt={r.name} className="w-full h-full object-contain p-2" loading="lazy" />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-indigo-900/20 backdrop-blur-[1px] transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button variant="secondary" size="sm" className="font-bold shadow-lg">
                          <Download className="h-4 w-4 mr-1.5" /> Save
                        </Button>
                      </div>
                      <div className="p-2.5 text-xs text-center text-foreground font-bold border-t bg-muted/30">{r.name}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : !isProcessing && (
              <Button onClick={process} className="w-full h-14 text-lg font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:scale-[1.01] mt-8">
                Convert to Images
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}