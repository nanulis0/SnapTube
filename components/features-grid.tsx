"use client";

import { motion } from "framer-motion";
import { Download, Zap, Shield, Headphones } from "lucide-react";

const features = [
  {
    icon: Download,
    title: "4K Ultra HD",
    desc: "Download videos in stunning 4K resolution with crystal clear quality.",
  },
  {
    icon: Headphones,
    title: "MP3 Extract",
    desc: "Extract audio tracks as high-quality MP3 files instantly.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Browser-based processing means no server wait times.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    desc: "Everything processed locally. Your data never leaves your device.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function FeaturesGrid() {
  return (
    <motion.section
      className="w-full max-w-5xl mx-auto px-4 py-16"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.h2
        variants={itemVariants}
        className="text-center text-2xl md:text-3xl font-bold text-foreground mb-2 font-mono"
      >
        Why SnapTube?
      </motion.h2>
      <motion.p
        variants={itemVariants}
        className="text-center text-muted-foreground mb-12 text-sm"
      >
        Built for speed, designed for simplicity
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-colors cursor-default"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex items-start gap-4">
              <motion.div
                className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-foreground mb-1 font-mono text-sm">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
