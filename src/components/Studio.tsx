import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookmarkSimple, Check, Copy, MagnifyingGlass, Shuffle, Star, X } from "@phosphor-icons/react";
import type { Kind, Piece, Ratio, Topic } from "../types";
import { buildCaption, filterLibrary, kinds, library, topics } from "../data/library";
import { motionById } from "../data/backgrounds";
import { shellVars, themeById } from "../data/themes";
import { freshDeskId, loadDesk, saveDesk } from "../lib/desk";
import { ColourLauncher, ColourPanel } from "./ColourPanel";
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

function initialColourOpen() {
  if (typeof window === "undefined") return true;
  if (!window.matchMedia("(min-width: 1024px)").matches) return false;
  try {
    return localStorage.getItem("mihrab-colour-open") !== "0";
  } catch {
    return true;
  }
}

function emptyLibraryCopy(savedOnly: boolean, query: string, savedCount: number) {
  if (savedOnly && savedCount === 0) return "Nothing saved yet. Star a line and it stays on this device.";
  if (query.trim()) return savedOnly ? "No saved line matches that search." : "No line matches that search.";
  if (savedOnly) return "No saved line in this filter.";
  return "No lines for this filter. Clear it, or write your own.";
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
  const [draft, setDraft] = useState<Piece>(stored.draft);
  const [savedIds, setSavedIds] = useState<string[]>(stored.savedIds);
  const [savedOnly, setSavedOnly] = useState(stored.savedOnly);
  const [tray, setTray] = useState<Piece[]>(stored.tray);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [colourOpen, setColourOpen] = useState(initialColourOpen);
  const [backgroundId, setBackgroundId] = useState<string | null>(stored.backgroundId);
  const [videoReady, setVideoReady] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const matches = useMemo(
    () => filterLibrary(kind, topic, query, savedIds, savedOnly),
    [kind, topic, query, savedIds, savedOnly],
  );
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
      });
    }, 180);
    return () => window.clearTimeout(id);
  }, [draft, kind, topic, themeId, ratio, duration, useHook, showMark, savedIds, savedOnly, tray, backgroundId]);

  function setColour(open: boolean) {
    setColourOpen(open);
    try {
      localStorage.setItem("mihrab-colour-open", open ? "1" : "0");
    } catch {
      /* storage can be blocked */
    }
  }

  function compose() {
    const pool = matches.filter((piece) => piece.id !== draft.id);
    const choices = pool.length ? pool : matches;
    if (!choices.length) {
      setNotice("Nothing in the library matches these filters. Clear one, or write your own line.");
      return;
    }
    const next = choices[Math.floor(Math.random() * choices.length)];
    setDraft({ ...next });
    setNotice("");
    setCopied(false);
  }

  function update(partial: Partial<Piece>) {
    setDraft((current) => ({ ...current, ...partial }));
    setCopied(false);
  }

  function toggleSaved(id: string) {
    setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
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
    setDraft({ ...piece });
    setNotice("");
    setCopied(false);
  }

  function writeOwn() {
    setDraft({
      id: "custom",
      kind: "reminder",
      topic: topic === "all" ? "hope" : topic,
      arabic: "",
      english: "",
      source: "A reminder",
      hook: "Read this slowly.",
    });
    setNotice("");
    setCopied(false);
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

  const composeRef = useRef(compose);
  composeRef.current = compose;

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
      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        composeRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1560px] flex-col px-4 py-6 md:px-8 md:py-8"
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
      <WordBand />
      <header className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[0.72rem] font-medium tracking-[0.28em] text-[var(--accent)]">MIHRAB</p>
          <h1 className="font-display mt-3 max-w-[14ch] text-balance text-[2.7rem] font-medium leading-[0.96] tracking-[-0.03em] text-[var(--ink)] md:text-5xl">
            Faceless reminders, set in type.
          </h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--soft)]">
            Pick an ayah, a hadith, or a short reminder. Search the library, pin a short run, and
            the desk keeps the line when you come back.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <InstallHome />
          <p className="hidden text-xs leading-relaxed text-[var(--faint)] md:block">
            <span className="tabular-nums">{library.length}</span> lines
            <span className="mx-2 text-[var(--line)]">/</span>
            C composes
            <span className="mx-2 text-[var(--line)]">/</span>
            slash searches
          </p>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)_auto] lg:gap-8">
        <section id="line" className="order-2 lg:order-1">
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

          <div className="mt-4 flex flex-wrap gap-2">
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

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <MagneticButton
              onClick={compose}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm text-[var(--accent-ink)]"
            >
              <Shuffle size={16} weight="regular" />
              Compose
            </MagneticButton>
            <button
              type="button"
              onClick={writeOwn}
              className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98]"
            >
              Write your own
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
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-[var(--ink)]">Pinned</p>
              <p className="text-xs tabular-nums text-[var(--faint)]">{tray.length}/7</p>
            </div>
            {tray.length === 0 ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--faint)]">
                Pin the line you are setting. Seven stay on this device.
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
                        className={`flex h-full w-full flex-col rounded-2xl border px-3 py-2 pr-7 text-left transition-colors active:scale-[0.98] ${
                          active
                            ? "border-[var(--accent)] bg-[var(--wash)]"
                            : "border-[var(--line)] hover:bg-[var(--wash)]"
                        }`}
                      >
                        <span className="text-[0.65rem] tabular-nums text-[var(--faint)]">{index + 1}</span>
                        <span className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--ink)]">
                          {piece.english}
                        </span>
                      </button>
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
          </div>

          <div className="mt-8 border-t border-[var(--line)]">
            <div className="flex items-baseline justify-between py-3">
              <p className="text-sm text-[var(--ink)]">Library</p>
              <p className="text-xs tabular-nums text-[var(--faint)]">
                {matches.length === 0 ? "No matches" : `${matches.length} showing`}
              </p>
            </div>
            {matches.length === 0 ? (
              <p className="pb-6 text-sm leading-relaxed text-[var(--soft)]">
                {emptyLibraryCopy(savedOnly, query, savedIds.length)}
              </p>
            ) : (
              <ul className="max-h-[340px] overflow-auto">
                <AnimatePresence initial={false}>
                  {matches.map((piece, index) => {
                    const active = piece.id === draft.id;
                    const saved = savedIds.includes(piece.id);
                    return (
                      <motion.li
                        key={piece.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.28 }}
                        className={`flex border-t border-[var(--line)] ${active ? "bg-[var(--wash)]" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => openPiece(piece)}
                          className="flex min-w-0 flex-1 flex-col gap-1 py-3 pr-2 pl-1 text-left"
                        >
                          <span className="text-[0.65rem] tracking-[0.14em] text-[var(--accent)]">
                            {kindLabel[piece.kind]} · {topicLabel[piece.topic]}
                          </span>
                          <span className="text-sm leading-relaxed text-[var(--ink)]">{piece.english}</span>
                          <span className="text-xs text-[var(--faint)]">{piece.source}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSaved(piece.id)}
                          aria-pressed={saved}
                          aria-label={saved ? `Unsave ${piece.source}` : `Save ${piece.source}`}
                          className="mt-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--accent)] hover:bg-[var(--wash)]"
                        >
                          <Star size={16} weight={saved ? "fill" : "regular"} />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>

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
              <p className="max-w-[48ch] text-sm leading-relaxed whitespace-pre-wrap text-[var(--soft)]">
                {draft.english.trim() ? buildCaption(draft) : "The caption appears here."}
              </p>
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

          <p className="mt-8 max-w-[68ch] text-sm leading-relaxed text-[var(--faint)]">
            Ayah and hadith lines are short English renderings of well-known texts, with the Arabic
            beside them. They are not a new translation. Confirm the wording in a mushaf or a
            trusted collection before you post it as scripture. Lines marked Reminder are original.
            Do not attribute them to the Qur'an or the Prophet, peace be upon him.
          </p>
        </section>

        <section className="order-1 flex flex-col gap-3 lg:sticky lg:top-8 lg:order-2">
          <ColourLauncher theme={theme} motionName={ground?.name} onOpen={() => setColour(true)} />
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
            motion={ground}
            videoRef={videoRef}
            videoReady={videoReady}
          />
        </section>
        <ColourPanel
          themeId={themeId}
          backgroundId={backgroundId}
          open={colourOpen}
          onOpen={setColour}
          onTheme={setThemeId}
          onBackground={setBackgroundId}
        />
      </div>
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
