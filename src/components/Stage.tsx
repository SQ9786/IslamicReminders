import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ArrowsIn,
  ArrowsOut,
  CheckCircle,
  DeviceMobile,
  DownloadSimple,
  FilmStrip,
  Images,
  ImageSquare,
  Pause,
  Play,
  ShareNetwork,
  SpeakerHigh,
  SpeakerSlash,
  Stack,
} from "@phosphor-icons/react";
import type { Motion } from "../data/backgrounds";
import { buildCaption, soundSrc } from "../data/library";
import type { Piece, Ratio, Seat, Theme, Voice } from "../types";
import { drawReminder, ratioSize, type DrawSpec, type Plate } from "../lib/drawReminder";
import {
  canShareFile,
  canvasPng,
  downloadBlob,
  downloadStill,
  fileSlug,
  recordReel,
  runLayers,
  shareFile,
  shareStill,
  zipStore,
} from "../lib/exportMedia";
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
  seat: Seat;
  onSeat: (seat: Seat) => void;
  clear: boolean;
  onClear: (value: boolean) => void;
  guides: boolean;
  onGuides: (value: boolean) => void;
  firm: boolean;
  onFirm: (value: boolean) => void;
  run: Piece[];
  motion: Motion | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoReady: number;
  onPosted: (ids: string[]) => void;
  advanced?: boolean;
  desk?: "phone" | "studio";
  compact?: boolean;
  span?: "chip" | "sample" | "full";
};

const ratios: Ratio[] = ["9:16", "4:5", "1:1"];
const durations = [6, 9, 12];
const voiceOptions: { id: Voice; label: string }[] = [
  { id: "even", label: "Even" },
  { id: "arabic", label: "Arabic larger" },
  { id: "english", label: "English larger" },
];
const seatOptions: { id: Seat; label: string }[] = [
  { id: "high", label: "High" },
  { id: "mid", label: "Middle" },
  { id: "low", label: "Low" },
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
  seat,
  onSeat,
  clear,
  onClear,
  guides,
  onGuides,
  firm,
  onFirm,
  run,
  motion,
  videoRef,
  videoReady,
  onPosted,
  advanced = true,
  desk = "studio",
  compact = false,
  span = "full",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const soundGraph = useRef<{
    ctx: AudioContext;
    delay: DelayNode;
    dest: MediaStreamAudioDestinationNode;
  } | null>(null);
  const sounding = useRef<string | null>(null);
  const lock = useRef(false);
  const pausePaint = useRef(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [mode, setMode] = useState<"off" | "line" | "run">("off");
  const [recording, setRecording] = useState<"off" | "line" | "run">("off");
  const [progress, setProgress] = useState(1);
  const [held, setHeld] = useState<number | null>(null);
  const [runAt, setRunAt] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState<{ blob: Blob; filename: string; text: string; ids: string[] } | null>(null);
  const [markIds, setMarkIds] = useState<string[]>([]);
  const [shareNote, setShareNote] = useState("");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState(false);
  const [sound, setSound] = useState(true);

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
    seat,
    clear,
    firm,
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
    return { piece: item, theme, ratio, useHook, showMark, voice, seat, clear, firm, plate: plate() };
  }

  function drawFrame(
    t: number,
    item: Piece = piece,
    options?: { typeFade?: number; pass?: "all" | "ground" | "type" },
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = ratioSize[ratio];
    if (canvas.width !== size.w || canvas.height !== size.h) {
      canvas.width = size.w;
      canvas.height = size.h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawReminder(ctx, { ...specFor(item), typeFade: options?.typeFade, pass: options?.pass }, t);
  }

  function paint(t: number, item: Piece = piece) {
    drawFrame(t, item);
  }

  function paintRun(t: number, sequence: Piece[]) {
    const layers = runLayers(t, Math.max(1, sequence.length));
    if (layers.length === 1) {
      drawFrame(layers[0].local, sequence[layers[0].index] ?? piece, { typeFade: layers[0].fade });
      return layers[0].index;
    }
    drawFrame(1, sequence[layers[0].index] ?? piece, { pass: "ground" });
    for (const layer of layers) {
      drawFrame(layer.local, sequence[layer.index] ?? piece, { typeFade: layer.fade, pass: "type" });
    }
    return layers[layers.length - 1].index;
  }

  function postableIds(sequence: Piece[]) {
    return sequence.map((item) => item.id).filter((id) => id && id !== "custom");
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

  function speechAt(item: Piece, audioMs: number, count: number) {
    const slotMs = duration * 1000;
    const withHook = useHook && Boolean(item.hook.trim());
    const wanted = (withHook ? 0.44 : 0.16) * slotMs;
    const endMargin = count > 1 ? slotMs * 0.16 + 80 : 120;
    const latest = Math.max(0, slotMs - audioMs - endMargin);
    return Math.min(wanted, latest) / slotMs;
  }

  function quietSound() {
    audioRef.current?.pause();
    sounding.current = null;
  }

  function ensureGraph() {
    const audio = audioRef.current;
    if (!audio) return null;
    if (!soundGraph.current) {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      const delay = ctx.createDelay(30);
      const dest = ctx.createMediaStreamDestination();
      source.connect(delay);
      delay.connect(ctx.destination);
      delay.connect(dest);
      soundGraph.current = { ctx, delay, dest };
    }
    return soundGraph.current;
  }

  function startLine(item: Piece | undefined, count: number) {
    const audio = audioRef.current;
    const src = item && sound ? soundSrc(item) : null;
    if (!audio || !item || !src) {
      quietSound();
      return;
    }
    const graph = ensureGraph();
    if (!graph) return;
    void graph.ctx.resume();
    const applyDelay = () => {
      const audioMs = Number.isFinite(audio.duration) ? audio.duration * 1000 : 0;
      const fraction = audioMs ? speechAt(item, audioMs, count) : useHook && item.hook.trim() ? 0.44 : 0.16;
      graph.delay.delayTime.value = fraction * duration;
    };
    sounding.current = item.id;
    audio.pause();
    if (!audio.src.endsWith(src)) audio.src = src;
    audio.currentTime = 0;
    audio.addEventListener("loadedmetadata", applyDelay, { once: true });
    applyDelay();
    void audio.play();
  }

  function followSound(t: number, sequence: Piece[]) {
    if (!sound) return;
    const count = Math.max(1, sequence.length);
    const layers = runLayers(t, count);
    const current = layers[layers.length - 1];
    if (!current) return;
    const item = sequence[current.index];
    if (!item || sounding.current === item.id) return;
    startLine(item, count);
  }

  const pieceKey = `${piece.id}|${piece.english}|${piece.arabic}|${piece.hook}|${piece.source}`;
  useEffect(() => {
    setHeld(null);
  }, [pieceKey]);

  useEffect(() => {
    if (lock.current || pausePaint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (mode === "off") {
      quietSound();
      const frameT = held ?? 1;
      setProgress(frameT);
      setRunAt(-1);
      const reduce =
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (motion && !reduce) {
        let frame = 0;
        let last = 0;
        const loop = (now: number) => {
          if (pausePaint.current) return;
          if (!document.hidden && now - last > 32) {
            last = now;
            drawFrame(frameT, piece);
          }
          frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
      }
      drawFrame(frameT, piece);
      return;
    }

    const sequence = mode === "run" ? run.filter((item) => item.english.trim()) : [piece];
    const count = Math.max(1, sequence.length);
    const totalMs = duration * (mode === "run" ? count : 1) * 1000;
    const start = performance.now();
    let frame = 0;
    let shown = -1;
    const loop = (now: number) => {
      if (pausePaint.current) return;
      const t = Math.min(1, (now - start) / totalMs);
      const index = paintRun(t, sequence);
      setProgress(t);
      followSound(t, sequence);
      if (index !== shown) {
        shown = index;
        if (mode === "run") setRunAt(index);
      }
      if (t < 1) frame = requestAnimationFrame(loop);
      else {
        setMode("off");
        setRunAt(-1);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // drawFrame reads the latest plate through signature
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, duration, signature, held, recording, saving, sound]);

  const canExport = Boolean(piece.english.trim());
  const runnable = run.filter((item) => item.english.trim());
  const canRun = runnable.length >= 2;
  const canShare = typeof navigator.share === "function";
  const busy = recording !== "off" || saving;
  const slug = fileSlug(piece.source || piece.english.slice(0, 24));
  const size = ratioSize[ratio];
  const studio = desk === "studio";
  const frameWidth = focused
    ? ratio === "9:16"
      ? "min(92vw, calc(78dvh * 9 / 16))"
      : ratio === "4:5"
        ? "min(92vw, calc(78dvh * 4 / 5))"
        : "min(92vw, 78dvh)"
    : !studio
      ? span === "chip"
        ? "min(28vw, 112px)"
        : span === "sample"
          ? "min(52vw, 200px)"
          : "min(100%, 420px)"
      : phone
        ? "min(100%, 280px)"
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
    setReady(null);
    setHeld(null);
    setMode("off");
    pausePaint.current = true;
    lock.current = true;
    setRecording(sequence.length > 1 ? "run" : "line");
    const count = sequence.length;
    const ids = postableIds(sequence);
    let shown = -1;
    try {
      if (sound) startLine(sequence[0], count);
      const graph = soundGraph.current;
      if (graph?.ctx.state === "suspended") await graph.ctx.resume();
      const track = sound ? graph?.dest.stream.getAudioTracks()[0] : null;
      const blob = await recordReel(
        canvas,
        (t) => {
          const index = paintRun(t, sequence);
          setProgress(t);
          followSound(t, sequence);
          if (index !== shown) {
            shown = index;
            if (count > 1) setRunAt(index);
          }
        },
        duration * count * 1000,
        track,
      );
      const extension = blob.type.includes("mp4") ? "mp4" : "webm";
      const filename = count > 1 ? `tadhkeer-run.${extension}` : `tadhkeer-${slug}.${extension}`;
      const text = sequence.map((item) => buildCaption(item)).join("\n\n—\n\n");
      setMarkIds(ids);
      if (canShareFile(blob.type)) {
        setReady({ blob, filename, text, ids });
        setShareNote("Ready. Send opens Instagram, TikTok, WhatsApp, and the other apps on this phone.");
      } else {
        downloadBlob(blob, filename);
        setShareNote("Saved the video. Open it from your camera roll to post.");
      }
    } catch {
      setError("This browser cannot record a video. Download the image instead.");
    } finally {
      quietSound();
      pausePaint.current = false;
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
    paint(held ?? 1);
    try {
      const result = await shareStill(canvas, `tadhkeer-${slug}.png`, buildCaption(piece));
      if (result === "shared") setShareNote("Shared the still. Paste the caption if the app asks for one.");
      if (result === "saved") setShareNote("Saved the still.");
      if (result === "cancelled") setShareNote("");
    } catch {
      setError("The still could not be shared. Download it instead.");
    }
  }

  function onSend() {
    if (!ready) return;
    const pending = ready;
    navigator.clipboard?.writeText(pending.text).catch(() => {});
    void shareFile(pending.blob, pending.filename, pending.text).then((result) => {
      if (result === "shared") {
        if (pending.ids.length) onPosted(pending.ids);
        setMarkIds([]);
        setReady(null);
        setShareNote("Sent. Paste the caption in the app if it did not travel with the video.");
      } else if (result === "saved") {
        setShareNote("Saved the video.");
      } else {
        setShareNote("");
      }
    });
  }

  async function onSaveStills() {
    const canvas = canvasRef.current;
    if (!canvas || !canRun || busy) return;
    setError("");
    setShareNote("");
    setMode("off");
    pausePaint.current = true;
    setSaving(true);
    try {
      const files: { name: string; data: Uint8Array }[] = [];
      for (let index = 0; index < runnable.length; index++) {
        const item = runnable[index];
        paint(1, item);
        const blob = await canvasPng(canvas);
        const slugName = fileSlug(item.source || item.english.slice(0, 24));
        files.push({
          name: `tadhkeer-${String(index + 1).padStart(2, "0")}-${slugName}.png`,
          data: new Uint8Array(await blob.arrayBuffer()),
        });
      }
      downloadBlob(zipStore(files), "tadhkeer-stills.zip");
      setShareNote(`Saved ${files.length} stills.`);
    } catch {
      setError("The stills could not be packed. Download them one at a time.");
    } finally {
      pausePaint.current = false;
      setSaving(false);
      paint(held ?? 1);
    }
  }

  function seekTo(clientX: number, target: HTMLElement) {
    if (mode !== "off" || busy) return;
    const rect = target.getBoundingClientRect();
    const next = rect.width <= 0 ? 1 : Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setHeld(next);
    setProgress(next);
    paint(next);
  }

  function releaseFrame() {
    setHeld(null);
    setProgress(1);
    paint(1);
  }

  return (
    <div
      className={
        focused
          ? "fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 overflow-auto bg-[var(--page)] px-4 py-6"
          : "flex flex-col gap-4"
      }
    >
      {studio && (
      <>
      <div className="flex w-full max-w-[440px] flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-[var(--ink)]">Frame</p>
          <div className="flex rounded-full border border-[var(--line)] p-1" role="group" aria-label="Frame">
            {ratios.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onRatio(item)}
                className={`rounded-full px-3 py-1 text-sm tracking-wide transition-colors ${
                  ratio === item ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[var(--soft)] hover:text-[var(--ink)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm text-[var(--ink)]">Video length</p>
          <div className="flex rounded-full border border-[var(--line)] p-1" role="group" aria-label="Video length">
            {durations.map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => onDuration(seconds)}
                className={`rounded-full px-3 py-1 text-sm tabular-nums transition-colors ${
                  duration === seconds ? "bg-[var(--wash)] text-[var(--ink)]" : "text-[var(--soft)] hover:text-[var(--ink)]"
                }`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-[440px] flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--ink)]">Text balance</p>
          <p className="mb-2 text-sm text-[var(--soft)]">Which line is larger.</p>
          <div className="flex rounded-full border border-[var(--line)] p-1" role="group" aria-label="Text balance">
            {voiceOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onVoice(item.id)}
                aria-pressed={voice === item.id}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  voice === item.id ? "bg-[var(--wash)] text-[var(--ink)]" : "text-[var(--soft)] hover:text-[var(--ink)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPhone((value) => !value)}
            aria-pressed={phone}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors active:scale-[0.98] ${
              phone
                ? "border-[var(--accent)] bg-[var(--wash)] text-[var(--ink)]"
                : "border-[var(--line)] text-[var(--ink)] hover:bg-[var(--wash)]"
            }`}
          >
            <DeviceMobile size={14} weight="regular" />
            {phone ? "Studio size" : "Phone size"}
          </button>
          <button
            type="button"
            onClick={() => setFocused((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98]"
          >
            {focused ? <ArrowsIn size={14} weight="regular" /> : <ArrowsOut size={14} weight="regular" />}
            {focused ? "Close" : "Focus"}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[440px]">
        <p className="text-sm text-[var(--ink)]">Text position</p>
        <p className="mb-2 text-sm text-[var(--soft)]">Where the type sits in the frame.</p>
        <div className="flex rounded-full border border-[var(--line)] p-1" role="group" aria-label="Text position">
          {seatOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSeat(item.id)}
              aria-pressed={seat === item.id}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                seat === item.id ? "bg-[var(--wash)] text-[var(--ink)]" : "text-[var(--soft)] hover:text-[var(--ink)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      </>
      )}

      <div className="order-first mx-auto flex w-full flex-col gap-3" style={{ width: frameWidth }}>
        <div className="relative">
          {!fontsReady && (
            <div
              className={`absolute inset-0 animate-pulse rounded-[1.4rem] bg-[var(--wash)] ${
                ratio === "9:16" ? "aspect-[9/16]" : ratio === "4:5" ? "aspect-[4/5]" : "aspect-square"
              }`}
            />
          )}
          <div
            className={`relative overflow-hidden rounded-[1.4rem] shadow-[0_30px_70px_-24px_rgba(20,16,12,0.45)] ring-1 ring-[var(--line)] transition-opacity duration-500 ${
              fontsReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <canvas ref={canvasRef} className="block h-auto w-full" />
            {guides && ratio === "9:16" && (
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute inset-x-0 top-0 h-[14%] border-b border-dashed border-[var(--ink)]/30 bg-[var(--ink)]/10" />
                <div className="absolute top-[14%] right-0 bottom-[18%] w-[12%] border-l border-dashed border-[var(--ink)]/30 bg-[var(--ink)]/10" />
                <div className="absolute inset-x-0 bottom-0 h-[18%] border-t border-dashed border-[var(--ink)]/30 bg-[var(--ink)]/10" />
              </div>
            )}
          </div>
        </div>

        {!compact && (
        <div className="flex items-center justify-between text-sm text-[var(--soft)]">
          <p className="tabular-nums">
            {size.w} × {size.h}
          </p>
          <p>
            {theme.name}
            {mode === "run" && runAt >= 0 ? ` · ${runAt + 1}/${runnable.length}` : ""}
          </p>
        </div>
        )}

        {!compact && (
        <>
        <div
          className={`relative h-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${mode === "off" && !busy ? "cursor-ew-resize" : ""}`}
          role="slider"
          tabIndex={mode === "off" && !busy ? 0 : -1}
          aria-label="Poster moment"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-disabled={mode !== "off" || busy}
          onKeyDown={(event) => {
            if (mode !== "off" || busy) return;
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            event.stopPropagation();
            const delta = event.key === "ArrowRight" ? 0.02 : -0.02;
            const next = Math.min(1, Math.max(0, (held ?? 1) + delta));
            setHeld(next);
            setProgress(next);
            paint(next);
          }}
          onPointerDown={(event) => {
            if (mode !== "off" || busy) return;
            seekTo(event.clientX, event.currentTarget);
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              /* the pointer can already be gone */
            }
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            seekTo(event.clientX, event.currentTarget);
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--line)]">
            <div
              className="h-full origin-left bg-[var(--accent)]"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        </div>
        {held !== null && mode === "off" && (
          <button
            type="button"
            onClick={releaseFrame}
            className="self-start text-xs text-[var(--soft)] underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--ink)]"
          >
            Release the frame
          </button>
        )}
        </>
        )}

        <audio ref={audioRef} preload="auto" />
        {!studio && !compact && (
          <div>
            <p className="mb-2 text-sm text-[var(--ink)]">Video length</p>
            <div className="flex rounded-full border border-[var(--line)] p-1" role="group" aria-label="Video length">
              {durations.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => onDuration(seconds)}
                  className={`flex-1 rounded-full px-3 py-1 text-sm tabular-nums transition-colors ${
                    duration === seconds ? "bg-[var(--wash)] text-[var(--ink)]" : "text-[var(--soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>
        )}
        {studio && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={sound}
            onClick={() => setSound((value) => !value)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              sound ? "bg-[var(--wash)] text-[var(--ink)]" : "text-[var(--soft)] hover:text-[var(--ink)]"
            }`}
          >
            {sound ? "Sound on" : "Sound off"}
          </button>
          <p className="text-sm leading-relaxed text-[var(--soft)]">
            {sound
              ? "The voice starts when the English line appears. It is not a recitation."
              : "Sound is off, so the video is quiet."}
          </p>
        </div>
        )}
        <div
          className={
            studio
              ? "flex flex-wrap gap-2"
              : "fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-1.5 border-t border-[var(--line)] bg-[var(--page)]/95 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md"
          }
        >
        {!studio && (
          <button
            type="button"
            aria-pressed={sound}
            aria-label={sound ? "Sound on" : "Sound off"}
            onClick={() => setSound((value) => !value)}
            className={`inline-flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-xs ${
              sound ? "bg-[var(--wash)] text-[var(--ink)]" : "text-[var(--soft)]"
            }`}
          >
            {sound ? <SpeakerHigh size={18} weight="regular" /> : <SpeakerSlash size={18} weight="regular" />}
            Sound
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setError("");
            setShareNote("");
            setHeld(null);
            if (mode === "line") {
              setMode("off");
              return;
            }
            if (sound) startLine(piece, 1);
            setMode("line");
          }}
          disabled={!canExport || busy}
          className={
            studio
              ? "inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-5 py-3 text-base text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
              : "inline-flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-xs text-[var(--ink)] disabled:opacity-40"
          }
        >
          {mode === "line" ? <Pause size={18} weight="regular" /> : <Play size={18} weight="regular" />}
          {mode === "line" ? "Stop" : studio ? "Play video" : "Play"}
        </button>
        <MagneticButton
          onClick={() => {
            if (!canExport) return;
            setMode("off");
            setShareNote("");
            paint(held ?? 1);
            const canvas = canvasRef.current;
            if (canvas) downloadStill(canvas, `tadhkeer-${slug}.png`);
          }}
          disabled={!canExport || busy}
          className={
            studio
              ? "inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-base text-[var(--accent-ink)] disabled:opacity-40"
              : "inline-flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl bg-[var(--accent)] px-1 py-2 text-xs text-[var(--accent-ink)] disabled:opacity-40"
          }
        >
          <ImageSquare size={18} weight="regular" />
          {studio ? "Download image" : "Image"}
          {studio && <DownloadSimple size={16} weight="regular" />}
        </MagneticButton>
        <MagneticButton
          onClick={() => onRecord([piece])}
          disabled={!canExport || busy}
          className={
            studio
              ? "inline-flex items-center gap-2 rounded-full border border-[var(--accent)] bg-[var(--field)] px-5 py-3 text-base text-[var(--ink)] disabled:opacity-40"
              : "inline-flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl border border-[var(--accent)] bg-[var(--field)] px-1 py-2 text-xs text-[var(--ink)] disabled:opacity-40"
          }
        >
          <FilmStrip size={18} weight="regular" />
          {recording === "line" ? "Recording…" : studio ? "Download video" : "Video"}
        </MagneticButton>
        {(studio ? advanced : true) && canShare && (
          <button
            type="button"
            onClick={onShare}
            disabled={!canExport || busy}
            className={
              studio
                ? "inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
                : "inline-flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-xs text-[var(--ink)] disabled:opacity-40"
            }
          >
            <ShareNetwork size={18} weight="regular" />
            Share
          </button>
        )}
        {advanced && canRun && (
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
              setHeld(null);
              if (sound) startLine(runnable[0], runnable.length);
              setMode("run");
            }}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
          >
            {mode === "run" ? <Pause size={16} weight="regular" /> : <Stack size={16} weight="regular" />}
            {mode === "run" ? "Stop" : "Play pinned video"}
          </button>
        )}
        {advanced && canRun && (
          <button
            type="button"
            onClick={() => onRecord(runnable)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_50%,transparent)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
          >
            <FilmStrip size={16} weight="regular" />
            {recording === "run" ? "Recording…" : "Download pinned video"}
          </button>
        )}
        {advanced && canRun && (
          <button
            type="button"
            onClick={onSaveStills}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
          >
            <Images size={16} weight="regular" />
            {saving ? "Packing…" : "Save stills"}
          </button>
        )}
        </div>
        {ready && (
          <button
            type="button"
            onClick={onSend}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-ink)] active:scale-[0.98]"
          >
            <ShareNetwork size={16} weight="regular" />
            Send
          </button>
        )}
        {markIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onPosted(markIds);
              setMarkIds([]);
              setShareNote("Marked posted on this device.");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98]"
          >
            <CheckCircle size={16} weight="regular" />
            Mark posted
          </button>
        )}

      {advanced && (
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--soft)]">
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
          Mark Tadhkeer
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={clear} onChange={(event) => onClear(event.target.checked)} />
          Clear of the buttons
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={guides} onChange={(event) => onGuides(event.target.checked)} />
          Show reel edges
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={firm} onChange={(event) => onFirm(event.target.checked)} />
          Firm plate
        </label>
      </div>
      )}

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
      {studio && (
      <p className="text-sm leading-relaxed text-[var(--soft)]">
        {advanced
          ? "Send opens the share sheet, including Instagram, TikTok, and WhatsApp. The caption is copied so you can paste it. A pinned video fades from one line into the next and speaks each English line. Drag the bar under the frame to hold a moment, then download that image. Firm plate holds the type off the motion. Clear of the buttons keeps the type inside a Reel."
          : "Play video lets you hear it first. Download image saves this frame. Download video saves the motion, and the voice starts when the English line appears. Phone size shows the post at the width of a phone."}
      </p>
      )}
      {!studio && !compact && (
        <p className="text-sm leading-relaxed text-[var(--soft)]">
          {sound
            ? "The voice starts when the English line appears. It is not a recitation."
            : "Sound is off, so the video is quiet."}
        </p>
      )}
      </div>
    </div>
  );
}

