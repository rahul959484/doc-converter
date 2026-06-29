import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UploadCloud, File, Trash2, GripVertical, Loader2, FileImage } from "lucide-react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ImageToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orientation, setOrientation] = useState<"p" | "l">("p");
  const [margin, setMargin] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
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
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted-document.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Image to PDF</h2>
        <p className="text-muted-foreground mt-1">Convert multiple images into a single PDF document. Drag to reorder.</p>
      </div>

      <Card 
        className={cn(
          "p-12 border-dashed transition-all duration-200 group relative overflow-hidden",
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "hover:border-primary/50 hover:bg-muted/50"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div 
          className="flex flex-col items-center justify-center space-y-4 text-center cursor-pointer relative z-10"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={cn(
            "p-4 rounded-full transition-colors duration-200",
            isDragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          )}>
            <UploadCloud className="h-8 w-8" />
          </div>
          <div>
            <p className="font-medium text-lg">
              {isDragging ? "Drop images here" : "Click or drag images to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WebP, GIF, BMP supported</p>
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
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-base font-medium">Document Orientation</Label>
              <RadioGroup value={orientation} onValueChange={(val) => setOrientation(val as "p" | "l")} className="flex gap-6">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="p" id="p" />
                  <Label htmlFor="p" className="cursor-pointer">Portrait</Label>
                </div>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="l" id="l" />
                  <Label htmlFor="l" className="cursor-pointer">Landscape</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-4">
              <Label className="text-base font-medium">Page Margins</Label>
              <RadioGroup value={margin.toString()} onValueChange={(val) => setMargin(Number(val))} className="flex gap-6">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="0" id="m0" />
                  <Label htmlFor="m0" className="cursor-pointer">None</Label>
                </div>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="20" id="m20" />
                  <Label htmlFor="m20" className="cursor-pointer">Small</Label>
                </div>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="40" id="m40" />
                  <Label htmlFor="m40" className="cursor-pointer">Large</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Images ({files.length})</Label>
              <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-muted-foreground hover:text-destructive">
                Clear all
              </Button>
            </div>
            <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-2">
              <AnimatePresence>
                {files.map((file, i) => (
                  <Reorder.Item 
                    key={`${file.name}-${file.size}-${i}`} 
                    value={file} 
                    className="flex items-center gap-4 p-3 bg-card border rounded-lg shadow-sm hover:border-primary/30 transition-colors"
                  >
                    <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                      <FileImage className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </div>

          <Button onClick={processToPdf} disabled={isProcessing} className="w-full h-12 text-base font-medium">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating PDF...
              </>
            ) : (
              "Download PDF"
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}