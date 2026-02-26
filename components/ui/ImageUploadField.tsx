import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

const MAX_SIZE = 800;
const QUALITY = 0.8;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = (height / width) * MAX_SIZE;
          width = MAX_SIZE;
        } else {
          width = (width / height) * MAX_SIZE;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      const isPng = file.type === 'image/png';
      const dataUrl = isPng
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', QUALITY);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erreur de chargement'));
    };
    img.src = url;
  });
}

interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label,
  placeholder = 'URL ou glissez une image ici',
  previewSize = 'md',
  className = ''
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const dataUrl = await resizeImage(file);
      onChange(dataUrl);
    } catch (err) {
      alert('Erreur lors du téléchargement de l\'image.');
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

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold mb-2">{label}</label>
      )}
      <div className="flex gap-4 items-start">
        <div className={`${sizeClasses[previewSize]} rounded-xl border-2 border-neutral-200 overflow-hidden bg-neutral-100 flex-shrink-0 flex items-center justify-center`}>
          {value ? (
            <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-neutral-400" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col sm:flex-row gap-2 p-3 rounded-xl border-2 border-dashed transition-colors ${
              isDragging ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 min-w-0 px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white"
            />
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg font-medium text-sm whitespace-nowrap transition-colors"
            >
              <Upload className="w-4 h-4" />
              Ajouter une photo
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Collez une URL, glissez une image ici ou cliquez sur « Ajouter une photo ».
          </p>
        </div>
      </div>
    </div>
  );
};
