"use client"

import { FC } from "react";

const Loading: FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {/* Main loading container */}
      <div className="relative flex flex-col items-center justify-center gap-8 p-8 rounded-2xl bg-card/50 border border-border/50 shadow-2xl">
        
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/10 to-transparent animate-gradient-shift" />
        </div>
        
        {/* Photoshop-like loading animation */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-32 h-32 rounded-full border-4 border-border/30 relative">
            
            {/* Rotating gradient ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-accent animate-spin-slow" 
                 style={{ animationDuration: "3s" }} />
            
            {/* Inner pulsing circle */}
            <div className="absolute inset-4 rounded-full bg-linear-to-br from-primary/20 to-accent/20 animate-pulse-slow" />
            
            {/* Center logo/icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-16 h-16">
                {/* Paint brush icon */}
                <svg 
                  className="w-full h-full text-primary animate-bounce-subtle"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  <path d="M9 11a3 3 0 1 0 6 0 3 3 0 0 0-6 0" />
                </svg>
                
                {/* Pulsing dot */}
                <div className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-ping" />
              </div>
            </div>
            
            {/* Progress indicators */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full animate-bounce" 
                 style={{ animationDelay: "0.1s" }} />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent rounded-full animate-bounce" 
                 style={{ animationDelay: "0.2s" }} />
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full animate-bounce" 
                 style={{ animationDelay: "0.3s" }} />
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full animate-bounce" 
                 style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
        
        {/* Loading text with typing animation */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x">
              Loading ArtStudio
            </h2>
            {/* Typing dots */}
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
          
          {/* Subtle description */}
          <p className="text-muted-foreground text-sm max-w-md text-center">
            Preparing your creative workspace with advanced tools and features...
          </p>
          
          {/* Progress bar */}
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-linear-to-r from-primary to-accent rounded-full animate-progress" />
          </div>
          
          {/* Feature loading indicators */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {["Layers", "Brushes", "Filters", "AI Tools", "Export"].map((feature, index) => (
              <div
                key={feature}
                className="px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-xs font-medium flex items-center gap-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                {feature}
              </div>
            ))}
          </div>
        </div>
        
        {/* Optional tips/help text */}
        <div className="text-xs text-muted-foreground/70 text-center max-w-sm mt-2 animate-fade-in" style={{ animationDelay: "1s" }}>
          💡 Tip: Use Ctrl+S to save your work automatically
        </div>
      </div>
      
      {/* Optional: Add custom CSS animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Loading;