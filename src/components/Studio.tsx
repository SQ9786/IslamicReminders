import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowSquareOut,
  ArrowUUpLeft,
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  Check,
  CheckCircle,
  Copy,
  MagnifyingGlass,
  Shuffle,
  Stack,
  Star,
  X,
} from "@phosphor-icons/react";
import type { Kind, Piece, Ratio, Seat, Topic, Voice } from "../types";
import { buildCaption, filterLibrary, kinds, library, topics } from "../data/library";
import { motionById } from "../data/backgrounds";
import { shellVars, themeById } from "../data/themes";
import { freshDeskId, loadDesk, saveDesk } from "../lib/desk";
import { ColourPanel } from "./ColourPanel";
import { InstallHome } from "./InstallHome";
import { MagneticButton } from "./MagneticButton";
import { Stage } from "./Stage";
import { WordBand } from "./WordBand";

const fieldClass =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--field)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--faint)] focus-visible:border-[var(--accent)]";

const kindLabel: Record<Kind, string> = {
  ayah: "Ayah",
  hadith: "Hadith",
  reminder: "Reminder",
};

const topicLabel = Object.fromEntries(topics.map((item) => [item.id, item.label])) as Record<Topic, string>;

function verifiedDraft(piece: Piece): Piece {
  const found = library.find((item) => item.id === piece.id);
  if (!found) return piece;
  if (found.english !== piece.english || found.arabic !== piece.arabic) return piece;
  return {
    ...piece,
    source: found.source,
    sourceUrl: found.sourceUrl,
    attribution: found.attribution,
  };
}

function emptyLibraryCopy(savedOnly: boolean, freshOnly: boolean, query: string, savedCount: number) {
  if (query.trim()) {
    if (freshOnly && savedOnly) return "No unposted saved line matches that search.";
    if (freshOnly) return "No unposted line matches that search.";
    if (savedOnly) return "No saved line matches that search.";
    return "No line matches that search.";
  }
  if (savedOnly && savedCount === 0) return "Nothing saved yet. Star a line and it stays on this device.";
  if (freshOnly && savedOnly) return "No unposted saved line in this filter.";
  if (freshOnly) return "Every line in this filter is marked posted.";
  if (savedOnly) return "No saved line in this filter.";
  return "No lines for this filter. Clear it, or write your own.";
}

function useDesk(): "phone" | "studio" {
  const query = "(min-width: 1024px)";
  const [desk, setDesk] = useState<"phone" | "studio">(() =>
    window.matchMedia(query).matches ? "studio" : "phone",
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const apply = () => setDesk(media.matches ? "studio" : "phone");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return desk;
}

export function Studio() {
  const [stored] = useState(loadDesk);
  const [kind, setKind] = useState<Kind | "all">(stored.kind);
  const [topic, setTopic] = useState<Topic | "all">(stored.topic);
  const [themeId, setThemeId] = useState(stored.themeId);
  const [ratio, setRatio] = useState<Ratio>(stored.ratio);
  const [duration, setDuration] = useState(stored.duration);
  const [useHook, setUseHook] = useState(stored.useHook);
  const [showMark, setShowMark] = useState(stored.showMark);
  const [draft, setDraft] = useState<Piece>(() => verifiedDraft(stored.draft));
  const [savedIds, setSavedIds] = useState<string[]>(stored.savedIds);
  const [savedOnly, setSavedOnly] = useState(stored.savedOnly);
  const [tray, setTray] = useState<Piece[]>(stored.tray);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [backgroundId, setBackgroundId] = useState<string | null>(stored.backgroundId);
  const [voice, setVoice] = useState<Voice>(stored.voice);
  const [seat, setSeat] = useState<Seat>(stored.seat);
  const [clear, setClear] = useState(stored.clear);
  const [guides, setGuides] = useState(stored.guides);
  const [firm, setFirm] = useState(stored.firm);
  const [postedIds, setPostedIds] = useState<string[]>(stored.postedIds);
  const [freshOnly, setFreshOnly] = useState(stored.freshOnly);
  const [pathStep, setPathStep] = useState<"reminder" | "style" | "download">("reminder");
  const [more, setMore] = useState(false);
  const desk = useDesk();
  const studio = desk === "studio";
  const compact = !studio && pathStep !== "download";
  const span = studio ? "full" : pathStep === "reminder" ? "chip" : pathStep === "style" ? "sample" : "full";
  const [copiedRun, setCopiedRun] = useState(false);
  const [videoReady, setVideoReady] = useState(0);
  const [undoCount, setUndoCount] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const activeRow = useRef<HTMLLIElement>(null);
  const skipRowScroll = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const history = useRef<Piece[]>([]);
  const stepRef = useRef<(direction: 1 | -1) => void>(() => {});
  const undoRef = useRef<() => void>(() => {});
  const postedRef = useRef<() => void>(() => {});
  const nextRef = useRef<() => void>(() => {});

  const matches = useMemo(
    () => filterLibrary(kind, topic, query, savedIds, savedOnly, postedIds, freshOnly),
    [kind, topic, query, savedIds, savedOnly, postedIds, freshOnly],
  );
  const unpostedCount = library.filter((piece) => !postedIds.includes(piece.id)).length;
  const caption = draft.english.trim() ? buildCaption(draft) : "";
  const runCount = tray.filter((piece) => piece.english.trim()).length;
  const theme = themeById(themeId);
  const ground = motionById(backgroundId);
  const pinned = tray.some((piece) => piece.id === draft.id);

  useEffect(() => {
    const root = document.documentElement;
    const vars = shellVars(theme);
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === "string") root.style.setProperty(key, value);
    }
    root.style.colorScheme = theme.shell.light ? "light" : "dark";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.shell.page);
  }, [theme]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      saveDesk({
        draft,
        kind,
        topic,
        themeId,
        ratio,
        duration: duration as 6 | 9 | 12,
        useHook,
        showMark,
        savedIds,
        savedOnly,
        tray,
        backgroundId,
        voice,
        seat,
        clear,
        guides,
        postedIds,
        freshOnly,
        firm,
      });
    }, 180);
    return () => window.clearTimeout(id);
  }, [
    draft,
    kind,
    topic,
    themeId,
    ratio,
    duration,
    useHook,
    showMark,
    savedIds,
    savedOnly,
    tray,
    backgroundId,
    voice,
    seat,
    clear,
    guides,
    postedIds,
    freshOnly,
    firm,
  ]);

  function samePiece(a: Piece, b: Piece) {
    return (
      a.id === b.id &&
      a.kind === b.kind &&
      a.topic === b.topic &&
      a.arabic === b.arabic &&
      a.english === b.english &&
      a.source === b.source &&
      a.hook === b.hook
    );
  }

  function replaceDraft(next: Piece) {
    if (samePiece(draft, next)) return;
    history.current = [...history.current, draft].slice(-24);
    setUndoCount(history.current.length);
    setDraft({ ...next });
    setNotice("");
    setCopied(false);
  }

  function undo() {
    const previous = history.current.pop();
    setUndoCount(history.current.length);
    if (!previous) return;
    setDraft(previous);
    setNotice("");
    setCopied(false);
  }

  function step(direction: 1 | -1) {
    if (!matches.length) return;
    const index = matches.findIndex((item) => item.id === draft.id);
    const start = index < 0 ? (direction > 0 ? -1 : 0) : index;
    const next = matches[(start + direction + matches.length) % matches.length];
    replaceDraft(next);
  }

  function compose() {
    const unposted = matches.filter((piece) => !postedIds.includes(piece.id) && piece.id !== draft.id);
    const pool = unposted.length ? unposted : matches.filter((piece) => piece.id !== draft.id);
    const choices = pool.length ? pool : matches;
    if (!choices.length) {
      setNotice("Nothing in the library matches these filters. Clear one, or write your own line.");
      return;
    }
    const next = choices[Math.floor(Math.random() * choices.length)];
    replaceDraft(next);
  }

  function nextUnposted() {
    const pool = matches.filter((piece) => !postedIds.includes(piece.id));
    if (!pool.length) {
      setNotice("Every line in this filter is marked posted.");
      return;
    }
    const index = pool.findIndex((item) => item.id === draft.id);
    if (pool.length === 1 && index === 0) {
      setNotice("This is the only unposted line in the filter.");
      return;
    }
    replaceDraft(pool[(index + 1) % pool.length]);
  }

  function fillTray() {
    const room = 7 - tray.length;
    if (room <= 0) {
      setNotice("The desk holds seven lines. Unpin one first.");
      return;
    }
    const pinnedIds = new Set(tray.map((piece) => piece.id));
    const next = matches
      .filter((piece) => piece.english.trim() && !postedIds.includes(piece.id) && !pinnedIds.has(piece.id))
      .slice(0, room);
    if (!next.length) {
      setNotice("No unposted line left to pin in this filter.");
      return;
    }
    setTray((current) => [...current, ...next.map((piece) => ({ ...piece }))]);
    setNotice("");
  }

  function movePin(index: number, direction: -1 | 1) {
    setTray((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = current.slice();
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }

  function update(partial: Partial<Piece>) {
    setDraft((current) => ({ ...current, ...partial }));
    setCopied(false);
  }

  function toggleSaved(id: string) {
    setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function togglePosted(id: string) {
    if (!id || id === "custom") {
      setNotice("Pin the line before marking it posted.");
      return;
    }
    setPostedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-400)));
  }

  function rememberPosted(ids: string[]) {
    const next = ids.filter((id) => id && id !== "custom");
    if (!next.length) return;
    setPostedIds((current) => [...new Set([...current, ...next])].slice(-400));
  }

  function pinCurrent() {
    if (!draft.english.trim()) {
      setNotice("Write the English line before you pin it.");
      return;
    }
    const exists = tray.some((piece) => piece.id === draft.id);
    if (!exists && tray.length >= 7) {
      setNotice("The desk holds seven lines. Unpin one first.");
      return;
    }
    const id = draft.id === "custom" ? freshDeskId() : draft.id;
    const next = { ...draft, id };
    if (id !== draft.id) setDraft(next);
    setTray((current) => {
      const index = current.findIndex((piece) => piece.id === id);
      if (index >= 0) {
        const copy = current.slice();
        copy[index] = next;
        return copy;
      }
      return [...current, next];
    });
    setNotice("");
    setCopied(false);
  }

  function openPiece(piece: Piece) {
    replaceDraft(piece);
  }

  function writeOwn() {
    replaceDraft({
      id: "custom",
      kind: "reminder",
      topic: topic === "all" ? "hope" : topic,
      arabic: "",
      english: "",
      source: "A reminder",
      hook: "Read this slowly.",
    });
  }

  async function copyCaption() {
    if (!draft.english.trim()) return;
    try {
      await navigator.clipboard.writeText(buildCaption(draft));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice("Clipboard is blocked in this browser. Select the caption and copy it yourself.");
    }
  }

  async function copyRunCaptions() {
    const lines = tray.filter((piece) => piece.english.trim());
    if (!lines.length) return;
    try {
      await navigator.clipboard.writeText(lines.map((piece) => buildCaption(piece)).join("\n\n—\n\n"));
      setCopiedRun(true);
      window.setTimeout(() => setCopiedRun(false), 1600);
    } catch {
      setNotice("Clipboard is blocked in this browser. Select the caption and copy it yourself.");
    }
  }

  const composeRef = useRef(compose);
  composeRef.current = compose;
  stepRef.current = step;
  undoRef.current = undo;
  postedRef.current = () => togglePosted(draft.id);
  nextRef.current = nextUnposted;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target;
      if (el instanceof HTMLElement && el.closest("input, textarea, select")) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "c") {
        event.preventDefault();
        composeRef.current();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        undoRef.current();
        return;
      }
      if (key === "p") {
        event.preventDefault();
        postedRef.current();
        return;
      }
      if (key === "n") {
        event.preventDefault();
        nextRef.current();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowRight" || key === "j") {
        event.preventDefault();
        stepRef.current(1);
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft" || key === "k") {
        event.preventDefault();
        stepRef.current(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (skipRowScroll.current) {
      skipRowScroll.current = false;
      return;
    }
    if (studio || pathStep !== "reminder") return;
    activeRow.current?.scrollIntoView({ block: "center" });
  }, [draft.id, studio, pathStep]);

  useEffect(() => {
    if (studio || pathStep !== "download") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathStep, studio, draft.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ground) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  }, [ground]);

  return (
    <div
      className={`relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1560px] flex-col px-4 py-6 md:px-8 md:py-8 ${studio ? "" : pathStep === "download" ? "pb-48" : "pb-36"}`}
      style={shellVars(theme)}
    >
      {ground && (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <video
            ref={videoRef}
            key={ground.id}
            className="h-full w-full object-cover opacity-90 mix-blend-soft-light"
            src={ground.src}
            poster={ground.poster}
            muted
            loop
            playsInline
            autoPlay
            onLoadedData={() => setVideoReady((value) => value + 1)}
          />
          <div className="absolute inset-0" style={{ background: theme.shell.page, opacity: 0.5 }} />
        </div>
      )}
      {studio && <WordBand />}
      <header className={`${studio ? "mt-8" : "mt-4"} flex flex-wrap items-end justify-between gap-6`}>
        <div>
          <p className="text-[0.72rem] font-medium tracking-[0.28em] text-[var(--accent)]">TADHKEER</p>
          {!studio && <h1 className="sr-only">Create beautiful Islamic posts and reels</h1>}
          {studio && (
            <>
              <h1 className="font-display mt-3 max-w-[18ch] text-balance text-[2.4rem] font-medium leading-[1.02] tracking-[-0.03em] text-[var(--ink)] md:text-5xl">
                Create beautiful Islamic posts and reels
              </h1>
              <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--soft)]">
                Choose a reminder, choose a style, then download. The preview stays beside you.
              </p>
            </>
          )}
          <nav className={`${studio ? "mt-5" : "mt-3"} flex flex-wrap gap-2`} aria-label="Create a post">
            {(
              studio
                ? ([
                    ["reminder", "1", "Choose a reminder"],
                    ["style", "2", "Choose a style"],
                    ["download", "3", "Download"],
                  ] as const)
                : ([
                    ["reminder", "1", "Line"],
                    ["style", "2", "Style"],
                    ["download", "3", "Save"],
                  ] as const)
            ).map(([id, number, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPathStep(id)}
                aria-current={pathStep === id ? "step" : undefined}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  pathStep === id
                    ? "border-[var(--accent)] bg-[var(--wash)] text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--soft)] hover:text-[var(--ink)]"
                }`}
              >
                <span className="font-medium tabular-nums text-[var(--accent)]">{number}</span>
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <InstallHome />
          {studio && (
            <p className="text-sm text-[var(--soft)]">
              <span className="tabular-nums">{library.length}</span> lines
            </p>
          )}
        </div>
      </header>

      <div className={`grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] ${studio ? "mt-8 gap-10 lg:gap-8" : "mt-4 gap-6"}`}>
        <section id="line" className="order-2 lg:order-1">
          {pathStep === "style" && (
            <div>
              <h2 className="text-lg text-[var(--ink)]">Choose a style</h2>
              <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[var(--soft)]">
                {studio
                  ? "Pick a motion and a colour. The preview updates as you go. Text balance and text position sit with the preview."
                  : "Pick a motion and a colour. The preview updates as you go."}
              </p>
              <div className="mt-4">
                <ColourPanel
                  themeId={themeId}
                  backgroundId={backgroundId}
                  open
                  onOpen={() => undefined}
                  onTheme={setThemeId}
                  onBackground={setBackgroundId}
                  inline
                  row={!studio}
                />
              </div>
              <button
                type="button"
                onClick={() => setPathStep("download")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-base text-[var(--accent-ink)] active:scale-[0.98]"
              >
                {studio ? "Generate design" : "Save"}
              </button>
            </div>
          )}
          {pathStep === "download" && (
            <div>
              <h2 className="text-lg text-[var(--ink)]">{studio ? "Download" : "Save"}</h2>
              <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[var(--soft)]">
                {studio
                  ? "Play video lets you hear it first. Download image saves a still. Download video saves the motion, and the voice starts when the English line appears. It is not a recitation."
                  : "Play, image, and video sit along the bottom. The voice starts when the English line appears. It is not a recitation."}
              </p>
              <SourceCard piece={draft} />
            </div>
          )}
          {pathStep === "reminder" && (
          <>
          <div className="flex flex-wrap gap-2">
            {kinds.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setKind(item.id)}
                className="relative rounded-full px-3 py-1.5 text-sm text-[var(--ink)]"
              >
                {kind === item.id && (
                  <motion.span
                    layoutId="kind-pill"
                    className="absolute inset-0 rounded-full bg-[var(--wash)]"
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </button>
            ))}
          </div>

          <div className={`mt-4 flex gap-2 ${studio ? "flex-wrap" : "-mx-4 flex-nowrap overflow-x-auto px-4 pb-1"}`}>
            <FilterChip active={topic === "all"} onClick={() => setTopic("all")}>
              Any topic
            </FilterChip>
            {topics.map((item) => (
              <FilterChip key={item.id} active={topic === item.id} onClick={() => setTopic(item.id)}>
                {item.label}
              </FilterChip>
            ))}
            <FilterChip active={savedOnly} onClick={() => setSavedOnly((value) => !value)}>
              Saved{savedIds.length ? ` ${savedIds.length}` : ""}
            </FilterChip>
            <FilterChip active={freshOnly} onClick={() => setFreshOnly((value) => !value)}>
              Unposted {unpostedCount}
            </FilterChip>
          </div>

          <label className="mt-4 block">
            <span className="sr-only">Search the library</span>
            <span className="relative block">
              <MagnifyingGlass
                size={16}
                weight="regular"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--faint)]"
              />
              <input
                ref={searchRef}
                className={`${fieldClass} pr-10 pl-9`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a line, a source, or Arabic"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  className="absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--soft)] hover:bg-[var(--wash)]"
                  aria-label="Clear search"
                >
                  <X size={14} weight="regular" />
                </button>
              )}
            </span>
          </label>
          </>
          )}

          {studio && (
          <button
            type="button"
            onClick={() => setMore((value) => !value)}
            aria-expanded={more}
            className="mt-6 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--wash)]"
          >
            {more ? "Hide options" : "More options"}
          </button>
          )}

          {studio && more && (
          <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <MagneticButton
              onClick={compose}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm text-[var(--accent-ink)]"
            >
              <Shuffle size={16} weight="regular" />
              Pick a line
            </MagneticButton>
            <button
              type="button"
              onClick={nextUnposted}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98]"
            >
              <ArrowRight size={16} weight="regular" />
              Next
            </button>
            <button
              type="button"
              onClick={writeOwn}
              className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98]"
            >
              Write your own
            </button>
            <button
              type="button"
              onClick={undo}
              disabled={undoCount === 0}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
            >
              <ArrowUUpLeft size={16} weight="regular" />
              Undo
            </button>
            <button
              type="button"
              onClick={pinCurrent}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98]"
            >
              <BookmarkSimple size={16} weight={pinned ? "fill" : "regular"} />
              {pinned ? "Update pin" : "Pin"}
            </button>
          </div>
          {notice && (
            <p className="mt-3 text-sm text-[var(--danger)]" role="status">
              {notice}
            </p>
          )}

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-[var(--ink)]">Pinned</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fillTray}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--soft)] hover:text-[var(--ink)]"
                >
                  <Stack size={14} weight="regular" />
                  Fill
                </button>
                {tray.some((piece) => piece.english.trim()) && (
                  <button
                    type="button"
                    onClick={copyRunCaptions}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--soft)] hover:text-[var(--ink)]"
                  >
                    {copiedRun ? <Check size={14} weight="regular" /> : <Copy size={14} weight="regular" />}
                    {copiedRun ? "Copied" : "Copy captions"}
                  </button>
                )}
                {tray.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTray([])}
                    className="text-xs text-[var(--soft)] hover:text-[var(--ink)]"
                  >
                    Clear
                  </button>
                )}
                <p className="text-xs tabular-nums text-[var(--faint)]">{tray.length}/7</p>
              </div>
            </div>
            {tray.length === 0 ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--faint)]">
                Pin the line you are setting, or fill the tray from the unposted shelf. Seven stay on this device, and two or more play as one reel.
              </p>
            ) : (
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {tray.map((piece, index) => {
                  const active = piece.id === draft.id;
                  return (
                    <li key={piece.id} className="relative w-40 shrink-0">
                      <button
                        type="button"
                        onClick={() => openPiece(piece)}
                        className={`flex h-full w-full flex-col rounded-2xl border px-3 pt-2 pr-7 text-left transition-colors active:scale-[0.98] ${
                          tray.length > 1 ? "pb-8" : "pb-2"
                        } ${
                          active
                            ? "border-[var(--accent)] bg-[var(--wash)]"
                            : "border-[var(--line)] hover:bg-[var(--wash)]"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1 text-[0.65rem] tabular-nums text-[var(--faint)]">
                          {index + 1}
                          {postedIds.includes(piece.id) && <CheckCircle size={12} weight="fill" />}
                        </span>
                        <span className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--ink)]">
                          {piece.english}
                        </span>
                      </button>
                      {tray.length > 1 && (
                        <div className="absolute bottom-1.5 left-1.5 flex gap-0.5">
                          <button
                            type="button"
                            onClick={() => movePin(index, -1)}
                            disabled={index === 0}
                            aria-label={`Move line ${index + 1} earlier`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--field)] text-[var(--soft)] hover:bg-[var(--wash)] disabled:opacity-30"
                          >
                            <CaretLeft size={12} weight="regular" />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePin(index, 1)}
                            disabled={index === tray.length - 1}
                            aria-label={`Move line ${index + 1} later`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--field)] text-[var(--soft)] hover:bg-[var(--wash)] disabled:opacity-30"
                          >
                            <CaretRight size={12} weight="regular" />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setTray((current) => current.filter((item) => item.id !== piece.id))}
                        className="absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--soft)] hover:bg-[var(--wash)]"
                        aria-label={`Unpin line ${index + 1}`}
                      >
                        <X size={12} weight="regular" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {runCount >= 2 && (
              <p className="mt-2 text-sm leading-relaxed text-[var(--soft)]">
                This run is {runCount * duration}s. Move a pin to change the order. The type fades from one line into the next. The video speaks each English line.
              </p>
            )}
            <ul className="mt-4 flex max-w-[68ch] flex-wrap gap-2">
              {[
                ["C", "Pick a line"],
                ["N", "Next unposted"],
                ["Z", "Undo"],
                ["↑↓", "Move through the list"],
                ["P", "Mark posted"],
                ["/", "Search"],
                ["F", "Focus the frame"],
              ].map(([key, label]) => (
                <li
                  key={key}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--field)] px-2.5 py-1 text-sm text-[var(--soft)]"
                >
                  <kbd className="font-medium text-[var(--ink)]">{key}</kbd>
                  {label}
                </li>
              ))}
            </ul>
          </div>
          </>
          )}

          {pathStep === "reminder" && (
          <div className="mt-8 border-t border-[var(--line)]">
            <div className="flex items-center justify-between gap-3 py-3">
              <p className="text-sm text-[var(--ink)]">Library</p>
              <div className="flex items-center gap-3">
                {!studio && (
                  <button
                    type="button"
                    onClick={nextUnposted}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--ink)] hover:bg-[var(--wash)]"
                  >
                    <ArrowRight size={14} weight="regular" />
                    Next
                  </button>
                )}
                <p className="text-xs tabular-nums text-[var(--faint)]">
                  {matches.length === 0 ? "No matches" : `${matches.length} showing`}
                </p>
              </div>
            </div>
            {!studio && notice && (
              <p className="pb-2 text-sm text-[var(--soft)]" role="status">
                {notice}
              </p>
            )}
            {matches.length === 0 ? (
              <p className="pb-6 text-sm leading-relaxed text-[var(--soft)]">
                {emptyLibraryCopy(savedOnly, freshOnly, query, savedIds.length)}
              </p>
            ) : (
              <ul className={studio ? "max-h-[340px] overflow-auto" : ""}>
                <AnimatePresence initial={false}>
                  {matches.map((piece, index) => {
                    const active = piece.id === draft.id;
                    const saved = savedIds.includes(piece.id);
                    const posted = postedIds.includes(piece.id);
                    return (
                      <motion.li
                        key={piece.id}
                        ref={active ? activeRow : undefined}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.28 }}
                        className={`flex scroll-mt-28 border-t border-[var(--line)] scroll-mb-28 ${active ? "bg-[var(--wash)]" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => openPiece(piece)}
                          className="flex min-w-0 flex-1 flex-col gap-1 py-3 pr-2 pl-1 text-left"
                        >
                          <span className="text-[0.65rem] tracking-[0.14em] text-[var(--accent)]">
                            {kindLabel[piece.kind]} · {topicLabel[piece.topic]}
                          </span>
                          <span className={`text-sm leading-relaxed ${posted && !active ? "text-[var(--soft)]" : "text-[var(--ink)]"}`}>
                            {piece.english}
                          </span>
                          <span className="text-sm text-[var(--soft)]">{piece.source}</span>
                        </button>
                        <div className="mt-2 flex shrink-0 flex-col items-end">
                          {piece.sourceUrl && (
                            <a
                              href={piece.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-sm text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--accent)]"
                            >
                              View source
                              <ArrowSquareOut size={14} weight="regular" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleSaved(piece.id)}
                            aria-pressed={saved}
                            aria-label={saved ? `Unsave ${piece.source}` : `Save ${piece.source}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--accent)] hover:bg-[var(--wash)]"
                          >
                            <Star size={16} weight={saved ? "fill" : "regular"} />
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePosted(piece.id)}
                            aria-pressed={posted}
                            aria-label={posted ? `Mark ${piece.source} unposted` : `Mark ${piece.source} posted`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--accent)] hover:bg-[var(--wash)]"
                          >
                            <CheckCircle size={16} weight={posted ? "fill" : "regular"} />
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
            <SourceCard piece={draft} />
            <button
              type="button"
              onClick={() => setPathStep("style")}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-base text-[var(--accent-ink)] active:scale-[0.98]"
            >
              Choose a style
            </button>
          </div>
          )}

          {studio && more && (
          <div className="mt-8 grid gap-4 border-t border-[var(--line)] pt-6">
            <label className="grid gap-2">
              <span className="text-sm text-[var(--ink)]">Hook</span>
              <input
                className={fieldClass}
                value={draft.hook}
                maxLength={90}
                onChange={(event) => update({ hook: event.target.value })}
              />
              <span className="text-xs text-[var(--faint)]">Spoken or shown before the line. Optional.</span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-[var(--ink)]">Label</span>
                <select
                  className={fieldClass}
                  value={draft.kind}
                  onChange={(event) => update({ kind: event.target.value as Kind })}
                >
                  <option value="ayah">Ayah</option>
                  <option value="hadith">Hadith</option>
                  <option value="reminder">Reminder</option>
                </select>
                <span className="text-xs text-[var(--faint)]">Use ayah or hadith only for the text itself.</span>
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-[var(--ink)]">Topic</span>
                <select
                  className={fieldClass}
                  value={draft.topic}
                  onChange={(event) => update({ topic: event.target.value as Topic })}
                >
                  {topics.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-[var(--faint)]">Used for the caption tag.</span>
              </label>
            </div>
            <label className="grid gap-2">
              <span className="text-sm text-[var(--ink)]">Arabic</span>
              <textarea
                className={`${fieldClass} min-h-24 font-[Amiri,serif] text-lg leading-relaxed`}
                dir="rtl"
                value={draft.arabic}
                maxLength={320}
                onChange={(event) => update({ arabic: event.target.value })}
                placeholder="اختياري"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-[var(--ink)]">English</span>
              <textarea
                className={`${fieldClass} min-h-24`}
                value={draft.english}
                maxLength={340}
                onChange={(event) => update({ english: event.target.value })}
                placeholder="The line on the poster"
              />
              {!draft.english.trim() && (
                <span className="text-xs text-[var(--danger)]">The poster needs an English line.</span>
              )}
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-[var(--ink)]">Source</span>
              <input
                className={fieldClass}
                value={draft.source}
                maxLength={80}
                onChange={(event) => update({ source: event.target.value })}
                placeholder="Ash-Sharh 94:6"
              />
            </label>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="max-w-[48ch] text-sm leading-relaxed whitespace-pre-wrap text-[var(--soft)]">
                  {caption || "The caption appears here."}
                </p>
                {caption && (
                  <p
                    className={`mt-2 text-xs tabular-nums ${caption.length > 2200 ? "text-[var(--danger)]" : "text-[var(--faint)]"}`}
                  >
                    {caption.length.toLocaleString()} / 2,200
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={copyCaption}
                disabled={!draft.english.trim()}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98] disabled:opacity-40"
              >
                {copied ? <Check size={14} weight="regular" /> : <Copy size={14} weight="regular" />}
                {copied ? "Copied" : "Copy caption"}
              </button>
            </div>
          </div>
          )}

          <p className="mt-8 max-w-[68ch] text-sm leading-relaxed text-[var(--soft)]">
            The shelf is Qur’an and sahih hadith from Bukhari and Muslim. The English is a short
            rendering, not a published translation. View source opens Quran.com or Sunnah.com so you
            can check the wording before you share it.
          </p>
          <a
            href="mailto:creator@tadhkeer.space"
            className="mt-4 inline-block text-sm tracking-wide text-[var(--soft)] underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--ink)]"
          >
            creator@tadhkeer.space
          </a>
        </section>

        <section className="order-1 flex flex-col gap-3 lg:sticky lg:top-8 lg:order-2">
          <Stage
            piece={draft}
            theme={theme}
            ratio={ratio}
            duration={duration}
            useHook={useHook}
            showMark={showMark}
            onRatio={setRatio}
            onDuration={(seconds) => {
              if (seconds === 6 || seconds === 9 || seconds === 12) setDuration(seconds);
            }}
            onHook={setUseHook}
            onMark={setShowMark}
            voice={voice}
            onVoice={setVoice}
            seat={seat}
            onSeat={setSeat}
            clear={clear}
            onClear={setClear}
            guides={guides}
            onGuides={setGuides}
            firm={firm}
            onFirm={setFirm}
            run={tray}
            motion={ground}
            videoRef={videoRef}
            videoReady={videoReady}
            onPosted={rememberPosted}
            advanced={studio && more}
            desk={desk}
            compact={compact}
            span={span}
            onNext={nextUnposted}
            notice={notice}
          />
        </section>
      </div>
    </div>
  );
}

function SourceCard({ piece }: { piece: Piece }) {
  return (
    <div className="my-4 rounded-2xl border border-[var(--line)] bg-[var(--field)] p-4">
      <p className="text-sm leading-relaxed text-[var(--ink)]">{piece.english || "Choose a line to begin."}</p>
      <p className="mt-2 text-base text-[var(--ink)]">{piece.source}</p>
      {piece.attribution && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--soft)]">{piece.attribution}</p>
      )}
      {piece.sourceUrl && (
        <a
          href={piece.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--accent)]"
        >
          View source
          <ArrowSquareOut size={14} weight="regular" />
        </a>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors active:scale-[0.98] ${
        active
          ? "border-[var(--accent)] text-[var(--ink)]"
          : "border-[var(--line)] text-[var(--soft)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}
