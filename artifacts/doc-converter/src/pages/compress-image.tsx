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
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 mb-1">
          Optimize
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Image Compressor</h2>
        <p className="text-muted-foreground text-lg">Reduce image file size directly in your browser.</p>
      </div>

      <Card 
        className={cn(
          "p-14 border-2 border-dashed transition-all duration-300 group relative overflow-hidden bg-card/50",
          isDragging ? "border-yellow-500 bg-yellow-500/5 scale-[1.02] shadow-xl shadow-yellow-500/10" : "border-border hover:border-yellow-500/50 hover:bg-muted/50 hover:shadow-lg"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {isDragging && <div className="absolute inset-0 bg-yellow-500/5 blur-3xl rounded-full" />}
        <div 
          className="flex flex-col items-center justify-center space-y-5 text-center cursor-pointer relative z-10"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={cn(
            "p-5 rounded-2xl transition-all duration-300 shadow-sm",
            isDragging ? "bg-yellow-500 text-white scale-110 shadow-yellow-500/25 shadow-lg" : "bg-background border shadow-sm text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-yellow-500/25"
          )}>
            <UploadCloud className="h-10 w-10" />
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-xl">
              {isDragging ? "Drop images to compress" : "Click or drag images here"}
            </p>
            <p className="text-sm text-muted-foreground/80 font-medium">Process multiple images at once</p>
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
          className="space-y-8 bg-card p-6 md:p-8 rounded-2xl border shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 border-b">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Compression Quality</Label>
                <span className="font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-sm">{quality}%</span>
              </div>
              <Slider 
                value={[quality]} 
                onValueChange={(v) => setQuality(v[0])} 
                max={100} 
                step={1} 
                className="py-4 cursor-pointer"
              />
              <p className="text-xs font-medium text-muted-foreground">Lower quality yields smaller file size.</p>
            </div>
            <div className="space-y-4">
              <Label className="text-base font-semibold">Output Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-full h-12 rounded-xl bg-background border-2 focus:ring-yellow-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original" className="py-2.5 font-medium">Keep Original</SelectItem>
                  <SelectItem value="jpeg" className="py-2.5 font-medium">JPEG</SelectItem>
                  <SelectItem value="png" className="py-2.5 font-medium">PNG</SelectItem>
                  <SelectItem value="webp" className="py-2.5 font-medium">WebP (Best size)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Queue ({tasks.length})</Label>
              <Button variant="ghost" size="sm" onClick={() => setTasks([])} className="text-muted-foreground hover:text-destructive font-semibold">
                Clear Queue
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
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-xl shadow-sm relative overflow-hidden transition-colors",
                      task.status === "done" ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/50" : "bg-background"
                    )}
                  >
                    {task.status === "processing" && (
                      <div className="absolute bottom-0 left-0 h-1 bg-yellow-500/20 w-full transition-all duration-300">
                        <div 
                          className="h-full bg-yellow-500 transition-all duration-300" 
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                    )}
                    
                    <div className={cn(
                      "h-12 w-12 rounded-lg flex items-center justify-center shrink-0 border",
                      task.status === "done" ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200" : "bg-muted border-border/50"
                    )}>
                      {task.status === "done" ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <FileImage className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-foreground">{task.file.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="text-muted-foreground font-medium">Orig: {formatSize(task.file.size)}</span>
                        
                        {task.status === "processing" && (
                          <span className="text-yellow-600 dark:text-yellow-500 font-bold flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Compressing... {Math.round(task.progress || 0)}%
                          </span>
                        )}
                        
                        {task.status === "error" && (
                          <span className="text-destructive font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Failed
                          </span>
                        )}

                        {task.compressedFile && (
                          <>
                            <span className="text-muted-foreground hidden sm:inline opacity-50">→</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              New: {formatSize(task.compressedFile.size)} 
                            </span>
                            <span className="bg-emerald-200 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-full font-bold shadow-sm">
                              -{calculateReduction(task.file.size, task.compressedFile.size)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {task.status === "done" && (
                        <Button size="sm" variant="outline" className="font-semibold shadow-sm border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200" onClick={() => {
                          const url = URL.createObjectURL(task.compressedFile!);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `compressed-${task.file.name}`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}>
                          <Download className="h-4 w-4 mr-2" /> Save
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            <Button 
              onClick={processImages} 
              className="flex-1 h-14 text-lg font-bold shadow-lg shadow-yellow-500/20 bg-yellow-600 hover:bg-yellow-700 text-white transition-all hover:scale-[1.01]" 
              disabled={tasks.every(t => t.status === "done" || t.status === "processing")}
            >
              {tasks.some(t => t.status === "processing") ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Compressing...
                </>
              ) : (
                "Compress Images"
              )}
            </Button>
            {tasks.some(t => t.status === "done") && (
              <Button onClick={downloadAll} variant="outline" className="flex-1 h-14 text-lg font-bold border-2 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50 transition-all hover:scale-[1.01]">
                <Download className="mr-2 h-5 w-5" /> Download All Saved
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}