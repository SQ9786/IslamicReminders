import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ArrowsIn,
  ArrowsOut,
  DownloadSimple,
  FilmStrip,
  ImageSquare,
  Pause,
  Play,
  ShareNetwork,
  Stack,
} from "@phosphor-icons/react";
import type { Motion } from "../data/backgrounds";
import type { Piece, Ratio, Theme, Voice } from "../types";
import { drawReminder, ratioSize, type DrawSpec, type Plate } from "../lib/drawReminder";
import { downloadStill, fileSlug, placeInRun, recordReel, shareStill } from "../lib/exportMedia";
import { MagneticButton } from "./MagneticButton";

type Props = {
  piece: Piece;
  theme: Theme;
  ratio: Ratio;
  duration: number;
  useHook: boolean;
  showMark: boolean;
  onRatio: (ratio: Ratio) => void;
  onDuration: (seconds: number) => void;
  onHook: (value: boolean) => void;
  onMark: (value: boolean) => void;
  voice: Voice;
  onVoice: (voice: Voice) => void;
  run: Piece[];
  motion: Motion | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoReady: number;
};

const ratios: Ratio[] = ["9:16", "4:5", "1:1"];
const durations = [6, 9, 12];
const voiceOptions: { id: Voice; label: string }[] = [
  { id: "even", label: "Even" },
  { id: "arabic", label: "Arabic" },
  { id: "english", label: "English" },
];

export function Stage({
  piece,
  theme,
  ratio,
  duration,
  useHook,
  showMark,
  onRatio,
  onDuration,
  onHook,
  onMark,
  voice,
  onVoice,
  run,
  motion,
  videoRef,
  videoReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lock = useRef(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [mode, setMode] = useState<"off" | "line" | "run">("off");
  const [recording, setRecording] = useState<"off" | "line" | "run">("off");
  const [progress, setProgress] = useState(1);
  const [runAt, setRunAt] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const [error, setError] = useState("");

  const signature = [
    piece.kind,
    piece.topic,
    piece.arabic,
    piece.english,
    piece.source,
    piece.hook,
    theme.id,
    ratio,
    useHook,
    showMark,
    voice,
    fontsReady,
    motion?.id ?? "still",
    videoReady,
    run.map((item) => `${item.id}:${item.english}`).join("~"),
  ].join("|");

  function plate(): Plate | null {
    const video = videoRef.current;
    if (!motion || !video || video.readyState < 2 || video.videoWidth < 2) return null;
    return {
      source: video,
      width: video.videoWidth,
      height: video.videoHeight,
      ink: motion.ink,
      muted: motion.muted,
      rule: motion.rule,
      veil: motion.veil,
      light: motion.light,
    };
  }

  function specFor(item: Piece): DrawSpec {
    return { piece: item, theme, ratio, useHook, showMark, voice, plate: plate() };
  }

  function paint(t: number, item: Piece = piece) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = ratioSize[ratio];
    if (canvas.width !== size.w || canvas.height !== size.h) {
      canvas.width = size.w;
      canvas.height = size.h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawReminder(ctx, specFor(item), t);
  }

  useEffect(() => {
    let live = true;
    const ready = Promise.race([
      document.fonts.ready.then(async () => {
        await document.fonts.load("700 64px Amiri");
        await document.fonts.load("600 64px Fraunces");
        await document.fonts.load("500 32px Outfit");
      }),
      new Promise((resolve) => window.setTimeout(resolve, 2800)),
    ]);
    ready.then(() => {
      if (live) setFontsReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (lock.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = ratioSize[ratio];
    if (canvas.width !== size.w || canvas.height !== size.h) {
      canvas.width = size.w;
      canvas.height = size.h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const current = specFor(piece);

    if (mode === "off") {
      const reduce =
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (motion && !reduce) {
        let frame = 0;
        let last = 0;
        const loop = (now: number) => {
          if (!document.hidden && now - last > 32) {
            last = now;
            drawReminder(ctx, specFor(piece), 1);
          }
          frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
      }
      drawReminder(ctx, current, 1);
      setProgress(1);
      setRunAt(-1);
      return;
    }

    const sequence = mode === "run" ? run.filter((item) => item.english.trim()) : [piece];
    const count = Math.max(1, sequence.length);
    const totalMs = duration * (mode === "run" ? count : 1) * 1000;
    const start = performance.now();
    let frame = 0;
    let shown = -1;
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / totalMs);
      const placed = placeInRun(t, mode === "run" ? count : 1);
      drawReminder(ctx, { ...current, piece: sequence[placed.index] ?? piece }, placed.local);
      setProgress(t);
      if (mode === "run" && placed.index !== shown) {
        shown = placed.index;
        setRunAt(placed.index);
      }
      if (t < 1) frame = requestAnimationFrame(loop);
      else {
        setMode("off");
        setRunAt(-1);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // specFor reads the latest plate through signature
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, duration, signature]);

  const canExport = Boolean(piece.english.trim());
  const runnable = run.filter((item) => item.english.trim());
  const canRun = runnable.length >= 2;
  const canShare = typeof navigator.share === "function";
  const busy = recording !== "off";
  const slug = fileSlug(piece.source || piece.english.slice(0, 24));
  const size = ratioSize[ratio];
  const frameWidth = focused
    ? ratio === "9:16"
      ? "min(92vw, calc(78dvh * 9 / 16))"
      : ratio === "4:5"
        ? "min(92vw, calc(78dvh * 4 / 5))"
        : "min(92vw, 78dvh)"
    : ratio === "9:16"
      ? "min(100%, 440px, calc(62dvh * 9 / 16))"
      : ratio === "4:5"
        ? "min(100%, 440px, calc(62dvh * 4 / 5))"
        : "min(100%, 440px, 62dvh)";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target;
      if (el instanceof HTMLElement && el.closest("input, textarea, select")) return;
      if (event.key === "Escape") {
        setFocused(false);
        return;
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFocused((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onRecord(sequence: Piece[]) {
    const canvas = canvasRef.current;
    if (!canvas || sequence.length === 0 || recording !== "off") return;
    setError("");
    setShareNote("");
    setMode("off");
    lock.current = true;
    setRecording(sequence.length > 1 ? "run" : "line");
    const count = sequence.length;
    let shown = -1;
    try {
      const blob = await recordReel(
        canvas,
        (t) => {
          const placed = placeInRun(t, count);
          paint(placed.local, sequence[placed.index]);
          setProgress(t);
          if (count > 1 && placed.index !== shown) {
            shown = placed.index;
            setRunAt(placed.index);
          }
        },
        duration * count * 1000,
      );
      downloadBlobSafe(blob, count > 1 ? "mihrab-run.webm" : `mihrab-${slug}.webm`);
    } catch {
      setError("This browser cannot record a reel. Download the still, then add sound in your editor.");
    } finally {
      lock.current = false;
      setRecording("off");
      setRunAt(-1);
      paint(1);
      setProgress(1);
    }
  }

  async function onShare() {
    const canvas = canvasRef.current;
    if (!canvas || !canExport || recording !== "off") return;
    setError("");
    setMode("off");
    paint(1);
    try {
      const result = await shareStill(canvas, `mihrab-${slug}.png`, piece.source || "Mihrab");
      if (result === "shared") setShareNote("Shared the still.");
      if (result === "saved") setShareNote("Saved the still.");
      if (result === "cancelled") setShareNote("");
    } catch {
      setError("The still could not be shared. Download it instead.");
    }
  }

  return (
    <div
      className={
        focused
          ? "fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 overflow-auto bg-[var(--page)] px-4 py-6"
          : "flex flex-col gap-4"
      }
    >
      <div className="flex w-full max-w-[440px] flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border border-[var(--line)] p-1">
          {ratios.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onRatio(item)}
              className={`rounded-full px-3 py-1 text-xs tracking-wide transition-colors ${
                ratio === item ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[var(--soft)] hover:text-[var(--ink)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex rounded-full border border-[var(--line)] p-1">
          {durations.map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => onDuration(seconds)}
              className={`rounded-full px-3 py-1 text-xs tabular-nums transition-colors ${
                duration === seconds ? "bg-[var(--wash)] text-[var(--ink)]" : "text-[var(--soft)] hover:text-[var(--ink)]"
              }`}
            >
              {seconds}s
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-[440px] flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border border-[var(--line)] p-1" role="group" aria-label="Type voice">
          {voiceOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onVoice(item.id)}
              aria-pressed={voice === item.id}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                voice === item.id ? "bg-[var(--wash)] text-[var(--ink)]" : "text-[var(--soft)] hover:text-[var(--ink)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFocused((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98]"
        >
          {focused ? <ArrowsIn size={14} weight="regular" /> : <ArrowsOut size={14} weight="regular" />}
          {focused ? "Close" : "Focus"}
        </button>
      </div>

      <div className="mx-auto flex w-full flex-col gap-3" style={{ width: frameWidth }}>
        <div className="relative">
          {!fontsReady && (
            <div
              className={`absolute inset-0 animate-pulse rounded-[1.4rem] bg-[var(--wash)] ${
                ratio === "9:16" ? "aspect-[9/16]" : ratio === "4:5" ? "aspect-[4/5]" : "aspect-square"
              }`}
            />
          )}
          <div
            className={`overflow-hidden rounded-[1.4rem] shadow-[0_30px_70px_-24px_rgba(20,16,12,0.45)] ring-1 ring-[var(--line)] transition-opacity duration-500 ${
              fontsReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <canvas ref={canvasRef} className="block h-auto w-full" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[0.68rem] text-[var(--faint)]">
          <p className="tabular-nums">
            {size.w} × {size.h}
          </p>
          <p>
            {theme.name}
            {mode === "run" && runAt >= 0 ? ` · ${runAt + 1}/${runnable.length}` : ""}
          </p>
        </div>

        <div className="h-0.5 w-full bg-[var(--line)]">
          <div
            className="h-0.5 origin-left bg-[var(--accent)]"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setError("");
            setShareNote("");
            setMode((value) => (value === "line" ? "off" : "line"));
          }}
          disabled={!canExport || busy}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
        >
          {mode === "line" ? <Pause size={16} weight="regular" /> : <Play size={16} weight="regular" />}
          {mode === "line" ? "Stop" : "Play reel"}
        </button>
        <MagneticButton
          onClick={() => {
            if (!canExport) return;
            setMode("off");
            setShareNote("");
            paint(1);
            const canvas = canvasRef.current;
            if (canvas) downloadStill(canvas, `mihrab-${slug}.png`);
          }}
          disabled={!canExport || busy}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-ink)] disabled:opacity-40"
        >
          <ImageSquare size={16} weight="regular" />
          Still
          <DownloadSimple size={14} weight="regular" />
        </MagneticButton>
        {canShare && (
          <button
            type="button"
            onClick={onShare}
            disabled={!canExport || busy}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
          >
            <ShareNetwork size={16} weight="regular" />
            Share
          </button>
        )}
        <MagneticButton
          onClick={() => onRecord([piece])}
          disabled={!canExport || busy}
          className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_50%,transparent)] px-4 py-2 text-sm text-[var(--ink)] disabled:opacity-40"
        >
          <FilmStrip size={16} weight="regular" />
          {recording === "line" ? "Recording…" : "Reel"}
        </MagneticButton>
        {canRun && (
          <button
            type="button"
            onClick={() => {
              if (busy) return;
              if (mode === "run") {
                setMode("off");
                return;
              }
              setError("");
              setShareNote("");
              setMode("run");
            }}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
          >
            {mode === "run" ? <Pause size={16} weight="regular" /> : <Stack size={16} weight="regular" />}
            {mode === "run" ? "Stop" : "Play run"}
          </button>
        )}
        {canRun && (
          <button
            type="button"
            onClick={() => onRecord(runnable)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_50%,transparent)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
          >
            <FilmStrip size={16} weight="regular" />
            {recording === "run" ? "Recording…" : "Save run"}
          </button>
        )}
        </div>

      <div className="flex gap-4 text-xs text-[var(--soft)]">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={useHook}
            onChange={(event) => onHook(event.target.checked)}
          />
          Open with the hook
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={showMark}
            onChange={(event) => onMark(event.target.checked)}
          />
          Mark Mihrab
        </label>
      </div>

      {shareNote && (
        <p className="text-sm text-[var(--soft)]" role="status">
          {shareNote}
        </p>
      )}
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      {!canExport && (
        <p className="text-sm text-[var(--soft)]">Write the English line before you export.</p>
      )}
      <p className="text-xs leading-relaxed text-[var(--faint)]">
        The reel is silent. A run plays each pinned line for the length you chose. Add recitation or a nasheed in your editor before you post.
      </p>
      </div>
    </div>
  );
}

function downloadBlobSafe(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
