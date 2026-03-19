import { useState, useEffect } from "react";
import {
  Calendar, Clock, MapPin, Star, Instagram, ArrowLeft, Check,
  ChevronRight, Menu, X, MessageCircle, Users, CreditCard,
  FileText, Settings, Bell, Plus, Sparkles, Shield, Zap,
  Home, TrendingUp, User, ChevronLeft
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS  (source-of-truth — change here, propagates everywhere)
───────────────────────────────────────────────────────────────── */
const T = {
  // Backgrounds
  bgBase:    "#07070a",
  bgSurface: "rgba(255,255,255,0.035)",
  bgSurfaceHover: "rgba(255,255,255,0.055)",
  bgRaised:  "rgba(255,255,255,0.06)",
  // Borders
  border:    "rgba(255,255,255,0.08)",
  borderHover:"rgba(255,255,255,0.16)",
  borderFocus:"rgba(255,255,255,0.30)",
  // Text
  textPrimary:"#f4f4f5",
  textSecondary:"#a1a1aa",
  textMuted:  "#52525b",
  // Accent (blanc premium)
  accent:    "#ffffff",
  accentFg:  "#000000",
  // Status
  emerald:   "#34d399",
  emeraldBg: "rgba(52,211,153,0.12)",
  amber:     "#fbbf24",
  amberBg:   "rgba(251,191,36,0.12)",
  blue:      "#60a5fa",
  blueBg:    "rgba(96,165,250,0.12)",
  violet:    "#a78bfa",
  violetBg:  "rgba(167,139,250,0.12)",
  // Radius
  radiusSm:  "10px",
  radiusMd:  "14px",
  radiusLg:  "20px",
  radiusXl:  "24px",
  radiusFull:"9999px",
  // Shadows
  shadowSm:  "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
  shadowMd:  "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
  shadowLg:  "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)",
  shadowGlow:"0 0 24px rgba(255,255,255,0.06)",
};

/* ── Inject Google Fonts + Global CSS ─────────────────────────── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
    body { background: ${T.bgBase}; }
    .ink-root { font-family: 'Inter', system-ui, sans-serif; color: ${T.textPrimary}; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
    .glass {
      background: ${T.bgSurface};
      border: 1px solid ${T.border};
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .glass-hover:hover {
      background: ${T.bgSurfaceHover};
      border-color: ${T.borderHover};
    }
    .gradient-border {
      border: 1px solid transparent;
      background-clip: padding-box;
      position: relative;
    }
    .gradient-border::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.03));
      z-index: -1;
    }
    .glow-dot::before {
      content: '';
      width: 6px; height: 6px;
      border-radius: 50%;
      background: ${T.emerald};
      box-shadow: 0 0 8px ${T.emerald};
      display: inline-block;
      margin-right: 6px;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%,100% { opacity:1; box-shadow: 0 0 8px ${T.emerald}; }
      50%      { opacity:.6; box-shadow: 0 0 16px ${T.emerald}; }
    }
    @keyframes fadeUp {
      from { opacity:0; transform: translateY(8px); }
      to   { opacity:1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp 0.25s ease forwards; }
    .tab-active {
      background: ${T.bgRaised};
      border-color: ${T.borderHover} !important;
      color: ${T.textPrimary} !important;
    }
  `}</style>
);

/* ── MOCK DATA ──────────────────────────────────────────────────── */
const STUDIO = {
  name:"Encre & Âme",
  tagline:"Tatouage sur mesure · Paris 11ème",
  rating:4.9, reviews:47,
  instagram:"@encre.ame",
  address:"42 rue de la Roquette, Paris 11",
  styles:["Blackwork","Fine Line","Géométrique"],
};
const FLASH = [
  {id:1,name:"Serpent géo",price:150,size:"5×5cm",
   grad:"linear-gradient(135deg,#1a0533,#0d0d1a)"},
  {id:2,name:"Rose noire",price:120,size:"4×4cm",
   grad:"linear-gradient(135deg,#0d1a0d,#1a1a0d)"},
  {id:3,name:"Phases de lune",price:200,size:"8×3cm",
   grad:"linear-gradient(135deg,#00111a,#0d0020)"},
  {id:4,name:"Papillon",price:130,size:"5×3cm",
   grad:"linear-gradient(135deg,#1a0d00,#0d001a)"},
];
const RDV = [
  {id:1,client:"Sophie M.",   date:"Aujourd'hui",time:"14h00",type:"Flash", acompte:50, status:"confirmed"},
  {id:2,client:"Lucas B.",    date:"Demain",     time:"10h30",type:"Projet",acompte:100,status:"pending"},
  {id:3,client:"Amélie T.",   date:"Ven 21 mars",time:"16h00",type:"Flash", acompte:60, status:"confirmed"},
  {id:4,client:"Marc D.",     date:"Sam 22 mars",time:"11h00",type:"Projet",acompte:150,status:"confirmed"},
  {id:5,client:"Chloé R.",    date:"Lun 24 mars",time:"09h30",type:"Flash", acompte:80, status:"pending"},
];
const MESSAGES = [
  {id:1,from:"Sarah K.",preview:"Est-ce que votre flash serpent est encore...",time:"11h23",unread:true},
  {id:2,from:"Théo W.", preview:"Merci pour le tatouage, je suis vraiment...",time:"09h10",unread:false},
  {id:3,from:"Nina P.", preview:"Il reste des créneaux pour avril ?",          time:"Hier", unread:true},
];
const CAL_DAYS = [
  [null,null,null,null,null,1,2],
  [3,4,5,6,7,8,9],
  [10,11,12,13,14,15,16],
  [17,18,"19",20,21,22,23],
  [24,25,26,27,28,29,30],
];
const SLOTS = ["09:00","10:00","11:00","14:00","15:00","16:00","17:00"];
const BOOKED = ["10:00","15:00"];

/* ── ATOMS ──────────────────────────────────────────────────────── */

function Badge({ children, color="default" }) {
  const map = {
    confirmed: { bg:T.emeraldBg,  text:T.emerald,  dot:T.emerald  },
    pending:   { bg:T.amberBg,    text:T.amber,    dot:T.amber    },
    flash:     { bg:T.violetBg,   text:T.violet,   dot:null       },
    default:   { bg:T.bgRaised,   text:T.textSecondary, dot:null  },
  };
  const c = map[color] || map.default;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"2px 8px", borderRadius:T.radiusFull,
      background:c.bg, color:c.text,
      fontSize:11, fontWeight:600, letterSpacing:".01em",
      border:`1px solid ${c.text}22`,
    }}>
      {c.dot && <span style={{
        width:5,height:5,borderRadius:"50%",
        background:c.dot,
        boxShadow:`0 0 6px ${c.dot}`,
        flexShrink:0,
      }}/>}
      {children}
    </span>
  );
}

function Avatar({ name, size=36, ring=false }) {
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{
      width:size,height:size,
      borderRadius:"50%",
      background:"linear-gradient(135deg,#2a2a2a,#1a1a1a)",
      display:"flex",alignItems:"center",justifyContent:"center",
      flexShrink:0,
      fontSize:size*0.35, fontWeight:700, color:T.textSecondary,
      boxShadow: ring
        ? `0 0 0 2px ${T.bgBase}, 0 0 0 3px ${T.border}, ${T.shadowSm}`
        : T.shadowSm,
    }}>{initials}</div>
  );
}

function Divider() {
  return <div style={{height:1,background:T.border,margin:"0"}} />;
}

/* ── PHONE FRAME ────────────────────────────────────────────────── */
function PhoneFrame({ children }) {
  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"flex-start",padding:"32px 16px 40px"}}>
      <div style={{
        position:"relative",
        width:390,
        background:"linear-gradient(145deg,#2a2a2a,#1a1a1a)",
        borderRadius:52,
        padding:12,
        boxShadow:"0 0 0 1px #333, 0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}>
        {/* Side buttons */}
        <div style={{position:"absolute",right:-3,top:120,width:3,height:64,background:"#222",borderRadius:"0 3px 3px 0"}}/>
        <div style={{position:"absolute",left:-3,top:80,width:3,height:36,background:"#222",borderRadius:"3px 0 0 3px"}}/>
        <div style={{position:"absolute",left:-3,top:128,width:3,height:64,background:"#222",borderRadius:"3px 0 0 3px"}}/>
        {/* Screen */}
        <div style={{
          overflow:"hidden",
          borderRadius:42,
          background:T.bgBase,
          minHeight:720,
          position:"relative",
        }}>
          {/* Notch */}
          <div style={{
            position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
            width:120,height:32,
            background:"#0a0a0d",
            borderRadius:"0 0 20px 20px",
            zIndex:20,
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          }}>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#1a1a1a"}}/>
            <div style={{width:52,height:6,borderRadius:99,background:"#1a1a1a"}}/>
          </div>
          {children}
        </div>
        {/* Home bar */}
        <div style={{display:"flex",justifyContent:"center",paddingTop:8}}>
          <div style={{width:100,height:5,borderRadius:99,background:"#333"}}/>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   VIEW 1 — VITRINE PUBLIQUE
══════════════════════════════════════════════════════════════════ */
function VitrineView() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState(null);
  const [liked, setLiked] = useState({});

  return (
    <div className="ink-root" style={{overflowY:"auto",maxHeight:720,paddingTop:32}}>

      {/* ── Sticky nav ── */}
      <nav style={{
        position:"sticky",top:0,zIndex:30,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"12px 18px",
        background:"rgba(7,7,10,0.85)",
        backdropFilter:"blur(24px)",
        WebkitBackdropFilter:"blur(24px)",
        borderBottom:`1px solid ${T.border}`,
      }}>
        <Avatar name="Encre Âme" size={30}/>
        <span style={{fontSize:13,fontWeight:700,letterSpacing:"-.01em",color:T.textPrimary}}>
          Encre & Âme
        </span>
        <button onClick={()=>setMenuOpen(!menuOpen)}
                style={{background:"none",border:"none",cursor:"pointer",color:T.textSecondary,padding:4}}>
          {menuOpen ? <X size={18}/> : <Menu size={18}/>}
        </button>
      </nav>

      {/* ── Menu overlay ── */}
      {menuOpen && (
        <div className="fade-up" style={{
          position:"absolute",inset:0,zIndex:25,
          background:"rgba(7,7,10,0.97)",
          backdropFilter:"blur(40px)",
          display:"flex",flexDirection:"column",
          padding:"80px 24px 40px",
        }}>
          {["Flash disponibles","Portfolio","À propos","Contact"].map((item,i)=>(
            <button key={item} onClick={()=>setMenuOpen(false)}
                    style={{
                      background:"none",border:"none",
                      borderBottom:`1px solid ${T.border}`,
                      padding:"18px 0",
                      fontSize:20,fontWeight:700,
                      color:T.textPrimary,textAlign:"left",cursor:"pointer",
                      opacity:1, letterSpacing:"-.02em",
                    }}>
              {item}
            </button>
          ))}
          <button onClick={()=>setMenuOpen(false)}
                  style={{
                    marginTop:32,padding:"16px",borderRadius:T.radiusLg,
                    background:T.accent,color:T.accentFg,
                    border:"none",fontSize:16,fontWeight:800,cursor:"pointer",
                    boxShadow:"0 4px 20px rgba(255,255,255,0.15)",
                    letterSpacing:"-.01em",
                  }}>
            Réserver un RDV
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{
        position:"relative",
        padding:"8px 20px 32px",
        overflow:"hidden",
      }}>
        {/* Mesh gradient bg */}
        <div style={{
          position:"absolute",inset:0,
          background:`
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(120,60,220,.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 80%, rgba(60,120,220,.12) 0%, transparent 60%),
            radial-gradient(ellipse 100% 100% at 50% 50%, rgba(255,255,255,.02) 0%, transparent 70%)
          `,
          zIndex:0,
        }}/>
        {/* Noise grain overlay */}
        <div style={{
          position:"absolute",inset:0,
          backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity:.4,zIndex:1,
        }}/>

        <div style={{position:"relative",zIndex:2}}>
          {/* Avatar avec gradient ring */}
          <div style={{
            display:"inline-block",
            padding:2,
            borderRadius:"50%",
            background:"linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.05))",
            marginBottom:16,marginTop:8,
          }}>
            <div style={{
              width:64,height:64,borderRadius:"50%",
              background:"linear-gradient(135deg,#2d1b4e,#1a1a2e)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,fontWeight:900,color:"rgba(255,255,255,0.8)",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.1)",
            }}>E</div>
          </div>

          <h1 style={{
            fontSize:32,fontWeight:900,lineHeight:1.05,
            letterSpacing:"-.04em",color:T.textPrimary,marginBottom:6,
          }}>Encre & Âme</h1>

          <p style={{fontSize:13,color:T.textSecondary,marginBottom:14,fontWeight:400}}>
            Tatouage sur mesure · Paris 11ème
          </p>

          {/* Rating pill */}
          <div style={{
            display:"inline-flex",alignItems:"center",gap:6,
            padding:"5px 10px",borderRadius:T.radiusFull,
            background:T.bgSurface,border:`1px solid ${T.border}`,
            marginBottom:16,
          }}>
            <div style={{display:"flex",gap:1}}>
              {[1,2,3,4,5].map(i=>(
                <Star key={i} size={10} style={{fill:T.amber,color:T.amber}}/>
              ))}
            </div>
            <span style={{fontSize:12,fontWeight:700,color:T.textPrimary}}>4.9</span>
            <span style={{fontSize:11,color:T.textMuted}}>· 47 avis</span>
          </div>

          {/* Style tags */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
            {STUDIO.styles.map(s=>(
              <span key={s} style={{
                padding:"4px 10px",borderRadius:T.radiusFull,
                background:T.bgSurface,border:`1px solid ${T.border}`,
                fontSize:11,fontWeight:600,color:T.textSecondary,
                letterSpacing:".02em",
              }}>{s}</span>
            ))}
          </div>

          {/* CTAs */}
          <div style={{display:"flex",gap:8}}>
            <button style={{
              flex:1,padding:"14px",borderRadius:T.radiusLg,
              background:T.accent,color:T.accentFg,border:"none",
              fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:"-.01em",
              boxShadow:"0 4px 24px rgba(255,255,255,0.18)",
              transition:"all .15s",
            }}>Réserver un RDV</button>
            {[<Instagram size={16}/>,<MessageCircle size={16}/>].map((icon,i)=>(
              <button key={i} style={{
                padding:"14px 14px",borderRadius:T.radiusLg,
                background:T.bgSurface,border:`1px solid ${T.border}`,
                color:T.textSecondary,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all .15s",
              }}>{icon}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLASH SECTION ── */}
      <section style={{padding:"0 16px 24px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <span style={{fontSize:11,fontWeight:600,color:T.textMuted,letterSpacing:".06em",textTransform:"uppercase"}}>
              DISPONIBLES
            </span>
            <h2 style={{fontSize:16,fontWeight:800,letterSpacing:"-.02em",color:T.textPrimary,marginTop:1}}>
              Flash du moment ⚡
            </h2>
          </div>
          <button style={{
            display:"flex",alignItems:"center",gap:4,
            fontSize:12,fontWeight:600,color:T.textSecondary,
            background:"none",border:"none",cursor:"pointer",
          }}>
            Voir tout <ChevronRight size={12}/>
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {FLASH.map(f=>(
            <button key={f.id} onClick={()=>setSelectedFlash(f)}
                    style={{
                      borderRadius:T.radiusLg,overflow:"hidden",
                      background:T.bgSurface,border:`1px solid ${T.border}`,
                      textAlign:"left",cursor:"pointer",
                      transition:"all .2s",padding:0,
                      boxShadow:T.shadowSm,
                    }}>
              {/* Design placeholder */}
              <div style={{
                aspectRatio:"1",
                background:f.grad,
                display:"flex",alignItems:"center",justifyContent:"center",
                position:"relative",overflow:"hidden",
              }}>
                <span style={{fontSize:40,opacity:.18,userSelect:"none",fontWeight:900}}>✦</span>
                {/* like btn */}
                <button onClick={e=>{e.stopPropagation();setLiked(p=>({...p,[f.id]:!p[f.id]}))}}
                        style={{
                          position:"absolute",top:8,right:8,
                          width:28,height:28,borderRadius:"50%",
                          background:"rgba(7,7,10,0.6)",border:`1px solid ${T.border}`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          cursor:"pointer",fontSize:13,
                          backdropFilter:"blur(8px)",
                        }}>
                  {liked[f.id] ? "♥" : "♡"}
                </button>
              </div>
              <div style={{padding:"10px 12px 12px"}}>
                <p style={{fontSize:12,fontWeight:700,color:T.textPrimary,marginBottom:3,
                           overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {f.name}
                </p>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:T.textMuted}}>{f.size}</span>
                  <span style={{fontSize:13,fontWeight:800,color:T.textPrimary}}>{f.price}€</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── INFO STRIP ── */}
      <section style={{
        margin:"0 16px 24px",
        borderRadius:T.radiusLg,
        background:T.bgSurface,
        border:`1px solid ${T.border}`,
        overflow:"hidden",
      }}>
        {[
          {icon:<MapPin size={13}/>,   label:"Adresse",  value:STUDIO.address},
          {icon:<Clock size={13}/>,    label:"Horaires", value:"Mar–Sam · 10h–19h"},
          {icon:<Instagram size={13}/>,label:"Instagram",value:STUDIO.instagram},
        ].map((item,i,arr)=>(
          <div key={i}>
            <div style={{
              display:"flex",alignItems:"center",gap:10,
              padding:"12px 14px",
            }}>
              <div style={{
                width:28,height:28,borderRadius:8,
                background:T.bgRaised,border:`1px solid ${T.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:T.textSecondary,flexShrink:0,
              }}>{item.icon}</div>
              <div>
                <p style={{fontSize:10,color:T.textMuted,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase"}}>{item.label}</p>
                <p style={{fontSize:12,color:T.textPrimary,fontWeight:500}}>{item.value}</p>
              </div>
            </div>
            {i < arr.length-1 && <Divider/>}
          </div>
        ))}
      </section>

      {/* ── FLASH MODAL (bottom sheet) ── */}
      {selectedFlash && (
        <div className="fade-up" style={{
          position:"absolute",inset:0,zIndex:40,
          background:"rgba(0,0,0,0.75)",
          backdropFilter:"blur(12px)",
          display:"flex",alignItems:"flex-end",
        }}>
          <div style={{
            width:"100%",borderRadius:"24px 24px 0 0",
            padding:24,
            background:"rgba(14,14,18,0.98)",
            border:`1px solid ${T.border}`,
            borderBottom:"none",
            boxShadow:"0 -20px 60px rgba(0,0,0,0.6)",
          }}>
            <div style={{width:36,height:4,borderRadius:99,background:"rgba(255,255,255,0.12)",margin:"0 auto 24px"}}/>
            <div style={{display:"flex",gap:16,marginBottom:16}}>
              <div style={{
                width:80,height:80,borderRadius:T.radiusMd,flexShrink:0,
                background:selectedFlash.grad,
                display:"flex",alignItems:"center",justifyContent:"center",
                border:`1px solid ${T.border}`,
              }}>
                <span style={{fontSize:28,opacity:.2}}>✦</span>
              </div>
              <div>
                <h3 style={{fontSize:20,fontWeight:900,color:T.textPrimary,letterSpacing:"-.02em"}}>
                  {selectedFlash.name}
                </h3>
                <p style={{fontSize:12,color:T.textMuted,marginBottom:6}}>{selectedFlash.size}</p>
                <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <span style={{fontSize:28,fontWeight:900,color:T.textPrimary,letterSpacing:"-.04em"}}>
                    {selectedFlash.price}€
                  </span>
                  <span style={{fontSize:11,color:T.textMuted}}>· Acompte 30%</span>
                </div>
              </div>
            </div>
            <p style={{fontSize:13,color:T.textSecondary,lineHeight:1.5,marginBottom:20}}>
              Design disponible à la réservation. Un acompte de <strong style={{color:T.textPrimary}}>
              {Math.round(selectedFlash.price*0.3)}€</strong> est demandé pour sécuriser votre créneau.
            </p>
            <button style={{
              width:"100%",padding:16,borderRadius:T.radiusLg,
              background:T.accent,color:T.accentFg,border:"none",
              fontSize:15,fontWeight:800,cursor:"pointer",
              boxShadow:"0 4px 24px rgba(255,255,255,0.15)",
              letterSpacing:"-.01em",
            }}>
              Réserver ce flash · {Math.round(selectedFlash.price*0.3)}€
            </button>
            <button onClick={()=>setSelectedFlash(null)}
                    style={{
                      width:"100%",padding:"12px",marginTop:8,
                      background:"none",border:"none",
                      fontSize:13,color:T.textMuted,cursor:"pointer",
                    }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   VIEW 2 — BOOKING
══════════════════════════════════════════════════════════════════ */
function BookingView() {
  const [step, setStep]         = useState(1);
  const [bookType, setBookType] = useState(null);
  const [selDay,   setSelDay]   = useState(null);
  const [selSlot,  setSelSlot]  = useState(null);

  const canNext = (step===1&&bookType)||(step===2&&selDay&&selSlot)||step===3;

  const stepLabels = ["Type","Date & Heure","Paiement"];

  return (
    <div className="ink-root" style={{overflowY:"auto",maxHeight:720,paddingTop:32}}>

      {/* Header */}
      <div style={{
        position:"sticky",top:0,zIndex:10,
        padding:"12px 16px",
        background:"rgba(7,7,10,0.9)",
        backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${T.border}`,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <button style={{
            width:32,height:32,borderRadius:T.radiusSm,
            background:T.bgSurface,border:`1px solid ${T.border}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            color:T.textSecondary,cursor:"pointer",
          }} onClick={()=>step>1&&setStep(step-1)}>
            <ArrowLeft size={14}/>
          </button>
          <div style={{flex:1}}>
            <p style={{fontSize:10,color:T.textMuted,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase"}}>
              Encre & Âme
            </p>
            <p style={{fontSize:13,fontWeight:700,color:T.textPrimary,letterSpacing:"-.01em"}}>
              {stepLabels[step-1]}
            </p>
          </div>
          <span style={{
            padding:"3px 8px",borderRadius:T.radiusFull,
            background:T.bgSurface,border:`1px solid ${T.border}`,
            fontSize:10,fontWeight:700,color:T.textMuted,
          }}>{step}/3</span>
        </div>
        {/* Progress bar */}
        <div style={{height:2,background:T.bgRaised,borderRadius:99,overflow:"hidden"}}>
          <div style={{
            height:"100%",
            width:`${(step/3)*100}%`,
            background:`linear-gradient(90deg, ${T.accent}, rgba(255,255,255,0.6))`,
            borderRadius:99,
            transition:"width .4s cubic-bezier(.4,0,.2,1)",
          }}/>
        </div>
      </div>

      <div style={{padding:"20px 16px 24px"}}>

        {/* ── STEP 1 ── */}
        {step===1&&(
          <div className="fade-up">
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:"-.04em",color:T.textPrimary,marginBottom:4}}>
              Quel type de RDV ?
            </h2>
            <p style={{fontSize:13,color:T.textSecondary,marginBottom:20}}>
              Choisissez selon votre projet
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {[
                {key:"flash",emoji:"⚡",title:"Flash disponible",
                 desc:"Réservez un design prêt. Acompte immédiat en ligne.",price:"Dès 120€"},
                {key:"projet",emoji:"🎨",title:"Projet sur-mesure",
                 desc:"Envoyez votre idée. Réponse sous 24h.",price:"Devis gratuit"},
              ].map(opt=>(
                <button key={opt.key} onClick={()=>setBookType(opt.key)}
                        style={{
                          textAlign:"left",padding:16,cursor:"pointer",
                          borderRadius:T.radiusLg,
                          background: bookType===opt.key ? T.bgRaised : T.bgSurface,
                          border: `1px solid ${bookType===opt.key ? T.borderFocus : T.border}`,
                          transition:"all .2s",
                          boxShadow: bookType===opt.key ? T.shadowGlow : "none",
                        }}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <span style={{fontSize:24,lineHeight:1}}>{opt.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:14,fontWeight:700,color:T.textPrimary,letterSpacing:"-.01em"}}>
                          {opt.title}
                        </span>
                        {bookType===opt.key&&(
                          <div style={{
                            width:18,height:18,borderRadius:"50%",
                            background:T.accent,
                            display:"flex",alignItems:"center",justifyContent:"center",
                          }}>
                            <Check size={11} style={{color:T.accentFg}}/>
                          </div>
                        )}
                      </div>
                      <p style={{fontSize:12,color:T.textSecondary,lineHeight:1.4,marginBottom:8}}>
                        {opt.desc}
                      </p>
                      <span style={{
                        fontSize:10,fontWeight:700,letterSpacing:".03em",
                        color:T.textMuted,
                        padding:"3px 8px",borderRadius:T.radiusFull,
                        background:T.bgBase,border:`1px solid ${T.border}`,
                      }}>{opt.price}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step===2&&(
          <div className="fade-up">
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:"-.04em",color:T.textPrimary,marginBottom:4}}>
              Choisissez une date
            </h2>
            <p style={{fontSize:13,color:T.textSecondary,marginBottom:16}}>Mars 2026</p>

            {/* Calendar */}
            <div style={{
              borderRadius:T.radiusLg,
              background:T.bgSurface,border:`1px solid ${T.border}`,
              padding:16,marginBottom:16,
            }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <button style={{background:"none",border:"none",cursor:"pointer",color:T.textSecondary,padding:4}}>
                  <ChevronLeft size={16}/>
                </button>
                <span style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>Mars 2026</span>
                <button style={{background:"none",border:"none",cursor:"pointer",color:T.textSecondary,padding:4}}>
                  <ChevronRight size={16}/>
                </button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
                {["L","M","M","J","V","S","D"].map((d,i)=>(
                  <div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,
                                       color:T.textMuted,padding:"4px 0",letterSpacing:".04em"}}>
                    {d}
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                {CAL_DAYS.flat().map((day,i)=>{
                  const isToday = day==="19";
                  const isSel   = selDay===day;
                  const isEmpty = !day;
                  return (
                    <button key={i} onClick={()=>day&&setSelDay(day)}
                            disabled={isEmpty}
                            style={{
                              aspectRatio:"1",borderRadius:8,border:"none",cursor:isEmpty?"default":"pointer",
                              fontSize:12,fontWeight:isSel||isToday?700:500,
                              background: isSel ? T.accent :
                                          isToday ? "rgba(255,255,255,0.08)" : "transparent",
                              color: isSel ? T.accentFg :
                                     isToday ? T.textPrimary : T.textSecondary,
                              opacity: isEmpty ? 0 : 1,
                              pointerEvents: isEmpty?"none":"auto",
                              transition:"all .15s",
                              boxShadow: isSel ? "0 2px 8px rgba(255,255,255,0.2)" : "none",
                            }}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots */}
            {selDay&&(
              <div className="fade-up">
                <p style={{fontSize:11,fontWeight:700,color:T.textMuted,
                           letterSpacing:".05em",textTransform:"uppercase",marginBottom:10}}>
                  CRÉNEAUX DISPONIBLES
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                  {SLOTS.map(s=>{
                    const booked=BOOKED.includes(s);
                    const isSel=selSlot===s;
                    return (
                      <button key={s} onClick={()=>!booked&&setSelSlot(s)}
                              disabled={booked}
                              style={{
                                padding:"10px 6px",borderRadius:T.radiusMd,
                                fontSize:12,fontWeight:600,cursor:booked?"not-allowed":"pointer",
                                border:`1px solid ${isSel?T.borderFocus:T.border}`,
                                background: isSel ? T.accent : booked ? T.bgBase : T.bgSurface,
                                color: isSel ? T.accentFg : booked ? T.textMuted : T.textSecondary,
                                textDecoration: booked?"line-through":"none",
                                transition:"all .15s",
                                boxShadow: isSel ? "0 2px 8px rgba(255,255,255,0.15)" : "none",
                              }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step===3&&(
          <div className="fade-up">
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:"-.04em",color:T.textPrimary,marginBottom:4}}>
              Récapitulatif
            </h2>
            <p style={{fontSize:13,color:T.textSecondary,marginBottom:16}}>
              Vérifiez avant de confirmer
            </p>

            <div style={{
              borderRadius:T.radiusLg,
              background:T.bgSurface,border:`1px solid ${T.border}`,
              overflow:"hidden",marginBottom:16,
            }}>
              {[
                {label:"Studio",value:"Encre & Âme"},
                {label:"Type",  value:bookType==="flash"?"⚡ Flash":"🎨 Projet"},
                {label:"Date",  value:`${selDay||"—"} mars 2026`},
                {label:"Heure", value:selSlot||"—"},
              ].map(({label,value},i,arr)=>(
                <div key={label}>
                  <div style={{display:"flex",justifyContent:"space-between",
                               alignItems:"center",padding:"12px 16px"}}>
                    <span style={{fontSize:12,color:T.textMuted}}>{label}</span>
                    <span style={{fontSize:12,fontWeight:600,color:T.textPrimary}}>{value}</span>
                  </div>
                  {i<arr.length-1&&<Divider/>}
                </div>
              ))}
              <div style={{borderTop:`1px solid ${T.border}`,padding:"14px 16px",
                           background:T.bgRaised,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:600,color:T.textSecondary}}>Acompte à payer</span>
                <span style={{fontSize:20,fontWeight:900,color:T.textPrimary,letterSpacing:"-.03em"}}>50€</span>
              </div>
            </div>

            {/* Stripe mock */}
            <div style={{
              borderRadius:T.radiusLg,
              background:T.bgSurface,border:`1px solid ${T.border}`,
              padding:16,marginBottom:16,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                <Shield size={12} style={{color:T.emerald}}/>
                <span style={{fontSize:11,color:T.emerald,fontWeight:600}}>Paiement sécurisé · Stripe</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{
                  height:42,borderRadius:T.radiusMd,
                  background:T.bgBase,border:`1px solid ${T.border}`,
                  padding:"0 14px",display:"flex",alignItems:"center",
                }}>
                  <span style={{fontSize:12,color:T.textMuted}}>Numéro de carte</span>
                  <span style={{marginLeft:"auto",fontSize:16,color:T.textMuted,opacity:.4}}>💳</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  {["MM / AA","CVV"].map(ph=>(
                    <div key={ph} style={{
                      flex:1,height:42,borderRadius:T.radiusMd,
                      background:T.bgBase,border:`1px solid ${T.border}`,
                      padding:"0 14px",display:"flex",alignItems:"center",
                    }}>
                      <span style={{fontSize:12,color:T.textMuted}}>{ph}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={()=>step<3&&canNext?setStep(step+1):null}
          style={{
            width:"100%",padding:16,borderRadius:T.radiusLg,
            background: canNext ? T.accent : T.bgSurface,
            color: canNext ? T.accentFg : T.textMuted,
            border: `1px solid ${canNext ? "transparent" : T.border}`,
            fontSize:15,fontWeight:800,cursor:canNext?"pointer":"not-allowed",
            letterSpacing:"-.01em",transition:"all .2s",
            boxShadow: canNext ? "0 4px 24px rgba(255,255,255,0.18)" : "none",
          }}>
          {step===1?"Continuer →":step===2?"Confirmer la date →":"Payer 50€ · Stripe →"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   VIEW 3 — DASHBOARD INTERNE
══════════════════════════════════════════════════════════════════ */
const NAV = [
  {key:"home",     icon:<Home size={16}/>,           label:"Accueil"},
  {key:"rdv",      icon:<Calendar size={16}/>,        label:"Rendez-vous"},
  {key:"clients",  icon:<Users size={16}/>,           label:"Clients"},
  {key:"messages", icon:<MessageCircle size={16}/>,   label:"Messages",badge:2},
  {key:"acomptes", icon:<CreditCard size={16}/>,      label:"Acomptes"},
  {key:"vitrine",  icon:<Sparkles size={16}/>,        label:"Ma vitrine"},
  {key:"consent",  icon:<FileText size={16}/>,        label:"Consentements"},
  {key:"settings", icon:<Settings size={16}/>,        label:"Paramètres"},
];

const STATS_DATA = [
  {label:"RDV ce mois",     value:"12",   sub:"+3 cette semaine",  color:T.blue,   bg:T.blueBg,    icon:<Calendar size={14}/>},
  {label:"Acomptes reçus",  value:"840€", sub:"4 en attente",      color:T.emerald,bg:T.emeraldBg, icon:<CreditCard size={14}/>},
  {label:"Nouveaux clients",value:"5",    sub:"ce mois",           color:T.violet, bg:T.violetBg,  icon:<Users size={14}/>},
];

function DashboardView() {
  const [nav, setNav]   = useState("home");
  const [open, setOpen] = useState(true);

  return (
    <div className="ink-root" style={{
      display:"flex",height:"100vh",overflow:"hidden",
      background:T.bgBase,minHeight:640,
    }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        display:"flex",flexDirection:"column",
        width: open ? 224 : 56,
        transition:"width .2s cubic-bezier(.4,0,.2,1)",
        flexShrink:0,
        background:"rgba(10,10,14,0.98)",
        borderRight:`1px solid ${T.border}`,
        overflow:"hidden",
      }}>
        {/* Logo */}
        <div style={{
          display:"flex",alignItems:"center",gap:10,
          padding: open ? "20px 16px" : "20px 12px",
          borderBottom:`1px solid ${T.border}`,
        }}>
          <div style={{
            width:32,height:32,borderRadius:10,
            background:"linear-gradient(135deg,#fff,#ccc)",
            display:"flex",alignItems:"center",justifyContent:"center",
            flexShrink:0,
            boxShadow:"0 2px 8px rgba(255,255,255,0.15)",
          }}>
            <span style={{fontSize:13,fontWeight:900,color:"#000",fontFamily:"Inter,sans-serif"}}>I</span>
          </div>
          {open&&<span style={{fontSize:14,fontWeight:800,letterSpacing:"-.03em",color:T.textPrimary,
                               whiteSpace:"nowrap"}}>InkFlow</span>}
        </div>

        {/* Nav items */}
        <nav style={{flex:1,padding:"8px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {NAV.map(item=>{
            const isActive = nav===item.key;
            return (
              <button key={item.key} onClick={()=>setNav(item.key)}
                      style={{
                        display:"flex",alignItems:"center",gap:10,
                        padding: open ? "9px 10px" : "9px 10px",
                        borderRadius:T.radiusMd,border:"none",cursor:"pointer",
                        background: isActive ? T.bgRaised : "transparent",
                        color: isActive ? T.textPrimary : T.textMuted,
                        textAlign:"left",transition:"all .15s",
                        justifyContent: open ? "flex-start" : "center",
                        position:"relative",
                        boxShadow: isActive ? T.shadowSm : "none",
                        ...(isActive ? {borderLeft:`2px solid ${T.accent}`} : {borderLeft:"2px solid transparent"}),
                      }}>
                <span style={{flexShrink:0,opacity:isActive?1:0.7}}>{item.icon}</span>
                {open&&<span style={{fontSize:13,fontWeight:isActive?600:500,letterSpacing:"-.01em",flex:1,
                                     whiteSpace:"nowrap"}}>{item.label}</span>}
                {open&&item.badge&&(
                  <span style={{
                    minWidth:18,height:18,borderRadius:T.radiusFull,
                    background:T.bgRaised,border:`1px solid ${T.border}`,
                    fontSize:10,fontWeight:700,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:T.blue,
                    padding:"0 5px",
                  }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{padding:"8px",borderTop:`1px solid ${T.border}`}}>
          <div style={{
            display:"flex",alignItems:"center",gap:10,
            padding:"8px 10px",borderRadius:T.radiusMd,cursor:"pointer",
            transition:"all .15s",
          }}>
            <Avatar name="Encre Ame" size={28} ring/>
            {open&&(
              <div style={{minWidth:0}}>
                <p style={{fontSize:12,fontWeight:700,color:T.textPrimary,
                           overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                           letterSpacing:"-.01em"}}>
                  Encre & Âme
                </p>
                <p style={{fontSize:10,color:T.emerald,fontWeight:600}}>PRO</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>

        {/* Top bar */}
        <div style={{
          position:"sticky",top:0,zIndex:10,
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"14px 24px",
          background:"rgba(7,7,10,0.92)",
          backdropFilter:"blur(20px)",
          borderBottom:`1px solid ${T.border}`,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setOpen(!open)}
                    style={{
                      width:32,height:32,borderRadius:T.radiusSm,
                      background:T.bgSurface,border:`1px solid ${T.border}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:T.textSecondary,cursor:"pointer",
                    }}>
              <Menu size={14}/>
            </button>
            <div>
              <p style={{fontSize:10,color:T.textMuted,fontWeight:600,
                         letterSpacing:".05em",textTransform:"uppercase"}}>
                Jeudi 19 mars 2026
              </p>
              <p style={{fontSize:14,fontWeight:700,color:T.textPrimary,letterSpacing:"-.02em"}}>
                Tableau de bord
              </p>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button style={{
              position:"relative",width:34,height:34,borderRadius:T.radiusSm,
              background:T.bgSurface,border:`1px solid ${T.border}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              color:T.textSecondary,cursor:"pointer",
            }}>
              <Bell size={14}/>
              <span style={{
                position:"absolute",top:6,right:6,width:6,height:6,
                borderRadius:"50%",background:"#ef4444",
                boxShadow:"0 0 6px #ef4444",
              }}/>
            </button>
            <button style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"8px 14px",borderRadius:T.radiusMd,
              background:T.accent,color:T.accentFg,border:"none",
              fontSize:12,fontWeight:800,cursor:"pointer",
              letterSpacing:"-.01em",
              boxShadow:"0 2px 12px rgba(255,255,255,0.15)",
            }}>
              <Plus size={13}/> Nouveau RDV
            </button>
          </div>
        </div>

        <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:20}}>

          {/* ── HERO SECTION DU DASHBOARD ── */}
          <div style={{
            borderRadius:T.radiusXl,
            overflow:"hidden",
            position:"relative",
            border:`1px solid ${T.border}`,
            boxShadow:T.shadowLg,
          }}>
            {/* Mesh gradient background */}
            <div style={{
              position:"absolute",inset:0,
              background:`
                radial-gradient(ellipse 60% 80% at 10% 50%, rgba(100,50,200,.20) 0%, transparent 60%),
                radial-gradient(ellipse 50% 60% at 90% 20%, rgba(50,100,220,.15) 0%, transparent 50%),
                radial-gradient(ellipse 80% 100% at 50% 100%, rgba(0,0,0,.4) 0%, transparent 70%)
              `,
              zIndex:0,
            }}/>
            <div style={{
              position:"absolute",inset:0,
              background:"rgba(15,10,25,0.7)",
              zIndex:1,
            }}/>

            {/* Grid pattern */}
            <div style={{
              position:"absolute",inset:0,zIndex:2,
              backgroundImage:`
                linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)
              `,
              backgroundSize:"32px 32px",
            }}/>

            <div style={{position:"relative",zIndex:3,padding:28}}>
              <div style={{
                display:"flex",flexDirection:"column",gap:20,
              }}>
                {/* Top row */}
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
                  <div>
                    <div style={{
                      display:"inline-flex",alignItems:"center",
                      gap:6,padding:"3px 10px",borderRadius:T.radiusFull,
                      background:T.emeraldBg,border:`1px solid ${T.emerald}22`,
                      marginBottom:10,
                    }}>
                      <span className="glow-dot"/>
                      <span style={{fontSize:11,fontWeight:700,color:T.emerald,letterSpacing:".02em"}}>
                        En ligne
                      </span>
                    </div>
                    <h2 style={{
                      fontSize:26,fontWeight:900,letterSpacing:"-.05em",
                      color:T.textPrimary,marginBottom:6,lineHeight:1,
                    }}>
                      Bonjour,<br/>Encre & Âme 👋
                    </h2>
                    <p style={{fontSize:13,color:T.textSecondary,lineHeight:1.5}}>
                      Vous avez{" "}
                      <span style={{color:T.textPrimary,fontWeight:700}}>2 RDV aujourd'hui</span>
                      {" "}et{" "}
                      <span style={{color:T.amber,fontWeight:700}}>2 demandes en attente</span>.
                    </p>
                  </div>

                  {/* Quick action pills */}
                  <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                    {[
                      {icon:<Calendar size={12}/>,label:"Agenda"},
                      {icon:<Sparkles size={12}/>,label:"Vitrine"},
                      {icon:<TrendingUp size={12}/>,label:"Stats"},
                    ].map(a=>(
                      <button key={a.label} style={{
                        display:"flex",alignItems:"center",gap:6,
                        padding:"6px 12px",borderRadius:T.radiusMd,
                        background:T.bgSurface,border:`1px solid ${T.border}`,
                        color:T.textSecondary,fontSize:11,fontWeight:600,
                        cursor:"pointer",transition:"all .15s",letterSpacing:".01em",
                        backdropFilter:"blur(8px)",
                        whiteSpace:"nowrap",
                      }}>
                        {a.icon}{a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Today's RDV strip */}
                <div>
                  <p style={{fontSize:10,fontWeight:700,color:T.textMuted,
                             letterSpacing:".05em",textTransform:"uppercase",marginBottom:10}}>
                    AUJOURD'HUI
                  </p>
                  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
                    {RDV.slice(0,3).map(r=>(
                      <div key={r.id} style={{
                        flexShrink:0,display:"flex",alignItems:"center",gap:10,
                        padding:"10px 14px",borderRadius:T.radiusMd,
                        background:"rgba(255,255,255,0.05)",
                        border:`1px solid ${T.border}`,
                        backdropFilter:"blur(8px)",
                        minWidth:160,
                      }}>
                        <div style={{
                          width:3,height:36,borderRadius:99,
                          background: r.status==="confirmed" ? T.emerald : T.amber,
                          boxShadow: `0 0 8px ${r.status==="confirmed"?T.emerald:T.amber}`,
                          flexShrink:0,
                        }}/>
                        <div>
                          <p style={{fontSize:12,fontWeight:700,color:T.textPrimary,letterSpacing:"-.01em"}}>
                            {r.client}
                          </p>
                          <p style={{fontSize:11,color:T.textMuted,marginTop:1}}>
                            {r.time} · {r.type}
                          </p>
                        </div>
                      </div>
                    ))}
                    <button style={{
                      flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                      gap:6,padding:"10px 14px",borderRadius:T.radiusMd,
                      background:"transparent",
                      border:`1px dashed ${T.border}`,color:T.textMuted,
                      fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s",
                    }}>
                      <Plus size={12}/> Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {STATS_DATA.map(s=>(
              <div key={s.label} style={{
                borderRadius:T.radiusLg,padding:"18px 20px",
                background:T.bgSurface,border:`1px solid ${T.border}`,
                boxShadow:T.shadowSm,transition:"all .2s",
              }}>
                <div style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  padding:"4px 8px",borderRadius:T.radiusFull,
                  background:s.bg,marginBottom:12,
                }}>
                  <span style={{color:s.color}}>{s.icon}</span>
                  <span style={{fontSize:10,fontWeight:700,color:s.color,letterSpacing:".03em"}}>
                    {s.label.toUpperCase()}
                  </span>
                </div>
                <p style={{
                  fontSize:28,fontWeight:900,color:T.textPrimary,
                  letterSpacing:"-.05em",lineHeight:1,marginBottom:4,
                }}>{s.value}</p>
                <p style={{fontSize:11,color:T.textMuted,fontWeight:500}}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── RDV LIST + MESSAGES ── */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>

            {/* RDV */}
            <div style={{
              borderRadius:T.radiusLg,
              background:T.bgSurface,border:`1px solid ${T.border}`,
              overflow:"hidden",boxShadow:T.shadowSm,
            }}>
              <div style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"16px 20px",borderBottom:`1px solid ${T.border}`,
              }}>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:T.textPrimary,letterSpacing:"-.01em"}}>
                    Prochains rendez-vous
                  </p>
                  <p style={{fontSize:11,color:T.textMuted}}>5 à venir</p>
                </div>
                <button style={{
                  display:"flex",alignItems:"center",gap:4,
                  fontSize:11,fontWeight:600,color:T.textMuted,
                  background:"none",border:"none",cursor:"pointer",
                }}>
                  Voir tout <ChevronRight size={11}/>
                </button>
              </div>
              <div>
                {RDV.map((r,i)=>(
                  <div key={r.id} style={{
                    display:"flex",alignItems:"center",gap:12,
                    padding:"12px 20px",
                    borderBottom: i<RDV.length-1 ? `1px solid ${T.border}` : "none",
                    cursor:"pointer",transition:"background .15s",
                  }}>
                    <Avatar name={r.client} size={34}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                        <span style={{fontSize:13,fontWeight:600,color:T.textPrimary,
                                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                                      letterSpacing:"-.01em"}}>
                          {r.client}
                        </span>
                        <span style={{
                          fontSize:10,fontWeight:600,
                          padding:"1px 6px",borderRadius:T.radiusFull,
                          background:T.bgRaised,border:`1px solid ${T.border}`,
                          color:T.textMuted,flexShrink:0,
                        }}>{r.type}</span>
                      </div>
                      <p style={{fontSize:11,color:T.textMuted}}>
                        {r.date} · {r.time}
                      </p>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.textSecondary}}>
                        {r.acompte}€
                      </span>
                      <Badge color={r.status}>
                        {r.status==="confirmed"?"Confirmé":"En attente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{
              borderRadius:T.radiusLg,
              background:T.bgSurface,border:`1px solid ${T.border}`,
              overflow:"hidden",boxShadow:T.shadowSm,
              display:"flex",flexDirection:"column",
            }}>
              <div style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"16px 16px",borderBottom:`1px solid ${T.border}`,
              }}>
                <p style={{fontSize:13,fontWeight:700,color:T.textPrimary,letterSpacing:"-.01em"}}>
                  Messages
                </p>
                <Badge color="confirmed">
                  {MESSAGES.filter(m=>m.unread).length} non lus
                </Badge>
              </div>
              <div style={{flex:1}}>
                {MESSAGES.map((m,i)=>(
                  <div key={m.id} style={{
                    padding:"12px 16px",cursor:"pointer",
                    borderBottom: i<MESSAGES.length-1 ? `1px solid ${T.border}` : "none",
                    transition:"background .15s",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{
                        fontSize:12,fontWeight:m.unread?700:500,
                        color:m.unread?T.textPrimary:T.textSecondary,
                        flex:1,letterSpacing:"-.01em",
                      }}>{m.from}</span>
                      {m.unread&&(
                        <span style={{
                          width:6,height:6,borderRadius:"50%",
                          background:T.blue,
                          boxShadow:`0 0 8px ${T.blue}`,flexShrink:0,
                        }}/>
                      )}
                      <span style={{fontSize:10,color:T.textMuted}}>{m.time}</span>
                    </div>
                    <p style={{
                      fontSize:11,color:T.textMuted,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                      lineHeight:1.4,
                    }}>{m.preview}</p>
                  </div>
                ))}
              </div>
              <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`}}>
                <button style={{
                  width:"100%",padding:"10px",borderRadius:T.radiusMd,
                  background:T.bgRaised,border:`1px solid ${T.border}`,
                  color:T.textSecondary,fontSize:12,fontWeight:600,cursor:"pointer",
                  transition:"all .15s",letterSpacing:"-.01em",
                }}>
                  Ouvrir la messagerie →
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   APP SHELL
══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView] = useState("dashboard");
  const TABS = [
    {key:"vitrine",  label:"📱 Vitrine"},
    {key:"booking",  label:"📅 Booking"},
    {key:"dashboard",label:"🏠 Dashboard"},
  ];

  return (
    <div className="ink-root" style={{minHeight:"100vh",background:T.bgBase}}>
      <GlobalStyle/>

      {/* Tab bar */}
      {view !== "dashboard" && (
        <div style={{
          position:"sticky",top:0,zIndex:50,
          display:"flex",justifyContent:"center",alignItems:"center",
          gap:4,padding:"10px",
          background:"rgba(7,7,10,0.92)",
          backdropFilter:"blur(20px)",
          borderBottom:`1px solid ${T.border}`,
        }}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setView(t.key)}
                    className={view===t.key?"tab-active":""}
                    style={{
                      padding:"7px 16px",borderRadius:T.radiusMd,
                      fontSize:12,fontWeight:600,cursor:"pointer",
                      background: view===t.key ? T.bgRaised : "transparent",
                      border:`1px solid ${view===t.key ? T.borderHover : "transparent"}`,
                      color: view===t.key ? T.textPrimary : T.textMuted,
                      transition:"all .2s",letterSpacing:"-.01em",
                    }}>
              {t.label}
            </button>
          ))}

          {/* Version tag */}
          <div style={{
            position:"absolute",right:16,
            display:"flex",alignItems:"center",gap:5,
            fontSize:10,color:T.textMuted,fontWeight:500,
          }}>
            <Zap size={10} style={{color:T.violet}}/> InkFlow v2
          </div>
        </div>
      )}

      {/* Dashboard prend tout l'espace */}
      {view === "dashboard" && (
        <div>
          {/* Petit switcher en haut */}
          <div style={{
            position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",
            zIndex:50,display:"flex",gap:4,
            background:"rgba(10,10,14,0.95)",
            border:`1px solid ${T.border}`,
            borderRadius:T.radiusFull,padding:6,
            backdropFilter:"blur(20px)",
            boxShadow:T.shadowLg,
          }}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setView(t.key)}
                      style={{
                        padding:"6px 14px",borderRadius:T.radiusFull,
                        fontSize:11,fontWeight:600,cursor:"pointer",
                        background: view===t.key ? T.bgRaised : "transparent",
                        border:`1px solid ${view===t.key ? T.borderHover : "transparent"}`,
                        color: view===t.key ? T.textPrimary : T.textMuted,
                        transition:"all .2s",letterSpacing:"-.01em",
                      }}>
                {t.label}
              </button>
            ))}
          </div>
          <DashboardView/>
        </div>
      )}

      {view === "vitrine"   && <PhoneFrame><VitrineView/></PhoneFrame>}
      {view === "booking"   && <PhoneFrame><BookingView/></PhoneFrame>}
    </div>
  );
}
