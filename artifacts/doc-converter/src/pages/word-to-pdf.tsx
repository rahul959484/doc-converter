import { useState, useRef } from "react";
import mammoth from "mammoth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f); setDone(false); setPreview("");
    const ab = await f.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: ab });
    setPreview(result.value);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const convert = async () => {
    if (!preview) return;
    setIsProcessing(true); setDone(false);
    try {
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;padding:48px;font-family:Georgia,serif;font-size:13px;line-height:1.8;color:#1a1a1a;";
      container.innerHTML = `<style>h1,h2,h3{margin-top:1em;margin-bottom:0.4em;}p{margin-bottom:0.6em;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px 10px;}ul,ol{padding-left:1.5em;}</style>${preview}`;
      document.body.appendChild(container);
      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: 794 });
      document.body.removeChild(container);

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL("image/png");
      const imgH = (canvas.height / canvas.width) * pageW;

      let y = 0;
      let first = true;
      while (y < imgH) {
        if (!first) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -y, pageW, imgH);
        y += pageH;
        first = false;
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file!.name.replace(/\.[^.]+$/, "") + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const formatSize = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">WORD to PDF</h2>
        <p className="text-muted-foreground mt-1">Convert DOCX files to PDF — all formatting preserved, no uploads.</p>
      </div>

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
                <div className={cn("p-4 rounded-full transition-colors", isDragging ? "bg-primary text-primary-foreground" : "bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white")}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{isDragging ? "Drop DOCX here" : "Click or drag a DOCX file"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports .docx format</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-5 flex items-center gap-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/40 rounded flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setPreview(""); setDone(false); }} className="shrink-0">Change</Button>
            </Card>

            {preview && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Document preview</p>
                <div className="rounded-xl border bg-white dark:bg-zinc-50 p-6 max-h-72 overflow-auto shadow-inner">
                  <div className="text-sm text-zinc-800 leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_table]:border-collapse [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:px-2 [&_th]:py-1"
                    dangerouslySetInnerHTML={{ __html: preview }} />
                </div>
              </div>
            )}

            {done && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex items-center gap-2 pl-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">PDF downloaded successfully!</p>
                  </div>
                </Card>
              </motion.div>
            )}

            <Button onClick={convert} disabled={isProcessing || !preview} className="w-full h-12 text-base font-medium">
              {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Converting...</> : <><Download className="mr-2 h-5 w-5" />Convert to PDF</>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
