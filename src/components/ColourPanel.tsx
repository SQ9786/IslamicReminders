import { AnimatePresence, motion } from "framer-motion";
import { CaretRight, Palette, X } from "@phosphor-icons/react";
import type { Theme } from "../types";
import { themes } from "../data/themes";

type Props = {
  themeId: string;
  open: boolean;
  onOpen: (open: boolean) => void;
  onTheme: (id: string) => void;
};

export function ColourLauncher({ theme, onOpen }: { theme: Theme; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)] active:scale-[0.98] lg:hidden"
    >
      <Palette size={16} weight="regular" />
      Colour
      <span
        className="h-3 w-3 rounded-full"
        style={{ background: `linear-gradient(160deg, ${theme.bg[0]}, ${theme.bg[2]})` }}
      />
      {theme.name}
    </button>
  );
}

export function ColourPanel({ themeId, open, onOpen, onTheme }: Props) {
  const theme = themes.find((item) => item.id === themeId) ?? themes[0];

  return (
    <>
      <aside
        className={`sticky top-8 hidden max-h-[calc(100dvh-4rem)] self-start overflow-y-auto lg:order-3 lg:block ${open ? "w-[280px]" : "w-14"}`}
        aria-label="Colour settings"
      >
        {open ? (
          <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--field)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--accent)]">
                  Settings
                </p>
                <h2 className="mt-1 text-lg tracking-tight text-[var(--ink)]">Colour scheme</h2>
              </div>
              <button
                type="button"
                onClick={() => onOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] active:scale-[0.98]"
                aria-label="Collapse colour settings"
              >
                <CaretRight size={16} weight="regular" />
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--faint)]">
              The studio and the frame share the scheme you pick.
            </p>
            <ThemeList themeId={themeId} onTheme={onTheme} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onOpen(true)}
            className="flex h-[220px] w-14 flex-col items-center gap-4 rounded-[1.4rem] border border-[var(--line)] bg-[var(--field)] py-4 text-[var(--ink)] active:scale-[0.98]"
            aria-label={`Open colour settings. Current scheme ${theme.name}`}
          >
            <Palette size={18} weight="regular" />
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--accent)] [writing-mode:vertical-rl]">
              Colour
            </span>
            <span
              className="mt-auto h-5 w-5 rounded-full"
              style={{ background: `linear-gradient(160deg, ${theme.bg[0]}, ${theme.bg[2]})` }}
            />
          </button>
        )}
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[rgba(18,16,14,0.46)]"
              aria-label="Close colour settings"
              onClick={() => onOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label="Colour scheme"
              className="absolute inset-y-0 right-0 w-[min(100%,20rem)] overflow-auto border-l border-[var(--line)] bg-[var(--page)] p-4"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--accent)]">
                    Settings
                  </p>
                  <h2 className="mt-1 text-lg tracking-tight text-[var(--ink)]">Colour scheme</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)]"
                  aria-label="Collapse colour settings"
                >
                  <X size={16} weight="regular" />
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--faint)]">
                The studio and the frame share the scheme you pick.
              </p>
              <ThemeList
                themeId={themeId}
                onTheme={(id) => {
                  onTheme(id);
                  onOpen(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ThemeList({ themeId, onTheme }: { themeId: string; onTheme: (id: string) => void }) {
  return (
    <ul className="mt-4 grid gap-2">
      {themes.map((item) => {
        const selected = item.id === themeId;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onTheme(item.id)}
              aria-pressed={selected}
              className={`flex w-full items-center gap-3 rounded-2xl border px-2 py-2 text-left active:scale-[0.98] ${
                selected ? "border-[var(--accent)] bg-[var(--wash)]" : "border-[var(--line)]"
              }`}
            >
              <span
                className="h-14 w-14 shrink-0 rounded-xl"
                style={{
                  background: `linear-gradient(165deg, ${item.bg[0]}, ${item.bg[2]})`,
                  boxShadow: `inset 0 0 0 1px ${item.rule}`,
                }}
              />
              <span className="min-w-0">
                <span className="block text-sm text-[var(--ink)]">{item.name}</span>
                <span className="mt-1 block text-[0.68rem] uppercase tracking-[0.16em] text-[var(--faint)]">
                  {item.shell.light ? "Light" : "Dark"}
                </span>
                <span className="mt-2 flex gap-1">
                  {item.bg.map((color) => (
                    <span
                      key={color}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: color }}
                    />
                  ))}
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.shell.accent }} />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
