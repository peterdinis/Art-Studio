"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, 
  RefreshCcw, 
  Home, 
  Copy, 
  Terminal, 
  Info, 
  Cpu, 
  Globe, 
  Clock 
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdvancedErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdvancedError({ error, reset }: AdvancedErrorProps) {
  const [mounted, setMounted] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [sysInfo, setSysInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    setSysInfo({
      os: navigator.platform,
      browser: navigator.userAgent.split(' ').pop() || 'Unknown',
      time: new Date().toLocaleString(),
      url: window.location.href,
      digest: error.digest || 'N/A'
    });
  }, [error]);

  const copyToClipboard = () => {
    const report = `
Error Report: ${new Date().toISOString()}
----------------------------------------
Message: ${error.message}
Digest: ${error.digest || 'N/A'}
Stack: ${error.stack || 'No stack trace'}
System: ${JSON.stringify(sysInfo, null, 2)}
    `;
    navigator.clipboard.writeText(report);
    toast.success("Error report copied to clipboard");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
      >
        {/* Main Error Card */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50 group-hover:bg-red-500 transition-colors" />
            
            <div className="flex items-start gap-5">
              <div className="p-4 rounded-2xl bg-red-500/20 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  System Exception
                </h1>
                <p className="text-white/60 leading-relaxed mb-6">
                  Art Studio encountered a critical error while processing the current task. 
                  Don't worry, your work may have been partially saved.
                </p>
                
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-sm text-red-400 break-words mb-8">
                  <span className="text-white/40 mr-2">$</span>
                  {error.message || "An unexpected error occurred in the rendering pipeline."}
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={reset}
                    className="h-12 px-6 rounded-xl bg-white text-black hover:bg-white/90 transition-all flex items-center gap-2 font-semibold shadow-lg shadow-white/5"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Try to Recover
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    className="h-12 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Back to Studio
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Stack Trace */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <button 
              onClick={() => setShowStack(!showStack)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-white/40" />
                <span className="font-semibold text-white/80">Stack Trace Details</span>
              </div>
              <Info className={cn("w-4 h-4 text-white/40 transition-transform", showStack && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {showStack && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-white/50 leading-relaxed max-h-[300px] overflow-auto custom-scrollbar">
                    {error.stack || "No additional stack trace information available."}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">Environment Info</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/60">Platform</span>
                </div>
                <span className="text-sm font-mono text-white/80 truncate max-w-[150px]">{sysInfo.os}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white/60">Runtime</span>
                </div>
                <span className="text-sm font-mono text-white/80">{sysInfo.browser}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white/60">Incident Time</span>
                </div>
                <span className="text-sm font-mono text-white/80">{sysInfo.time}</span>
              </div>
            </div>

            <Button 
              onClick={copyToClipboard}
              variant="secondary"
              className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/20 border-none text-white flex items-center gap-2 group transition-all"
            >
              <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Copy Error Report
            </Button>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-xl">
            <h4 className="font-semibold mb-2">Need Help?</h4>
            <p className="text-sm text-white/60 leading-relaxed">
              If this error persists, please share the error report with our development team for priority resolution.
            </p>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
