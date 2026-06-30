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
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Add Page Numbers</h2>
        <p className="text-muted-foreground mt-1">Stamp page numbers onto every page of your PDF.</p>
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
                  <Hash className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-medium text-lg">{isDragging ? "Drop PDF here" : "Click or drag a PDF to upload"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Page numbers added entirely in your browser</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-base font-medium">Number Format</Label>
                <Select value={format} onValueChange={(v) => { setFormat(v as Format); setResult(null); }}>
                  <SelectTrigger data-testid="select-format"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1, 2, 3...</SelectItem>
                    <SelectItem value="Page 1">Page 1, Page 2...</SelectItem>
                    <SelectItem value="1 / N">1 / 12, 2 / 12...</SelectItem>
                    <SelectItem value="Page 1 of N">Page 1 of 12...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Position</Label>
                <Select value={position} onValueChange={(v) => { setPosition(v as Position); setResult(null); }}>
                  <SelectTrigger data-testid="select-position"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-from" className="text-base font-medium">Start Numbering From</Label>
                <Input
                  id="start-from"
                  type="number"
                  min="1"
                  value={startFrom}
                  onChange={e => { setStartFrom(e.target.value); setResult(null); }}
                  className="max-w-xs"
                  data-testid="input-start-from"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size" className="text-base font-medium">Font Size (pt)</Label>
                <Input
                  id="font-size"
                  type="number"
                  min="6"
                  max="36"
                  value={fontSize}
                  onChange={e => { setFontSize(e.target.value); setResult(null); }}
                  className="max-w-xs"
                  data-testid="input-font-size"
                />
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border text-sm text-muted-foreground">
              Preview: page numbers will appear as <span className="font-mono font-medium text-foreground">{getLabel(0, pageCount)}</span>, <span className="font-mono font-medium text-foreground">{getLabel(1, pageCount)}</span>... at {POSITIONS.find(p => p.value === position)?.label}.
            </div>

            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">Page Numbers Added — {formatSize(result.length)}</p>
                    </div>
                    <Button onClick={download} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 px-6" data-testid="button-download">
                      <Download className="mr-2 h-5 w-5" /> Download PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={process} disabled={isProcessing} className="w-full h-12 text-base font-medium" data-testid="button-apply">
                {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Adding Numbers...</> : "Add Page Numbers"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
