import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ExcelToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f); setDone(false); setSheets([]); setActiveSheet(0);
    const ab = await f.arrayBuffer();
    const wb = XLSX.read(ab, { type: "array" });
    const parsed = wb.SheetNames.map(name => {
      const ws = wb.Sheets[name];
      const html = XLSX.utils.sheet_to_html(ws);
      return { name, html };
    });
    setSheets(parsed);
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
    if (!sheets.length) return;
    setIsProcessing(true); setDone(false);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        const container = document.createElement("div");
        container.style.cssText = "position:fixed;left:-9999px;top:0;width:1060px;background:#fff;padding:32px;font-family:Calibri,Arial,sans-serif;font-size:11px;";
        container.innerHTML = `<style>table{border-collapse:collapse;width:100%;font-size:11px;}td,th{border:1px solid #d0d0d0;padding:4px 8px;white-space:nowrap;}th,tr:first-child td{background:#f0f0f0;font-weight:600;}tr:nth-child(even) td{background:#f9f9f9;}</style><h3 style="margin-bottom:12px;font-size:13px;color:#444;">${sheet.name}</h3>${sheet.html}`;
        document.body.appendChild(container);
        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(container, { scale: 1.5, backgroundColor: "#ffffff", width: 1060 });
        document.body.removeChild(container);

        const imgData = canvas.toDataURL("image/png");
        const imgH = (canvas.height / canvas.width) * pageW;

        if (i > 0) pdf.addPage();
        let y = 0;
        let first = true;
        while (y < imgH) {
          if (!first) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, -y, pageW, imgH);
          y += pageH; first = false;
        }
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
        <h2 className="text-2xl font-semibold tracking-tight">Excel to PDF</h2>
        <p className="text-muted-foreground mt-1">Convert XLSX spreadsheets to PDF — all sheets included, no uploads.</p>
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
                <div className={cn("p-4 rounded-full transition-colors", isDragging ? "bg-primary text-primary-foreground" : "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white")}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{isDragging ? "Drop file here" : "Click or drag an Excel file"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports .xlsx, .xls, .csv</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-5 flex items-center gap-4 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/40 rounded flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{sheets.length} sheet{sheets.length !== 1 ? "s" : ""} — {formatSize(file.size)}</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setSheets([]); setDone(false); }} className="shrink-0">Change</Button>
            </Card>

            {sheets.length > 0 && (
              <div className="space-y-3">
                {sheets.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {sheets.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSheet(i)}
                        className={cn("px-3 py-1 rounded-md text-xs font-medium border transition-colors", activeSheet === i ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                      >{s.name}</button>
                    ))}
                  </div>
                )}
                <div className="rounded-xl border bg-white dark:bg-zinc-50 max-h-64 overflow-auto shadow-inner">
                  <div
                    className="p-3 text-xs [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 [&_td]:text-gray-800 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold [&_th]:text-gray-700"
                    dangerouslySetInnerHTML={{ __html: sheets[activeSheet]?.html ?? "" }}
                  />
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

            <Button onClick={convert} disabled={isProcessing || !sheets.length} className="w-full h-12 text-base font-medium">
              {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Converting {sheets.length} sheet{sheets.length !== 1 ? "s" : ""}...</> : <><Download className="mr-2 h-5 w-5" />Convert to PDF</>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
