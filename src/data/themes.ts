import type { Theme } from "../types";

export const themes: Theme[] = [
  {
    id: "layl",
    name: "Layl",
    bg: ["#241c16", "#161310", "#100e0c"],
    ink: "#f4efe6",
    muted: "#d4c4b0",
    motif: "rgba(196, 164, 116, 0.32)",
    rule: "rgba(196, 164, 116, 0.72)",
    glow: "rgba(196, 148, 96, 0.18)",
  },
  {
    id: "fajr",
    name: "Fajr",
    bg: ["#f1e2d4", "#e7d0be", "#d7b79f"],
    ink: "#2a211c",
    muted: "#6a5346",
    motif: "rgba(90, 58, 42, 0.2)",
    rule: "rgba(90, 58, 42, 0.45)",
    glow: "rgba(255, 244, 230, 0.45)",
  },
  {
    id: "zaytoun",
    name: "Zaytoun",
    bg: ["#243026", "#1a241c", "#121814"],
    ink: "#f3f0e6",
    muted: "#c9d2c4",
    motif: "rgba(196, 176, 120, 0.28)",
    rule: "rgba(196, 176, 120, 0.65)",
    glow: "rgba(120, 140, 90, 0.2)",
  },
  {
    id: "raml",
    name: "Raml",
    bg: ["#efe6d6", "#e4d5bc", "#d9c6a6"],
    ink: "#2c241c",
    muted: "#6e5c48",
    motif: "rgba(92, 68, 40, 0.18)",
    rule: "rgba(92, 68, 40, 0.42)",
    glow: "rgba(255, 248, 236, 0.4)",
  },
  {
    id: "hibr",
    name: "Hibr",
    bg: ["#1c1a17", "#121110", "#0e0d0c"],
    ink: "#f6f1e6",
    muted: "#e0c48a",
    motif: "rgba(212, 176, 110, 0.3)",
    rule: "rgba(212, 176, 110, 0.8)",
    glow: "rgba(180, 140, 70, 0.16)",
  },
  {
    id: "rawdah",
    name: "Rawdah",
    bg: ["#1d3330", "#142422", "#0e1918"],
    ink: "#f4f1e8",
    muted: "#d5c7a4",
    motif: "rgba(212, 190, 140, 0.26)",
    rule: "rgba(212, 190, 140, 0.62)",
    glow: "rgba(80, 130, 110, 0.22)",
  },
];

export function themeById(id: string): Theme {
  return themes.find((theme) => theme.id === id) ?? themes[0];
}
