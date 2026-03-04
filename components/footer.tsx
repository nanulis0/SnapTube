"use client";

import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      className="w-full border-t border-border py-10 px-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
            <svg
              width="12"
              height="12"
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
            </svg>
          </div>
          <span className="text-sm font-bold text-foreground font-mono">
            SnapTube
          </span>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          SnapTube is a front-end tool. We do not host or store any content.
          Please respect copyright laws.
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {["Privacy", "Terms", "Contact"].map((link) => (
            <motion.a
              key={link}
              href="#"
              className="hover:text-foreground transition-colors"
              whileHover={{ y: -1 }}
            >
              {link}
            </motion.a>
          ))}
        </div>
      </div>
    </motion.footer>
  );
}
