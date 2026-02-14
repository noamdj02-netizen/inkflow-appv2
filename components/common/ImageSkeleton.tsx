import React, { useState } from 'react';

interface ImageSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  fallbackSrc?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-square',
  fallbackSrc,
  onError,
  onLoad,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [didFallback, setDidFallback] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    if (fallbackSrc && !didFallback) {
      setDidFallback(true);
      (e.target as HTMLImageElement).src = fallbackSrc;
      onError?.(e);
      return;
    }
    setHasError(true);
    onError?.(e);
  };

  return (
    <div className={`relative ${aspectRatio} overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
      )}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
      {hasError && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-neutral-500">Image non disponible</p>
          </div>
        </div>
      )}
    </div>
  );
};
