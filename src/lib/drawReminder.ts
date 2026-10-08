import { kickerFor } from "../data/library";
import type { Piece, Ratio, Seat, Theme, Voice } from "../types";

export const ratioSize: Record<Ratio, { w: number; h: number }> = {
  "9:16": { w: 1080, h: 1920 },
  "4:5": { w: 1080, h: 1350 },
  "1:1": { w: 1080, h: 1080 },
};

export type Plate = {
  source: CanvasImageSource;
  width: number;
  height: number;
  ink: string;
  muted: string;
  rule: string;
  veil: string;
  light: boolean;
};

export type DrawSpec = {
  piece: Piece;
  theme: Theme;
  ratio: Ratio;
  useHook: boolean;
  showMark: boolean;
  voice?: Voice;
  seat?: Seat;
  clear?: boolean;
  plate?: Plate | null;
  typeFade?: number;
  pass?: "all" | "ground" | "type";
  firm?: boolean;
};

function textRoom(ratio: Ratio, clear: boolean) {
  if (!clear) return { top: 0.12, bottom: 0.16, side: 0.105 };
  if (ratio === "9:16") return { top: 0.2, bottom: 0.24, side: 0.16 };
  if (ratio === "4:5") return { top: 0.14, bottom: 0.18, side: 0.13 };
  return { top: 0.13, bottom: 0.16, side: 0.13 };
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  w: number,
  h: number,
) {
  if (sw < 2 || sh < 2) return;
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

let noiseTile: HTMLCanvasElement | null = null;

function noise(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (noiseTile) return noiseTile;
  const tile = document.createElement("canvas");
  tile.width = 180;
  tile.height = 180;
  const nctx = tile.getContext("2d");
  if (!nctx) return null;
  const image = nctx.createImageData(180, 180);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 150 + Math.random() * 90;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 46;
  }
  nctx.putImageData(image, 0, 0);
  noiseTile = tile;
  return tile;
}

function smoothstep(value: number): number {
  const x = Math.min(1, Math.max(0, value));
  return x * x * (3 - 2 * x);
}

function appear(t: number, start: number, duration: number): number {
  return smoothstep((t - start) / duration);
}

export function layerAlpha(t: number, useHook: boolean) {
  if (!useHook || !Number.isFinite(t)) {
    const body = appear(t, 0.02, 0.2);
    return {
      hook: 0,
      kicker: body,
      arabic: appear(t, 0.08, 0.18),
      english: appear(t, 0.16, 0.2),
      source: appear(t, 0.26, 0.16),
    };
  }
  const hookIn = appear(t, 0, 0.08);
  const hookOut = appear(t, 0.2, 0.08);
  return {
    hook: hookIn * (1 - hookOut),
    kicker: appear(t, 0.3, 0.1),
    arabic: appear(t, 0.36, 0.12),
    english: appear(t, 0.44, 0.14),
    source: appear(t, 0.54, 0.12),
  };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let line = words[0];
    for (const word of words.slice(1)) {
      const next = `${line} ${word}`;
      if (ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontFor: (size: number) => string,
  start: number,
  min: number,
  maxLines: number,
) {
  let size = start;
  let lines = wrapText(ctx, text, maxWidth);
  while (size > min && lines.length > maxLines) {
    size -= 2;
    ctx.font = fontFor(size);
    lines = wrapText(ctx, text, maxWidth);
  }
  ctx.font = fontFor(size);
  return { size, lines: wrapText(ctx, text, maxWidth) };
}

function strokeStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.rect(-radius, -radius, radius * 2, radius * 2);
  ctx.stroke();
  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  ctx.rect(-radius, -radius, radius * 2, radius * 2);
  ctx.stroke();
  ctx.restore();
}

function drawArch(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const left = w * 0.2;
  const right = w * 0.8;
  const span = right - left;
  const base = h * 0.34;
  const cy = h * 0.16 + span / 2;
  ctx.beginPath();
  ctx.moveTo(left, base);
  ctx.lineTo(left, cy);
  ctx.arc((left + right) / 2, cy, span / 2, Math.PI, 0);
  ctx.lineTo(right, base);
  ctx.stroke();
}

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  tracking: number,
) {
  const chars = [...text];
  ctx.save();
  ctx.textAlign = "left";
  const widths = chars.map((char) => ctx.measureText(char).width);
  const total =
    widths.reduce((sum, width) => sum + width, 0) + tracking * Math.max(0, chars.length - 1);
  let cursor = centerX - total / 2;
  chars.forEach((char, index) => {
    ctx.fillText(char, cursor, y);
    cursor += widths[index] + tracking;
  });
  ctx.restore();
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return lines.length * lineHeight;
}

function typeCaps(voice: Voice, arabic: string, english: string) {
  const longArabic = arabic.trim().length > 80;
  const longEnglish = english.trim().length > 140;
  if (voice === "arabic") {
    return { arabic: longArabic ? 0.06 : 0.084, english: longEnglish ? 0.032 : 0.036 };
  }
  if (voice === "english") {
    return { arabic: longArabic ? 0.04 : 0.046, english: longEnglish ? 0.048 : 0.06 };
  }
  return { arabic: longArabic ? 0.052 : 0.068, english: longEnglish ? 0.04 : 0.048 };
}

export function drawReminder(
  ctx: CanvasRenderingContext2D,
  spec: DrawSpec,
  t: number,
) {
  const { w, h } = ratioSize[spec.ratio];
  const { theme, piece, useHook, showMark, plate } = spec;
  const voice = spec.voice ?? "even";
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const drift = reduce ? 0 : t * w * 0.02;
  const alpha = layerAlpha(Math.min(1, Math.max(0, t)), useHook && Boolean(piece.hook.trim()));
  const pass = spec.pass ?? "all";
  const typeFade = Math.min(1, Math.max(0, spec.typeFade ?? 1));
  const fade = (amount: number) => amount * typeFade;
  const hasPlate = Boolean(plate && plate.width > 1 && plate.height > 1);
  const ink = hasPlate && plate ? plate.ink : theme.ink;
  const muted = hasPlate && plate ? plate.muted : theme.muted;
  const rule = hasPlate && plate ? plate.rule : theme.rule;

  const frameMargin = w * 0.105;
  const room = textRoom(spec.ratio, Boolean(spec.clear));
  const margin = w * room.side;

  if (pass !== "type") {
  ctx.clearRect(0, 0, w, h);
  const firm = Boolean(spec.firm);
  if (hasPlate && plate) {
    drawCover(ctx, plate.source, plate.width, plate.height, w, h);
    ctx.fillStyle = plate.veil;
    ctx.fillRect(0, 0, w, h);
    if (firm) {
      ctx.fillStyle = plate.light ? "rgba(255,248,240,0.24)" : "rgba(0,0,0,0.24)";
      ctx.fillRect(0, 0, w, h);
    }
    const band = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.82);
    band.addColorStop(0, plate.light ? "rgba(255,248,240,0)" : "rgba(0,0,0,0)");
    band.addColorStop(0.5, plate.light ? (firm ? "rgba(255,248,240,0.5)" : "rgba(255,248,240,0.28)") : firm ? "rgba(0,0,0,0.58)" : "rgba(0,0,0,0.34)");
    band.addColorStop(1, plate.light ? (firm ? "rgba(255,248,240,0.18)" : "rgba(255,248,240,0.08)") : firm ? "rgba(0,0,0,0.36)" : "rgba(0,0,0,0.2)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, w, h);
  } else {
    const ground = ctx.createLinearGradient(0, 0, w * 0.2, h);
    ground.addColorStop(0, theme.bg[0]);
    ground.addColorStop(0.58, theme.bg[1]);
    ground.addColorStop(1, theme.bg[2]);
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.18, h * 0.12, 0, w * 0.28, h * 0.18, w * 0.95);
    glow.addColorStop(0, theme.glow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = theme.motif;
    ctx.lineWidth = Math.max(1.25, w / 520);
    const step = w / 4.6;
    const radius = step * 0.22;
    for (let y = -step; y < h + step; y += step) {
      for (let x = -step; x < w + step; x += step) {
        strokeStar(ctx, x + drift, y + drift * 0.35, radius);
      }
    }
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = hasPlate ? rule : theme.motif;
  ctx.globalAlpha = hasPlate ? 0.55 : 1;
  ctx.lineWidth = Math.max(1.5, w / 280);
  drawArch(ctx, w, h);
  ctx.restore();

  const tile = noise();
  if (tile) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    const pattern = ctx.createPattern(tile, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  const vignette = ctx.createRadialGradient(w / 2, h * 0.46, w * 0.18, w / 2, h * 0.5, w * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, firm ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = rule;
  ctx.lineWidth = Math.max(2, w * 0.0035);
  ctx.strokeRect(frameMargin * 0.48, frameMargin * 0.48, w - frameMargin * 0.96, h - frameMargin * 0.96);
  ctx.restore();
  }
  if (pass === "ground" || typeFade <= 0) return;

  const maxWidth = w - margin * 2;
  const cx = w / 2;

  if (fade(alpha.hook) > 0.01 && piece.hook.trim()) {
    ctx.save();
    ctx.globalAlpha = fade(alpha.hook);
    ctx.translate(0, (1 - alpha.hook) * h * 0.012);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.direction = "ltr";
    ctx.fillStyle = ink;
    const fitted = fit(
      ctx,
      piece.hook,
      maxWidth,
      (size) => `600 ${size}px Fraunces, Georgia, serif`,
      w * 0.064,
      w * 0.04,
      5,
    );
    const block = fitted.lines.length * fitted.size * 1.28;
    drawLines(ctx, fitted.lines, cx, h * 0.42 - block / 2, fitted.size * 1.28);
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = ink;

  const kickerSize = w * 0.028;
  ctx.font = `500 ${kickerSize}px Outfit, sans-serif`;
  const kicker = kickerFor(piece.kind);

  const arabicFont = (size: number) => `700 ${size}px Amiri, "Geeza Pro", serif`;
  const englishFont = (size: number) => `560 ${size}px Fraunces, Georgia, serif`;
  const hasArabic = Boolean(piece.arabic.trim());
  const caps = typeCaps(voice, piece.arabic, piece.english);

  ctx.font = arabicFont(w * 0.07);
  const arabic = hasArabic
    ? fit(ctx, piece.arabic, maxWidth, arabicFont, w * caps.arabic, w * 0.034, 6)
    : { size: 0, lines: [] as string[] };

  ctx.font = englishFont(w * 0.046);
  const english = piece.english.trim()
    ? fit(ctx, piece.english, maxWidth, englishFont, w * caps.english, w * 0.03, 8)
    : { size: 0, lines: ["Write a line to begin."] };

  const arabicLeading = arabic.size * 1.45;
  const englishLeading = english.size * 1.32;
  const arabicBlock = arabic.lines.length * arabicLeading;
  const englishBlock = english.lines.length * englishLeading;
  const ornament = w * 0.028;
  const gap = h * 0.028;
  const stack =
    kickerSize +
    gap * 0.8 +
    arabicBlock +
    (hasArabic ? gap : gap * 0.3) +
    ornament +
    gap +
    englishBlock;

  const sourceRoom = h * room.bottom;
  const topLimit = h * room.top;
  const available = h - topLimit - sourceRoom;
  let scale = stack > available ? available / stack : 1;
  scale = Math.max(0.72, Math.min(1, scale));

  const seat = spec.seat ?? "mid";
  const bias = seat === "high" ? 0.06 : seat === "low" ? 0.82 : 0.5;
  let y = topLimit + Math.max(0, (available - stack * scale) * bias);

  const rise = (amount: number) => (1 - amount) * h * 0.01;

  ctx.save();
  ctx.globalAlpha = fade(alpha.kicker);
  ctx.translate(0, rise(alpha.kicker));
  ctx.font = `500 ${kickerSize * scale}px Outfit, sans-serif`;
  ctx.fillStyle = muted;
  ctx.direction = "ltr";
  drawTracked(ctx, kicker, cx, y, w * 0.012);
  ctx.restore();
  y += (kickerSize + gap * 0.8) * scale;

  if (hasArabic) {
    ctx.save();
    ctx.globalAlpha = fade(alpha.arabic);
    ctx.translate(0, rise(alpha.arabic));
    ctx.font = arabicFont(arabic.size * scale);
    ctx.fillStyle = ink;
    ctx.direction = "rtl";
    y += drawLines(ctx, arabic.lines, cx, y, arabicLeading * scale);
    ctx.restore();
    y += gap * scale;
  }

  ctx.save();
  ctx.globalAlpha = fade(Math.max(alpha.arabic, alpha.english));
  ctx.fillStyle = rule;
  const d = ornament * 0.55 * scale;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(cx + d, y + d);
  ctx.lineTo(cx, y + d * 2);
  ctx.lineTo(cx - d, y + d);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  y += ornament * scale + gap * scale;

  ctx.save();
  ctx.globalAlpha = fade(piece.english.trim() ? alpha.english : 0.85);
  ctx.translate(0, rise(alpha.english));
  ctx.font = englishFont((piece.english.trim() ? english.size : w * 0.04) * scale);
  ctx.fillStyle = piece.english.trim() ? ink : muted;
  ctx.direction = "ltr";
  drawLines(ctx, english.lines, cx, y, englishLeading * scale);
  ctx.restore();

  const source = piece.source.trim() || "Add a source";
  ctx.save();
  ctx.globalAlpha = alpha.source;
  ctx.font = `500 ${w * 0.026 * scale}px Outfit, sans-serif`;
  ctx.fillStyle = muted;
  ctx.direction = "ltr";
  ctx.textAlign = "center";
  const sourceY = spec.clear
    ? h * (1 - room.bottom) + w * 0.012 - (showMark ? w * 0.04 : 0)
    : h - frameMargin * 1.15 - (showMark ? w * 0.06 : 0);
  ctx.strokeStyle = rule;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = fade(alpha.source * 0.8);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.08, sourceY - w * 0.03);
  ctx.lineTo(cx + w * 0.08, sourceY - w * 0.03);
  ctx.stroke();
  ctx.globalAlpha = fade(alpha.source);
  ctx.fillText(source, cx, sourceY);
  if (showMark) {
    ctx.globalAlpha = fade(alpha.source * 0.7);
    ctx.font = `500 ${w * 0.02}px Outfit, sans-serif`;
    ctx.fillText("mihrab", cx, sourceY + w * 0.045);
  }
  ctx.restore();
  ctx.restore();
}
