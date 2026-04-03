import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { StyleBadge } from './StyleBadge';
import type { DiscoverStudio } from '../../lib/discover';

interface ArtistCardProps {
  studio: DiscoverStudio;
  onClick?: () => void;
  key?: React.Key;
}

export function ArtistCard({ studio, onClick }: ArtistCardProps) {
  const [coverBroken, setCoverBroken] = useState(false);
  const [previewBroken, setPreviewBroken] = useState<Record<number, boolean>>({});
  const hasCover = studio.portfolio_cover_url && !coverBroken;
  const preview = (studio.portfolio_preview ?? []).slice(0, 3);
  const hasPreview = preview.length >= 2;

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    window.location.href = `/p/${studio.slug}`;
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: '#161616',
        border: '1px solid #2a2a2a',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
    >
      {/* Cover photo */}
      <div style={{
        position: 'relative',
        aspectRatio: '4/3',
        background: '#0d0d0d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {hasCover ? (
          <img
            src={studio.portfolio_cover_url!}
            alt={`Tatouages par ${studio.studio_name}`}
            onError={() => setCoverBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 12, color: '#6b6b6b' }}>Portfolio bientôt disponible</span>
        )}
        {studio.rating_count >= 3 && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(201,169,110,0.9)',
            color: '#0d0d0d', fontSize: 10, fontWeight: 700,
            padding: '3px 9px', borderRadius: 100,
          }}>
            ✓ Vérifié
          </span>
        )}
      </div>

      {/* Preview strip */}
      {hasPreview && (
        <div style={{ display: 'flex', gap: 2, height: 52 }}>
          {preview.map((url, i) => (
            <div key={i} style={{
              flex: 1, overflow: 'hidden', background: '#0d0d0d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!previewBroken[i] ? (
                <img
                  src={url}
                  alt=""
                  onError={() => setPreviewBroken((p) => ({ ...p, [i]: true }))}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e3dc', lineHeight: 1.2 }}>
            {studio.studio_name || studio.name}
          </div>
          {studio.studio_name && studio.name !== studio.studio_name && (
            <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{studio.name}</div>
          )}
          {studio.city && (
            <div style={{ fontSize: 11, color: '#6b6b6b', marginTop: 2 }}>📍 {studio.city}</div>
          )}
        </div>

        {studio.styles && studio.styles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {studio.styles.slice(0, 3).map((s) => <StyleBadge key={s} style={s} />)}
            {studio.styles.length > 3 && (
              <span style={{ fontSize: 11, color: '#6b6b6b', alignSelf: 'center' }}>
                +{studio.styles.length - 3}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StarRating avg={studio.rating_avg} count={studio.rating_count} />
          {studio.price_min != null && (
            <span style={{ fontSize: 11, color: '#c9a96e', fontWeight: 500 }}>
              à partir de {studio.price_min}€
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
