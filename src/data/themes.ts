import type { CSSProperties } from "react";
import type { Shell, Theme } from "../types";

const night = (accent: string, accentInk: string, glow: string): Shell => ({
  light: false,
  page: "#12100e",
  ink: "#f3efe6",
  soft: "#c8c0b4",
  faint: "#e4d9cc",
  accent,
  accentInk,
  line: "rgba(243, 239, 230, 0.12)",
  field: "rgba(243, 239, 230, 0.04)",
  wash: "rgba(243, 239, 230, 0.08)",
  danger: "#e2b8a4",
  glow,
});

const day = (page: string, accent: string): Shell => ({
  light: true,
  page,
  ink: "#2a211c",
  soft: "#5c4b40",
  faint: "#4a3b32",
  accent,
  accentInk: "#fbf6ee",
  line: "rgba(42, 33, 28, 0.14)",
  field: "rgba(255, 252, 247, 0.72)",
  wash: "rgba(42, 33, 28, 0.08)",
  danger: "#8d3b32",
  glow: "rgba(160, 110, 70, 0.16)",
});

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
    shell: night("#c4a574", "#231c16", "rgba(196, 164, 116, 0.14)"),
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
    shell: day("#f4ebe1", "#8d5e3c"),
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
    shell: {
      ...night("#c6b07a", "#1a241c", "rgba(140, 160, 110, 0.16)"),
      page: "#101612",
    },
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
    shell: day("#f3ead8", "#8a6238"),
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
    shell: night("#d4b06e", "#1c1a17", "rgba(212, 176, 110, 0.14)"),
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
    shell: {
      ...night("#d4be8c", "#142422", "rgba(90, 140, 120, 0.16)"),
      page: "#0e1918",
      soft: "#d7d0c0",
    },
  },
];

export function shellVars(theme: Theme): CSSProperties {
  const shell = theme.shell;
  return {
    "--page": shell.page,
    "--ink": shell.ink,
    "--soft": shell.soft,
    "--faint": shell.faint,
    "--accent": shell.accent,
    "--accent-ink": shell.accentInk,
    "--line": shell.line,
    "--field": shell.field,
    "--wash": shell.wash,
    "--danger": shell.danger,
    "--glow": shell.glow,
  } as CSSProperties;
}

export function themeById(id: string): Theme {
  return themes.find((theme) => theme.id === id) ?? themes[0];
}
