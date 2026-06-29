import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileImage, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CompressTask {
  id: string;
  file: File;
  compressedFile?: File;
  status: "idle" | "processing" | "done" | "error";
  progress?: number;
}

export default function CompressImage() {
  const [tasks, setTasks] = useState<CompressTask[]>([]);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<string>("original");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
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
      addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const newTasks = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: "idle" as const,
    }));
    setTasks((prev) => [...prev, ...newTasks]);
  };

  const processImages = async () => {
    const pendingTasks = tasks.filter(t => t.status !== "done");
    if (pendingTasks.length === 0) return;

    for (const task of pendingTasks) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "processing", progress: 10 } : t));
      
      try {
        const options = {
          maxSizeMB: 5,
          useWebWorker: true,
          initialQuality: quality / 100,
          onProgress: (p: number) => {
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: p } : t));
          },
          ...(format !== "original" && { fileType: `image/${format}` })
        };
        
        const compressedFile = await imageCompression(task.file, options);
        
        setTasks(prev => prev.map(t => t.id === task.id ? { 
          ...t, 
          status: "done", 
          progress: 100,
          compressedFile 
        } : t));
      } catch (err) {
        console.error(err);
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "error" } : t));
      }
    }
  };

  const downloadAll = () => {
    tasks.filter(t => t.compressedFile).forEach(t => {
      const url = URL.createObjectURL(t.compressedFile!);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed-${t.file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";
  const calculateReduction = (original: number, compressed: number) => {
    const reduction = Math.round((1 - compressed / original) * 100);
    return reduction > 0 ? reduction : 0;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Image Compressor</h2>
        <p className="text-muted-foreground mt-1">Reduce image file size directly in your browser.</p>
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
              {isDragging ? "Drop images to compress" : "Click or drag images here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Process multiple images at once</p>
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

      {tasks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Quality ({quality}%)</Label>
              </div>
              <Slider 
                value={[quality]} 
                onValueChange={(v) => setQuality(v[0])} 
                max={100} 
                step={1} 
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">Lower quality yields smaller file size.</p>
            </div>
            <div className="space-y-4">
              <Label className="text-base font-medium">Output Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Keep Original</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Files ({tasks.length})</Label>
              <Button variant="ghost" size="sm" onClick={() => setTasks([])} className="text-muted-foreground hover:text-destructive">
                Clear all
              </Button>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-card border rounded-lg shadow-sm relative overflow-hidden"
                  >
                    {task.status === "processing" && (
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full transition-all duration-300"
                      >
                        <div 
                          className="h-full bg-primary transition-all duration-300" 
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                    )}
                    
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center shrink-0">
                      <FileImage className="h-6 w-6 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.file.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="text-muted-foreground">Original: {formatSize(task.file.size)}</span>
                        
                        {task.status === "processing" && (
                          <span className="text-primary font-medium flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Compressing...
                          </span>
                        )}
                        
                        {task.status === "error" && (
                          <span className="text-destructive font-medium flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Failed
                          </span>
                        )}

                        {task.compressedFile && (
                          <>
                            <span className="text-muted-foreground hidden sm:inline">→</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              New: {formatSize(task.compressedFile.size)} 
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-medium">
                              -{calculateReduction(task.file.size, task.compressedFile.size)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {task.status === "done" && (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                          <Button size="sm" variant="secondary" onClick={() => {
                            const url = URL.createObjectURL(task.compressedFile!);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `compressed-${task.file.name}`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}>
                            <Download className="h-4 w-4 mr-2" /> Save
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              onClick={processImages} 
              className="flex-1 h-12 text-base font-medium" 
              disabled={tasks.every(t => t.status === "done" || t.status === "processing")}
            >
              {tasks.some(t => t.status === "processing") ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Compressing...
                </>
              ) : (
                "Compress Images"
              )}
            </Button>
            {tasks.some(t => t.status === "done") && (
              <Button onClick={downloadAll} variant="outline" className="flex-1 h-12 text-base font-medium">
                <Download className="mr-2 h-5 w-5" /> Download All
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}