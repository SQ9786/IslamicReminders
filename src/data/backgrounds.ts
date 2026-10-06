export type Motion = {
  id: string;
  name: string;
  src: string;
  poster: string;
  ink: string;
  muted: string;
  rule: string;
  veil: string;
  light: boolean;
  note: string;
};

export const motions: Motion[] = [
  {
    id: "noor",
    name: "Noor",
    src: "/backgrounds/noor.mp4",
    poster: "/backgrounds/noor.jpg",
    ink: "#f7f1e6",
    muted: "#ead7b6",
    rule: "rgba(234, 210, 160, 0.8)",
    veil: "rgba(20, 12, 8, 0.34)",
    light: false,
    note: "Lamp",
  },
  {
    id: "fajr",
    name: "Sahar",
    src: "/backgrounds/fajr.mp4",
    poster: "/backgrounds/fajr.jpg",
    ink: "#2a211c",
    muted: "#5c4638",
    rule: "rgba(90, 58, 42, 0.5)",
    veil: "rgba(255, 246, 236, 0.22)",
    light: true,
    note: "Dawn",
  },
  {
    id: "bahr",
    name: "Bahr",
    src: "/backgrounds/bahr.mp4",
    poster: "/backgrounds/bahr.jpg",
    ink: "#f4f7f4",
    muted: "#d5e4df",
    rule: "rgba(210, 232, 226, 0.7)",
    veil: "rgba(4, 16, 18, 0.36)",
    light: false,
    note: "Water",
  },
  {
    id: "layl",
    name: "Qamar",
    src: "/backgrounds/layl.mp4",
    poster: "/backgrounds/layl.jpg",
    ink: "#f4f1ea",
    muted: "#d5d0e4",
    rule: "rgba(210, 206, 230, 0.72)",
    veil: "rgba(6, 8, 20, 0.4)",
    light: false,
    note: "Night",
  },
  {
    id: "hibr",
    name: "Qalam",
    src: "/backgrounds/hibr.mp4",
    poster: "/backgrounds/hibr.jpg",
    ink: "#f6f1e6",
    muted: "#e4c98a",
    rule: "rgba(212, 176, 110, 0.8)",
    veil: "rgba(8, 6, 4, 0.46)",
    light: false,
    note: "Ink",
  },
];

export function motionById(id: string | null | undefined): Motion | null {
  if (!id) return null;
  return motions.find((item) => item.id === id) ?? null;
}
