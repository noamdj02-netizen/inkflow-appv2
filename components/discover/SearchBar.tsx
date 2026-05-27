import React, { useState } from 'react';
import { STYLES_LIST, STYLE_SLUGS } from '../../lib/constants/styles';
import { DISCOVER_UI as U } from '../../lib/discoverUiTheme';

interface SearchBarProps {
  defaultCity?: string;
  defaultStyle?: string;
  defaultQ?: string;
}

export function SearchBar({ defaultCity = '', defaultStyle = '', defaultQ = '' }: SearchBarProps) {
  const [q, setQ] = useState(defaultQ);
  const [city, setCity] = useState(defaultCity);
  const [style, setStyle] = useState(defaultStyle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = ['explorer'];
    const citySlug = city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
    if (citySlug) parts.push(citySlug);
    if (style) {
      const styleSlug = STYLE_SLUGS[style] ?? style.toLowerCase().replace(/\s+/g, '-');
      parts.push(styleSlug);
    }
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    window.location.href = `/${parts.join('/')}${qs}`;
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 44,
    padding: '0 16px',
    borderRadius: 12,
    background: U.surface,
    border: `1.5px solid ${U.border}`,
    color: U.text,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        maxWidth: 640,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, studio, style…"
          style={inputStyle}
        />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville (Paris, Lyon…)"
          style={inputStyle}
        />
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          style={{
            ...inputStyle,
            flex: 'unset',
            paddingRight: 12,
          }}
        >
          <option value="">Tous les styles</option>
          {STYLES_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        style={{
          minHeight: 44,
          padding: '0 28px',
          borderRadius: 12,
          background: U.chipActiveBg,
          color: U.chipActiveFg,
          fontWeight: 700,
          fontSize: 14,
          border: 'none',
          cursor: 'pointer',
          letterSpacing: '-0.01em',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Trouver un tatoueur →
      </button>
    </form>
  );
}
