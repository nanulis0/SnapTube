"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is SnapTube free to use?",
    a: "Yes, SnapTube is completely free to use. No account required, no hidden fees, and no limits on downloads.",
  },
  {
    q: "What video quality options are available?",
    a: "We support downloads in 4K (2160p), 1440p, 1080p, 720p, and 480p. Audio can be extracted in MP3 format at 128, 192, 256, or 320 kbps.",
  },
  {
    q: "Is it safe to use?",
    a: "Absolutely. All processing happens directly in your browser. We do not store your data, links, or downloaded files on any server.",
  },
  {
    q: "Does it work on mobile devices?",
    a: "Yes, SnapTube is fully responsive and works on all modern browsers including mobile Safari and Chrome on Android.",
  },
  {
    q: "Why does processing happen in the browser?",
    a: "Browser-based processing means your data stays private. No need to trust a third-party server with your activity or files.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.section
      id="faq"
      className="w-full max-w-3xl mx-auto px-4 py-20"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.h2
        variants={itemVariants}
        className="text-center text-2xl md:text-3xl font-bold text-foreground mb-2 font-mono"
      >
        Frequently Asked Questions
      </motion.h2>
      <motion.p
        variants={itemVariants}
        className="text-center text-muted-foreground mb-12 text-sm"
      >
        Everything you need to know
      </motion.p>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
          >
            <motion.button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left"
              whileTap={{ scale: 0.99 }}
            >
              <span className="text-sm font-medium text-foreground pr-4">
                {faq.q}
              </span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
