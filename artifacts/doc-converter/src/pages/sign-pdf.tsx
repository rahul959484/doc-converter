import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, PenLine, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [targetPage, setTargetPage] = useState("last");
  const [position, setPosition] = useState<"bottom-left" | "bottom-right" | "bottom-center">("bottom-right");
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasSignature(true);
    }
    lastPos.current = pos;
  };

  const stopDraw = () => { setIsDrawing(false); lastPos.current = null; };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setResult(null);
  };

  const handleFile = async (f: File) => {
    setFile(f); setResult(null);
    const ab = await f.arrayBuffer();
    const doc = await PDFDocument.load(ab);
    setPageCount(doc.getPageCount());
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

  const process = async () => {
    if (!file || !hasSignature) return;
    setIsProcessing(true);
    try {
      const canvas = canvasRef.current!;
      const sigDataUrl = canvas.toDataURL("image/png");
      const sigResponse = await fetch(sigDataUrl);
      const sigBytes = new Uint8Array(await sigResponse.arrayBuffer());

      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const sigImage = await doc.embedPng(sigBytes);

      const pages = doc.getPages();
      const pageIdx = targetPage === "last" ? pages.length - 1 : Math.min(Number(targetPage) - 1, pages.length - 1);
      const page = pages[Math.max(0, pageIdx)];
      const { width, height } = page.getSize();

      const sigW = 180;
      const sigH = (sigImage.height / sigImage.width) * sigW;
      const margin = 30;

      let x = 0, y = margin;
      if (position === "bottom-left") x = margin;
      else if (position === "bottom-right") x = width - sigW - margin;
      else x = (width - sigW) / 2;

      page.drawImage(sigImage, { x, y, width: sigW, height: sigH });
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
    a.download = `signed-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sign PDF</h2>
        <p className="text-muted-foreground mt-1">Draw your signature and place it on any page of your PDF.</p>
      </div>

      {/* Signature Canvas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium flex items-center gap-2"><PenLine className="h-4 w-4" /> Draw Your Signature</Label>
          <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-muted-foreground hover:text-destructive gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
        <div className="rounded-xl border-2 border-dashed border-border bg-white overflow-hidden" style={{ cursor: "crosshair" }}>
          <canvas
            ref={canvasRef}
            width={700}
            height={180}
            className="w-full touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            data-testid="canvas-signature"
          />
        </div>
        {!hasSignature && (
          <p className="text-xs text-muted-foreground text-center">Sign inside the box above using your mouse or finger</p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn("p-10 border-dashed transition-all duration-200 group cursor-pointer", isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "hover:border-primary/50 hover:bg-muted/50")}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center space-y-3 text-center">
                <div className={cn("p-3 rounded-full transition-colors", isDragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground")}>
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-medium">{isDragging ? "Drop PDF here" : "Click or drag a PDF to sign"}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">PDF will receive your signature</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} data-testid="input-file" />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="options" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 border-primary/20 bg-primary/5">
              <div className="h-12 w-12 bg-primary/20 rounded flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{pageCount} pages — {formatSize(file.size)}</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} className="shrink-0">Change File</Button>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Place On Page</Label>
                <Select value={targetPage} onValueChange={v => { setTargetPage(v); setResult(null); }}>
                  <SelectTrigger data-testid="select-page"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last">Last page</SelectItem>
                    <SelectItem value="1">Page 1</SelectItem>
                    {Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => i + 2).map(n => (
                      <SelectItem key={n} value={String(n)}>Page {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Signature Position</Label>
                <Select value={position} onValueChange={v => { setPosition(v as typeof position); setResult(null); }}>
                  <SelectTrigger data-testid="select-position"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">Signature Applied — {formatSize(result.length)}</p>
                    </div>
                    <Button onClick={download} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 px-6" data-testid="button-download">
                      <Download className="mr-2 h-5 w-5" /> Download Signed PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Button onClick={process} disabled={isProcessing || !hasSignature} className="w-full h-12 text-base font-medium" data-testid="button-sign">
                {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Signing...</>
                  : !hasSignature ? "Draw your signature first" : "Apply Signature to PDF"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
