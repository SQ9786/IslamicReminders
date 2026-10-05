export type Kind = "ayah" | "hadith" | "reminder";

export type Topic =
  | "mercy"
  | "patience"
  | "prayer"
  | "trust"
  | "character"
  | "gratitude"
  | "hope"
  | "time";

export type Piece = {
  id: string;
  kind: Kind;
  topic: Topic;
  arabic: string;
  english: string;
  source: string;
  hook: string;
};

export type Ratio = "9:16" | "4:5" | "1:1";

export type Theme = {
  id: string;
  name: string;
  bg: [string, string, string];
  ink: string;
  muted: string;
  motif: string;
  rule: string;
  glow: string;
};
