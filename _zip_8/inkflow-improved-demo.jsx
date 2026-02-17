import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Grid, TrendingUp } from 'lucide-react';

export default function InkFlowImproved() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('inkflow-theme-v2') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inkflow-theme-v2', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{`
        /* ===== VARIABLES DE THÈME AMÉLIORÉES ===== */
        :root[data-theme="light"] {
          --bg-primary: #f8f9fa;
          --bg-secondary: #ffffff;
          --bg-sidebar: #1a1a1a;
          --bg-card: #ffffff;
          --bg-card-secondary: #f8f9fa;
          --bg-hover: #f5f5f5;
          --text-primary: #1a1a1a;
          --text-secondary: #6b7280;
          --text-tertiary: #9ca3af;
          --text-sidebar: #ffffff;
          --orange: #ff8c00;
          --orange-hover: #ff7700;
          --orange-light: #fff4e6;
          --green: #10b981;
          --green-bg: #d1fae5;
          --magenta: #d946ef;
          --magenta-hover: #c026d3;
          --border: #e5e7eb;
          --shadow-sm: rgba(0, 0, 0, 0.05);
          --shadow-md: rgba(0, 0, 0, 0.1);
        }

        :root[data-theme="dark"] {
          --bg-primary: #18181b;
          --bg-secondary: #1f1f23;
          --bg-sidebar: #1f1f23;
          --bg-card: #27272a;
          --bg-card-secondary: #2d2d31;
          --bg-hover: #3a3a3f;
          --text-primary: #fafafa;
          --text-secondary: #d4d4d8;
          --text-tertiary: #a1a1aa;
          --text-sidebar: #fafafa;
          --orange: #fb923c;
          --orange-hover: #f97316;
          --orange-light: rgba(251, 146, 60, 0.15);
          --green: #22c55e;
          --green-bg: rgba(34, 197, 94, 0.15);
          --magenta: #e879f9;
          --magenta-hover: #d946ef;
          --border: #3a3a3f;
          --shadow-sm: rgba(0, 0, 0, 0.4);
          --shadow-md: rgba(0, 0, 0, 0.5);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .app {
          display: flex;
          min-height: 100vh;
        }

        /* SIDEBAR */
        .sidebar {
          width: 260px;
          background: var(--bg-sidebar);
          padding: 1.5rem 0;
          position: fixed;
          height: 100vh;
          overflow-y: auto;
          border-right: 1px solid var(--border);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 1.5rem;
          margin-bottom: 2rem;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.875rem;
          color: #1a1a1a;
        }

        .logo-text {
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--text-sidebar);
        }

        .nav-item {
          padding: 0.75rem 1.5rem;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9375rem;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 8px;
          margin: 0 0.75rem;
          padding-left: 0.75rem;
        }

        /* MAIN CONTENT */
        .main-content {
          flex: 1;
          margin-left: 260px;
          background: var(--bg-primary);
        }

        /* HEADER */
        .header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-add-widget {
          background: var(--magenta);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          box-shadow: 0 2px 8px rgba(217, 70, 239, 0.3);
        }

        .btn-add-widget:hover {
          background: var(--magenta-hover);
          transform: translateY(-1px);
        }

        /* THEME TOGGLE */
        .theme-toggle {
          position: relative;
          width: 56px;
          height: 28px;
          background: var(--border);
          border-radius: 100px;
          border: none;
          cursor: pointer;
          box-shadow: inset 0 2px 4px var(--shadow-sm);
        }

        .theme-toggle:hover {
          transform: scale(1.05);
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, var(--orange) 0%, var(--orange-hover) 100%);
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(251, 146, 60, 0.5);
        }

        .theme-toggle[data-theme="dark"] .toggle-slider {
          transform: translateX(28px);
        }

        .toggle-icon {
          width: 14px;
          height: 14px;
          color: white;
          transition: all 0.3s ease;
        }

        .toggle-icon.sun {
          opacity: 1;
          transform: rotate(0deg);
        }

        .toggle-icon.moon {
          position: absolute;
          opacity: 0;
          transform: rotate(180deg);
        }

        .theme-toggle[data-theme="dark"] .toggle-icon.sun {
          opacity: 0;
          transform: rotate(-180deg);
        }

        .theme-toggle[data-theme="dark"] .toggle-icon.moon {
          opacity: 1;
          transform: rotate(0deg);
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--orange) 0%, var(--orange-hover) 100%);
          color: white;
          cursor: pointer;
          position: relative;
          box-shadow: 0 2px 8px rgba(251, 146, 60, 0.3);
        }

        .profile {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--green);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          cursor: pointer;
        }

        /* CONTENT */
        .content {
          padding: 2rem;
        }

        .section-header {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .section-subtitle {
          color: var(--text-secondary);
        }

        /* CUSTOMIZE CARD */
        .customize-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px var(--shadow-sm);
        }

        .customize-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .studio-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--bg-hover);
          border-radius: 8px;
        }

        .link-url {
          flex: 1;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .btn-copy {
          background: var(--magenta);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(217, 70, 239, 0.3);
        }

        .btn-copy:hover {
          background: var(--magenta-hover);
        }

        .btn-outline {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .btn-outline:hover {
          background: var(--bg-hover);
        }

        /* STATS GRID */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          box-shadow: 0 1px 3px var(--shadow-sm);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px var(--shadow-md);
        }

        .stat-card.dark {
          background: var(--bg-card-secondary);
        }

        :root[data-theme="dark"] .stat-card.dark {
          background: linear-gradient(135deg, #3a3a3f 0%, #27272a 100%);
          border-color: rgba(255, 255, 255, 0.05);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-value.orange {
          color: var(--orange);
        }

        /* CHART CARD */
        .chart-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px var(--shadow-sm);
        }

        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
        }

        .chart-placeholder {
          width: 100%;
          height: 250px;
          background: var(--bg-hover);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
        }

        .no-data {
          text-align: center;
          color: var(--text-tertiary);
          padding: 3rem;
          font-size: 0.875rem;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        @keyframes fadeIn {
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
          animation: fadeIn 0.5s ease forwards;
        }
      `}</style>

      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">IF.</div>
            <div className="logo-text">InkFlow</div>
          </div>
          <nav>
            <div className="nav-item active">📊 Vue d'ensemble</div>
            <div className="nav-item">📈 Statistiques</div>
            <div className="nav-item">📝 Demandes</div>
            <div className="nav-item">📅 Rendez-vous</div>
            <div className="nav-item">⚡ Galerie Flash</div>
            <div className="nav-item">👥 Clients</div>
            <div className="nav-item">💬 Messagerie</div>
            <div className="nav-item">🎨 Portfolio</div>
            <div className="nav-item">💰 Finance</div>
            <div className="nav-item">🤖 Assistant IA</div>
            <div className="nav-item">⚙️ Paramètres</div>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="main-content">
          <header className="header">
            <h1 className="header-title">Vue d'ensemble</h1>
            
            <div className="header-actions">
              <button className="btn-add-widget">
                <Grid size={16} />
                Ajouter un widget
              </button>

              <button 
                className="theme-toggle" 
                onClick={toggleTheme}
                data-theme={theme}
              >
                <div className="toggle-slider">
                  <Sun className="toggle-icon sun" />
                  <Moon className="toggle-icon moon" />
                </div>
              </button>

              <div className="notification-icon">
                <Bell size={20} />
              </div>

              <div className="profile">N</div>
            </div>
          </header>

          <main className="content">
            {/* Customize Section */}
            <div className="customize-card animate-in">
              <div className="customize-header">
                <span>🎨</span>
                <span>Personnaliser l'apparence</span>
              </div>
              <div className="studio-link">
                <span style={{ fontSize: '1.25rem' }}>🔗</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Lien de votre vitrine
                </span>
                <span className="link-url">http://localhost:3000/studio/mon-studio</span>
                <button className="btn-copy">Copier le lien</button>
                <button className="btn-outline">Ouvrir</button>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="stat-label">RDV aujourd'hui</div>
                <div className="stat-value">0</div>
              </div>
              <div className="stat-card dark animate-in" style={{ animationDelay: '0.2s' }}>
                <div className="stat-label">Revenus totaux</div>
                <div className="stat-value">0€</div>
              </div>
              <div className="stat-card animate-in" style={{ animationDelay: '0.3s' }}>
                <div className="stat-label">Acomptes en attente</div>
                <div className="stat-value orange">0€</div>
              </div>
            </div>

            {/* Charts */}
            <div className="chart-card animate-in" style={{ animationDelay: '0.4s' }}>
              <h2 className="chart-title">Évolution du revenu (6 mois)</h2>
              <div className="chart-placeholder">
                <div className="no-data">
                  <TrendingUp size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <div>Aucun RDV pour le moment</div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="chart-card animate-in" style={{ animationDelay: '0.5s' }}>
              <h2 className="chart-title">✨ Mode sombre amélioré</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                J'ai corrigé le problème ! Le nouveau mode sombre utilise des tons de gris chauds 
                (#27272a) au lieu de blanc pur, créant un effet beaucoup plus harmonieux et élégant. 
                Les couleurs d'accent (orange, magenta) sont plus vives pour mieux ressortir.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
