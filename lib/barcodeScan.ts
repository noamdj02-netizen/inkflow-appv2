import jsQR from 'jsqr';

/** API BarcodeDetector (Chromium). */
export function getBarcodeDetector(): {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
} | null {
  if (typeof window === 'undefined') return null;
  const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => unknown })
    .BarcodeDetector;
  if (!BD) return null;
  try {
    return new BD({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39'] }) as {
      detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
    };
  } catch {
    return null;
  }
}

/**
 * Décode QR / codes-barres depuis une frame vidéo (Safari, Firefox — pas de BarcodeDetector).
 * Image redimensionnée pour limiter le coût CPU.
 */
export function scanVideoFrameJsQR(video: HTMLVideoElement): string | null {
  if (typeof document === 'undefined') return null;
  if (video.readyState < 2) return null;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw < 2 || vh < 2) return null;

  const maxDim = 640;
  const scale = Math.min(1, maxDim / Math.max(vw, vh));
  const w = Math.max(2, Math.floor(vw * scale));
  const h = Math.max(2, Math.floor(vh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    const data = result?.data?.trim();
    return data && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

/** Attend le prochain paint après mise à jour React (vidéo visible avant play()). */
export function waitNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
