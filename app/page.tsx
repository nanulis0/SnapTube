"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeAnimation } from "@/components/welcome-animation";
import { Navbar } from "@/components/navbar";
import { DownloaderHero } from "@/components/downloader-hero";
import { FeaturesGrid } from "@/components/features-grid";
import { HowItWorks } from "@/components/how-it-works";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  const handleAnimationComplete = useCallback(() => {
    setShowContent(true);
  }, []);

  return (
    <main className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(oklch(0.7 0.18 250 / 0.4) 1px, transparent 1px),
              linear-gradient(90deg, oklch(0.7 0.18 250 / 0.4) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Welcome animation */}
      <WelcomeAnimation onComplete={handleAnimationComplete} />

      {/* Main content */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Navbar />
            <DownloaderHero />

            {/* Divider */}
            <motion.div
              className="w-full max-w-xl mx-auto h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.7 0.18 250 / 0.3), transparent)",
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            />

            <div id="features">
              <FeaturesGrid />
            </div>

            {/* Divider */}
            <motion.div
              className="w-full max-w-xl mx-auto h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.7 0.18 250 / 0.3), transparent)",
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            />

            <HowItWorks />

            {/* Divider */}
            <motion.div
              className="w-full max-w-xl mx-auto h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.7 0.18 250 / 0.3), transparent)",
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            />

            <FaqSection />

            {/* CTA Section */}
            <motion.section
              className="w-full max-w-3xl mx-auto px-4 py-20 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-mono text-balance">
                Ready to download?
              </h2>
              <p className="text-muted-foreground mb-8 text-sm max-w-md mx-auto">
                Scroll back up and paste your first YouTube link. It only takes
                a few seconds.
              </p>
              <motion.button
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                Start Downloading
              </motion.button>
            </motion.section>

            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
