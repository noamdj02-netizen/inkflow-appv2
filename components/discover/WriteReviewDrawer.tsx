import React, { useState } from 'react';
import { STYLES_LIST } from '../../lib/constants/styles';
import { postReview } from '../../lib/discover';

interface WriteReviewDrawerProps {
  studioId: string;
  studioName: string;
  onClose: () => void;
}

export function WriteReviewDrawer({ studioId, studioName, onClose }: WriteReviewDrawerProps) {
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [body, setBody]       = useState('');
  const [style, setStyle]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const canSubmit = rating > 0 && name.trim().length >= 2 && email.includes('@') && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await postReview({
        studioId,
        clientName: name.trim(),
        clientEmail: email.trim(),
        rating,
        body: body.trim() || undefined,
        tattooStyle: style || undefined,
      });
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: '10px 14px',
    borderRadius: 12,
    background: '#1a1a1a',
    border: '1.5px solid #2a2a2a',
    color: '#e8e3dc',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: '#161616',
        borderRadius: '24px 24px 0 0',
        borderTop: '1px solid #2a2a2a',
        padding: '24px 20px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        zIndex: 201,
        maxHeight: '90dvh',
        overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: '#2a2a2a', margin: '0 auto 20px',
        }} />

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e8e3dc', marginBottom: 8 }}>
              Merci pour votre avis !
            </div>
            <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 24 }}>
              Votre avis sera publié après modération.
            </div>
            <button
              onClick={onClose}
              style={{
                minHeight: 44, padding: '0 24px', borderRadius: 12,
                background: '#c9a96e', color: '#0d0d0d',
                fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#e8e3dc' }}>
                Laisser un avis
              </div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{studioName}</div>
            </div>

            {/* Étoiles */}
            <div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 8 }}>Note *</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    style={{
                      fontSize: 32, background: 'none', border: 'none', cursor: 'pointer',
                      color: i <= (hovered || rating) ? '#c9a96e' : '#2a2a2a',
                      padding: 4, minWidth: 44, minHeight: 44,
                      transition: 'color 0.1s',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Infos */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 6 }}>Prénom *</div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marie D."
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 6 }}>Email *</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@email.fr"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Style */}
            <div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 6 }}>Style de tatouage</div>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={{ ...inputStyle, paddingRight: 12 }}
              >
                <option value="">Sélectionner (optionnel)</option>
                {STYLES_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Commentaire */}
            <div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 6 }}>
                Votre avis <span style={{ color: '#2a2a2a' }}>(optionnel)</span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Décrivez votre expérience…"
                maxLength={1000}
                rows={4}
                style={{
                  ...inputStyle,
                  minHeight: 'unset',
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
              <div style={{ fontSize: 10, color: '#6b6b6b', textAlign: 'right', marginTop: 4 }}>
                {body.length}/1000
              </div>
            </div>

            {error && (
              <div style={{
                fontSize: 13, color: '#f47b7b',
                background: 'rgba(244,123,123,0.1)',
                border: '1px solid rgba(244,123,123,0.3)',
                borderRadius: 10, padding: '10px 14px',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                minHeight: 48, width: '100%',
                borderRadius: 14,
                background: canSubmit ? '#c9a96e' : '#2a2a2a',
                color: canSubmit ? '#0d0d0d' : '#6b6b6b',
                fontWeight: 700, fontSize: 15, border: 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Envoi en cours…' : 'Publier mon avis'}
            </button>

            <div style={{ fontSize: 11, color: '#6b6b6b', textAlign: 'center' }}>
              Votre email ne sera jamais affiché publiquement.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
