import React from 'react';

type PublicPictureImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  /** Chemin absolu depuis /public, ex. /images/hero.png */
  src: string;
};

/**
 * WebP (et AVIF si présent) en priorité — assets générés par `npm run img:webp`.
 * Fallback = `src` original (png/jpg).
 */
export const PublicPictureImage: React.FC<PublicPictureImageProps> = ({
  src,
  alt,
  className,
  loading = 'lazy',
  ...rest
}) => {
  const m = src.match(/^(.*)\.(png|jpe?g)$/i);
  if (!m) {
    return (
      <img
        src={src}
        alt={alt ?? ''}
        className={className}
        loading={loading}
        decoding="async"
        {...rest}
      />
    );
  }
  const base = m[1];
  const webp = `${base}.webp`;
  const avif = `${base}.avif`;
  return (
    <picture>
      <source type="image/avif" srcSet={avif} />
      <source type="image/webp" srcSet={webp} />
      <img
        src={src}
        alt={alt ?? ''}
        className={className}
        loading={loading}
        decoding="async"
        {...rest}
      />
    </picture>
  );
};
