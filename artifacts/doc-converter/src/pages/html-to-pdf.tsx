import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Download, CheckCircle2, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE = `<div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px;">
  <h1 style="color: #1a1a1a; border-bottom: 2px solid #6d28d9; padding-bottom: 12px;">My Document Title</h1>
  <p style="color: #555; line-height: 1.7;">This is a sample HTML document. You can replace this with any HTML content you want to convert to PDF.</p>
  <h2 style="color: #6d28d9; margin-top: 24px;">Section One</h2>
  <p style="color: #555; line-height: 1.7;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
  <ul style="color: #555; line-height: 2;">
    <li>First bullet point with important information</li>
    <li>Second bullet point with more details</li>
    <li>Third bullet point to wrap things up</li>
  </ul>
  <div style="background: #f3f0ff; border-left: 4px solid #6d28d9; padding: 16px; margin-top: 24px; border-radius: 4px;">
    <strong style="color: #6d28d9;">Note:</strong> <span style="color: #555;">All processing happens in your browser. No data is sent to any server.</span>
  </div>
</div>`;

export default function HtmlToPdf() {
  const [html, setHtml] = useState(SAMPLE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const convert = async () => {
    if (!html.trim()) return;
    setIsProcessing(true);
    setDone(false);
    try {
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;";
      container.innerHTML = html;
      document.body.appendChild(container);

      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 794,
      });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgW = pageW;
      const imgH = pageW / ratio;

      let yOffset = 0;
      let remaining = imgH;
      let firstPage = true;

      while (remaining > 0) {
        if (!firstPage) pdf.addPage();
        const sliceH = Math.min(remaining, pageH);
        pdf.addImage(imgData, "PNG", 0, -yOffset, imgW, imgH);
        yOffset += pageH;
        remaining -= sliceH;
        firstPage = false;
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">HTML to PDF</h2>
        <p className="text-muted-foreground mt-1">Paste any HTML content and download it as a styled PDF document.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2"><Code2 className="h-4 w-4" /> HTML Input</Label>
          <textarea
            className="w-full h-96 rounded-xl border bg-muted/30 p-4 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            value={html}
            onChange={e => { setHtml(e.target.value); setDone(false); }}
            placeholder="<h1>Your HTML here</h1>"
            spellCheck={false}
            data-testid="input-html"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">Live Preview</Label>
          <div
            className="w-full h-96 rounded-xl border bg-white overflow-auto shadow-inner"
            ref={previewRef}
          >
            <div
              className="min-h-full"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
              <div className="flex items-center gap-3 pl-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold text-emerald-900 dark:text-emerald-300">PDF downloaded successfully!</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={convert} disabled={isProcessing || !html.trim()} className="w-full h-12 text-base font-medium" data-testid="button-convert">
        {isProcessing
          ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Converting HTML...</>
          : <><Download className="mr-2 h-5 w-5" />Convert to PDF</>}
      </Button>
    </div>
  );
}
