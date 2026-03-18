/**
 * Zone d'upload d'images de référence — réutilisable (vitrine, réservation, demandes).
 * UX optimisée : prévisualisation immédiate, touch targets 44px, drag & drop.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Image, X, Upload } from 'lucide-react';

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

  const isDark = variant === 'dark';

  const addFiles = useCallback(
    (files: File[]) => {
      const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const next = [...value, ...valid].slice(0, MAX_IMAGES);
      onChange(next);
    },
    [value, onChange]
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
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) addFiles(files);
      e.target.value = '';
    },
    [addFiles]
  );

  const handleClick = useCallback(() => {
    document.getElementById(inputId)?.click();
  }, [inputId]);

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
              key={`${file.name}-${i}`}
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
