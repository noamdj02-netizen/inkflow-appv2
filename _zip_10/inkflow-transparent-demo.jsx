import React, { useState } from 'react';
import { Moon, Sun, Bell, Grid } from 'lucide-react';

export default function InkFlowTransparent() {
  const [cardStyle, setCardStyle] = useState(1); // 1, 2, ou 3

  const getCardStyles = () => {
    if (cardStyle === 1) {
      return {
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'none'
      };
    } else if (cardStyle === 2) {
      return {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      };
    } else {
      return {
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'none'
      };
    }
  };

  const cardStyles = getCardStyles();

  return (
    <div style={{ minHeight: '100vh', background: '#18181b' }}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .card-hover:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .style-selector {
          transition: all 0.2s ease;
        }

        .style-selector:hover {
          transform: scale(1.05);
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: '#1f1f23',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#1a1a1a'
          }}>IF.</div>
          <div style={{
            fontWeight: 700,
            fontSize: '1.125rem',
            color: '#fafafa'
          }}>InkFlow</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={{
            background: '#e879f9',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <Grid size={16} />
            Ajouter un widget
          </button>

          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(251, 146, 60, 0.3)'
          }}>
            <Bell size={20} />
          </div>

          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#22c55e',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            cursor: 'pointer'
          }}>N</div>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Style Selector */}
        <div style={{
          ...cardStyles,
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            color: '#fafafa',
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            🎨 Choisissez votre style de cartes
          </h1>
          <p style={{
            color: '#d4d4d8',
            marginBottom: '2rem',
            fontSize: '1.125rem'
          }}>
            Cliquez sur un style pour voir le résultat en temps réel
          </p>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              className="style-selector"
              onClick={() => setCardStyle(1)}
              style={{
                background: cardStyle === 1 ? '#fb923c' : 'transparent',
                color: cardStyle === 1 ? 'white' : '#d4d4d8',
                border: `2px solid ${cardStyle === 1 ? '#fb923c' : 'rgba(255, 255, 255, 0.15)'}`,
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              Style 1: Transparent
              {cardStyle === 1 && ' ✓'}
            </button>

            <button 
              className="style-selector"
              onClick={() => setCardStyle(2)}
              style={{
                background: cardStyle === 2 ? '#fb923c' : 'transparent',
                color: cardStyle === 2 ? 'white' : '#d4d4d8',
                border: `2px solid ${cardStyle === 2 ? '#fb923c' : 'rgba(255, 255, 255, 0.15)'}`,
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              Style 2: Glassmorphism
              {cardStyle === 2 && ' ✓'}
            </button>

            <button 
              className="style-selector"
              onClick={() => setCardStyle(3)}
              style={{
                background: cardStyle === 3 ? '#fb923c' : 'transparent',
                color: cardStyle === 3 ? 'white' : '#d4d4d8',
                border: `2px solid ${cardStyle === 3 ? '#fb923c' : 'rgba(255, 255, 255, 0.15)'}`,
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              Style 3: Contour
              {cardStyle === 3 && ' ✓'}
            </button>
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(251, 146, 60, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(251, 146, 60, 0.2)'
          }}>
            <p style={{ color: '#fb923c', fontSize: '0.875rem', fontWeight: 500 }}>
              {cardStyle === 1 && '✨ Le plus discret - Parfait pour un look minimaliste'}
              {cardStyle === 2 && '✨ Effet verre moderne - Élégant avec du flou'}
              {cardStyle === 3 && '✨ Minimaliste extrême - Juste des contours'}
            </p>
          </div>
        </div>

        <h2 style={{
          color: '#fafafa',
          fontSize: '1.5rem',
          marginBottom: '0.5rem'
        }}>Vue d'ensemble</h2>
        <p style={{
          color: '#d4d4d8',
          marginBottom: '2rem'
        }}>Gérez vos rendez-vous et votre activité en un coup d'œil</p>

        {/* Customize Card */}
        <div 
          className="card-hover"
          style={{
            ...cardStyles,
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#d4d4d8',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            <span>🎨</span>
            <span>Personnaliser l'apparence</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '1.25rem' }}>🔗</span>
            <span style={{ color: '#d4d4d8', fontSize: '0.875rem' }}>
              Lien de votre vitrine
            </span>
            <span style={{ flex: 1, color: '#a1a1aa', fontSize: '0.875rem' }}>
              http://localhost:3000/studio/mon-studio
            </span>
            <button style={{
              background: '#e879f9',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}>
              Copier le lien
            </button>
            <button style={{
              background: 'transparent',
              color: '#d4d4d8',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}>
              Ouvrir
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Card 1 */}
          <div 
            className="card-hover"
            style={{
              ...cardStyles,
              borderRadius: '12px',
              padding: '2rem',
              cursor: 'pointer'
            }}
          >
            <div style={{
              fontSize: '0.875rem',
              color: '#a1a1aa',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              RDV aujourd'hui
            </div>
            <div style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: '#fafafa'
            }}>
              0
            </div>
          </div>

          {/* Card 2 - Dark */}
          <div 
            className="card-hover"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '2rem',
              cursor: 'pointer'
            }}
          >
            <div style={{
              fontSize: '0.875rem',
              color: '#a1a1aa',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Revenus totaux
            </div>
            <div style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: '#fafafa'
            }}>
              0€
            </div>
          </div>

          {/* Card 3 */}
          <div 
            className="card-hover"
            style={{
              ...cardStyles,
              borderRadius: '12px',
              padding: '2rem',
              cursor: 'pointer'
            }}
          >
            <div style={{
              fontSize: '0.875rem',
              color: '#a1a1aa',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Acomptes en attente
            </div>
            <div style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: '#fb923c'
            }}>
              0€
            </div>
          </div>
        </div>

        {/* Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: '1.5rem'
        }}>
          <div 
            className="card-hover"
            style={{
              ...cardStyles,
              borderRadius: '12px',
              padding: '1.5rem'
            }}
          >
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#fafafa',
              marginBottom: '1.5rem'
            }}>
              Évolution du revenu (6 mois)
            </h3>
            <div style={{
              width: '100%',
              height: '200px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a1a1aa',
              border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}>
              Graphique ici
            </div>
          </div>

          <div 
            className="card-hover"
            style={{
              ...cardStyles,
              borderRadius: '12px',
              padding: '1.5rem'
            }}
          >
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#fafafa',
              marginBottom: '1.5rem'
            }}>
              Aucun RDV
            </h3>
            <div style={{
              width: '100%',
              height: '200px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a1a1aa',
              fontSize: '0.875rem',
              textAlign: 'center',
              padding: '2rem'
            }}>
              Aucun rendez-vous pour le moment
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
