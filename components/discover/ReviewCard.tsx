import React from 'react';
import { StarRating } from './StarRating';
import type { DiscoverReview } from '../../lib/discover';

interface ReviewCardProps {
  review: DiscoverReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div style={{
      background: '#161616',
      border: '1px solid #2a2a2a',
      borderRadius: 14,
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e3dc' }}>{review.client_name}</span>
            {review.is_verified && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: 'rgba(201,169,110,0.15)',
                color: '#c9a96e',
                border: '1px solid rgba(201,169,110,0.3)',
                padding: '2px 8px', borderRadius: 100,
              }}>
                ✓ Avis vérifié
              </span>
            )}
          </div>
          {review.tattoo_style && (
            <span style={{ fontSize: 11, color: '#6b6b6b', marginTop: 2, display: 'block' }}>
              {review.tattoo_style}
            </span>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <StarRating avg={review.rating} count={0} />
          <span style={{ fontSize: 10, color: '#6b6b6b', marginTop: 2, display: 'block' }}>
            {new Date(review.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {review.body && (
        <p style={{ fontSize: 13, color: 'rgba(232,227,220,0.8)', lineHeight: 1.6, margin: 0 }}>
          {review.body}
        </p>
      )}

      {review.reply_body && (
        <div style={{
          paddingLeft: 12,
          borderLeft: '2px solid rgba(201,169,110,0.4)',
        }}>
          <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>
            Réponse du tatoueur
            {review.reply_at && ` · ${new Date(review.reply_at).toLocaleDateString('fr-FR')}`}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(232,227,220,0.7)', lineHeight: 1.5, margin: 0 }}>
            {review.reply_body}
          </p>
        </div>
      )}
    </div>
  );
}
