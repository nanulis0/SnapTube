"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function WelcomeAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => onComplete(), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Animated grid background */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(oklch(0.7 0.18 250 / 0.15) 1px, transparent 1px),
                  linear-gradient(90deg, oklch(0.7 0.18 250 / 0.15) 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Radial glow */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.7 0.18 250 / 0.2) 0%, transparent 70%)",
            }}
            animate={{
              scale: [0.5, 1.2, 1],
              opacity: [0, 0.8, 0.4],
            }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: phase >= 0 ? 1 : 0,
              rotate: phase >= 0 ? 0 : -180,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="relative z-10 mb-6"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                className="text-primary"
              >
                <motion.path
                  d="M12 2L2 7l10 5 10-5-10-5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                <motion.path
                  d="M2 17l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                />
                <motion.path
                  d="M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 1.1 }}
                />
              </svg>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : 20,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground font-mono">
              {"SnapTube".split("").map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: phase >= 1 ? 1 : 0,
                    y: phase >= 1 ? 0 : 30,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: 1.2 + i * 0.06,
                    ease: "easeOut",
                  }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="relative z-10 mt-4 text-muted-foreground text-lg tracking-widest uppercase"
            initial={{ opacity: 0, letterSpacing: "0.5em" }}
            animate={{
              opacity: phase >= 2 ? 1 : 0,
              letterSpacing: phase >= 2 ? "0.2em" : "0.5em",
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            4K Video Downloader
          </motion.p>

          {/* Loading bar */}
          <motion.div
            className="relative z-10 mt-8 w-48 h-0.5 bg-border rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: phase >= 2 ? "100%" : "0%" }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
