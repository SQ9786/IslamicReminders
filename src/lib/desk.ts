import { motions } from "../data/backgrounds";
import { library, topics } from "../data/library";
import { themes } from "../data/themes";
import type { Kind, Piece, Ratio, Seat, Topic, Voice } from "../types";

const KEY = "mihrab-desk";

const kindFilters = new Set<Kind | "all">(["all", "ayah", "hadith", "reminder"]);
const topicFilters = new Set<string>(["all", ...topics.map((item) => item.id)]);
const ratios = new Set<Ratio>(["9:16", "4:5", "1:1"]);
const voices = new Set<Voice>(["even", "arabic", "english"]);
const seats = new Set<Seat>(["high", "mid", "low"]);
const durations = new Set([6, 9, 12]);
const libraryIds = new Set(library.map((piece) => piece.id));

export type Desk = {
  draft: Piece;
  kind: Kind | "all";
  topic: Topic | "all";
  themeId: string;
  ratio: Ratio;
  duration: 6 | 9 | 12;
  useHook: boolean;
  showMark: boolean;
  savedIds: string[];
  savedOnly: boolean;
  tray: Piece[];
  backgroundId: string | null;
  voice: Voice;
  seat: Seat;
  clear: boolean;
  guides: boolean;
  postedIds: string[];
  freshOnly: boolean;
  firm: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPiece(value: unknown): value is Piece {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    (value.kind === "ayah" || value.kind === "hadith" || value.kind === "reminder") &&
    typeof value.topic === "string" &&
    topicFilters.has(value.topic) &&
    value.topic !== "all" &&
    typeof value.arabic === "string" &&
    typeof value.english === "string" &&
    typeof value.source === "string" &&
    typeof value.hook === "string"
  );
}

function onShelf(piece: Piece) {
  return piece.id === "custom" || piece.id.startsWith("desk-") || libraryIds.has(piece.id);
}

function shelfDraft(value: unknown, fallback: Piece): Piece {
  if (!isPiece(value) || !onShelf(value)) return fallback;
  return { ...value, topic: value.topic as Topic };
}

export function defaultDesk(): Desk {
  return {
    draft: { ...library[0] },
    kind: "all",
    topic: "all",
    themeId: themes[0].id,
    ratio: "9:16",
    duration: 9,
    useHook: true,
    showMark: false,
    savedIds: [],
    savedOnly: false,
    tray: [],
    backgroundId: motions[0].id,
    voice: "even",
    seat: "mid",
    clear: false,
    guides: false,
    postedIds: [],
    freshOnly: false,
    firm: false,
  };
}

export function loadDesk(): Desk {
  const base = defaultDesk();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return base;
    const themeId = typeof data.themeId === "string" ? data.themeId : base.themeId;
    const duration = Number(data.duration);
    const tray = Array.isArray(data.tray) ? data.tray.filter(isPiece).filter(onShelf).slice(0, 7) : [];
    const savedIds = Array.isArray(data.savedIds)
      ? [...new Set(data.savedIds.filter((id): id is string => typeof id === "string" && libraryIds.has(id)))]
      : [];
    return {
      draft: shelfDraft(data.draft, base.draft),
      kind:
        data.kind === "reminder"
          ? "all"
          : kindFilters.has(data.kind as Kind | "all")
            ? (data.kind as Kind | "all")
            : base.kind,
      topic: topicFilters.has(data.topic as Topic | "all") ? (data.topic as Topic | "all") : base.topic,
      themeId: themes.some((theme) => theme.id === themeId) ? themeId : base.themeId,
      ratio: ratios.has(data.ratio as Ratio) ? (data.ratio as Ratio) : base.ratio,
      duration: durations.has(duration) ? (duration as 6 | 9 | 12) : base.duration,
      useHook: typeof data.useHook === "boolean" ? data.useHook : base.useHook,
      showMark: typeof data.showMark === "boolean" ? data.showMark : base.showMark,
      savedIds,
      savedOnly: data.savedOnly === true,
      tray,
      backgroundId: backgroundFrom(data.backgroundId),
      voice: voices.has(data.voice as Voice) ? (data.voice as Voice) : base.voice,
      seat: seats.has(data.seat as Seat) ? (data.seat as Seat) : base.seat,
      clear: data.clear === true,
      guides: data.guides === true,
      postedIds: postedFrom(data.postedIds),
      freshOnly: data.freshOnly === true,
      firm: data.firm === true,
    };
  } catch {
    return base;
  }
}

export function saveDesk(desk: Desk) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(desk));
  } catch {
    /* storage can be blocked */
  }
}

function postedFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length < 80 && id !== "custom");
  return [...new Set(ids)].slice(-400);
}

function backgroundFrom(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value === "string" && motions.some((item) => item.id === value)) return value;
  return motions[0].id;
}

export function freshDeskId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `desk-${crypto.randomUUID()}`;
  return `desk-${Date.now().toString(36)}`;
}
