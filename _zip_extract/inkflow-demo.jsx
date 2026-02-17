import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Grid } from 'lucide-react';

export default function InkFlowThemeDemo() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('inkflow-demo-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inkflow-demo-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      transition: 'background 0.3s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <style>{`
        :root[data-theme="light"] {
          --bg-primary: #f8f9fa;
          --bg-secondary: #ffffff;
          --bg-card: #ffffff;
          --bg-card-dark: #1a1a1a;
          --bg-hover: #f5f5f5;
          --text-primary: #1a1a1a;
          --text-secondary: #6b7280;
          --text-tertiary: #9ca3af;
          --text-on-dark: #ffffff;
          --orange: #ff8c00;
          --orange-hover: #ff7700;
          --green: #10b981;
          --green-bg: #d1fae5;
          --blue: #6366f1;
          --blue-hover: #4f46e5;
          --border: #e5e7eb;
          --border-light: #f3f4f6;
          --shadow-sm: rgba(0, 0, 0, 0.05);
          --shadow-md: rgba(0, 0, 0, 0.1);
        }

        :root[data-theme="dark"] {
          --bg-primary: #0f1113;
          --bg-secondary: #18191b;
          --bg-card: #1e2023;
          --bg-card-dark: #2a2d31;
          --bg-hover: #2a2d31;
          --text-primary: #f9fafb;
          --text-secondary: #d1d5db;
          --text-tertiary: #9ca3af;
          --text-on-dark: #f9fafb;
          --orange: #ff9500;
          --orange-hover: #ffa31a;
          --green: #10b981;
          --green-bg: #134e3a;
          --blue: #6366f1;
          --blue-hover: #7c3aed;
          --border: #2d3035;
          --border-light: #252729;
          --shadow-sm: rgba(0, 0, 0, 0.3);
          --shadow-md: rgba(0, 0, 0, 0.4);
        }

        * { box-sizing: border-box; }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: slideIn 0.5s ease forwards;
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.3s ease',
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
            background: 'var(--text-primary)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--bg-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            transition: 'all 0.3s ease'
          }}>IF.</div>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: '1.125rem',
              color: 'var(--text-primary)',
              transition: 'color 0.3s ease'
            }}>InkFlow</div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              transition: 'color 0.3s ease'
            }}>Ink & Art Studio</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={{
            background: 'var(--blue)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <Grid size={16} />
            Ajouter un widget
          </button>

          {/* THEME TOGGLE BUTTON */}
          <button 
            onClick={toggleTheme}
            data-theme={theme}
            aria-label="Toggle theme"
            style={{
              position: 'relative',
              width: '56px',
              height: '28px',
              background: 'var(--border)',
              borderRadius: '100px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 2px 4px var(--shadow-sm)'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '24px',
              height: '24px',
              background: 'var(--orange)',
              borderRadius: '50%',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(255, 140, 0, 0.4)',
              transform: theme === 'dark' ? 'translateX(28px)' : 'translateX(0)'
            }}>
              <Sun 
                size={14} 
                color="white"
                style={{
                  position: 'absolute',
                  opacity: theme === 'light' ? 1 : 0,
                  transform: theme === 'light' ? 'rotate(0deg)' : 'rotate(-180deg)',
                  transition: 'all 0.3s ease'
                }}
              />
              <Moon 
                size={14} 
                color="white"
                style={{
                  position: 'absolute',
                  opacity: theme === 'dark' ? 1 : 0,
                  transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
          </button>

          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}>
            <Bell size={20} />
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '8px',
              height: '8px',
              background: '#ef4444',
              borderRadius: '50%',
              border: '2px solid var(--bg-secondary)',
              transition: 'border-color 0.3s ease'
            }}></div>
          </div>

          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#10b981',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}>AM</div>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          transition: 'color 0.3s ease'
        }}>Vue d'ensemble</h1>
        <p style={{
          color: 'var(--text-secondary)',
          marginBottom: '2rem',
          transition: 'color 0.3s ease'
        }}>Gérez vos rendez-vous et votre activité en un coup d'œil</p>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'RDV aujourd\'hui', value: '3', isDark: false },
            { label: 'Revenus totaux', value: '2,450€', isDark: true },
            { label: 'Acomptes en attente', value: '180€', isDark: false, isOrange: true }
          ].map((stat, idx) => (
            <div 
              key={idx}
              className="animate-in"
              style={{
                background: stat.isDark ? 'var(--bg-card-dark)' : 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.5rem',
                transition: 'all 0.3s ease',
                animationDelay: `${idx * 0.1}s`,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                fontSize: '0.875rem',
                color: stat.isDark ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                marginBottom: '0.75rem',
                transition: 'color 0.3s ease'
              }}>{stat.label}</div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: stat.isOrange ? 'var(--orange)' : (stat.isDark ? 'var(--text-on-dark)' : 'var(--text-primary)'),
                transition: 'color 0.3s ease'
              }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div 
          className="animate-in"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '2rem',
            transition: 'all 0.3s ease',
            animationDelay: '0.3s'
          }}
        >
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            transition: 'color 0.3s ease'
          }}>🎨 Système de thème InkFlow</h2>
          <p style={{
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            marginBottom: '1rem',
            transition: 'color 0.3s ease'
          }}>
            Cliquez sur le bouton en haut à droite pour basculer entre les modes clair et sombre. 
            Votre préférence est automatiquement sauvegardée dans le localStorage.
          </p>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <span style={{
              background: 'var(--orange)',
              color: 'white',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>React</span>
            <span style={{
              background: 'var(--green)',
              color: 'white',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>CSS Variables</span>
            <span style={{
              background: 'var(--blue)',
              color: 'white',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>localStorage</span>
          </div>
        </div>
      </main>
    </div>
  );
}
