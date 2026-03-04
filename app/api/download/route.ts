import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import {
  buildYtDlpDownloadArgs,
  resolveDownloadSelector,
} from "@/lib/ytdlp";

export const runtime = "nodejs";
const execFileAsync = promisify(execFile);
const YTDLP_STDIO_BUFFER_BYTES = 20 * 1024 * 1024;
const TEMP_DIR_PREFIX = "snaptube-download-";
const TEMP_OUTPUT_BASENAME = "download";
const TEMP_DIR_CLEANUP_DELAY_MS = 5 * 60 * 1000;
const COOKIE_BROWSER_FALLBACKS = [
  "chrome",
  "brave",
  "chromium",
  "edge",
  "firefox",
  "safari",
];
const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
};
const FOUR_K_ITAGS = new Set(["266", "313", "401"]);

function sanitizeFilename(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");

  return (
    normalized.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim() || "video"
  );
}

function splitFilename(name: string): { base: string; ext: string } {
  const trimmed = name.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return { base: trimmed, ext: "" };
  }

  return {
    base: trimmed.slice(0, dotIndex),
    ext: trimmed.slice(dotIndex + 1).toLowerCase(),
  };
}

function toContentDispositionFilename(filename: string): string {
  // HTTP header values must be byte-safe; keep only visible ASCII.
  const asciiSafe = filename.replace(/[^\x20-\x7E]/g, "_");
  return asciiSafe || "video.bin";
}

function getExecErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Failed to download selected format.";
  }

  const maybeError = error as Error & { stderr?: string | Buffer };
  if (typeof maybeError.stderr === "string" && maybeError.stderr.trim()) {
    return maybeError.stderr.trim();
  }
  if (maybeError.stderr instanceof Buffer && maybeError.stderr.length > 0) {
    return maybeError.stderr.toString("utf8").trim();
  }
  if (maybeError.message) {
    return maybeError.message;
  }
  return "Failed to download selected format.";
}

function extractYouTubeVideoId(sourceUrl: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = sourceUrl.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isBestQualityOr4kRequest(
  formatType: "video" | "audio" | undefined,
  formatId: string,
  selector: string
): boolean {
  if (formatType !== "video") return false;

  const normalizedFormatId = formatId.toLowerCase();
  const normalizedSelector = selector.toLowerCase();
  return (
    FOUR_K_ITAGS.has(formatId) ||
    normalizedFormatId.includes("2160") ||
    normalizedFormatId.includes("bestvideo") ||
    normalizedSelector.includes("2160") ||
    normalizedSelector.includes("bestvideo")
  );
}

function log4kDebug(requestId: string, event: string, details: object): void {
  console.info(`[4k-download][${requestId}] ${event}`, details);
}

function isYoutubeBotBlock(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("sign in to confirm you’re not a bot") ||
    normalized.includes("sign in to confirm you're not a bot") ||
    normalized.includes("http error 403")
  );
}

function isCookieBrowserAccessError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find cookie database") ||
    normalized.includes("could not copy chrome cookie database") ||
    normalized.includes("no such file or directory") ||
    normalized.includes("unable to get key for cookie decryption") ||
    normalized.includes("cannot decrypt cookies")
  );
}

function isMissingFfmpegError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("ffmpeg") &&
    (normalized.includes("not found") ||
      normalized.includes("not installed") ||
      normalized.includes("could not be found"))
  );
}

function isFormatNotAvailableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("requested format is not available") ||
    normalized.includes("format not available")
  );
}

async function resolveDownloadedFilePath(tempDir: string): Promise<string> {
  const fileNames = await readdir(tempDir);
  const candidates = fileNames
    .filter(
      (fileName) =>
        fileName.startsWith(`${TEMP_OUTPUT_BASENAME}.`) &&
        !fileName.endsWith(".part")
    )
    .map((fileName) => join(tempDir, fileName));

  if (candidates.length === 0) {
    throw new Error("Download completed but output file was not found.");
  }

  let pickedPath = candidates[0];
  let pickedSize = 0;
  for (const candidatePath of candidates) {
    const fileStat = await stat(candidatePath);
    if (fileStat.size > pickedSize) {
      pickedPath = candidatePath;
      pickedSize = fileStat.size;
    }
  }

  return pickedPath;
}

async function downloadWithYtDlp(
  sourceUrl: string,
  formatId: string,
  outputTemplate: string,
  formatType?: "video" | "audio",
  hasEmbeddedAudio?: boolean,
  require4k?: boolean,
  cookiesFromBrowser?: string,
  requestId?: string,
  shouldLog4kDebug?: boolean
): Promise<void> {
  const selector = resolveDownloadSelector({
    formatId,
    formatType,
    hasEmbeddedAudio,
    require4k,
  });
  const args = buildYtDlpDownloadArgs(
    sourceUrl,
    selector,
    outputTemplate,
    cookiesFromBrowser
  );
  if (shouldLog4kDebug && requestId) {
    log4kDebug(requestId, "running-yt-dlp", {
      formatId,
      selector,
      formatType,
      hasEmbeddedAudio: Boolean(hasEmbeddedAudio),
      usingCookiesFromBrowser: cookiesFromBrowser ?? "none",
      outputTemplate,
    });
  }
  await execFileAsync("python3", args, {
    maxBuffer: YTDLP_STDIO_BUFFER_BYTES,
  });
}

export async function POST(req: Request) {
  let tempDirToCleanup: string | null = null;
  const requestId = crypto.randomUUID().slice(0, 8);
  let shouldLog4kDebug = false;
  let require4k = false;
  try {
    const body = (await req.json()) as {
      sourceUrl?: string;
      formatId?: string;
      filename?: string;
      mimeType?: string;
      formatType?: "video" | "audio";
      hasEmbeddedAudio?: boolean;
      require4k?: boolean;
    };
    const sourceUrl = body.sourceUrl?.trim();
    const formatId = body.formatId?.trim();
    const requestedFilename = body.filename?.trim();
    const requestedMimeType = body.mimeType?.trim();
    const formatType = body.formatType;
    const hasEmbeddedAudio = body.hasEmbeddedAudio;
    require4k = Boolean(body.require4k);
    const resolvedSelector = resolveDownloadSelector({
      formatId: formatId ?? "",
      formatType,
      hasEmbeddedAudio,
      require4k,
    });
    shouldLog4kDebug = isBestQualityOr4kRequest(
      formatType,
      formatId ?? "",
      resolvedSelector
    );

    if (!sourceUrl || !formatId) {
      return NextResponse.json(
        { error: "Missing source URL or format ID." },
        { status: 400 }
      );
    }

    const tempDir = await mkdtemp(join(tmpdir(), TEMP_DIR_PREFIX));
    tempDirToCleanup = tempDir;
    const outputTemplate = join(tempDir, `${TEMP_OUTPUT_BASENAME}.%(ext)s`);
    let lastErrorMessage = "";
    if (shouldLog4kDebug) {
      log4kDebug(requestId, "request-start", {
        videoId: extractYouTubeVideoId(sourceUrl) ?? "unknown",
        formatId,
        formatType,
        hasEmbeddedAudio: Boolean(hasEmbeddedAudio),
        selector: resolvedSelector,
        tempDir,
      });
    }

    try {
      await downloadWithYtDlp(
        sourceUrl,
        formatId,
        outputTemplate,
        formatType,
        hasEmbeddedAudio,
        require4k,
        undefined,
        requestId,
        shouldLog4kDebug
      );
    } catch (initialError) {
      lastErrorMessage = getExecErrorMessage(initialError);
      if (shouldLog4kDebug) {
        log4kDebug(requestId, "initial-attempt-failed", {
          message: lastErrorMessage,
          isYoutubeBotBlock: isYoutubeBotBlock(lastErrorMessage),
          isFormatNotAvailable: isFormatNotAvailableError(lastErrorMessage),
        });
      }
      const shouldRetryWithCookies =
        isYoutubeBotBlock(lastErrorMessage) ||
        (require4k && isFormatNotAvailableError(lastErrorMessage));
      if (!shouldRetryWithCookies) {
        throw initialError;
      }

      for (const browser of COOKIE_BROWSER_FALLBACKS) {
        try {
          if (shouldLog4kDebug) {
            log4kDebug(requestId, "cookie-retry-start", {
              browser,
            });
          }
          await downloadWithYtDlp(
            sourceUrl,
            formatId,
            outputTemplate,
            formatType,
            hasEmbeddedAudio,
            require4k,
            browser,
            requestId,
            shouldLog4kDebug
          );
          lastErrorMessage = "";
          if (shouldLog4kDebug) {
            log4kDebug(requestId, "cookie-retry-succeeded", {
              browser,
            });
          }
          break;
        } catch (cookieError) {
          const cookieErrorMessage = getExecErrorMessage(cookieError);
          lastErrorMessage = cookieErrorMessage;
          const retryableError =
            isYoutubeBotBlock(cookieErrorMessage) ||
            isCookieBrowserAccessError(cookieErrorMessage);
          if (shouldLog4kDebug) {
            log4kDebug(requestId, "cookie-retry-failed", {
              browser,
              retryableError,
              message: cookieErrorMessage,
            });
          }
          if (!retryableError) {
            throw cookieError;
          }
        }
      }
    }

    if (lastErrorMessage) {
      throw new Error(lastErrorMessage || "Failed to download selected format.");
    }

    const outputFilePath = await resolveDownloadedFilePath(tempDir);
    const stream = createReadStream(outputFilePath);
    const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;
    const outputFilename = outputFilePath.split("/").pop() ?? "download.bin";
    const outputExt = outputFilename.split(".").pop()?.toLowerCase() ?? "";
    const requestedParts = splitFilename(requestedFilename || "video");
    const safeBaseName = sanitizeFilename(requestedParts.base || "video");
    const finalExt = outputExt || requestedParts.ext || "bin";
    const finalFilename = `${safeBaseName}.${finalExt}`;
    const headerSafeFilename = toContentDispositionFilename(finalFilename);
    const contentType =
      EXTENSION_TO_MIME_TYPE[finalExt] ??
      requestedMimeType ??
      "application/octet-stream";

    setTimeout(() => {
      void rm(tempDir, { recursive: true, force: true });
    }, TEMP_DIR_CLEANUP_DELAY_MS);
    tempDirToCleanup = null;
    if (shouldLog4kDebug) {
      log4kDebug(requestId, "download-success", {
        outputFilePath,
        finalFilename,
        finalExt,
        contentType,
      });
    }

    return new Response(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${headerSafeFilename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (tempDirToCleanup) {
      await rm(tempDirToCleanup, { recursive: true, force: true }).catch(
        () => undefined
      );
    }
    let message = getExecErrorMessage(error);
    if (isYoutubeBotBlock(message)) {
      message =
        "YouTube blocked direct download for this video. Try again while logged into YouTube in a local browser.";
    }
    if (isMissingFfmpegError(message)) {
      message =
        "4K/high-quality merge requires FFmpeg on the server. Install FFmpeg and try again.";
    }
    if (require4k && isFormatNotAvailableError(message)) {
      message =
        "True 4K stream is not available for this request. YouTube returned no downloadable 2160p adaptive stream for the current session/video.";
      const status = 422;
      if (shouldLog4kDebug) {
        log4kDebug(requestId, "request-error", {
          message,
          status,
        });
      }
      console.error("download error:", message);
      return NextResponse.json({ error: message }, { status });
    }
    if (shouldLog4kDebug) {
      log4kDebug(requestId, "request-error", {
        message,
      });
    }
    console.error("download error:", message);
    return NextResponse.json(
      { error: message || "Failed to download selected format." },
      { status: 500 }
    );
  }
}
