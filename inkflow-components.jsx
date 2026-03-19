/**
 * INKFLOW — Composants MVP Mobile-First
 * Stack: React 18 + Tailwind CSS
 * DA: Dark Premium, Ocre/Cuivre (#c9a96e), fond #0d0d0d
 *
 * INDEX:
 * 1. BottomNavBar       — Navigation fixe native-like
 * 2. BottomDrawer       — Formulaires en sheet (remplace les modals)
 * 3. QuickAddClient     — CRM 3 champs zéro friction
 * 4. AppShell           — Layout racine mobile-first
 * 5. ClientCard         — Fiche client compacte
 * 6. BookingSlot        — Créneau agenda tactile
 */

import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────
// DESIGN TOKENS (à centraliser dans tailwind.config.js)
// ─────────────────────────────────────────────
// extend.colors:
// ink-bg:      '#0d0d0d'
// ink-surface: '#161616'
// ink-border:  '#2a2a2a'
// ink-text:    '#e8e3dc'
// ink-muted:   '#6b6b6b'
// ink-accent:  '#c9a96e'


// ─────────────────────────────────────────────
// 1. BOTTOM NAV BAR
// ─────────────────────────────────────────────
// Usage: <BottomNavBar activeTab="agenda" onChange={setTab} />

const NAV_ITEMS = [
  {
    id: "agenda",
    label: "Agenda",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "clients",
    label: "Clients",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    // CTA central — action rapide
    id: "add",
    label: "",
    icon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: "vitrine",
    label: "Ma Page",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Réglages",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function BottomNavBar({ activeTab, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: "rgba(13,13,13,0.92)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid #2a2a2a",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
        paddingTop: "8px",
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const isCTA = item.id === "add";

        if (isCTA) {
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex items-center justify-center rounded-full transition-transform active:scale-90"
              style={{
                width: 52,
                height: 52,
                background: "#c9a96e",
                color: "#0d0d0d",
                marginBottom: 8,
                boxShadow: "0 4px 20px rgba(201,169,110,0.35)",
              }}
              aria-label="Nouvelle action rapide"
            >
              {item.icon()}
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex flex-col items-center justify-center gap-1 transition-colors"
            style={{
              color: isActive ? "#c9a96e" : "#6b6b6b",
              minWidth: 48,
              paddingBottom: 2,
            }}
            aria-label={item.label}
          >
            {item.icon(isActive)}
            {item.label && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.02em",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}


// ─────────────────────────────────────────────
// 2. BOTTOM DRAWER (Bottom Sheet)
// ─────────────────────────────────────────────
// Usage: <BottomDrawer open={open} onClose={() => setOpen(false)} title="Nouveau client">...</BottomDrawer>

export function BottomDrawer({ open, onClose, title, children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{ background: "rgba(0,0,0,0.72)" }}
    >
      <div
        className="relative rounded-t-3xl flex flex-col"
        style={{
          background: "#161616",
          border: "1px solid #2a2a2a",
          borderBottom: "none",
          maxHeight: "90vh",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
          animation: "slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            style={{ width: 36, height: 4, borderRadius: 2, background: "#3a3a3a" }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid #2a2a2a" }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#e8e3dc",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-colors"
            style={{ width: 32, height: 32, background: "#2a2a2a", color: "#6b6b6b" }}
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4" style={{ flex: 1 }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}


// ─────────────────────────────────────────────
// 3. QUICK ADD CLIENT — CRM ZÉRO FRICTION
// ─────────────────────────────────────────────
// 3 champs max. Le reste se complète plus tard sur la fiche client.
// Usage: <QuickAddClient onSave={handleSave} onClose={handleClose} />

export function QuickAddClient({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", instagram: "", project: "" });
  const [loading, setLoading] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 300);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await onSave(form);
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#0d0d0d",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 16,
    color: "#e8e3dc",
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "system-ui, sans-serif",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "#6b6b6b",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Champ 1 — Nom */}
      <div>
        <label style={labelStyle}>Nom *</label>
        <input
          ref={nameRef}
          type="text"
          placeholder="Ex : Sophie Martin"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#c9a96e")}
          onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
          required
        />
      </div>

      {/* Champ 2 — Instagram */}
      <div>
        <label style={labelStyle}>Instagram</label>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b6b6b",
              fontSize: 16,
              pointerEvents: "none",
            }}
          >
            @
          </span>
          <input
            type="text"
            placeholder="sophiemartintattoo"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            style={{ ...inputStyle, paddingLeft: 32 }}
            onFocus={(e) => (e.target.style.borderColor = "#c9a96e")}
            onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
          />
        </div>
      </div>

      {/* Champ 3 — Projet */}
      <div>
        <label style={labelStyle}>Projet</label>
        <input
          type="text"
          placeholder="Ex : Dragon épaule droite — custom"
          value={form.project}
          onChange={(e) => setForm({ ...form, project: e.target.value })}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#c9a96e")}
          onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
        />
      </div>

      {/* Note discrète */}
      <p style={{ fontSize: 12, color: "#6b6b6b", marginTop: -8 }}>
        Tu pourras ajouter les zones du corps, photos de référence et acompte sur la fiche client.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !form.name.trim()}
        className="flex items-center justify-center gap-2 rounded-2xl transition-all active:scale-95"
        style={{
          width: "100%",
          padding: "16px",
          background: form.name.trim() ? "#c9a96e" : "#2a2a2a",
          color: form.name.trim() ? "#0d0d0d" : "#6b6b6b",
          fontSize: 16,
          fontWeight: 600,
          border: "none",
          cursor: form.name.trim() ? "pointer" : "not-allowed",
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {loading ? (
          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Créer le client
          </>
        )}
      </button>
    </form>
  );
}


// ─────────────────────────────────────────────
// 4. APP SHELL — Layout racine mobile-first
// ─────────────────────────────────────────────
// Place ce layout à la racine de ton app.

export function AppShell({ children }) {
  const [activeTab, setActiveTab] = useState("agenda");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabChange = (tab) => {
    if (tab === "add") {
      setDrawerOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div
      style={{
        background: "#0d0d0d",
        minHeight: "100dvh",
        color: "#e8e3dc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Page content — padding bottom = hauteur bottom nav */}
      <main
        style={{
          paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {children}
      </main>

      <BottomNavBar activeTab={activeTab} onChange={handleTabChange} />

      <BottomDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Nouveau client"
      >
        <QuickAddClient
          onSave={async (data) => {
            // Appel API ici : POST /api/clients
            console.log("Nouveau client :", data);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      </BottomDrawer>
    </div>
  );
}


// ─────────────────────────────────────────────
// 5. CLIENT CARD — Fiche client compacte (liste CRM)
// ─────────────────────────────────────────────

export function ClientCard({ client, onPress }) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusColors = {
    pending:    { bg: "#2a2200", text: "#c9a96e", label: "En attente" },
    confirmed:  { bg: "#0d2a1a", text: "#4ade80", label: "Confirmé" },
    completed:  { bg: "#1a1a2e", text: "#818cf8", label: "Terminé" },
    cancelled:  { bg: "#2a0d0d", text: "#f87171", label: "Annulé" },
  };

  const status = statusColors[client.status] || statusColors.pending;

  return (
    <button
      onClick={() => onPress?.(client)}
      className="w-full text-left transition-colors active:opacity-70"
      style={{
        background: "#161616",
        border: "1px solid #2a2a2a",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#2a2a2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 14,
          fontWeight: 700,
          color: "#c9a96e",
          letterSpacing: "0.02em",
        }}
      >
        {client.avatar ? (
          <img
            src={client.avatar}
            alt={client.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
          />
        ) : (
          initials
        )}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span
            style={{ fontSize: 15, fontWeight: 600, color: "#e8e3dc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {client.name}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: status.text,
              background: status.bg,
              borderRadius: 6,
              padding: "2px 8px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {status.label}
          </span>
        </div>
        {client.project && (
          <p
            style={{
              fontSize: 13,
              color: "#6b6b6b",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {client.project}
          </p>
        )}
        {client.instagram && (
          <p style={{ fontSize: 12, color: "#c9a96e", marginTop: 1 }}>@{client.instagram}</p>
        )}
      </div>

      {/* Chevron */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}


// ─────────────────────────────────────────────
// 6. BOOKING SLOT — Créneau agenda tactile
// ─────────────────────────────────────────────

export function BookingSlot({ slot, onPress }) {
  const isEmpty = !slot.client;

  return (
    <button
      onClick={() => onPress?.(slot)}
      className="w-full text-left transition-all active:scale-98"
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 12,
        minHeight: 64,
      }}
    >
      {/* Time column */}
      <div
        style={{
          width: 48,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          paddingTop: 2,
          gap: 2,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e3dc" }}>{slot.startTime}</span>
        <span style={{ fontSize: 11, color: "#6b6b6b" }}>{slot.endTime}</span>
      </div>

      {/* Accent bar */}
      <div
        style={{
          width: 3,
          borderRadius: 2,
          background: isEmpty ? "#2a2a2a" : "#c9a96e",
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          background: isEmpty ? "transparent" : "#161616",
          border: isEmpty ? "1px dashed #2a2a2a" : "1px solid #2a2a2a",
          borderRadius: 12,
          padding: isEmpty ? "12px 14px" : "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {isEmpty ? (
          <span style={{ fontSize: 13, color: "#3a3a3a" }}>Disponible</span>
        ) : (
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#e8e3dc" }}>{slot.client}</p>
            {slot.project && (
              <p style={{ fontSize: 12, color: "#6b6b6b", marginTop: 2 }}>{slot.project}</p>
            )}
          </div>
        )}
        {!isEmpty && slot.deposit && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#4ade80",
              background: "#0d2a1a",
              borderRadius: 8,
              padding: "4px 10px",
            }}
          >
            +{slot.deposit}€
          </span>
        )}
      </div>
    </button>
  );
}


// ─────────────────────────────────────────────
// DÉMO — Story complète
// ─────────────────────────────────────────────

const MOCK_CLIENTS = [
  { id: 1, name: "Sophie Martin", instagram: "sophiemtattoo", project: "Dragon épaule droite — custom", status: "confirmed" },
  { id: 2, name: "Lucas Ferreira", instagram: "lucasink", project: "Flash rose old school avant-bras", status: "pending" },
  { id: 3, name: "Inès Kowalski", instagram: "inesink_", project: "Portrait réaliste cuisse", status: "completed" },
];

const MOCK_SLOTS = [
  { id: 1, startTime: "10:00", endTime: "12:30", client: "Sophie Martin", project: "Dragon épaule droite", deposit: 80 },
  { id: 2, startTime: "12:30", endTime: "14:00", client: null },
  { id: 3, startTime: "14:00", endTime: "17:00", client: "Lucas Ferreira", project: "Flash rose old school", deposit: 50 },
  { id: 4, startTime: "17:00", endTime: "19:00", client: null },
];

export default function InkflowDemo() {
  const [activeTab, setActiveTab] = useState("agenda");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clients, setClients] = useState(MOCK_CLIENTS);

  const handleTabChange = (tab) => {
    if (tab === "add") { setDrawerOpen(true); return; }
    setActiveTab(tab);
  };

  const handleSaveClient = async (data) => {
    setClients((prev) => [
      ...prev,
      { id: Date.now(), ...data, status: "pending" },
    ]);
  };

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100dvh", color: "#e8e3dc", fontFamily: "system-ui, sans-serif" }}>
      <main style={{ paddingBottom: 80, paddingTop: 16 }}>

        {/* Header de section */}
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontSize: 12, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Jeudi 20 mars
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e8e3dc", letterSpacing: "-0.02em" }}>
            {activeTab === "agenda" ? "Agenda" : activeTab === "clients" ? "Clients" : "Ma Page"}
          </h1>
        </div>

        {activeTab === "agenda" && (
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK_SLOTS.map((slot) => (
              <BookingSlot key={slot.id} slot={slot} onPress={(s) => console.log("Slot sélectionné", s)} />
            ))}
          </div>
        )}

        {activeTab === "clients" && (
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} onPress={(c) => console.log("Client sélectionné", c)} />
            ))}
          </div>
        )}

        {activeTab === "vitrine" && (
          <div style={{ padding: "0 20px", textAlign: "center", paddingTop: 40 }}>
            <p style={{ color: "#6b6b6b" }}>Générateur de page vitrine — bientôt</p>
          </div>
        )}

      </main>

      <BottomNavBar activeTab={activeTab} onChange={handleTabChange} />

      <BottomDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Nouveau client">
        <QuickAddClient onSave={handleSaveClient} onClose={() => setDrawerOpen(false)} />
      </BottomDrawer>
    </div>
  );
}
