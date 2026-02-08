"use client"

import { motion } from "framer-motion";
import { Layers, Droplets, Palette, Image as ImageIcon, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-950 to-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Photoshop-like UI elements */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-cyan-400/20 rounded-lg opacity-20"
        />

        <motion.div
          animate={{
            x: [100, 0, 100],
            y: [200, 100, 200],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-3/4 right-1/4 w-24 h-24 border-2 border-purple-400/20 rounded-full opacity-20"
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Subtle gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 left-1/3 w-64 h-64 bg-linear-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-linear-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-16 min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          {/* Photoshop logo/icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2,
            }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center p-6 bg-linear-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-2xl shadow-cyan-500/25">
              <Layers className="w-16 h-16" />
            </div>
          </motion.div>

          {/* Error code with creative animation */}
          <div className="relative mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-9xl font-black tracking-tighter mb-4"
            >
              <span className="bg-linear-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                404
              </span>
            </motion.h1>

            {/* Animated underline */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
              className="h-1 bg-linear-to-r from-transparent via-cyan-500 to-transparent mx-auto"
            />

            {/* Floating design elements around 404 */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 360, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-4 -left-4 p-2 bg-cyan-500/20 rounded-lg border border-cyan-400/30"
            >
              <Palette className="w-6 h-6 text-cyan-400" />
            </motion.div>

            <motion.div
              animate={{
                y: [0, 10, 0],
                rotate: [360, 0, 360],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute -bottom-4 -right-4 p-2 bg-purple-500/20 rounded-lg border border-purple-400/30"
            >
              <Droplets className="w-6 h-6 text-purple-400" />
            </motion.div>
          </div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Layer Not Found
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              It seems you tried to access a layer that doesn't exist.
              It might have been deleted or moved.
            </p>
          </motion.div>

          {/* Photoshop UI elements animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex justify-center gap-8 mb-12"
          >
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
                className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded ${i === 1 ? 'bg-cyan-500/20' : i === 2 ? 'bg-purple-500/20' : i === 3 ? 'bg-pink-500/20' : 'bg-blue-500/20'}`} />
                  <div className="text-left">
                    <div className="w-16 h-2 bg-gray-600 rounded mb-1" />
                    <div className="w-12 h-2 bg-gray-700 rounded" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Action buttons with Photoshop style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-linear-to-r from-cyan-600 to-blue-600 rounded-lg font-semibold flex items-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                <Home className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Return to Home Screen
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg font-semibold flex items-center gap-3 hover:bg-white/20 transition-all"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Go Back
            </motion.button>
          </motion.div>

          {/* Photoshop shortcuts hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-16 pt-8 border-t border-white/10"
          >
            <p className="text-gray-400 mb-4">Quick Tips:</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Ctrl</kbd>
                <span className="text-gray-400">+</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Z</kbd>
                <span className="ml-2 text-gray-300">For undo</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Ctrl</kbd>
                <span className="text-gray-400">+</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">S</kbd>
                <span className="ml-2 text-gray-300">For save</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">F5</kbd>
                <span className="ml-2 text-gray-300">For refresh</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer with Photoshop branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
          className="mt-auto pt-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">Adobe Photoshop Concept • Error 404</span>
          </div>
        </motion.div>
      </div>

      {/* Floating layer panel animation */}
      <div className="absolute bottom-8 left-8 opacity-10">
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-48 p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-3 h-3 bg-red-500/50 rounded-full" />
              <div className="w-16 h-2 bg-gray-700 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-3 h-3 bg-green-500/50 rounded-full" />
              <div className="w-20 h-2 bg-gray-700 rounded" />
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div className="w-3 h-3 bg-blue-500/50 rounded-full" />
              <div className="w-12 h-2 bg-gray-700 rounded" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;