import type { Piece, Topic } from "../types";

export type PostPlace = "instagram" | "tiktok";

const topicTag: Record<Topic, string> = {
  mercy: "#rahma",
  patience: "#sabr",
  prayer: "#salah",
  trust: "#tawakkul",
  character: "#akhlaq",
  gratitude: "#shukr",
  hope: "#yaqeen",
  time: "#deen",
  speech: "#speech",
  sincerity: "#niyyah",
};

function opening(piece: Piece): string {
  const hook = piece.hook.trim();
  const english = piece.english.trim();
  if (!hook || hook.toLowerCase() === english.toLowerCase()) return english;
  return hook;
}

function sourceLine(piece: Piece): string {
  const source = piece.source.trim();
  if (piece.kind === "ayah") return source ? `Qur'an · ${source}` : "Qur'an";
  if (piece.kind === "hadith") return source ? `Hadith · ${source}` : "Hadith";
  return source || "Reminder";
}

function tags(piece: Piece, place: PostPlace): string {
  const topic = topicTag[piece.topic];
  const kind = piece.kind === "ayah" ? "#quran" : piece.kind === "hadith" ? "#hadith" : "#reminder";
  if (place === "tiktok") return `${kind} ${topic}`;
  return `#islam ${kind} ${topic}`;
}

export function captionFor(piece: Piece, place: PostPlace = "instagram"): string {
  const open = opening(piece);
  const english = piece.english.trim();
  const source = sourceLine(piece);
  if (place === "tiktok") return [open, source, tags(piece, place)].filter(Boolean).join("\n\n");

  const parts: string[] = [];
  if (open) parts.push(open);
  if (piece.arabic.trim()) parts.push(piece.arabic.trim());
  if (english && english.toLowerCase() !== open.toLowerCase()) parts.push(english);
  const url = piece.sourceUrl?.trim();
  parts.push(url ? `${source}\n${url}` : source);
  parts.push(tags(piece, "instagram"));
  return parts.join("\n\n");
}

export function batchCaption(pieces: Piece[], place: PostPlace): string {
  const usable = pieces.filter((piece) => piece.english.trim());
  if (usable.length === 0) return "";
  if (usable.length === 1) return captionFor(usable[0], place);
  const first = usable[0];
  if (place === "tiktok") {
    const rest = usable.length - 1;
    const source = rest > 0 ? `${sourceLine(first)} · and ${rest} more` : sourceLine(first);
    return [opening(first), source, tags(first, "tiktok")].filter(Boolean).join("\n\n");
  }
  const lines = usable.map((piece, index) => `${index + 1}. ${piece.english.trim()}\n${sourceLine(piece)}`);
  return [opening(first), lines.join("\n\n"), tags(first, "instagram")].filter(Boolean).join("\n\n");
}
