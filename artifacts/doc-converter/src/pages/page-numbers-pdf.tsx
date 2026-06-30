import { useState, useRef } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
type Format = "1" | "Page 1" | "1 / N" | "Page 1 of N";

export default function PageNumbersPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [format, setFormat] = useState<Format>("Page 1");
  const [startFrom, setStartFrom] = useState("1");
  const [fontSize, setFontSize] = useState("11");
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

  const getLabel = (i: number, total: number) => {
    const n = i + (Number(startFrom) || 1);
    switch (format) {
      case "1": return `${n}`;
      case "Page 1": return `Page ${n}`;
      case "1 / N": return `${n} / ${total}`;
      case "Page 1 of N": return `Page ${n} of ${total}`;
    }
  };

  const getCoords = (pos: Position, pageWidth: number, pageHeight: number, textWidth: number, fSize: number) => {
    const margin = 20;
    const isBottom = pos.startsWith("bottom");
    const y = isBottom ? margin : pageHeight - margin - fSize;
    let x = 0;
    if (pos.endsWith("center")) x = (pageWidth - textWidth) / 2;
    else if (pos.endsWith("right")) x = pageWidth - textWidth - margin;
    else x = margin;
    return { x, y };
  };

  const process = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fSize = Number(fontSize) || 11;
      const total = doc.getPageCount();

      doc.getPages().forEach((page, i) => {
        const { width, height } = page.getSize();
        const label = getLabel(i, total);
        const textWidth = font.widthOfTextAtSize(label, fSize);
        const { x, y } = getCoords(position, width, height, textWidth, fSize);
        page.drawText(label, { x, y, size: fSize, font, color: rgb(0.3, 0.3, 0.3) });
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
    a.download = `numbered-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";

  const POSITIONS: { value: Position; label: string }[] = [
    { value: "bottom-left", label: "Bottom Left" },
    { value: "bottom-center", label: "Bottom Center" },
    { value: "bottom-right", label: "Bottom Right" },
    { value: "top-left", label: "Top Left" },
    { value: "top-center", label: "Top Center" },
    { value: "top-right", label: "Top Right" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1">
          Enhance
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Add Page Numbers</h2>
        <p className="text-muted-foreground text-lg">Stamp beautiful page numbering onto every page of your PDF.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn(
                "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
                isDragging ? "border-emerald-500 bg-emerald-500/5 scale-[1.02] shadow-xl shadow-emerald-500/10" : "border-border hover:border-emerald-500/50 hover:bg-muted/50 hover:shadow-lg cursor-pointer"
              )}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isDragging && <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full" />}
              <div className="flex flex-col items-center justify-center space-y-5 text-center relative z-10">
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300 shadow-sm",
                  isDragging ? "bg-emerald-500 text-white scale-110 shadow-emerald-500/25 shadow-lg" : "bg-background border shadow-sm text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/25"
                )}>
                  <Hash className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-xl">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground/80 font-medium">Page numbers added entirely in your browser</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="options" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl border bg-muted/30">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                <FileText className="h-7 w-7 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-lg text-foreground">{file.name}</p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">{pageCount} pages</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} className="shrink-0 font-semibold border-dashed">Change File</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t">
              <div className="space-y-4">
                <Label className="text-lg font-bold">Number Format</Label>
                <Select value={format} onValueChange={(v) => { setFormat(v as Format); setResult(null); }}>
                  <SelectTrigger className="h-14 text-base font-semibold border-2 focus:ring-emerald-500"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" className="py-2.5 font-medium">1, 2, 3...</SelectItem>
                    <SelectItem value="Page 1" className="py-2.5 font-medium">Page 1, Page 2...</SelectItem>
                    <SelectItem value="1 / N" className="py-2.5 font-medium">1 / 12, 2 / 12...</SelectItem>
                    <SelectItem value="Page 1 of N" className="py-2.5 font-medium">Page 1 of 12...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-bold">Position</Label>
                <Select value={position} onValueChange={(v) => { setPosition(v as Position); setResult(null); }}>
                  <SelectTrigger className="h-14 text-base font-semibold border-2 focus:ring-emerald-500"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(p => <SelectItem key={p.value} value={p.value} className="py-2.5 font-medium">{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="start-from" className="text-lg font-bold">Start Numbering From</Label>
                <Input
                  id="start-from"
                  type="number"
                  min="1"
                  value={startFrom}
                  onChange={e => { setStartFrom(e.target.value); setResult(null); }}
                  className="h-14 text-base font-semibold border-2 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="font-size" className="text-lg font-bold">Font Size (pt)</Label>
                <Input
                  id="font-size"
                  type="number"
                  min="6"
                  max="36"
                  value={fontSize}
                  onChange={e => { setFontSize(e.target.value); setResult(null); }}
                  className="h-14 text-base font-semibold border-2 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 flex items-center justify-center mt-4">
              <p className="font-medium text-center">
                Preview: <span className="font-bold bg-white dark:bg-black px-3 py-1 rounded shadow-sm mx-1 text-emerald-700 dark:text-emerald-400">{getLabel(0, pageCount)}</span>, <span className="font-bold bg-white dark:bg-black px-3 py-1 rounded shadow-sm mx-1 text-emerald-700 dark:text-emerald-400">{getLabel(1, pageCount)}</span>... at <span className="font-bold">{POSITIONS.find(p => p.value === position)?.label}</span>.
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
                        <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Numbers Added!</h3>
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
              <Button onClick={process} disabled={isProcessing} className="w-full h-14 text-lg font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white transition-all hover:scale-[1.01] mt-8">
                {isProcessing ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" />Adding Numbers...</> : "Add Page Numbers"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}