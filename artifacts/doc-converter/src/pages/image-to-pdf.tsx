import { useState, useRef } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UploadCloud, File, Trash2, GripVertical, Loader2, FileImage, Download, CheckCircle2 } from "lucide-react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ImageToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orientation, setOrientation] = useState<"p" | "l">("p");
  const [margin, setMargin] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      setResultUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      setFiles((prev) => [...prev, ...droppedFiles]);
      setResultUrl(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResultUrl(null);
  };

  const processToPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      const doc = new jsPDF({ orientation, unit: "px", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      for (let i = 0; i < files.length; i++) {
        if (i > 0) doc.addPage();
        
        const file = files[i];
        const url = URL.createObjectURL(file);
        
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;
            
            const maxW = pageWidth - margin * 2;
            const maxH = pageHeight - margin * 2;

            const ratio = Math.min(maxW / imgWidth, maxH / imgHeight);
            
            const w = imgWidth * ratio;
            const h = imgHeight * ratio;
            
            const x = margin + (maxW - w) / 2;
            const y = margin + (maxH - h) / 2;
            
            doc.addImage(img, file.type === 'image/png' ? 'PNG' : 'JPEG', x, y, w, h);
            URL.revokeObjectURL(url);
            resolve();
          };
        });
      }
      
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "converted-document.pdf";
    a.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-1">
          Convert
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Image to PDF</h2>
        <p className="text-muted-foreground text-lg">Convert multiple images into a single PDF document. Drag to reorder.</p>
      </div>

      <AnimatePresence mode="wait">
        {!resultUrl ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <Card 
              className={cn(
                "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
                isDragging ? "border-primary bg-primary/5 scale-[1.02] shadow-xl shadow-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-lg"
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {isDragging && <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />}
              <div 
                className="flex flex-col items-center justify-center space-y-5 text-center cursor-pointer relative z-10"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300 shadow-sm",
                  isDragging ? "bg-primary text-primary-foreground scale-110 shadow-primary/25 shadow-lg" : "bg-background border shadow-sm text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/25"
                )}>
                  <UploadCloud className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-xl">
                    {isDragging ? "Drop images here" : "Click or drag images to upload"}
                  </p>
                  <p className="text-sm text-muted-foreground/80 font-medium">PNG, JPG, WebP, GIF, BMP supported</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileChange}
                />
              </div>
            </Card>

            {files.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 bg-card p-6 md:p-8 rounded-2xl border shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Document Orientation</Label>
                    <RadioGroup value={orientation} onValueChange={(val) => setOrientation(val as "p" | "l")} className="flex gap-4">
                      <div className="flex-1">
                        <RadioGroupItem value="p" id="p" className="peer sr-only" />
                        <Label htmlFor="p" className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                          <div className="h-12 w-8 border-2 border-current rounded-sm opacity-60 mb-2"></div>
                          <span className="font-medium">Portrait</span>
                        </Label>
                      </div>
                      <div className="flex-1">
                        <RadioGroupItem value="l" id="l" className="peer sr-only" />
                        <Label htmlFor="l" className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                          <div className="h-8 w-12 border-2 border-current rounded-sm opacity-60 mb-2 mt-4"></div>
                          <span className="font-medium">Landscape</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Page Margins</Label>
                    <RadioGroup value={margin.toString()} onValueChange={(val) => setMargin(Number(val))} className="grid grid-cols-3 gap-3">
                      <div className="relative">
                        <RadioGroupItem value="0" id="m0" className="peer sr-only" />
                        <Label htmlFor="m0" className="flex items-center justify-center rounded-xl border-2 border-muted bg-transparent p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all font-medium">None</Label>
                      </div>
                      <div className="relative">
                        <RadioGroupItem value="20" id="m20" className="peer sr-only" />
                        <Label htmlFor="m20" className="flex items-center justify-center rounded-xl border-2 border-muted bg-transparent p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all font-medium">Small</Label>
                      </div>
                      <div className="relative">
                        <RadioGroupItem value="40" id="m40" className="peer sr-only" />
                        <Label htmlFor="m40" className="flex items-center justify-center rounded-xl border-2 border-muted bg-transparent p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all font-medium">Large</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Images ({files.length})</Label>
                    <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-muted-foreground hover:text-destructive">
                      Clear all
                    </Button>
                  </div>
                  <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-3">
                    <AnimatePresence>
                      {files.map((file, i) => (
                        <Reorder.Item 
                          key={`${file.name}-${file.size}-${i}`} 
                          value={file} 
                          className="flex items-center gap-4 p-3 bg-background border rounded-xl shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
                        >
                          <div className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground/50 group-hover:text-foreground transition-colors">
                            <GripVertical className="h-5 w-5" />
                          </div>
                          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 border border-primary/10">
                            <FileImage className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-foreground">{file.name}</p>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFile(i)} className="text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 shrink-0 mr-1">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Reorder.Item>
                      ))}
                    </AnimatePresence>
                  </Reorder.Group>
                </div>

                <Button onClick={processToPdf} disabled={isProcessing} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    "Create PDF"
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50 relative overflow-hidden shadow-lg shadow-emerald-500/5">
              <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Conversion Complete!</h3>
                  <p className="text-emerald-700/80 dark:text-emerald-400/80 max-w-sm mx-auto font-medium">
                    Your {files.length} images have been successfully combined into a single PDF document.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                  <Button variant="outline" onClick={() => {setResultUrl(null); setFiles([]);}} className="h-12 px-6 font-semibold border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                    Convert More
                  </Button>
                  <Button onClick={downloadPdf} className="h-12 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-105">
                    <Download className="mr-2 h-5 w-5" /> Download PDF
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}