/** Redimensionnement léger pour limiter le poids (data URL ou fichier). */

const DEFAULT_MAX = 1600;
const JPEG_QUALITY = 0.85;
const WEBP_QUALITY = 0.82;

/**
 * Redimensionne puis compresse en WebP (repli JPEG si `image/webp` indisponible).
 * Utilisé pour les images de référence projets / réservations afin de limiter la conso data mobile.
 */
export function compressImageFileToWebP(
  file: File,
  maxSize = DEFAULT_MAX,
  webpQuality = WEBP_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      if (!ctx) {
        reject(new Error('Canvas non supporté'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          canvas.toBlob(
            (jpegBlob) => {
              if (jpegBlob) resolve(jpegBlob);
              else reject(new Error('Compression impossible'));
            },
            'image/jpeg',
            JPEG_QUALITY
          );
        },
        'image/webp',
        webpQuality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erreur de chargement'));
    };
    img.src = url;
  });
}

export function resizeImageFile(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      const isPng = file.type === 'image/png';
      resolve(
        isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erreur de chargement'));
    };
    img.src = url;
  });
}

/** Après recadrage : limite la plus grande dimension pour alléger le stockage. */
export function resizeDataUrl(dataUrl: string, maxSize = DEFAULT_MAX): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxSize && height <= maxSize) {
        resolve(dataUrl);
        return;
      }
      if (width > height) {
        height = (height / width) * maxSize;
        width = maxSize;
      } else {
        width = (width / height) * maxSize;
        height = maxSize;
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      const isPng = dataUrl.startsWith('data:image/png');
      resolve(
        isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      );
    };
    img.onerror = () => reject(new Error('Erreur de chargement'));
    img.src = dataUrl;
  });
}
