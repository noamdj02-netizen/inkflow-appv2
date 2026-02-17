import React, { useState } from 'react';

export default function ColorComparison() {
  const [showBefore, setShowBefore] = useState(true);

  const beforeColors = {
    bgPrimary: '#0a0a0a',
    bgCard: '#1a1a1a',
    bgCardDark: '#2a2d31',
    textPrimary: '#fafafa',
    orange: '#d4a574',
    border: '#2a2a2a'
  };

  const afterColors = {
    bgPrimary: '#18181b',
    bgCard: '#27272a',
    bgCardDark: '#2d2d31',
    textPrimary: '#fafafa',
    orange: '#fb923c',
    border: '#3a3a3f'
  };

  const colors = showBefore ? beforeColors : afterColors;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.bgPrimary,
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      transition: 'all 0.3s ease'
    }}>
      <style>{`
        .card {
          transition: all 0.3s ease;
        }
        
        .toggle-btn {
          transition: all 0.2s ease;
        }
        
        .toggle-btn:hover {
          transform: scale(1.05);
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          background: colors.bgCard,
          padding: '2rem',
          borderRadius: '16px',
          border: `1px solid ${colors.border}`
        }}>
          <h1 style={{ 
            color: colors.textPrimary, 
            fontSize: '2.5rem',
            marginBottom: '1rem'
          }}>
            {showBefore ? '❌ AVANT - Mode sombre' : '✅ APRÈS - Mode sombre amélioré'}
          </h1>
          <p style={{ 
            color: colors.textPrimary, 
            opacity: 0.7,
            marginBottom: '2rem',
            fontSize: '1.125rem'
          }}>
            {showBefore 
              ? 'Trop de blanc, contraste trop fort, fatiguant pour les yeux'
              : 'Tons gris harmonieux, couleurs vives, élégant et reposant'}
          </p>
          <button 
            className="toggle-btn"
            onClick={() => setShowBefore(!showBefore)}
            style={{
              background: colors.orange,
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 4px 16px ${colors.orange}40`
            }}
          >
            {showBefore ? '👉 Voir APRÈS (amélioré)' : '👈 Voir AVANT (problème)'}
          </button>
        </div>

        {/* Color Swatches */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {[
            { name: 'Fond page', color: colors.bgPrimary, key: 'bgPrimary' },
            { name: 'Fond carte', color: colors.bgCard, key: 'bgCard' },
            { name: 'Fond carte sombre', color: colors.bgCardDark, key: 'bgCardDark' },
            { name: 'Texte', color: colors.textPrimary, key: 'textPrimary' },
            { name: 'Orange', color: colors.orange, key: 'orange' },
            { name: 'Bordure', color: colors.border, key: 'border' }
          ].map(({ name, color, key }) => (
            <div 
              key={key}
              className="card"
              style={{ 
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '100%',
                height: '80px',
                background: color,
                borderRadius: '8px',
                marginBottom: '1rem',
                border: `2px solid ${colors.border}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}></div>
              <div style={{ 
                color: colors.textPrimary, 
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                {name}
              </div>
              <code style={{ 
                color: colors.orange,
                fontSize: '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px'
              }}>
                {color}
              </code>
            </div>
          ))}
        </div>

        {/* Example Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Normal Card */}
          <div 
            className="card"
            style={{
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '2rem'
            }}
          >
            <div style={{ 
              color: colors.textPrimary,
              opacity: 0.6,
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              RDV AUJOURD'HUI
            </div>
            <div style={{ 
              color: colors.textPrimary,
              fontSize: '3rem',
              fontWeight: 700
            }}>
              0
            </div>
          </div>

          {/* Dark Card */}
          <div 
            className="card"
            style={{
              background: colors.bgCardDark,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '2rem'
            }}
          >
            <div style={{ 
              color: colors.textPrimary,
              opacity: 0.6,
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              REVENUS TOTAUX
            </div>
            <div style={{ 
              color: colors.textPrimary,
              fontSize: '3rem',
              fontWeight: 700
            }}>
              0€
            </div>
          </div>

          {/* Orange Card */}
          <div 
            className="card"
            style={{
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '2rem'
            }}
          >
            <div style={{ 
              color: colors.textPrimary,
              opacity: 0.6,
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              ACOMPTES EN ATTENTE
            </div>
            <div style={{ 
              color: colors.orange,
              fontSize: '3rem',
              fontWeight: 700
            }}>
              0€
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div style={{
          marginTop: '3rem',
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '2rem'
        }}>
          <h2 style={{ 
            color: colors.textPrimary,
            marginBottom: '1.5rem',
            fontSize: '1.5rem'
          }}>
            {showBefore ? '⚠️ Problèmes identifiés' : '✅ Améliorations apportées'}
          </h2>
          {showBefore ? (
            <ul style={{ 
              color: colors.textPrimary,
              opacity: 0.8,
              lineHeight: '2',
              paddingLeft: '1.5rem'
            }}>
              <li>Fond trop noir (#0a0a0a) - agressif pour les yeux</li>
              <li>Cartes trop blanches (#1a1a1a) - contraste dur</li>
              <li>Orange terne (#d4a574) - manque de punch</li>
              <li>Bordures trop sombres - éléments fusionnent</li>
              <li>Aspect "flashy" et peu professionnel</li>
            </ul>
          ) : (
            <ul style={{ 
              color: colors.textPrimary,
              opacity: 0.8,
              lineHeight: '2',
              paddingLeft: '1.5rem'
            }}>
              <li>Fond gris chaud (#18181b) - reposant et élégant</li>
              <li>Cartes gris doux (#27272a) - harmonie parfaite</li>
              <li>Orange vif (#fb923c) - ressort magnifiquement</li>
              <li>Bordures visibles (#3a3a3f) - hiérarchie claire</li>
              <li>Aspect premium et professionnel</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
