"use client";

import { FC, useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ScrollToTop: FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Check scroll position
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "fixed right-6 bottom-6 z-50 group",
        "flex items-center justify-center",
        "w-14 h-14 rounded-md",
        "bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e]",
        "border border-[#404040]",
        "shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
        "transition-all duration-300 transform",
        "hover:shadow-[0_6px_20px_rgba(49,168,255,0.3)]",
        "hover:border-[#31a8ff]",
        "hover:scale-105",
        "active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-[#31a8ff]/50 focus:ring-offset-2 focus:ring-offset-[#1e1e1e]",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10 pointer-events-none"
      )}
      aria-label="Scroll to top"
    >
      {/* Main icon with animation */}
      <ChevronUp 
        className={cn(
          "w-6 h-6 transition-all duration-300",
          hovered 
            ? "text-[#31a8ff] translate-y-[-2px]" 
            : "text-[#b0b0b0]"
        )}
      />
      
      {/* Photoshop-style corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#404040]" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#404040]" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#404040]" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#404040]" />
      
      {/* Hover effect corners */}
      {hovered && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#31a8ff] animate-pulse" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#31a8ff] animate-pulse" style={{ animationDelay: "0.1s" }} />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#31a8ff] animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#31a8ff] animate-pulse" style={{ animationDelay: "0.3s" }} />
        </>
      )}
      
      {/* Loading bar animation on hover */}
      {hovered && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#404040] overflow-hidden rounded-b-md">
          <div className="h-full bg-gradient-to-r from-[#31a8ff] via-[#1473e6] to-[#31a8ff] animate-progress" />
        </div>
      )}
      
      {/* Photoshop-style tooltip */}
      <div className={cn(
        "absolute right-full mr-3",
        "px-3 py-1.5",
        "bg-[#2a2a2a]",
        "border border-[#404040]",
        "text-[#b0b0b0] text-xs font-medium",
        "rounded shadow-lg",
        "whitespace-nowrap",
        "transition-all duration-200",
        "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
        "pointer-events-none"
      )}>
        Scroll to Top
        <div className="absolute top-1/2 left-full -translate-y-1/2">
          <div className="w-2 h-2 bg-[#2a2a2a] border-r border-t border-[#404040] rotate-45" />
        </div>
      </div>
    </button>
  );
};

export default ScrollToTop;