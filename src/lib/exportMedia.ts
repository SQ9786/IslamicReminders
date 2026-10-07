export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("png"));
    }, "image/png");
  });
}

export function downloadStill(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename);
  }, "image/png");
}

export type ShareResult = "shared" | "saved" | "cancelled";

export function canShareFile(type: string) {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  const name = type.includes("mp4") ? "mihrab.mp4" : type.includes("png") ? "mihrab.png" : "mihrab.webm";
  try {
    return navigator.canShare({ files: [new File([new Blob([""], { type })], name, { type })] });
  } catch {
    return false;
  }
}

function shareData(file: File, text: string): ShareData | null {
  if (typeof navigator.share !== "function") return null;
  const title = "Mihrab";
  const withText: ShareData = { files: [file], title, text };
  const filesOnly: ShareData = { files: [file], title };
  try {
    if (typeof navigator.canShare !== "function" || navigator.canShare(withText)) return withText;
    if (navigator.canShare(filesOnly)) return filesOnly;
  } catch {
    return filesOnly;
  }
  return null;
}

export function shareFile(blob: Blob, filename: string, text: string): Promise<ShareResult> {
  const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
  const data = shareData(file, text);
  if (!data || typeof navigator.share !== "function") {
    downloadBlob(blob, filename);
    return Promise.resolve("saved");
  }
  const finish = (error: unknown): ShareResult | Promise<ShareResult> => {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    if (data.text && typeof navigator.share === "function") {
      return navigator.share({ files: [file], title: "Mihrab" }).then(
        () => "shared" as const,
        (again: unknown) => {
          if (again instanceof DOMException && again.name === "AbortError") return "cancelled";
          downloadBlob(blob, filename);
          return "saved";
        },
      );
    }
    downloadBlob(blob, filename);
    return "saved";
  };
  return navigator.share(data).then(() => "shared" as const, finish);
}

export async function shareStill(canvas: HTMLCanvasElement, filename: string, text: string) {
  const blob = await canvasPng(canvas);
  return shareFile(blob, filename, text);
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function bytesOf(data: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  return copy;
}

export function zipStore(files: { name: string; data: Uint8Array }[]) {
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const centrals: ArrayBuffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, file.data.length, true);
    localView.setUint32(22, file.data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    parts.push(bytesOf(local), bytesOf(file.data));

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, file.data.length, true);
    centralView.setUint32(24, file.data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(bytesOf(central));
    offset += local.length + file.data.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.byteLength, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...parts, ...centrals, bytesOf(end)], { type: "application/zip" });
}

export function placeInRun(t: number, count: number) {
  if (count <= 1) return { index: 0, local: t };
  if (t >= 1) return { index: count - 1, local: 1 };
  const scaled = t * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  return { index, local: scaled - index };
}

const reelTypes = [
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

function openRecorder(stream: MediaStream) {
  if (typeof MediaRecorder === "undefined") return null;
  for (const mime of reelTypes) {
    if (!MediaRecorder.isTypeSupported(mime)) continue;
    try {
      return {
        mime,
        recorder: new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 }),
      };
    } catch {
      /* this mime is listed but cannot record a silent canvas */
    }
  }
  return null;
}

export function recordReel(
  canvas: HTMLCanvasElement,
  draw: (t: number) => void,
  durationMs: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    draw(0);
    const stream = canvas.captureStream(30);
    const opened = openRecorder(stream);
    if (!opened) {
      reject(new Error("unsupported"));
      return;
    }
    const { mime, recorder } = opened;
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error("record-failed"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
    recorder.start();

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      draw(t);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        draw(1);
        window.setTimeout(() => recorder.stop(), 160);
      }
    };
    requestAnimationFrame(step);
  });
}

export function fileSlug(source: string): string {
  const cleaned = source
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "reminder";
}
