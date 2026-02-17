import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function InkFlowDashboardWithTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('inkflow-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inkflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* ========== VARIABLES DE THÈME ========== */
        :root[data-theme="light"] {
          /* Backgrounds */
          --bg-primary: #f8f9fa;
          --bg-secondary: #ffffff;
          --bg-sidebar: #ffffff;
          --bg-card: #ffffff;
          --bg-card-dark: #1a1a1a;
          --bg-hover: #f5f5f5;
          
          /* Text */
          --text-primary: #1a1a1a;
          --text-secondary: #6b7280;
          --text-tertiary: #9ca3af;
          --text-on-dark: #ffffff;
          
          /* Accents (vos couleurs actuelles) */
          --orange: #ff8c00;
          --orange-hover: #ff7700;
          --orange-light: #fff4e6;
          --green: #10b981;
          --green-bg: #d1fae5;
          --blue: #6366f1;
          --blue-hover: #4f46e5;
          
          /* Borders & Shadows */
          --border: #e5e7eb;
          --border-light: #f3f4f6;
          --shadow-sm: rgba(0, 0, 0, 0.05);
          --shadow-md: rgba(0, 0, 0, 0.1);
          --shadow-lg: rgba(0, 0, 0, 0.15);
          
          /* Charts */
          --chart-grid: #e5e7eb;
          --chart-text: #6b7280;
        }

        :root[data-theme="dark"] {
          /* Backgrounds */
          --bg-primary: #0f1113;
          --bg-secondary: #18191b;
          --bg-sidebar: #18191b;
          --bg-card: #1e2023;
          --bg-card-dark: #2a2d31;
          --bg-hover: #2a2d31;
          
          /* Text */
          --text-primary: #f9fafb;
          --text-secondary: #d1d5db;
          --text-tertiary: #9ca3af;
          --text-on-dark: #f9fafb;
          
          /* Accents (gardent les mêmes couleurs vives) */
          --orange: #ff9500;
          --orange-hover: #ffa31a;
          --orange-light: #2d2416;
          --green: #10b981;
          --green-bg: #134e3a;
          --blue: #6366f1;
          --blue-hover: #7c3aed;
          
          /* Borders & Shadows */
          --border: #2d3035;
          --border-light: #252729;
          --shadow-sm: rgba(0, 0, 0, 0.3);
          --shadow-md: rgba(0, 0, 0, 0.4);
          --shadow-lg: rgba(0, 0, 0, 0.5);
          
          /* Charts */
          --chart-grid: #2d3035;
          --chart-text: #9ca3af;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .app {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        /* ========== SIDEBAR ========== */
        .sidebar {
          width: 230px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border);
          padding: 1.5rem 0;
          transition: background-color 0.3s ease, border-color 0.3s ease;
          position: fixed;
          height: 100vh;
          overflow-y: auto;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 1.5rem;
          margin-bottom: 2rem;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: var(--text-primary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--bg-sidebar);
          font-weight: 700;
          font-size: 0.875rem;
          transition: background-color 0.3s ease;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-name {
          font-weight: 700;
          font-size: 1.125rem;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }

        .logo-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          transition: color 0.3s ease;
        }

        .nav-menu {
          list-style: none;
        }

        .nav-item {
          padding: 0.625rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9375rem;
          position: relative;
        }

        .nav-item:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--text-primary);
          color: var(--bg-sidebar);
          border-radius: 8px;
          margin: 0 0.75rem;
          padding-left: 0.75rem;
        }

        .nav-item.active .nav-icon {
          color: var(--bg-sidebar);
        }

        .nav-badge {
          margin-left: auto;
          background: var(--orange);
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .nav-icon {
          width: 20px;
          height: 20px;
          color: var(--text-secondary);
          transition: color 0.2s ease;
        }

        /* ========== MAIN CONTENT ========== */
        .main-content {
          flex: 1;
          margin-left: 230px;
          background: var(--bg-primary);
          transition: background-color 0.3s ease;
        }

        /* ========== HEADER ========== */
        .header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* ========== THEME TOGGLE BUTTON ========== */
        .theme-toggle {
          position: relative;
          width: 56px;
          height: 28px;
          background: var(--border);
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px var(--shadow-sm);
        }

        .theme-toggle:hover {
          background: var(--border-light);
          transform: scale(1.05);
        }

        .theme-toggle:active {
          transform: scale(0.98);
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          background: var(--orange);
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(255, 140, 0, 0.4);
        }

        .theme-toggle[data-theme="dark"] .toggle-slider {
          transform: translateX(28px);
          box-shadow: 0 2px 6px rgba(255, 149, 0, 0.5);
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

        .add-widget-btn {
          background: var(--blue);
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
          transition: all 0.2s ease;
        }

        .add-widget-btn:hover {
          background: var(--blue-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .notification-icon, .profile-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .notification-icon {
          background: var(--bg-hover);
          color: var(--text-secondary);
        }

        .notification-icon:hover {
          background: var(--border);
        }

        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid var(--bg-secondary);
          transition: border-color 0.3s ease;
        }

        .profile-icon {
          background: #10b981;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        /* ========== CONTENT AREA ========== */
        .content {
          padding: 2rem;
        }

        .customize-section {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }

        .customize-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          transition: color 0.3s ease;
        }

        .studio-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-hover);
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .link-icon {
          width: 24px;
          height: 24px;
          color: var(--blue);
        }

        .link-text {
          color: var(--text-secondary);
          font-size: 0.875rem;
          transition: color 0.3s ease;
        }

        .link-url {
          flex: 1;
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: color 0.3s ease;
        }

        .copy-btn, .open-btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .copy-btn {
          background: var(--blue);
          color: white;
        }

        .copy-btn:hover {
          background: var(--blue-hover);
          transform: translateY(-1px);
        }

        .open-btn {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .open-btn:hover {
          background: var(--bg-hover);
        }

        /* ========== STATS GRID ========== */
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
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px var(--shadow-md);
        }

        .stat-card.dark {
          background: var(--bg-card-dark);
          color: var(--text-on-dark);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          transition: color 0.3s ease;
        }

        .stat-card.dark .stat-label {
          color: var(--text-tertiary);
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }

        .stat-card.dark .stat-value {
          color: var(--text-on-dark);
        }

        .stat-value.orange {
          color: var(--orange);
        }

        /* ========== CHARTS SECTION ========== */
        .charts-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .chart-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          transition: color 0.3s ease;
        }

        .chart-placeholder {
          width: 100%;
          height: 200px;
          background: var(--bg-hover);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          font-size: 0.875rem;
          transition: background-color 0.3s ease;
        }

        /* ========== BOTTOM SECTION ========== */
        .bottom-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.5rem;
        }

        .appointments-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .appointment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--bg-hover);
          border-radius: 8px;
          margin-bottom: 0.75rem;
          transition: all 0.3s ease;
        }

        .appointment-item:hover {
          background: var(--border-light);
          transform: translateX(4px);
        }

        .appointment-info h4 {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
          transition: color 0.3s ease;
        }

        .appointment-info p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          transition: color 0.3s ease;
        }

        .status-badge {
          background: var(--green-bg);
          color: var(--green);
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        /* ========== TOP CLIENTS ========== */
        .top-clients-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .client-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-light);
          transition: all 0.3s ease;
        }

        .client-item:last-child {
          border-bottom: none;
        }

        .client-name {
          font-weight: 500;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }

        .client-amount {
          font-weight: 600;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }

        .client-bar {
          height: 4px;
          background: var(--text-primary);
          border-radius: 2px;
          margin-top: 0.5rem;
          transition: background-color 0.3s ease;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .charts-grid, .bottom-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">IF.</div>
          <div className="logo-text">
            <div className="logo-name">InkFlow</div>
            <div className="logo-subtitle">Ink & Art Studio</div>
          </div>
        </div>

        <nav>
          <ul className="nav-menu">
            <li className="nav-item active">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Vue d'ensemble
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statistiques
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Demandes
              <span className="nav-badge">1</span>
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Rendez-vous
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Galerie Flash
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Clients
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messagerie
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Portfolio
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Finance
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Assistant IA
            </li>
            <li className="nav-item">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Paramètres
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <h1 className="header-title">Vue d'ensemble</h1>
          
          <div className="header-actions">
            <button className="add-widget-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un widget
            </button>

            {/* THEME TOGGLE BUTTON */}
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              data-theme={theme}
              aria-label="Toggle theme"
            >
              <div className="toggle-slider">
                <Sun className="toggle-icon sun" />
                <Moon className="toggle-icon moon" />
              </div>
            </button>

            <div className="notification-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="notification-badge"></div>
            </div>

            <div className="profile-icon">AM</div>
          </div>
        </header>

        {/* Content */}
        <div className="content">
          {/* Customize Section */}
          <div className="customize-section">
            <div className="customize-header">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>Personnaliser l'apparence</span>
            </div>
            <div className="studio-link">
              <svg className="link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="link-text">Lien de votre vitrine</span>
              <span className="link-url">http://localhost:3000/studio/ink-art-studio</span>
              <button className="copy-btn">Copier le lien</button>
              <button className="open-btn">Ouvrir</button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">RDV aujourd'hui</div>
              <div className="stat-value">0</div>
            </div>
            <div className="stat-card dark">
              <div className="stat-label">Revenus totaux</div>
              <div className="stat-value">0€</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Acomptes en attente</div>
              <div className="stat-value orange">0€</div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Évolution du revenu (6 mois)</h3>
              <div className="chart-placeholder">Graphique ici</div>
            </div>
            <div className="chart-card">
              <h3 className="chart-title">Répartition RDV</h3>
              <div className="chart-placeholder">Donut chart ici</div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="bottom-grid">
            <div className="appointments-card">
              <div className="card-header">
                <h3 className="chart-title">Prochains rendez-vous</h3>
              </div>
              <div className="appointment-item">
                <div className="appointment-info">
                  <h4>Lucas Martin</h4>
                  <p>Bras Japonais - Carpe Koï • 2025-02-14 14:00</p>
                </div>
                <div className="status-badge">Confirmé</div>
              </div>
              <div className="appointment-item">
                <div className="appointment-info">
                  <h4>Sophie Dubois</h4>
                  <p>Flash #04 - Lune • 2025-02-15 11:00</p>
                </div>
                <div className="status-badge">Confirmé</div>
              </div>
            </div>

            <div className="top-clients-card">
              <h3 className="chart-title">🏆 Top 5 clients</h3>
              <div className="client-item">
                <span className="client-name">Lucas Martin</span>
                <span className="client-amount">850€</span>
              </div>
              <div className="client-bar" style={{width: '100%'}}></div>
              <div className="client-item">
                <span className="client-name">Sophie Dubois</span>
                <span className="client-amount">320€</span>
              </div>
              <div className="client-bar" style={{width: '38%'}}></div>
              <div className="client-item">
                <span className="client-name">Thomas Bernard</span>
                <span className="client-amount">180€</span>
              </div>
              <div className="client-bar" style={{width: '21%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
