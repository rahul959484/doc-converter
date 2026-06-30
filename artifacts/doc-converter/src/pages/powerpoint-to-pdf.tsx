import { useState, useRef } from "react";
import JSZip from "jszip";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, Download, CheckCircle2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SlideData {
  index: number;
  title: string;
  body: string[];
}

function parseSlideXml(xml: string, idx: number): SlideData {
  const titleMatch = xml.match(/<p:sp>[^]*?<p:ph type="title"[^]*?<a:t>([^<]*)<\/a:t>[^]*?<\/p:sp>/);
  const title = titleMatch ? titleMatch[1].trim() : `Slide ${idx + 1}`;

  const texts: string[] = [];
  const tMatches = xml.matchAll(/<a:t>([^<]+)<\/a:t>/g);
  const titleText = titleMatch ? titleMatch[1].trim() : "";
  for (const m of tMatches) {
    const t = m[1].trim();
    if (t && t !== titleText) texts.push(t);
  }

  return { index: idx, title, body: [...new Set(texts)] };
}

export default function PowerpointToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f); setDone(false); setSlides([]);
    try {
      const ab = await f.arrayBuffer();
      const zip = await JSZip.loadAsync(ab);
      const slideFiles = Object.keys(zip.files)
        .filter(k => k.match(/^ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const na = parseInt(a.match(/\d+/)![0]);
          const nb = parseInt(b.match(/\d+/)![0]);
          return na - nb;
        });

      const parsed: SlideData[] = [];
      for (let i = 0; i < slideFiles.length; i++) {
        const xml = await zip.files[slideFiles[i]].async("string");
        parsed.push(parseSlideXml(xml, i));
      }
      setSlides(parsed);
    } catch (e) {
      console.error("Failed to parse PPTX:", e);
    }
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
    if (!slides.length) return;
    setIsProcessing(true); setDone(false); setProgress(0);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1280, 720] });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < slides.length; i++) {
        setProgress(Math.round(((i + 1) / slides.length) * 100));
        const slide = slides[i];

        const container = document.createElement("div");
        container.style.cssText = `position:fixed;left:-9999px;top:0;width:1280px;height:720px;background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);display:flex;flex-direction:column;padding:80px;box-sizing:border-box;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;`;

        const titleEl = document.createElement("h1");
        titleEl.style.cssText = "color:#fff;font-size:56px;font-weight:700;margin:0 0 32px;line-height:1.2;text-shadow:0 2px 8px rgba(0,0,0,.3);";
        titleEl.textContent = slide.title;
        container.appendChild(titleEl);

        if (slide.body.length > 0) {
          const ul = document.createElement("ul");
          ul.style.cssText = "color:rgba(255,255,255,.9);font-size:28px;line-height:1.8;padding-left:32px;margin:0;";
          slide.body.slice(0, 6).forEach(line => {
            const li = document.createElement("li");
            li.style.cssText = "margin-bottom:8px;";
            li.textContent = line;
            ul.appendChild(li);
          });
          container.appendChild(ul);
        }

        const badge = document.createElement("div");
        badge.style.cssText = "position:absolute;bottom:40px;right:60px;color:rgba(255,255,255,.4);font-size:18px;";
        badge.textContent = `${i + 1} / ${slides.length}`;
        container.appendChild(badge);
        document.body.appendChild(container);

        await new Promise(r => setTimeout(r, 80));
        const canvas = await html2canvas(container, { scale: 1, backgroundColor: null, width: 1280, height: 720 });
        document.body.removeChild(container);

        if (i > 0) pdf.addPage([1280, 720], "landscape");
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, pageH);
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
        <h2 className="text-2xl font-semibold tracking-tight">PowerPoint to PDF</h2>
        <p className="text-muted-foreground mt-1">Convert PPTX slides to PDF — text extracted and rendered locally.</p>
      </div>

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Text content is extracted from each slide and rendered as a clean PDF slide. Complex graphics and custom themes are simplified.
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
                <div className={cn("p-4 rounded-full transition-colors", isDragging ? "bg-primary text-primary-foreground" : "bg-red-500/10 text-red-600 group-hover:bg-red-600 group-hover:text-white")}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{isDragging ? "Drop PPTX here" : "Click or drag a PPTX file"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports .pptx format</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={handleFileChange} />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-5 flex items-center gap-4 border-red-200 bg-red-50 dark:bg-red-950/20">
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/40 rounded flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{slides.length} slide{slides.length !== 1 ? "s" : ""} parsed — {formatSize(file.size)}</p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setSlides([]); setDone(false); }} className="shrink-0">Change</Button>
            </Card>

            {slides.length > 0 && (
              <div className="rounded-xl border bg-muted/30 divide-y divide-border max-h-64 overflow-auto">
                {slides.map(s => (
                  <div key={s.index} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="text-xs font-mono text-muted-foreground w-6 shrink-0 pt-0.5">{s.index + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      {s.body.slice(0, 2).map((b, i) => (
                        <p key={i} className="text-xs text-muted-foreground truncate">· {b}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Rendering slides…</span><span>{progress}%</span>
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
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">PDF downloaded — {slides.length} slides converted!</p>
                  </div>
                </Card>
              </motion.div>
            )}

            <Button onClick={convert} disabled={isProcessing || !slides.length} className="w-full h-12 text-base font-medium">
              {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Converting… {progress}%</> : <><Download className="mr-2 h-5 w-5" />Convert to PDF</>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
