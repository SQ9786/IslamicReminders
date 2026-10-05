export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadStill(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename);
  }, "image/png");
}

function supportedMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function recordReel(
  canvas: HTMLCanvasElement,
  draw: (t: number) => void,
  durationMs: number,
): Promise<Blob> {
  const mime = supportedMime();
  if (!mime) return Promise.reject(new Error("unsupported"));

  return new Promise((resolve, reject) => {
    draw(0);
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 8_000_000,
    });
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
