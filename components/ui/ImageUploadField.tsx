import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Upload, Pencil, Trash2 } from 'lucide-react';
import { LazyImageCropModal } from './lazyImageCropModal';
import { ImageCropModalSuspenseFallback } from './skeleton';
import { useToast } from '../../contexts/ToastContext';

interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Forme de la miniature : square (carré), round (avatar), cover (bannière rectangulaire) */
  shape?: 'square' | 'round' | 'cover';
  previewSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

function shapeToAspect(shape: 'square' | 'round' | 'cover'): number {
  if (shape === 'cover') return 3;
  return 1;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label,
  shape = 'square',
  previewSize = 'md',
  className = ''
}) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cropBlobRef = useRef<string | null>(null);

  const revokeCropSrc = () => {
    if (cropBlobRef.current) {
      URL.revokeObjectURL(cropBlobRef.current);
      cropBlobRef.current = null;
    }
    setCropSrc(null);
  };

  useEffect(() => {
    return () => {
      if (cropBlobRef.current) URL.revokeObjectURL(cropBlobRef.current);
    };
  }, []);

  const openCropFromFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (cropBlobRef.current) URL.revokeObjectURL(cropBlobRef.current);
    const url = URL.createObjectURL(file);
    cropBlobRef.current = url;
    setCropSrc(url);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      openCropFromFile(file);
    } catch {
      toast.error('Impossible d’ouvrir l’image.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const triggerFileInput = () => inputRef.current?.click();

  const hasImage = Boolean(value && value.trim());

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36'
  };

  const shapeClasses = {
    square: 'rounded-xl',
    round: 'rounded-full',
    cover: 'rounded-xl aspect-[3/1] w-full max-w-md'
  };

  const thumbnailCls = shape === 'cover'
    ? `overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-[var(--border)] ${shapeClasses[shape]}`
    : `${sizeClasses[previewSize]} overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-[var(--border)] flex-shrink-0 ${shapeClasses[shape]}`;

  const aspect = shapeToAspect(shape as 'cover' | 'round' | 'square');
  const cropShape = shape === 'round' ? 'round' : 'rect';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">{label}</label>
      )}

      {cropSrc ? (
        <Suspense fallback={<ImageCropModalSuspenseFallback />}>
          <LazyImageCropModal
            isOpen
            imageSrc={cropSrc}
            aspect={aspect}
            cropShape={cropShape}
            title="Ajuster le cadrage"
            onClose={revokeCropSrc}
            onConfirm={async (dataUrl) => {
              onChange(dataUrl);
              revokeCropSrc();
            }}
          />
        </Suspense>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden
      />

      {!hasImage ? (
        <div
          role="button"
          tabIndex={0}
          onClick={triggerFileInput}
          onKeyDown={(e) => e.key === 'Enter' && triggerFileInput()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          aria-label="Ajouter une photo"
          className={`flex flex-col items-center justify-center gap-3 min-h-[120px] rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all active:scale-[0.99] touch-manipulation ${
            isDragging
              ? 'border-neutral-900 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
              : 'border-zinc-200 dark:border-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
            <Upload className="w-6 h-6 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Ajouter une photo
          </span>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Glissez une image ou cliquez pour parcourir
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={thumbnailCls}>
            <img
              src={value}
              alt="Aperçu"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerFileInput}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-neutral-900 dark:bg-zinc-700 text-white hover:bg-neutral-800 dark:hover:bg-zinc-600 transition-colors active:scale-[0.98]"
            >
              <Pencil className="w-4 h-4" strokeWidth={2} />
              Modifier
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
