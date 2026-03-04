"use client";

import { motion } from "framer-motion";
import { ClipboardCopy, Search, Download } from "lucide-react";

const steps = [
  {
    icon: ClipboardCopy,
    step: "01",
    title: "Paste Link",
    desc: "Copy any YouTube video URL and paste it into the input field above.",
  },
  {
    icon: Search,
    step: "02",
    title: "Choose Format",
    desc: "Select video quality up to 4K or choose MP3 for audio extraction.",
  },
  {
    icon: Download,
    step: "03",
    title: "Download",
    desc: "Click download and get your file processed instantly in your browser.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function HowItWorks() {
  return (
    <motion.section
      id="how-it-works"
      className="w-full max-w-5xl mx-auto px-4 py-20"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.h2
        variants={stepVariants}
        className="text-center text-2xl md:text-3xl font-bold text-foreground mb-2 font-mono"
      >
        How It Works
      </motion.h2>
      <motion.p
        variants={stepVariants}
        className="text-center text-muted-foreground mb-14 text-sm"
      >
        Three simple steps to download any video
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((item, i) => (
          <motion.div
            key={i}
            variants={stepVariants}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative text-center p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
          >
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
            )}

            <motion.div
              className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5"
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <item.icon className="w-7 h-7 text-primary" />
            </motion.div>

            <div className="text-xs font-mono text-primary/60 mb-2 tracking-widest">
              STEP {item.step}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2 font-mono">
              {item.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
