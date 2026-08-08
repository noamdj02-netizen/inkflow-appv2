import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { shouldPlayHeroVideo } from '../../lib/media/shouldPlayHeroVideo';

export interface HeroBackgroundVideoProps {
  posterSrc: string;
  mp4Src: string;
  webmSrc: string;
  /** Repli si le poster extrait ne charge pas. */
  posterFallbackSrc?: string;
  alt?: string;
  className?: string;
  objectPosition?: string;
}

/**
 * Fond hero vidéo en boucle — poster obligatoire, pas de vidéo sur mobile / connexion lente / reduced motion.
 */
export const HeroBackgroundVideo: React.FC<HeroBackgroundVideoProps> = ({
  posterSrc,
  mp4Src,
  webmSrc,
  posterFallbackSrc,
  alt = '',
  className = '',
  objectPosition = 'center',
}) => {
  const reduceMotion = useReducedMotion();
  const isMobileViewport = useMediaQuery('(max-width: 767px)');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [posterUrl, setPosterUrl] = useState(posterSrc);
  const [videoFailed, setVideoFailed] = useState(false);
  const playVideo = shouldPlayHeroVideo(reduceMotion, isMobileViewport) && !videoFailed;

  const handlePosterError = useCallback(() => {
    if (posterFallbackSrc && posterUrl !== posterFallbackSrc) {
      setPosterUrl(posterFallbackSrc);
    }
  }, [posterFallbackSrc, posterUrl]);

  useEffect(() => {
    setPosterUrl(posterSrc);
    setVideoFailed(false);
  }, [posterSrc, mp4Src, webmSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playVideo) return;

    const tryPlay = () => {
      void video.play().catch(() => {
        /* Autoplay bloqué — le poster reste visible via l’attribut poster. */
      });
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener('loadeddata', tryPlay, { once: true });
      return () => video.removeEventListener('loadeddata', tryPlay);
    }
  }, [playVideo, mp4Src, webmSrc]);

  const mediaClassName = `absolute inset-0 h-full w-full object-cover ${className}`.trim();

  if (!playVideo) {
    return (
      <img
        src={posterUrl}
        alt={alt}
        className={mediaClassName}
        style={{ objectPosition }}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onError={handlePosterError}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={mediaClassName}
      style={{ objectPosition }}
      poster={posterUrl}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      aria-hidden={alt === '' ? true : undefined}
      onError={() => setVideoFailed(true)}
    >
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
    </video>
  );
};
