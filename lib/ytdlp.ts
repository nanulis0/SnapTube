const YOUTUBE_REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  Referer: "https://www.youtube.com/",
  Origin: "https://www.youtube.com",
} as const;

const YOUTUBE_PLAYER_CLIENT_ARG = "youtube:player_client=tv,ios,android";
const FOUR_K_SELECTOR =
  "bestvideo[height<=2160][vcodec!=none]+bestaudio[acodec!=none]/best[height<=2160]/best";
const FOUR_K_STRICT_SELECTOR =
  "bestvideo[height>=2160][vcodec!=none]+bestaudio[acodec!=none]/bestvideo[height=2160][vcodec!=none]+bestaudio[acodec!=none]";

type DownloadSelectorInput = {
  formatId: string;
  formatType?: "video" | "audio";
  hasEmbeddedAudio?: boolean;
  require4k?: boolean;
};

function isSimpleFormatId(formatId: string): boolean {
  const selector = formatId.trim();
  if (!selector) return false;
  return !selector.includes("+") && !selector.includes("/") && !selector.includes("[");
}

function buildHeaderArgs(): string[] {
  return Object.entries(YOUTUBE_REQUEST_HEADERS).flatMap(([key, value]) => [
    "--add-header",
    `${key}: ${value}`,
  ]);
}

function normalizeKnownSelector(formatId: string): string {
  if (
    formatId === "bestvideo[height<=2160]+bestaudio/best" ||
    formatId === FOUR_K_SELECTOR
  ) {
    return FOUR_K_SELECTOR;
  }
  return formatId;
}

function shouldPairVideoWithAudio(
  formatId: string,
  formatType?: "video" | "audio",
  hasEmbeddedAudio?: boolean
): boolean {
  if (formatType !== "video") return false;
  if (hasEmbeddedAudio) return false;

  const selector = formatId.trim();
  if (!selector) return false;
  if (selector.includes("+")) return false;
  if (selector.includes("/")) return false;
  return true;
}

export function resolveDownloadSelector({
  formatId,
  formatType,
  hasEmbeddedAudio,
  require4k,
}: DownloadSelectorInput): string {
  const normalized = normalizeKnownSelector(formatId);

  if (require4k) {
    // Prefer the exact discovered 2160p itag when the UI provides one.
    // This avoids false negatives from a strict global bestvideo selector.
    if (isSimpleFormatId(normalized) && formatType === "video") {
      if (hasEmbeddedAudio) return normalized;
      return `${normalized}+bestaudio[acodec!=none]/${normalized}`;
    }
    return FOUR_K_STRICT_SELECTOR;
  }

  if (!shouldPairVideoWithAudio(normalized, formatType, hasEmbeddedAudio)) {
    return normalized;
  }

  return `${normalized}+bestaudio[acodec!=none]/${normalized}+bestaudio/${normalized}`;
}

export function buildYtDlpInfoArgs(url: string, cookiesFromBrowser?: string): string[] {
  const args = [
    "-m",
    "yt_dlp",
    "-J",
    "--no-playlist",
    "--extractor-args",
    YOUTUBE_PLAYER_CLIENT_ARG,
    ...buildHeaderArgs(),
    url,
  ];

  if (cookiesFromBrowser) {
    args.splice(4, 0, "--cookies-from-browser", cookiesFromBrowser);
  }

  return args;
}

export function buildYtDlpDownloadArgs(
  sourceUrl: string,
  selector: string,
  outputTemplate: string,
  cookiesFromBrowser?: string
): string[] {
  const args = [
    "-m",
    "yt_dlp",
    "--no-playlist",
    "--no-warnings",
    "--extractor-args",
    YOUTUBE_PLAYER_CLIENT_ARG,
    ...buildHeaderArgs(),
    "-f",
    selector,
    "--merge-output-format",
    "mp4",
    "-o",
    outputTemplate,
    sourceUrl,
  ];

  if (cookiesFromBrowser) {
    args.splice(4, 0, "--cookies-from-browser", cookiesFromBrowser);
  }

  return args;
}

export { FOUR_K_SELECTOR, FOUR_K_STRICT_SELECTOR };
