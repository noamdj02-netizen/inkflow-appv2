/**
 * Zone d'upload d'images de référence — réutilisable (vitrine, réservation, demandes).
 * UX optimisée : prévisualisation immédiate, touch targets 44px, drag & drop, recadrage.
 */
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Image, X, Upload } from 'lucide-react';
import { LazyImageCropModal } from '../ui/lazyImageCropModal';
import { ImageCropModalSuspenseFallback } from '../ui/skeleton';
import { dataUrlToFile } from '../../lib/cropImage';

const MAX_IMAGES = 10;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic';

interface ReferenceImageUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  /** Variant light (default) ou dark */
  variant?: 'light' | 'dark';
  /** Label personnalisé */
  label?: string;
  /** ID pour le input (évite conflits si plusieurs instances) */
  inputId?: string;
  className?: string;
}

export const ReferenceImageUpload: React.FC<ReferenceImageUploadProps> = ({
  value,
  onChange,
  variant = 'light',
  label = 'Ajouter des photos de référence',
  inputId = 'ref-upload',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cropBlobRef = useRef<string | null>(null);
  const pendingQueueRef = useRef<File[]>([]);
  const accumulatedRef = useRef<File[]>([]);

  const isDark = variant === 'dark';

  const revokeCrop = () => {
    if (cropBlobRef.current) {
      URL.revokeObjectURL(cropBlobRef.current);
      cropBlobRef.current = null;
    }
    setCropSrc(null);
  };

  useEffect(() => {
    return () => {
      if (cropBlobRef.current) URL.revokeObjectURL(cropBlobRef.current);
      pendingQueueRef.current = [];
      accumulatedRef.current = [];
    };
  }, []);

  const openNextInQueue = useCallback(() => {
    const q = pendingQueueRef.current;
    if (q.length === 0) {
      revokeCrop();
      return;
    }
    const file = q[0];
    if (cropBlobRef.current) URL.revokeObjectURL(cropBlobRef.current);
    const url = URL.createObjectURL(file);
    cropBlobRef.current = url;
    setCropSrc(url);
  }, []);

  const beginImport = useCallback(
    (incoming: File[]) => {
      const remaining = MAX_IMAGES - value.length;
      if (remaining <= 0) return;
      const looksLikeImage = (f: File) => {
        if (f.type.startsWith('image/')) return true;
        return /\.(jpe?g|png|webp|gif|heic|heif|bmp|tif)$/i.test(f.name);
      };
      const valid = incoming.filter(looksLikeImage).slice(0, remaining);
      if (valid.length === 0) return;
      pendingQueueRef.current = valid;
      accumulatedRef.current = [];
      openNextInQueue();
    },
    [openNextInQueue, value.length]
  );

  const addFiles = useCallback(
    (files: File[]) => {
      beginImport(files);
    },
    [beginImport]
  );

  const removeAt = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) addFiles(Array.from(files));
      e.target.value = '';
    },
    [addFiles]
  );

  const handleClick = useCallback(() => {
    document.getElementById(inputId)?.click();
  }, [inputId]);

  const handleCropConfirm = useCallback(
    async (dataUrl: string) => {
      const cropped = dataUrlToFile(dataUrl, `reference-${Date.now()}.jpg`);
      accumulatedRef.current.push(cropped);
      pendingQueueRef.current.shift();
      if (cropBlobRef.current) {
        URL.revokeObjectURL(cropBlobRef.current);
        cropBlobRef.current = null;
      }
      setCropSrc(null);
      if (pendingQueueRef.current.length > 0) {
        const next = pendingQueueRef.current[0];
        const url = URL.createObjectURL(next);
        cropBlobRef.current = url;
        setCropSrc(url);
      } else {
        const acc = accumulatedRef.current;
        accumulatedRef.current = [];
        pendingQueueRef.current = [];
        onChange([...value, ...acc]);
      }
    },
    [onChange, value]
  );

  const handleCropClose = useCallback(() => {
    pendingQueueRef.current = [];
    accumulatedRef.current = [];
    revokeCrop();
  }, []);

  useEffect(() => {
    const urls = value.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [value]);

  const zoneCls = `flex flex-col items-center justify-center gap-2 min-h-[88px] rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all active:scale-[0.99] touch-manipulation ${
    isDark
      ? 'border-zinc-600 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-500'
      : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 hover:border-zinc-300'
  } ${isDragging ? (isDark ? 'bg-zinc-800 border-zinc-500' : 'bg-zinc-100 border-zinc-400') : ''}`;

  return (
    <div className={className}>
      {cropSrc ? (
        <Suspense fallback={<ImageCropModalSuspenseFallback />}>
          <LazyImageCropModal
            isOpen
            imageSrc={cropSrc}
            aspect={1}
            cropShape="rect"
            title="Ajuster le cadrage"
            onClose={handleCropClose}
            onConfirm={handleCropConfirm}
          />
        </Suspense>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        className={zoneCls}
        aria-label={label}
      >
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleFileSelect}
          className="sr-only"
        />
        <Upload className={`w-8 h-8 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} strokeWidth={1.5} />
        <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {value.length > 0 ? `${value.length}/${MAX_IMAGES} photo(s)` : label}
        </p>
        <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          Glissez ou cliquez · max {MAX_IMAGES}
        </p>
      </div>

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((file, i) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
              className="relative group rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-square w-16 h-16 flex-shrink-0"
            >
              {previews[i] ? (
                <img src={previews[i]} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center text-white transition-colors touch-manipulation active:scale-95"
                aria-label="Supprimer cette photo"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
