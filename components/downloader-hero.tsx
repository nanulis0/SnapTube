"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  Music,
  Film,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
} from "lucide-react";

type VideoInfo = {
  id: string;
  sourceUrl: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  views: string;
  formats: DownloadFormat[];
};

type DownloadFormat = {
  itag: string;
  quality: string;
  format: string;
  size: string;
  type: "video" | "audio";
  mimeType: string;
  container: string;
  videoCodec?: string;
  audioCodec?: string;
  audioIncluded?: boolean;
  bitrateKbps?: number;
};

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim() || "video";
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function DownloaderHero() {
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "downloading"
  >("idle");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat | null>(
    null
  );
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showFormats, setShowFormats] = useState(false);

  const handleFetch = useCallback(async () => {
    if (!url.trim()) {
      setErrorMsg("Please enter a YouTube URL");
      setStatus("error");
      return;
    }

    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      setErrorMsg("Invalid YouTube URL. Please check and try again.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setVideoInfo(null);
    setSelectedFormat(null);
    setShowFormats(false);

    try {
      const response = await fetch("/api/video-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = (await response.json()) as
        | VideoInfo
        | {
            error?: string;
          };

      if (!response.ok) {
        const errorMessage =
          "error" in data ? data.error : "Failed to fetch video details.";
        setErrorMsg(errorMessage ?? "Failed to fetch video details.");
        setStatus("error");
        return;
      }

      setVideoInfo(data as VideoInfo);
      setStatus("success");
      setShowFormats(true);
    } catch {
      setErrorMsg("Could not fetch video details. Please try again.");
      setStatus("error");
    }
  }, [url]);

  const handleDownload = useCallback(
    async (format: DownloadFormat, options?: { require4k?: boolean }) => {
      if (!videoInfo) return;

      setSelectedFormat(format);
      setStatus("downloading");
      setDownloadProgress(20);

      try {
        const response = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceUrl: videoInfo.sourceUrl,
            formatId: format.itag,
            filename: `${sanitizeFilename(videoInfo.title)}.${format.format}`,
            mimeType: format.mimeType,
            formatType: format.type,
            hasEmbeddedAudio: format.audioIncluded ?? false,
            require4k: Boolean(options?.require4k),
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "Download request failed.");
        }

        setDownloadProgress(85);

        const outputBlob = await response.blob();
        const contentDisposition = response.headers.get("content-disposition");
        const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
        const outputFilename =
          filenameMatch?.[1] ?? `${sanitizeFilename(videoInfo.title)}.${format.format}`;

        const objectUrl = URL.createObjectURL(outputBlob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = outputFilename;
        a.click();
        URL.revokeObjectURL(objectUrl);

        setDownloadProgress(100);
        setTimeout(() => {
          setStatus("success");
          setSelectedFormat(null);
          setDownloadProgress(0);
        }, 600);
      } catch (error) {
        setErrorMsg(
          error instanceof Error
            ? error.message
            : "Download failed. Please try another format."
        );
        setStatus("error");
        setSelectedFormat(null);
        setDownloadProgress(0);
      }
    },
    [videoInfo]
  );

  const handleReset = () => {
    setUrl("");
    setStatus("idle");
    setVideoInfo(null);
    setSelectedFormat(null);
    setErrorMsg("");
    setShowFormats(false);
    setDownloadProgress(0);
  };

  const videoFormats = videoInfo
    ? videoInfo.formats.filter((format) => format.type === "video")
    : [];
  const audioFormats = videoInfo
    ? videoInfo.formats.filter((format) => format.type === "audio")
    : [];
  const explicit4kFormat =
    videoFormats.find((format) => format.quality.startsWith("2160p")) ?? null;
  const formats = activeTab === "video" ? videoFormats : audioFormats;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.18 250 / 0.15) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.7 0.18 250 / 0.2), transparent)",
          }}
        />
      </div>

      {/* Hero text */}
      <motion.div
        className="relative z-10 text-center mb-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.div
          className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          Free & Open Source
        </motion.div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 font-mono leading-tight text-balance">
          Download YouTube
          <br />
          <span className="text-primary">in 4K</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto leading-relaxed">
          Paste a link, pick your format, and download. 4K video and audio are
          processed server-side for better compatibility.
        </p>
      </motion.div>

      {/* Main input card */}
      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6 shadow-2xl shadow-primary/5">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 mb-5 p-1 rounded-xl bg-secondary/50 border border-border">
            {(["video", "audio"] as const).map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                {activeTab === tab && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary"
                    layoutId="activeTab"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab === "video" ? (
                    <Film className="w-4 h-4" />
                  ) : (
                    <Music className="w-4 h-4" />
                  )}
                  {tab === "video" ? "Video (up to 4K)" : "Audio (MP3)"}
                </span>
              </motion.button>
            ))}
          </div>

          {/* URL Input */}
          <div className="relative mb-4">
            <motion.div
              className="flex items-center gap-3 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                placeholder="Paste YouTube link here..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                aria-label="YouTube video URL"
              />
              <AnimatePresence>
                {url && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear input"
                    whileTap={{ scale: 0.8 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Fetch button */}
          <AnimatePresence mode="wait">
            {status !== "success" && status !== "downloading" && (
              <motion.button
                key="fetch"
                onClick={handleFetch}
                disabled={status === "loading"}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching video info...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Fetch Video
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Info Card */}
          <AnimatePresence>
            {videoInfo && status !== "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-5 p-4 rounded-xl border border-border bg-secondary/30">
                  <div className="flex gap-4">
                    <motion.div
                      className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-muted"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null;
                          img.src = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`;
                        }}
                      />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] bg-background/80 text-foreground font-mono">
                        {videoInfo.duration}
                      </div>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {videoInfo.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {videoInfo.channel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {videoInfo.views}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Format selection */}
          <AnimatePresence>
            {showFormats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4">
                  <button
                    onClick={() => setShowFormats((prev) => !prev)}
                    className="sr-only"
                  >
                    Toggle formats
                  </button>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Select Quality
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </div>
                  {activeTab === "video" && explicit4kFormat && (
                    <button
                      onClick={() =>
                        handleDownload(explicit4kFormat, { require4k: true })
                      }
                      disabled={status === "downloading"}
                      className={`w-full mb-3 flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        selectedFormat?.itag === explicit4kFormat.itag
                          ? "border-primary/60 bg-primary/15"
                          : "border-primary/30 bg-primary/10 hover:border-primary/60"
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
                          <Film className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            Download 4K (Best Quality)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {explicit4kFormat.quality} &middot; .
                            {explicit4kFormat.format} &middot;{" "}
                            {explicit4kFormat.size}
                          </div>
                        </div>
                      </div>
                      {selectedFormat?.itag === explicit4kFormat.itag &&
                      status === "downloading" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Download className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  )}
                  {activeTab === "video" && !explicit4kFormat && (
                    <div className="w-full mb-3 p-3 rounded-lg border border-border text-xs text-muted-foreground">
                      4K is unavailable for this video in the current YouTube
                      session. Try another video or provide authenticated access.
                    </div>
                  )}
                  {formats.length === 0 ? (
                    <div className="p-3 rounded-lg border border-border text-xs text-muted-foreground">
                      No {activeTab} formats found for this video.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formats.map((format, i) => (
                        <motion.button
                          key={`${format.itag}-${format.quality}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.06 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDownload(format)}
                          disabled={status === "downloading"}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                            selectedFormat?.itag === format.itag
                              ? "border-primary/50 bg-primary/10"
                              : "border-border hover:border-primary/30 hover:bg-secondary/30"
                          } disabled:opacity-50`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                format.type === "video"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-accent/10 text-accent"
                              }`}
                            >
                              {format.type === "video" ? (
                                <Film className="w-4 h-4" />
                              ) : (
                                <Music className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {format.quality}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                .{format.format} &middot; {format.size}
                              </div>
                            </div>
                          </div>

                          {selectedFormat?.itag === format.itag &&
                          status === "downloading" ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <Download className="w-4 h-4 text-muted-foreground" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Download progress */}
          <AnimatePresence>
            {status === "downloading" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-foreground font-medium">
                      Downloading and processing...
                    </span>
                    <span className="text-xs text-primary font-mono">
                      {Math.min(Math.round(downloadProgress), 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${Math.min(downloadProgress, 100)}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                    />
                    Preparing final file on server...
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success state after download */}
          <AnimatePresence>
            {downloadProgress >= 100 && status === "downloading" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 flex items-center gap-2 text-sm text-primary"
              >
                <CheckCircle2 className="w-4 h-4" />
                Download complete!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Supported sites */}
      <motion.div
        className="relative z-10 mt-8 flex items-center gap-2 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span>Supports:</span>
        {["YouTube", "YouTube Shorts", "YouTube Music"].map((site, i) => (
          <motion.span
            key={site}
            className="px-2 py-1 rounded-md bg-secondary/50 border border-border text-xs"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + i * 0.1 }}
          >
            {site}
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
}
