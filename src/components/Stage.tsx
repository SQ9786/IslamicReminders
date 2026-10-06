import { useEffect, useRef, useState, type RefObject } from "react";
import { DownloadSimple, FilmStrip, ImageSquare, Pause, Play } from "@phosphor-icons/react";
import type { Motion } from "../data/backgrounds";
import type { Piece, Ratio, Theme } from "../types";
import { drawReminder, ratioSize, type DrawSpec, type Plate } from "../lib/drawReminder";
import { downloadStill, fileSlug, recordReel } from "../lib/exportMedia";
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
  motion: Motion | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoReady: number;
};

const ratios: Ratio[] = ["9:16", "4:5", "1:1"];
const durations = [6, 9, 12];

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
  motion,
  videoRef,
  videoReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lock = useRef(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(1);
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
    fontsReady,
    motion?.id ?? "still",
    videoReady,
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

  function spec(): DrawSpec {
    return { piece, theme, ratio, useHook, showMark, plate: plate() };
  }

  function paint(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = ratioSize[ratio];
    if (canvas.width !== size.w || canvas.height !== size.h) {
      canvas.width = size.w;
      canvas.height = size.h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawReminder(ctx, spec(), t);
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
    const current = spec();

    if (!playing) {
      const reduce =
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (motion && !reduce) {
        let frame = 0;
        let last = 0;
        const loop = (now: number) => {
          if (!document.hidden && now - last > 32) {
            last = now;
            drawReminder(ctx, spec(), 1);
          }
          frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
      }
      drawReminder(ctx, current, 1);
      setProgress(1);
      return;
    }

    const start = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      drawReminder(ctx, current, t);
      setProgress(t);
      if (t < 1) frame = requestAnimationFrame(loop);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // spec() reads the latest piece through signature
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration, signature]);

  const canExport = Boolean(piece.english.trim());
  const slug = fileSlug(piece.source || piece.english.slice(0, 24));
  const size = ratioSize[ratio];
  const frameWidth =
    ratio === "9:16"
      ? "min(100%, 440px, calc(62dvh * 9 / 16))"
      : ratio === "4:5"
        ? "min(100%, 440px, calc(62dvh * 4 / 5))"
        : "min(100%, 440px, 62dvh)";

  async function onRecord() {
    const canvas = canvasRef.current;
    if (!canvas || !canExport || recording) return;
    setError("");
    setPlaying(false);
    lock.current = true;
    setRecording(true);
    try {
      const blob = await recordReel(
        canvas,
        (t) => {
          paint(t);
          setProgress(t);
        },
        duration * 1000,
      );
      downloadBlobSafe(blob, `mihrab-${slug}.webm`);
    } catch {
      setError("This browser cannot record a reel. Download the still, then add sound in your editor.");
    } finally {
      lock.current = false;
      setRecording(false);
      paint(1);
      setProgress(1);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <p>{theme.name}</p>
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
            setPlaying((value) => !value);
          }}
          disabled={!canExport || recording}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
        >
          {playing ? <Pause size={16} weight="regular" /> : <Play size={16} weight="regular" />}
          {playing ? "Stop" : "Play reel"}
        </button>
        <MagneticButton
          onClick={() => {
            if (!canExport) return;
            setPlaying(false);
            paint(1);
            const canvas = canvasRef.current;
            if (canvas) downloadStill(canvas, `mihrab-${slug}.png`);
          }}
          disabled={!canExport || recording}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-ink)] disabled:opacity-40"
        >
          <ImageSquare size={16} weight="regular" />
          Still
          <DownloadSimple size={14} weight="regular" />
        </MagneticButton>
        <MagneticButton
          onClick={onRecord}
          disabled={!canExport || recording}
          className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_50%,transparent)] px-4 py-2 text-sm text-[var(--ink)] disabled:opacity-40"
        >
          <FilmStrip size={16} weight="regular" />
          {recording ? "Recording…" : "Reel"}
        </MagneticButton>
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

      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      {!canExport && (
        <p className="text-sm text-[var(--soft)]">Write the English line before you export.</p>
      )}
      <p className="text-xs leading-relaxed text-[var(--faint)]">
        The reel is silent. Add recitation or a nasheed in your editor before you post.
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
