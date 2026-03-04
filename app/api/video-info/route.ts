import { NextResponse } from "next/server";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { buildYtDlpInfoArgs } from "@/lib/ytdlp";

export const runtime = "nodejs";
const execFileAsync = promisify(execFile);
const YTDLP_STDIO_BUFFER_BYTES = 20 * 1024 * 1024;
const COOKIE_BROWSER_FALLBACKS = [
  "chrome",
  "brave",
  "chromium",
  "edge",
  "firefox",
  "safari",
];

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

function formatDuration(secondsRaw: string): string {
  const totalSeconds = Number.parseInt(secondsRaw, 10);
  if (Number.isNaN(totalSeconds) || totalSeconds <= 0) return "0:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatViews(viewCountRaw?: string): string {
  const count = Number.parseInt(viewCountRaw ?? "0", 10);
  if (Number.isNaN(count) || count <= 0) return "0 views";
  return `${new Intl.NumberFormat("en-US").format(count)} views`;
}

type YtDlpFormat = {
  format_id?: string;
  ext?: string;
  acodec?: string;
  vcodec?: string;
  url?: string;
  manifest_url?: string;
  height?: number;
  abr?: number;
  tbr?: number;
  filesize?: number;
  filesize_approx?: number;
};

function hasDirectDownloadSource(format: YtDlpFormat): boolean {
  return Boolean(format.url || format.manifest_url);
}

type YtDlpInfo = {
  id: string;
  title: string;
  duration?: number;
  uploader?: string;
  view_count?: number;
  thumbnail?: string;
  formats?: YtDlpFormat[];
};

function formatApproxSizeBytes(bytesRaw?: number): string {
  if (!bytesRaw || bytesRaw <= 0) return "Unknown size";
  const mb = bytesRaw / (1024 * 1024);
  if (mb >= 1024) return `~${(mb / 1024).toFixed(1)} GB`;
  return `~${Math.round(mb)} MB`;
}

function videoMimeTypeFromExt(ext?: string): string {
  if (ext === "webm") return "video/webm";
  if (ext === "mkv") return "video/x-matroska";
  return "video/mp4";
}

function audioMimeTypeFromExt(ext?: string): string {
  if (ext === "webm") return "audio/webm";
  if (ext === "mp3") return "audio/mpeg";
  return "audio/mp4";
}

function videoQualityLabel(height?: number, hasAudio?: boolean): string {
  const resolution = `${height ?? "?"}p`;
  const qualityTier = height && height >= 2160 ? " 4K" : "";
  const audioNote = hasAudio ? "" : " (video only)";
  return `${resolution}${qualityTier}${audioNote}`;
}

function normalizeCodec(codecRaw?: string): string {
  if (!codecRaw || codecRaw === "none") return "unknown";
  const codec = codecRaw.split(".")[0];
  if (!codec) return "unknown";
  return codec.toUpperCase();
}

function collectFormats(formatsRaw: YtDlpFormat[] = []): DownloadFormat[] {
  const videoFormats = formatsRaw
    .filter(
      (f) => f.format_id && f.vcodec !== "none" && hasDirectDownloadSource(f)
    )
    .sort((a, b) => {
      const byHeight = (b.height ?? 0) - (a.height ?? 0);
      if (byHeight !== 0) return byHeight;

      // For same resolution, prefer a stream that already includes audio.
      const aHasAudio = a.acodec !== "none";
      const bHasAudio = b.acodec !== "none";
      if (aHasAudio !== bHasAudio) {
        return Number(bHasAudio) - Number(aHasAudio);
      }

      const aSize = a.filesize ?? a.filesize_approx ?? 0;
      const bSize = b.filesize ?? b.filesize_approx ?? 0;
      return bSize - aSize;
    });

  const audioFormats = formatsRaw
    .filter(
      (f) =>
        f.format_id &&
        f.vcodec === "none" &&
        f.acodec !== "none" &&
        hasDirectDownloadSource(f)
    )
    .sort((a, b) => (b.abr ?? b.tbr ?? 0) - (a.abr ?? a.tbr ?? 0));

  const videoFormatList: DownloadFormat[] = videoFormats.map((format) => {
    const hasAudio = format.acodec !== "none";
    return {
      itag: format.format_id ?? "",
      quality: videoQualityLabel(format.height, hasAudio),
      format: format.ext ?? "mp4",
      size: formatApproxSizeBytes(format.filesize ?? format.filesize_approx),
      type: "video",
      mimeType: videoMimeTypeFromExt(format.ext),
      container: format.ext ?? "mp4",
      videoCodec: normalizeCodec(format.vcodec),
      audioCodec: hasAudio ? normalizeCodec(format.acodec) : undefined,
      audioIncluded: hasAudio,
    };
  });

  const audioFormatList: DownloadFormat[] = audioFormats.map((format) => {
    const bitrateKbps = Math.round(format.abr ?? format.tbr ?? 0);
    return {
      itag: format.format_id ?? "",
      quality: `${bitrateKbps} kbps`,
      format: format.ext ?? "m4a",
      size: formatApproxSizeBytes(format.filesize ?? format.filesize_approx),
      type: "audio",
      mimeType: audioMimeTypeFromExt(format.ext),
      container: format.ext ?? "m4a",
      audioCodec: normalizeCodec(format.acodec),
      bitrateKbps,
    };
  });
  return [...videoFormatList, ...audioFormatList].filter(
    (format) => format.itag
  );
}

function has4kVideoFormat(formats: DownloadFormat[]): boolean {
  return formats.some((format) => format.type === "video" && format.quality.startsWith("2160p"));
}

async function fetchVideoInfo(url: string, cookiesFromBrowser?: string): Promise<YtDlpInfo> {
  const { stdout } = await execFileAsync(
    "python3",
    buildYtDlpInfoArgs(url, cookiesFromBrowser),
    {
      maxBuffer: YTDLP_STDIO_BUFFER_BYTES,
    }
  );
  return JSON.parse(stdout) as YtDlpInfo;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    let info = await fetchVideoInfo(url);
    let formats = collectFormats(info.formats);
    let lastCookieInfoError = "";

    if (!has4kVideoFormat(formats)) {
      for (const browser of COOKIE_BROWSER_FALLBACKS) {
        try {
          const cookieInfo = await fetchVideoInfo(url, browser);
          const cookieFormats = collectFormats(cookieInfo.formats);
          if (has4kVideoFormat(cookieFormats)) {
            info = cookieInfo;
            formats = cookieFormats;
            lastCookieInfoError = "";
            break;
          }
        } catch (cookieError) {
          lastCookieInfoError =
            cookieError instanceof Error ? cookieError.message : "Failed to fetch with browser cookies.";
        }
      }
    }

    return NextResponse.json({
      id: info.id,
      sourceUrl: url,
      title: info.title,
      thumbnail: info.thumbnail ?? `https://img.youtube.com/vi/${info.id}/hqdefault.jpg`,
      duration: formatDuration(String(info.duration ?? 0)),
      channel: info.uploader ?? "Unknown channel",
      views: formatViews(String(info.view_count ?? 0)),
      formats,
      fourKAvailable: has4kVideoFormat(formats),
      fourKAccessHint:
        !has4kVideoFormat(formats) && lastCookieInfoError
          ? "4K formats may require an authenticated browser session or PO token access."
          : undefined,
    });
  } catch (error) {
    let message =
      error instanceof Error
        ? error.message
        : "Failed to fetch video information.";
    if (
      message.includes("Sign in to confirm you’re not a bot") ||
      message.includes("Sign in to confirm you're not a bot")
    ) {
      message =
        "YouTube blocked this request (bot check). Add browser cookies support or try another video.";
    }
    console.error("video-info error:", message);
    return NextResponse.json(
      { error: message || "Failed to fetch video information." },
      { status: 500 }
    );
  }
}
