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
  Clock,
  Wifi,
  Activity,
  Maximize,
  ShieldAlert,
  Zap,
  Code
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
  const [sysInfo, setSysInfo] = useState<any>({});
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);
    
    // Detailed system information gathering
    const memory = (performance as any).memory;
    const info = {
      os: navigator.platform,
      browser: navigator.userAgent.split(' ').pop() || 'Unknown',
      time: new Date().toLocaleString(),
      url: window.location.href,
      digest: error.digest || 'N/A',
      cores: navigator.hardwareConcurrency || 'Unknown',
      resolution: `${window.screen.width}x${window.screen.height}`,
      memory: memory ? `${Math.round(memory.usedJSHeapSize / 1048576)}MB / ${Math.round(memory.jsHeapSizeLimit / 1048576)}MB` : 'Unavailable',
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled ? 'Yes' : 'No'
    };
    setSysInfo(info);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  const copyToClipboard = () => {
    const report = `
ART STUDIO CRITICAL ERROR REPORT
================================
Timestamp: ${new Date().toISOString()}
Incident ID: ${Math.random().toString(36).substring(2, 15).toUpperCase()}

ERROR DETAILS
-------------
Message: ${error.message}
Digest: ${error.digest || 'N/A'}
Stack: ${error.stack || 'No stack trace'}

ENVIRONMENT
-----------
${Object.entries(sysInfo).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join('\n')}
NETWORK: ${isOnline ? 'ONLINE' : 'OFFLINE'}
    `;
    navigator.clipboard.writeText(report);
    toast.success("Detailed error report copied to clipboard");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020203] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-red-500/30">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Retro scanline effect */}
      <div className="absolute inset-0 z-1 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_4px,3px_100%]" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 z-1 pointer-events-none opacity-[0.02] mix-blend-overlay grayscale" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10"
      >
        {/* Left Column: Error Branding & Main Message */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="relative group p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl overflow-hidden transition-all hover:border-white/20">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 via-purple-600 to-blue-500 opacity-60" />
            
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-6">
                <motion.div 
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    boxShadow: ["0 0 20px rgba(239,68,68,0.2)", "0 0 40px rgba(239,68,68,0.4)", "0 0 20px rgba(239,68,68,0.2)"]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="p-5 rounded-3xl bg-red-500/20 text-red-500 border border-red-500/30"
                >
                  <ShieldAlert className="w-10 h-10" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest border border-red-500/20">
                      Kernel Panic
                    </span>
                    <span className="text-white/20 text-xs">ID: {sysInfo.digest}</span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                    Critical Exception
                  </h1>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-lg text-white/60 leading-relaxed max-w-2xl">
                  Art Studio encountered a memory corruption or rendering pipeline failure. 
                  The current application state has been frozen to prevent further data loss.
                </p>
                
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-purple-500/20 blur opacity-50" />
                  <div className="relative p-6 rounded-2xl bg-black/60 border border-white/10 font-mono text-sm group-hover:border-red-500/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                      <Terminal className="w-3 h-3" />
                      Runtime Exception Output
                    </div>
                    <div className="text-red-400 break-words leading-relaxed">
                      <span className="text-red-500 font-bold mr-2">Error:</span>
                      {error.message || "Unspecified execution error in the GPU composition layer."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-4">
                <Button 
                  onClick={reset}
                  className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 transition-all flex items-center gap-3 font-bold text-lg shadow-xl shadow-white/5 group"
                >
                  <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  Attempt Hot-Reload
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-3 font-bold text-lg"
                >
                  <Home className="w-5 h-5" />
                  Exit to Dashboard
                </Button>
              </div>
            </div>
          </div>

          {/* Stack Trace Disclosure */}
          <div className="rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-2xl overflow-hidden">
            <button 
              onClick={() => setShowStack(!showStack)}
              className="flex items-center justify-between w-full p-6 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5">
                  <Code className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <span className="block font-bold text-white/90">Stack Trace Disclosure</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Developer Debugging Information</span>
                </div>
              </div>
              <div className={cn("transition-transform duration-300", showStack && "rotate-180")}>
                <Info className="w-5 h-5 text-white/20" />
              </div>
            </button>
            
            <AnimatePresence>
              {showStack && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                >
                  <div className="px-6 pb-6 pt-2">
                    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-white/40 leading-relaxed max-h-[250px] overflow-auto custom-scrollbar whitespace-pre-wrap selection:bg-blue-500/30">
                      {error.stack || "No extended stack information provided by the runtime environment."}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Telemetry & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl flex flex-col gap-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Activity className="w-20 h-20" />
             </div>

            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">System Telemetry</h3>
            
            <div className="space-y-4">
              {[
                { label: 'OS Platform', value: sysInfo.os, icon: Cpu, color: 'text-blue-400' },
                { label: 'Runtime Environment', value: sysInfo.browser, icon: Globe, color: 'text-emerald-400' },
                { label: 'Hardware Cores', value: sysInfo.cores, icon: Zap, color: 'text-amber-400' },
                { label: 'Screen Matrix', value: sysInfo.resolution, icon: Maximize, color: 'text-purple-400' },
                { label: 'Memory Allocation', value: sysInfo.memory, icon: Activity, color: 'text-red-400' },
                { label: 'Network Integrity', value: isOnline ? 'Stable' : 'Disconnected', icon: Wifi, color: isOnline ? 'text-green-400' : 'text-red-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4 h-4", item.color)} />
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{item.label}</span>
                  </div>
                  <span className="text-xs font-mono text-white/80">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-4">
              <Button 
                onClick={copyToClipboard}
                variant="secondary"
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 border-none text-white flex items-center gap-3 group transition-all font-bold shadow-lg shadow-blue-600/20"
              >
                <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Copy Full Log
              </Button>
              
              <p className="text-[10px] text-center text-white/30 leading-relaxed px-4">
                Telemetric data is captured locally and only shared if you manually paste the report to our support channel.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-gradient-to-br from-red-600/10 to-transparent border border-red-500/10 backdrop-blur-3xl relative group overflow-hidden">
             <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-600/20 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-700" />
            <h4 className="font-black text-xs uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
              <Info className="w-3 h-3" />
              Incident Support
            </h4>
            <p className="text-sm text-white/50 leading-relaxed">
              Our engineering team has been notified of this pattern. If this persists after reload, please clear your browser cache or contact support.
            </p>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
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
