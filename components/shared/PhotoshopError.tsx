"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type ErrorComponentProps = {
  error?: Error | string;
  reset?: () => void;
  title?: string;
  description?: string;
  variant?: "default" | "photoshop" | "glitch" | "retro";
  className?: string;
  showResetButton?: boolean;
  autoResetDuration?: number; // in milliseconds
};

const PhotoshopErrorDisplay = () => (
  <div className="relative">
    {/* Photoshop-like interface elements */}
    <div className="absolute -top-2 -left-2 w-4 h-4 border-2 border-gray-800"></div>
    <div className="absolute -top-2 -right-2 w-4 h-4 border-2 border-gray-800"></div>
    <div className="absolute -bottom-2 -left-2 w-4 h-4 border-2 border-gray-800"></div>
    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-2 border-gray-800"></div>
    
    {/* Grid pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="h-full w-full" style={{
        backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px),
                         linear-gradient(to bottom, #888 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>
    </div>
  </div>
);

export default function ErrorComponent({
  error,
  reset,
  title = "Something went wrong!",
  description,
  variant = "photoshop",
  className,
  showResetButton = true,
  autoResetDuration,
}: ErrorComponentProps) {
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const errorMessage = error instanceof Error ? error.message : error;
  const fullDescription = description || errorMessage || "An unexpected error occurred.";

  // Glitch animation effect
  useEffect(() => {
    if (variant === "glitch") {
      const interval = setInterval(() => {
        setGlitchEffect(true);
        setTimeout(() => setGlitchEffect(false), 100);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [variant]);

  // Auto reset functionality
  useEffect(() => {
    if (autoResetDuration && reset) {
      const timer = setTimeout(() => {
        reset();
      }, autoResetDuration);
      
      return () => clearTimeout(timer);
    }
  }, [autoResetDuration, reset]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const glitchVariants = {
    normal: { x: 0 },
    glitch: { 
      x: [0, -5, 5, -3, 3, 0],
      transition: { duration: 0.3 }
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "photoshop":
        return {
          bg: "bg-gradient-to-br from-gray-900 to-gray-950",
          border: "border-2 border-gray-800",
          shadow: "shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]",
          text: "text-gray-100",
          accent: "text-cyan-400"
        };
      case "glitch":
        return {
          bg: "bg-gradient-to-br from-purple-950 to-black",
          border: "border border-purple-500/30",
          shadow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
          text: "text-gray-100",
          accent: "text-purple-400"
        };
      case "retro":
        return {
          bg: "bg-gradient-to-br from-amber-900 to-amber-950",
          border: "border-4 border-amber-700",
          shadow: "shadow-[8px_8px_0px_0px_rgba(180,83,9,0.8)]",
          text: "text-amber-50",
          accent: "text-amber-400"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-red-950/50 to-gray-900",
          border: "border border-red-500/20",
          shadow: "shadow-lg",
          text: "text-gray-100",
          accent: "text-red-400"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn("min-h-screen flex items-center justify-center p-4", className)}
    >
      <motion.div
        variants={glitchVariants}
        animate={glitchEffect ? "glitch" : "normal"}
        className="relative"
      >
        <Card className={cn(
          "max-w-lg w-full overflow-hidden relative",
          styles.bg,
          styles.border,
          styles.shadow
        )}>
          {/* Background pattern for photoshop variant */}
          {variant === "photoshop" && <PhotoshopErrorDisplay />}

          {/* Animated background elements */}
          <motion.div 
            className="absolute inset-0 opacity-5"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, ${styles.accent.split('text-')[1] || 'cyan-400'} 2px, transparent 2px)`,
              backgroundSize: '30px 30px'
            }}
          />

          <CardHeader className="relative z-10">
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.5 }}
              >
                {variant === "retro" ? (
                  <Zap className={cn("h-8 w-8", styles.accent)} />
                ) : (
                  <AlertTriangle className={cn("h-8 w-8", styles.accent)} />
                )}
              </motion.div>
              <CardTitle className={cn("text-2xl", styles.text)}>
                {title}
              </CardTitle>
            </motion.div>
          </CardHeader>

          <CardContent className="relative z-10">
            <motion.p 
              variants={itemVariants}
              className={cn("mb-6", styles.text)}
            >
              {fullDescription}
            </motion.p>

            {/* Error code display (simulated) */}
            {variant === "photoshop" && (
              <motion.div
                variants={itemVariants}
                className="mb-4 p-3 bg-black/50 border border-gray-700 rounded font-mono text-sm"
              >
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>ERROR_LOG:</span>
                  <span>PS_{Date.now().toString().slice(-6)}</span>
                </div>
                <div className="text-cyan-300">
                  {`>> Layer composition failed at ${new Date().toLocaleTimeString()}`}
                </div>
                <div className="text-red-300">
                  {`>> ${errorMessage || "Unknown operation error"}`}
                </div>
              </motion.div>
            )}

            {/* Progress bar for auto reset */}
            {autoResetDuration && reset && (
              <motion.div variants={itemVariants} className="mt-4">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full", styles.accent.replace('text-', 'bg-'))}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: autoResetDuration / 1000, ease: "linear" }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Auto-resetting in {autoResetDuration / 1000}s
                </p>
              </motion.div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 relative z-10">
            <div className="flex flex-wrap gap-2 w-full">
              {showResetButton && reset && (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={reset}
                    className={cn(
                      "gap-2",
                      variant === "photoshop" && "bg-cyan-600 hover:bg-cyan-700",
                      variant === "glitch" && "bg-purple-600 hover:bg-purple-700",
                      variant === "retro" && "bg-amber-600 hover:bg-amber-700",
                      variant === "default" && "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </motion.div>
              )}

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className={cn(
                    "gap-2",
                    variant === "photoshop" && "border-gray-700",
                    variant === "glitch" && "border-purple-700",
                    variant === "retro" && "border-amber-700"
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  {showDetails ? "Hide Details" : "Show Details"}
                </Button>
              </motion.div>
            </div>

            {/* Error details */}
            <AnimatePresence>
              {showDetails && error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden"
                >
                  <div className={cn(
                    "mt-3 p-3 rounded text-sm font-mono",
                    variant === "photoshop" && "bg-black/70 border border-gray-800",
                    variant === "glitch" && "bg-black/70 border border-purple-900",
                    variant === "retro" && "bg-amber-950/50 border border-amber-800"
                  )}>
                    <div className="text-gray-400 mb-1">Error details:</div>
                    <div className="text-red-300">
                      {error instanceof Error ? error.stack : errorMessage}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status indicators */}
            {variant === "photoshop" && (
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-4 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-800 w-full"
              >
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Connection: Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span>Render: Failed</span>
                </div>
              </motion.div>
            )}
          </CardFooter>
        </Card>

        {/* Floating particles for glitch effect */}
        {variant === "glitch" && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-purple-500 rounded-full"
                initial={{
                  x: Math.random() * 100,
                  y: Math.random() * 100,
                  opacity: 0
                }}
                animate={{
                  x: [null, Math.random() * 300],
                  y: [null, Math.random() * 300],
                  opacity: [0, 0.8, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// Also create a hook for error handling
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (err: unknown) => {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    setError(errorObj);
    
    // Log to error reporting service
    console.error('Error caught:', errorObj);
    
    return errorObj;
  };

  const resetError = () => {
    setError(null);
  };

  return {
    error,
    handleError,
    resetError,
    hasError: !!error
  };
}

// Optional: Global error boundary component
export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  const { error, resetError, hasError } = useErrorHandler();

  if (hasError) {
    return (
      <ErrorComponent
        error={error!}
        reset={resetError}
        title="Application Error"
        variant="default"
        autoResetDuration={10000}
      />
    );
  }

  return <>{children}</>;
}