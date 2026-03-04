"use client";

import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 px-6 py-4"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-foreground font-bold text-lg font-mono tracking-tight">
            SnapTube
          </span>
        </motion.div>

        <div className="flex items-center gap-6">
          {["Features", "How it Works", "FAQ"].map((item, i) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="hidden md:block text-muted-foreground text-sm hover:text-foreground transition-colors"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -1 }}
            >
              {item}
            </motion.a>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}
