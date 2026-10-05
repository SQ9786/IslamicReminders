import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Shuffle } from "@phosphor-icons/react";
import type { Kind, Piece, Ratio, Topic } from "../types";
import { buildCaption, filterLibrary, kinds, library, topics } from "../data/library";
import { shellVars, themeById, themes } from "../data/themes";
import { ColourLauncher, ColourPanel } from "./ColourPanel";
import { MagneticButton } from "./MagneticButton";
import { Stage } from "./Stage";
import { WordBand } from "./WordBand";

const fieldClass =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--field)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--faint)] focus-visible:border-[var(--accent)]";

function initialColourOpen() {
  if (typeof window === "undefined") return true;
  if (!window.matchMedia("(min-width: 1024px)").matches) return false;
  try {
    return localStorage.getItem("mihrab-colour-open") !== "0";
  } catch {
    return true;
  }
}

export function Studio() {
  const [kind, setKind] = useState<Kind | "all">("all");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [themeId, setThemeId] = useState(themes[0].id);
  const [ratio, setRatio] = useState<Ratio>("9:16");
  const [duration, setDuration] = useState(9);
  const [useHook, setUseHook] = useState(true);
  const [showMark, setShowMark] = useState(false);
  const [draft, setDraft] = useState<Piece>(() => ({ ...library[0] }));
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [colourOpen, setColourOpen] = useState(initialColourOpen);

  const matches = useMemo(() => filterLibrary(kind, topic), [kind, topic]);
  const theme = themeById(themeId);

  useEffect(() => {
    const root = document.documentElement;
    const vars = shellVars(theme);
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === "string") root.style.setProperty(key, value);
    }
    root.style.colorScheme = theme.shell.light ? "light" : "dark";
  }, [theme]);

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

  return (
    <div
      className="mx-auto flex min-h-[100dvh] w-full max-w-[1560px] flex-col px-4 py-6 md:px-8 md:py-8"
      style={shellVars(theme)}
    >
      <WordBand />
      <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,400px)_auto] lg:gap-8">
        <section className="order-2 lg:order-1">
          <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[var(--accent)]">Mihrab</p>
          <h1 className="mt-4 max-w-[16ch] text-4xl leading-[0.96] tracking-tight text-[var(--ink)] md:text-5xl">
            Faceless reminders, set in type.
          </h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--soft)]">
            Pick an ayah, a hadith, or a short reminder. Mihrab places the Arabic and English on a
            vertical frame you can post without showing your face.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
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

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={topic === "all"} onClick={() => setTopic("all")}>
              Any topic
            </FilterChip>
            {topics.map((item) => (
              <FilterChip
                key={item.id}
                active={topic === item.id}
                onClick={() => setTopic(item.id)}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <MagneticButton
              onClick={compose}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm text-[var(--accent-ink)]"
            >
              <Shuffle size={16} weight="regular" />
              Compose
            </MagneticButton>
            <button
              type="button"
              onClick={() => {
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
              }}
              className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink)] active:scale-[0.98]"
            >
              Write your own
            </button>
            <p className="text-xs text-[var(--faint)]">{library.length} lines in the library</p>
          </div>
          {notice && (
            <p className="mt-3 text-sm text-[var(--danger)]" role="status">
              {notice}
            </p>
          )}

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
                <span className="text-xs text-[var(--faint)]">
                  Use ayah or hadith only for the text itself.
                </span>
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
              <p className="max-w-[48ch] whitespace-pre-wrap text-sm leading-relaxed text-[var(--soft)]">
                {draft.english.trim() ? buildCaption(draft) : "The caption appears here."}
              </p>
              <button
                type="button"
                onClick={copyCaption}
                disabled={!draft.english.trim()}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink)] active:scale-[0.98] disabled:opacity-40"
              >
                {copied ? <Check size={14} weight="regular" /> : <Copy size={14} weight="regular" />}
                {copied ? "Copied" : "Copy caption"}
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--line)]">
            <div className="flex items-baseline justify-between py-3">
              <p className="text-sm text-[var(--ink)]">Library</p>
              <p className="text-xs text-[var(--faint)]">
                {matches.length === 0 ? "No matches" : `${matches.length} showing`}
              </p>
            </div>
            {matches.length === 0 ? (
              <p className="pb-6 text-sm leading-relaxed text-[var(--soft)]">
                No lines for this filter. Clear it, or write your own above.
              </p>
            ) : (
              <ul className="max-h-[340px] overflow-auto">
                <AnimatePresence initial={false}>
                  {matches.map((piece, index) => (
                    <motion.li
                      key={piece.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.28 }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setDraft({ ...piece });
                          setNotice("");
                          setCopied(false);
                        }}
                        className="flex w-full flex-col gap-1 border-t border-[var(--line)] py-3 text-left"
                      >
                        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--accent)]">
                          {piece.kind} · {piece.topic}
                        </span>
                        <span
                          className={`text-sm leading-relaxed ${
                            piece.id === draft.id ? "text-[var(--accent)]" : "text-[var(--ink)]"
                          }`}
                        >
                          {piece.english}
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          <p className="mt-8 max-w-[68ch] text-sm leading-relaxed text-[var(--faint)]">
            Ayah and hadith lines are short English renderings of well-known texts, with the Arabic
            beside them. They are not a new translation. Confirm the wording in a mushaf or a
            trusted collection before you post it as scripture. Lines marked Reminder are original.
            Do not attribute them to the Qur'an or the Prophet, peace be upon him.
          </p>
        </section>

        <section className="order-1 flex flex-col gap-3 lg:sticky lg:top-8 lg:order-2">
          <ColourLauncher theme={theme} onOpen={() => setColour(true)} />
          <Stage
            piece={draft}
            theme={theme}
            ratio={ratio}
            duration={duration}
            useHook={useHook}
            showMark={showMark}
            onRatio={setRatio}
            onDuration={setDuration}
            onHook={setUseHook}
            onMark={setShowMark}
          />
        </section>
        <ColourPanel
          themeId={themeId}
          open={colourOpen}
          onOpen={setColour}
          onTheme={setThemeId}
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
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs active:scale-[0.98] ${
        active ? "border-[var(--accent)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--soft)]"
      }`}
    >
      {children}
    </button>
  );
}
