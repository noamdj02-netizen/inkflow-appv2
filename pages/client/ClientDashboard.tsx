/**
 * ClientDashboard — "My Inkflow" v2
 * 4 onglets : Accueil | Découverte | Flash | Favoris
 */

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MapPin, Zap, Heart,
  LogOut, Wallet, Calendar, Copy, Share2, CheckCircle,
  Clock, ChevronRight, Sparkles, Star, X,
  Droplets, Sun, Shield, Check, Gift,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#0d0d0d',
  surface: '#161616',
  border: '#2a2a2a',
  text: '#e8e3dc',
  muted: '#6b6b6b',
  accent: '#c9a96e',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Appointment {
  id: string; date: string; time?: string; service: string;
  status: string; price: number; studio_name?: string;
}
type Tab = 'home' | 'decouverte' | 'flash' | 'favoris';

// ── Mock data — Studios ───────────────────────────────────────────────────────
const MOCK_STUDIOS = [
  { id: 's1', name: 'Studio Noir', style: 'Blackwork', rating: 4.9, dist: '0.3 km', grad: ['#1a1a2e','#c9a96e'], initials: 'SN', accent: '#c9a96e' },
  { id: 's2', name: 'Ink & Bones', style: 'Japonais',  rating: 4.7, dist: '0.8 km', grad: ['#2d1b69','#11998e'], initials: 'IB', accent: '#a78bfa' },
  { id: 's3', name: 'Electric Ink', style: 'Neo-trad', rating: 4.8, dist: '1.2 km', grad: ['#f97316','#ef4444'], initials: 'EI', accent: '#fb923c' },
  { id: 's4', name: 'Minimal Lines', style: 'Fine line',rating: 4.6, dist: '1.5 km', grad: ['#0f2027','#2196f3'], initials: 'ML', accent: '#60a5fa' },
  { id: 's5', name: 'Dark Matter', style: 'Trash polka',rating:4.5, dist: '2.1 km', grad: ['#1e3c72','#e53935'], initials: 'DM', accent: '#f87171' },
  { id: 's6', name: 'Aquarelle Studio', style: 'Aquarelle',rating:4.9,dist:'2.8 km',grad:['#134e5e','#71b280'], initials:'AS', accent:'#34d399' },
];

// ── Mock data — Flashs ────────────────────────────────────────────────────────
const MOCK_FLASHES = [
  { id:'f1',  name:'Dragon Serpent',     studio:'Ink & Bones',      price:180, size:'15×20 cm', time:'3h',    grad:['#1a1a2e','#e94560'], h:220 },
  { id:'f2',  name:'Rose Géométrique',   studio:'Minimal Lines',    price:120, size:'10×10 cm', time:'1h30',  grad:['#134e5e','#71b280'], h:160 },
  { id:'f3',  name:'Papillon Aquarelle', studio:'Aquarelle Studio', price:200, size:'12×15 cm', time:'2h30',  grad:['#2d1b69','#da44bb'], h:200 },
  { id:'f4',  name:'Lune & Étoiles',     studio:'Studio Noir',      price:90,  size:'8×8 cm',   time:'1h',    grad:['#0d0d0d','#c9a96e'], h:150 },
  { id:'f5',  name:'Crane Japonais',     studio:'Ink & Bones',      price:250, size:'20×25 cm', time:'4h',    grad:['#2d1b69','#f97316'], h:240 },
  { id:'f6',  name:'Fleur de Cerisier', studio:'Aquarelle Studio', price:150, size:'12×12 cm', time:'2h',    grad:['#ff416c','#ff4b2b'], h:180 },
  { id:'f7',  name:'Serpent Ouroboros',  studio:'Dark Matter',      price:320, size:'25×25 cm', time:'5h',    grad:['#1e3c72','#2a5298'], h:260 },
  { id:'f8',  name:'Lézard Tribal',      studio:'Electric Ink',     price:110, size:'10×15 cm', time:'1h30',  grad:['#f7971e','#ffd200'], h:170 },
  { id:'f9',  name:'Méduse Aquarelle',   studio:'Aquarelle Studio', price:280, size:'18×22 cm', time:'4h',    grad:['#4facfe','#00f2fe'], h:230 },
  { id:'f10', name:'Triangle Sacré',     studio:'Minimal Lines',    price:80,  size:'6×6 cm',   time:'45min', grad:['#30cfd0','#330867'], h:140 },
  { id:'f11', name:'Loup Blackwork',     studio:'Studio Noir',      price:400, size:'30×30 cm', time:'6h',    grad:['#0f0c29','#302b63'], h:280 },
  { id:'f12', name:'Colibri Fine Line',  studio:'Minimal Lines',    price:140, size:'10×14 cm', time:'2h',    grad:['#a8ff78','#78ffd6'], h:190 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}
function generateCode(email: string) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) | 0;
  let code = '';
  for (let i = 0; i < 6; i++) { h = (h * 1103515245 + 12345) | 0; code += chars[Math.abs(h) % chars.length]; }
  return code;
}

const STATUS_LABEL: Record<string,string> = {
  pending:'En attente', confirmed:'Confirmé', completed:'Terminé',
  cancelled:'Annulé', in_progress:'En cours',
};
const STATUS_COLOR: Record<string,{bg:string;text:string}> = {
  pending:    {bg:'rgba(251,191,36,0.12)', text:'#fbbf24'},
  confirmed:  {bg:'rgba(52,211,153,0.12)', text:'#34d399'},
  completed:  {bg:'rgba(107,114,128,0.12)',text:'#9ca3af'},
  cancelled:  {bg:'rgba(248,113,113,0.12)',text:'#f87171'},
  in_progress:{bg:'rgba(96,165,250,0.12)', text:'#60a5fa'},
};

// ── HEALING TRACKER ───────────────────────────────────────────────────────────
const STEPS = [
  { day:1,  Icon:Droplets, label:'Film retiré',         tip:'Lave doucement 2× par jour.' },
  { day:3,  Icon:Shield,   label:'Premier pelage',       tip:'Ne gratte pas — c\'est normal.' },
  { day:10, Icon:Sun,      label:'90% cicatrisé',        tip:'Évite piscine, bain, soleil.' },
  { day:30, Icon:Check,    label:'Cicatrisation totale',  tip:'Protège avec SPF 50+.' },
];

const HealingTracker: React.FC<{date:string; service:string}> = ({date,service}) => {
  const days = daysSince(date);
  if (days > 40) return null;
  const pct = Math.min((days / 30) * 100, 100);
  return (
    <div className="rounded-2xl border p-5" style={{background:T.surface,borderColor:T.border}}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{color:T.accent}}>Cicatrisation</p>
          <h3 className="text-sm font-bold" style={{color:T.text}}>{service}</h3>
        </div>
        <span className="text-2xl font-bold tabular-nums" style={{color:T.accent}}>J+{days}</span>
      </div>
      <div className="relative h-1.5 rounded-full mb-5" style={{background:T.border}}>
        <div className="absolute left-0 top-0 h-full rounded-full" style={{width:`${pct}%`,background:`linear-gradient(90deg,${T.accent},#e8d5a3)`}} />
        {STEPS.map(s => (
          <div key={s.day} className="absolute top-1/2 w-2 h-2 rounded-full border-2"
            style={{left:`${(s.day/30)*100}%`,transform:'translate(-50%,-50%)',
              background:days>=s.day?T.accent:T.surface,borderColor:days>=s.day?T.accent:T.border}} />
        ))}
      </div>
      <div className="space-y-2">
        {STEPS.map(({day,Icon,label,tip}) => {
          const done = days >= day;
          const cur  = !done && STEPS.find(s=>days<s.day)?.day===day;
          return (
            <div key={day} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{background:done?'rgba(201,169,110,0.15)':cur?'rgba(201,169,110,0.08)':'rgba(42,42,42,0.4)'}}>
                <Icon className="w-3.5 h-3.5" style={{color:done?T.accent:cur?'#a0998f':T.border}} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{color:done?T.accent:cur?'#a0998f':T.border}}>
                    J+{day} — {label}
                  </span>
                  {cur && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{background:'rgba(201,169,110,0.15)',color:T.accent}}>Maintenant</span>}
                </div>
                {(done||cur) && <p className="text-xs mt-0.5" style={{color:T.muted}}>{tip}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── APPOINTMENT CARD ──────────────────────────────────────────────────────────
const AptCard: React.FC<{apt:Appointment}> = ({apt}) => {
  const sc = STATUS_COLOR[apt.status] || STATUS_COLOR.completed;
  return (
    <div className="rounded-2xl border p-4 flex gap-4" style={{background:T.surface,borderColor:T.border}}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{background:`linear-gradient(135deg,rgba(201,169,110,0.15),rgba(201,169,110,0.05))`}}>
        <Calendar className="w-5 h-5" style={{color:T.accent}} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-semibold text-sm truncate" style={{color:T.text}}>{apt.service}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{background:sc.bg,color:sc.text}}>
            {STATUS_LABEL[apt.status]??apt.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{color:T.muted}}>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{formatDate(apt.date)}{apt.time?` · ${apt.time}`:''}</span>
        </div>
        {apt.studio_name && <p className="text-xs mt-0.5 flex items-center gap-1" style={{color:T.muted}}><MapPin className="w-3 h-3"/>{apt.studio_name}</p>}
        {apt.price>0 && <p className="text-xs font-bold mt-1" style={{color:T.accent}}>{apt.price}€</p>}
      </div>
    </div>
  );
};

// ── MAP PLACEHOLDER ───────────────────────────────────────────────────────────
const MapView: React.FC = () => {
  const PIN_POS = [
    {left:'22%',top:'38%',name:'Studio Noir',  accent:'#c9a96e'},
    {left:'55%',top:'25%',name:'Ink & Bones',  accent:'#a78bfa'},
    {left:'70%',top:'55%',name:'Electric Ink', accent:'#fb923c'},
    {left:'35%',top:'65%',name:'Minimal Lines',accent:'#60a5fa'},
    {left:'80%',top:'30%',name:'Dark Matter',  accent:'#f87171'},
  ];
  return (
    <div className="relative w-full h-52 rounded-2xl overflow-hidden" style={{background:'#111316'}}>
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      {/* Streets mock */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#2a2a2a" strokeWidth="6"/>
        <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#2a2a2a" strokeWidth="3"/>
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#2a2a2a" strokeWidth="4"/>
        <line x1="65%" y1="0" x2="65%" y2="100%" stroke="#2a2a2a" strokeWidth="6"/>
        <line x1="50%" y1="40%" x2="65%" y2="0" stroke="#2a2a2a" strokeWidth="2"/>
      </svg>
      {/* Pins */}
      {PIN_POS.map(p => (
        <div key={p.name} className="absolute flex flex-col items-center" style={{left:p.left,top:p.top,transform:'translate(-50%,-100%)'}}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
            style={{background:p.accent}}>
            <MapPin className="w-4 h-4 text-black" strokeWidth={2.5}/>
          </div>
          <div className="text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={{background:'rgba(0,0,0,0.8)',color:'#fff',border:'1px solid rgba(255,255,255,0.1)'}}>
            {p.name}
          </div>
        </div>
      ))}
      {/* User location */}
      <div className="absolute flex items-center justify-center" style={{left:'48%',top:'55%',transform:'translate(-50%,-50%)'}}>
        <div className="w-4 h-4 rounded-full border-2 border-white" style={{background:'#3b82f6'}}/>
        <div className="absolute w-10 h-10 rounded-full animate-ping opacity-30" style={{background:'#3b82f6'}}/>
      </div>
      {/* Label overlay */}
      <div className="absolute bottom-3 left-3">
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{background:'rgba(0,0,0,0.75)',color:'#ffffff',border:'1px solid rgba(255,255,255,0.1)'}}>
          📍 Paris, France
        </span>
      </div>
    </div>
  );
};

// ── STUDIO CARD (découverte) ──────────────────────────────────────────────────
const StudioCard: React.FC<{studio:typeof MOCK_STUDIOS[0]; onFav:()=>void; isFav:boolean}> = ({studio,onFav,isFav}) => (
  <motion.div
    whileTap={{scale:0.97}}
    className="flex-shrink-0 w-44 rounded-2xl overflow-hidden border cursor-pointer"
    style={{background:T.surface,borderColor:T.border}}
  >
    <div className="w-full h-28 flex items-center justify-center relative"
      style={{background:`linear-gradient(135deg,${studio.grad[0]},${studio.grad[1]})`}}>
      <span className="text-2xl font-black text-white/80">{studio.initials}</span>
      <button onClick={(e)=>{e.stopPropagation();onFav();}}
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
        style={{background:'rgba(0,0,0,0.4)'}}>
        <Heart className="w-3.5 h-3.5" style={{color:isFav?'#f87171':'#fff',fill:isFav?'#f87171':'none'}}/>
      </button>
    </div>
    <div className="p-3">
      <p className="text-xs font-bold truncate" style={{color:T.text}}>{studio.name}</p>
      <p className="text-[10px] mt-0.5" style={{color:T.muted}}>{studio.style}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-0.5">
          <Star className="w-3 h-3" style={{color:'#fbbf24',fill:'#fbbf24'}}/>
          <span className="text-[10px] font-semibold" style={{color:T.text}}>{studio.rating}</span>
        </div>
        <span className="text-[10px]" style={{color:T.muted}}>{studio.dist}</span>
      </div>
    </div>
  </motion.div>
);

// ── FLASH CARD (masonry) ──────────────────────────────────────────────────────
const FlashCard: React.FC<{flash:typeof MOCK_FLASHES[0]; onOpen:()=>void; onFav:()=>void; isFav:boolean}> = ({flash,onOpen,onFav,isFav}) => (
  <motion.div
    whileTap={{scale:0.97}}
    onClick={onOpen}
    className="rounded-2xl overflow-hidden cursor-pointer relative mb-3"
    style={{background:T.surface,border:`1px solid ${T.border}`}}
  >
    {/* Image placeholder */}
    <div style={{
      height: flash.h,
      background:`linear-gradient(160deg,${flash.grad[0]},${flash.grad[1]})`,
    }}>
      <div className="w-full h-full flex items-end p-3">
        <p className="text-xs font-bold text-white drop-shadow-lg">{flash.name}</p>
      </div>
    </div>
    {/* Info */}
    <div className="px-3 py-2.5 flex items-center justify-between">
      <span className="text-sm font-bold" style={{color:T.accent}}>{flash.price}€</span>
      <button onClick={(e)=>{e.stopPropagation();onFav();}}
        className="w-7 h-7 rounded-full flex items-center justify-center"
        style={{background:'rgba(255,255,255,0.05)'}}>
        <Heart className="w-3.5 h-3.5" style={{color:isFav?'#f87171':T.muted,fill:isFav?'#f87171':'none'}}/>
      </button>
    </div>
  </motion.div>
);

// ── FLASH MODAL ───────────────────────────────────────────────────────────────
const FlashModal: React.FC<{flash:typeof MOCK_FLASHES[0]|null; onClose:()=>void; onFav:()=>void; isFav:boolean}> = ({flash,onClose,onFav,isFav}) => (
  <AnimatePresence>
    {flash && (
      <motion.div
        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)'}}
        onClick={onClose}
      >
        <motion.div
          initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
          transition={{type:'spring',stiffness:350,damping:38}}
          onClick={e=>e.stopPropagation()}
          className="w-full max-w-lg rounded-t-3xl overflow-hidden"
          style={{background:T.surface,border:`1px solid ${T.border}`}}
        >
          {/* Image */}
          <div style={{height:280,background:`linear-gradient(160deg,${flash.grad[0]},${flash.grad[1]})`}}>
            <div className="w-full h-full flex flex-col justify-between p-5">
              <button onClick={onClose}
                className="self-end w-8 h-8 rounded-full flex items-center justify-center"
                style={{background:'rgba(0,0,0,0.4)'}}>
                <X className="w-4 h-4 text-white"/>
              </button>
              <h2 className="text-xl font-black text-white drop-shadow-lg">{flash.name}</h2>
            </div>
          </div>
          {/* Details */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl p-3 text-center border" style={{background:T.bg,borderColor:T.border}}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{color:T.muted}}>Prix</p>
                <p className="text-lg font-black" style={{color:T.accent}}>{flash.price}€</p>
              </div>
              <div className="flex-1 rounded-xl p-3 text-center border" style={{background:T.bg,borderColor:T.border}}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{color:T.muted}}>Taille</p>
                <p className="text-sm font-bold" style={{color:T.text}}>{flash.size}</p>
              </div>
              <div className="flex-1 rounded-xl p-3 text-center border" style={{background:T.bg,borderColor:T.border}}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{color:T.muted}}>Durée</p>
                <p className="text-sm font-bold" style={{color:T.text}}>{flash.time}</p>
              </div>
            </div>
            <p className="text-xs" style={{color:T.muted}}>Par <span style={{color:T.text}}>{flash.studio}</span></p>
            <div className="flex gap-3">
              <button onClick={onFav}
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all"
                style={{borderColor:isFav?'#f87171':T.border,background:isFav?'rgba(248,113,113,0.1)':T.bg}}>
                <Heart className="w-5 h-5" style={{color:isFav?'#f87171':T.muted,fill:isFav?'#f87171':'none'}}/>
              </button>
              <button
                className="flex-1 rounded-2xl py-3 text-sm font-black transition-all active:scale-[0.97]"
                style={{background:T.accent,color:'#0d0d0d'}}
              >
                Réserver ce flash
              </button>
            </div>
          </div>
          <div style={{height:'env(safe-area-inset-bottom,0px)'}}/>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ── WALLET CARD ───────────────────────────────────────────────────────────────
const WalletCard: React.FC<{cents:number; code:string}> = ({cents,code}) => {
  const [copied,setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{background:'linear-gradient(135deg,#1e1a14,#2a2215)',border:'1px solid rgba(201,169,110,0.2)'}}>
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10" style={{background:T.accent}}/>
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4" style={{color:T.accent}}/>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{color:T.accent}}>Mon Wallet</span>
        </div>
        <div className="text-3xl font-black mb-0.5" style={{color:T.text}}>
          {(cents/100).toFixed(0)}€
          <span className="text-sm font-normal ml-1.5" style={{color:T.muted}}>de crédit</span>
        </div>
        <p className="text-xs mb-4" style={{color:T.muted}}>Utilisable chez tous les studios Inkflow</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border"
            style={{background:'rgba(0,0,0,0.3)',borderColor:'rgba(201,169,110,0.2)'}}>
            <span className="text-sm font-black tracking-widest" style={{color:T.accent}}>{code}</span>
            <button onClick={copy} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg"
              style={{background:'rgba(201,169,110,0.15)',color:T.accent}}>
              {copied ? <CheckCircle className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
              {copied?'Copié':'Copier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── HOME TAB ──────────────────────────────────────────────────────────────────
const HomeTab: React.FC<{
  email:string; cents:number; code:string;
  upcoming:Appointment[]; lastTattoo:Appointment|null;
  onGoFlash:()=>void;
}> = ({email,cents,code,upcoming,lastTattoo,onGoFlash}) => {
  const first = email.split('@')[0];
  const name = first.charAt(0).toUpperCase()+first.slice(1);
  return (
    <div className="space-y-5 px-4 pt-5 pb-28">
      <div>
        <h1 className="text-xl font-black" style={{color:T.text}}>Bonjour {name} 👋</h1>
        <p className="text-xs mt-0.5" style={{color:T.muted}}>{email}</p>
      </div>
      <WalletCard cents={cents} code={code}/>
      {lastTattoo && <HealingTracker date={lastTattoo.date} service={lastTattoo.service}/>}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{color:T.muted}}>
          <Calendar className="w-3.5 h-3.5"/> Prochains rendez-vous
        </h2>
        {upcoming.length===0 ? (
          <div className="rounded-2xl border p-8 text-center" style={{background:T.surface,borderColor:T.border}}>
            <Calendar className="w-8 h-8 mx-auto mb-2" style={{color:T.border}}/>
            <p className="text-sm" style={{color:T.muted}}>Aucun RDV prévu</p>
          </div>
        ) : (
          <div className="space-y-3">{upcoming.map(a=><AptCard key={a.id} apt={a}/>)}</div>
        )}
      </section>
      {/* Flash CTA */}
      <motion.button
        whileTap={{scale:0.97}}
        onClick={onGoFlash}
        className="w-full rounded-2xl p-4 flex items-center gap-3 border"
        style={{background:T.surface,borderColor:T.border}}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'rgba(201,169,110,0.12)'}}>
          <Zap className="w-5 h-5" style={{color:T.accent}}/>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold" style={{color:T.text}}>Explorer les flashs</p>
          <p className="text-xs" style={{color:T.muted}}>12 designs disponibles près de toi</p>
        </div>
        <ChevronRight className="w-4 h-4" style={{color:T.muted}}/>
      </motion.button>
    </div>
  );
};

// ── DÉCOUVERTE TAB ────────────────────────────────────────────────────────────
const DecouverteTab: React.FC<{favStudios:Set<string>; onToggleFav:(id:string)=>void}> = ({favStudios,onToggleFav}) => (
  <div className="pb-28">
    <div className="px-4 pt-5 mb-4">
      <h2 className="text-xl font-black mb-1" style={{color:T.text}}>À proximité</h2>
      <p className="text-xs" style={{color:T.muted}}>Studios Inkflow autour de toi</p>
    </div>
    <div className="px-4 mb-5">
      <MapView/>
    </div>
    {/* Horizontal scroll */}
    <div className="px-4 mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{color:T.muted}}>Studios</p>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
        {MOCK_STUDIOS.map(s=>(
          <StudioCard key={s.id} studio={s}
            isFav={favStudios.has(s.id)}
            onFav={()=>onToggleFav(s.id)}/>
        ))}
      </div>
    </div>
    {/* List */}
    <div className="px-4 space-y-3">
      {MOCK_STUDIOS.map(s=>(
        <motion.div key={s.id} whileTap={{scale:0.98}}
          className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer"
          style={{background:T.surface,borderColor:T.border}}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0"
            style={{background:`linear-gradient(135deg,${s.grad[0]},${s.grad[1]})`}}>
            {s.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{color:T.text}}>{s.name}</p>
            <p className="text-xs" style={{color:T.muted}}>{s.style}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3" style={{color:'#fbbf24',fill:'#fbbf24'}}/>
                <span className="text-xs font-semibold" style={{color:T.text}}>{s.rating}</span>
              </div>
              <span className="text-xs" style={{color:T.border}}>·</span>
              <span className="text-xs" style={{color:T.muted}}>{s.dist}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>onToggleFav(s.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{background:'rgba(255,255,255,0.04)'}}>
              <Heart className="w-4 h-4"
                style={{color:favStudios.has(s.id)?'#f87171':T.muted,fill:favStudios.has(s.id)?'#f87171':'none'}}/>
            </button>
            <ChevronRight className="w-4 h-4" style={{color:T.border}}/>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ── FLASH TAB ─────────────────────────────────────────────────────────────────
const FlashTab: React.FC<{favFlashes:Set<string>; onToggleFav:(id:string)=>void}> = ({favFlashes,onToggleFav}) => {
  const [selected, setSelected] = useState<typeof MOCK_FLASHES[0]|null>(null);
  const col1 = MOCK_FLASHES.filter((_,i)=>i%2===0);
  const col2 = MOCK_FLASHES.filter((_,i)=>i%2!==0);
  return (
    <>
      <div className="pb-28">
        <div className="px-4 pt-5 mb-4">
          <h2 className="text-xl font-black mb-1" style={{color:T.text}}>Espace Flash</h2>
          <p className="text-xs" style={{color:T.muted}}>{MOCK_FLASHES.length} designs disponibles</p>
        </div>
        {/* Masonry 2 colonnes */}
        <div className="px-4 flex gap-3">
          <div className="flex-1">
            {col1.map(f=>(
              <FlashCard key={f.id} flash={f}
                onOpen={()=>setSelected(f)}
                onFav={()=>onToggleFav(f.id)}
                isFav={favFlashes.has(f.id)}/>
            ))}
          </div>
          <div className="flex-1 mt-8">
            {col2.map(f=>(
              <FlashCard key={f.id} flash={f}
                onOpen={()=>setSelected(f)}
                onFav={()=>onToggleFav(f.id)}
                isFav={favFlashes.has(f.id)}/>
            ))}
          </div>
        </div>
      </div>
      <FlashModal
        flash={selected}
        onClose={()=>setSelected(null)}
        onFav={()=>{if(selected)onToggleFav(selected.id);}}
        isFav={selected?favFlashes.has(selected.id):false}/>
    </>
  );
};

// ── FAVORIS TAB ───────────────────────────────────────────────────────────────
const FavorisTab: React.FC<{favStudios:Set<string>; favFlashes:Set<string>; onUnfavStudio:(id:string)=>void; onUnfavFlash:(id:string)=>void}> = ({favStudios,favFlashes,onUnfavStudio,onUnfavFlash}) => {
  const [sub,setSub] = useState<'studios'|'flashs'>('studios');
  const savedStudios = MOCK_STUDIOS.filter(s=>favStudios.has(s.id));
  const savedFlashes = MOCK_FLASHES.filter(f=>favFlashes.has(f.id));
  return (
    <div className="pb-28">
      <div className="px-4 pt-5 mb-4">
        <h2 className="text-xl font-black mb-4" style={{color:T.text}}>Mes Favoris</h2>
        {/* Sub-tabs */}
        <div className="flex gap-2 p-1 rounded-xl" style={{background:T.surface}}>
          {(['studios','flashs'] as const).map(t=>(
            <button key={t} onClick={()=>setSub(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background:sub===t?T.accent:'transparent',
                color:sub===t?'#0d0d0d':T.muted,
              }}>
              {t==='studios'?`Tatoueurs (${savedStudios.length})`:`Flashs (${savedFlashes.length})`}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4">
        {sub==='studios' && (
          savedStudios.length===0 ? (
            <div className="rounded-2xl border p-10 text-center" style={{background:T.surface,borderColor:T.border}}>
              <Heart className="w-8 h-8 mx-auto mb-2" style={{color:T.border}}/>
              <p className="text-sm" style={{color:T.muted}}>Aucun tatoueur en favori</p>
              <p className="text-xs mt-1" style={{color:T.border}}>Explore la Découverte pour en ajouter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedStudios.map(s=>(
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl border"
                  style={{background:T.surface,borderColor:T.border}}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0"
                    style={{background:`linear-gradient(135deg,${s.grad[0]},${s.grad[1]})`}}>
                    {s.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{color:T.text}}>{s.name}</p>
                    <p className="text-xs" style={{color:T.muted}}>{s.style} · {s.dist}</p>
                  </div>
                  <button onClick={()=>onUnfavStudio(s.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{background:'rgba(248,113,113,0.1)'}}>
                    <Heart className="w-4 h-4" style={{color:'#f87171',fill:'#f87171'}}/>
                  </button>
                </div>
              ))}
            </div>
          )
        )}
        {sub==='flashs' && (
          savedFlashes.length===0 ? (
            <div className="rounded-2xl border p-10 text-center" style={{background:T.surface,borderColor:T.border}}>
              <Zap className="w-8 h-8 mx-auto mb-2" style={{color:T.border}}/>
              <p className="text-sm" style={{color:T.muted}}>Aucun flash enregistré</p>
              <p className="text-xs mt-1" style={{color:T.border}}>Parcours l'Espace Flash pour en sauvegarder</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                {savedFlashes.filter((_,i)=>i%2===0).map(f=>(
                  <div key={f.id} className="rounded-2xl overflow-hidden border mb-3"
                    style={{background:T.surface,borderColor:T.border}}>
                    <div style={{height:f.h*0.6,background:`linear-gradient(160deg,${f.grad[0]},${f.grad[1]})`}}>
                      <div className="h-full flex items-end p-2">
                        <p className="text-[10px] font-bold text-white">{f.name}</p>
                      </div>
                    </div>
                    <div className="px-2.5 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold" style={{color:T.accent}}>{f.price}€</span>
                      <button onClick={()=>onUnfavFlash(f.id)}>
                        <Heart className="w-3.5 h-3.5" style={{color:'#f87171',fill:'#f87171'}}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1 mt-6">
                {savedFlashes.filter((_,i)=>i%2!==0).map(f=>(
                  <div key={f.id} className="rounded-2xl overflow-hidden border mb-3"
                    style={{background:T.surface,borderColor:T.border}}>
                    <div style={{height:f.h*0.6,background:`linear-gradient(160deg,${f.grad[0]},${f.grad[1]})`}}>
                      <div className="h-full flex items-end p-2">
                        <p className="text-[10px] font-bold text-white">{f.name}</p>
                      </div>
                    </div>
                    <div className="px-2.5 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold" style={{color:T.accent}}>{f.price}€</span>
                      <button onClick={()=>onUnfavFlash(f.id)}>
                        <Heart className="w-3.5 h-3.5" style={{color:'#f87171',fill:'#f87171'}}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
const NAV_ITEMS: Array<{id:Tab; Icon:React.FC<{className?:string;strokeWidth?:number}>; label:string}> = [
  { id:'home',        Icon:Home,   label:'Accueil'    },
  { id:'decouverte',  Icon:MapPin, label:'Découverte' },
  { id:'flash',       Icon:Zap,    label:'Flash'      },
  { id:'favoris',     Icon:Heart,  label:'Favoris'    },
];

// ── MAIN ──────────────────────────────────────────────────────────────────────
export const ClientDashboard: React.FC = () => {
  const [tab, setTab]               = useState<Tab>('home');
  const [sessionEmail, setEmail]    = useState<string|null>(null);
  const [loading, setLoading]       = useState(true);
  const [appointments, setApts]     = useState<Appointment[]>([]);
  const [cents, setCents]           = useState(0);
  const [code, setCode]             = useState('');
  const [favStudios, setFavStudios] = useState<Set<string>>(new Set());
  const [favFlashes, setFavFlashes] = useState<Set<string>>(new Set());

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}})=>{
      if (!session?.user?.email) { window.location.href='/client'; return; }
      setEmail(session.user.email);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s)=>{
      if (!s?.user?.email) window.location.href='/client';
      else setEmail(s.user.email);
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // Load data
  useEffect(()=>{
    if (!sessionEmail) return;
    (async()=>{
      setLoading(true);
      try {
        const {data:apts} = await supabase
          .from('inkflow_appointments')
          .select('id,date,time,service,status,price,inkflow_studios(studio_name)')
          .eq('client_email',sessionEmail).order('date',{ascending:false}).limit(50);
        setApts((apts??[]).map((a:any)=>({
          id:a.id,date:a.date,time:a.time,service:a.service,status:a.status,price:a.price??0,
          studio_name:a.inkflow_studios?.studio_name,
        })));
        const {data:w} = await supabase.from('inkflow_client_wallets').select('balance_cents').eq('email',sessionEmail).maybeSingle();
        setCents(w?.balance_cents??0);
        let {data:cd} = await supabase.from('inkflow_client_codes').select('code').eq('email',sessionEmail).maybeSingle();
        if (!cd) {
          const c = generateCode(sessionEmail);
          await supabase.from('inkflow_client_codes').insert({email:sessionEmail,code:c});
          setCode(c);
        } else setCode(cd.code);
      } finally { setLoading(false); }
    })();
  },[sessionEmail]);

  const upcoming  = useMemo(()=>appointments.filter(a=>['pending','confirmed','in_progress'].includes(a.status)),[appointments]);
  const lastTattoo = useMemo(()=>appointments.find(a=>a.status==='completed')??null,[appointments]);

  const toggleFavStudio = (id:string) => setFavStudios(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleFavFlash  = (id:string) => setFavFlashes(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});

  if (loading || !sessionEmail) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:T.bg}}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{borderColor:T.border,borderTopColor:T.accent}}/>
    </div>
  );

  return (
    <div className="min-h-screen" style={{background:T.bg,color:T.text}}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3.5 border-b"
        style={{background:'rgba(13,13,13,0.96)',backdropFilter:'blur(12px)',borderColor:T.border}}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:T.accent}}>
            <Sparkles className="w-4 h-4" style={{color:'#0d0d0d'}}/>
          </div>
          <span className="font-black text-sm" style={{color:T.text}}>My Inkflow</span>
        </div>
        <button onClick={()=>supabase.auth.signOut().then(()=>{window.location.href='/client';})}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl"
          style={{color:T.muted,background:'rgba(42,42,42,0.5)'}}>
          <LogOut className="w-3.5 h-3.5"/>Déconnexion
        </button>
      </header>

      {/* Content with animated tab transitions */}
      <main className="max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{opacity:0, y:12}}
            animate={{opacity:1, y:0}}
            exit={{opacity:0,  y:-8}}
            transition={{duration:0.22, ease:[0.22,1,0.36,1]}}
          >
            {tab==='home' && (
              <HomeTab
                email={sessionEmail} cents={cents} code={code}
                upcoming={upcoming} lastTattoo={lastTattoo}
                onGoFlash={()=>setTab('flash')}/>
            )}
            {tab==='decouverte' && (
              <DecouverteTab favStudios={favStudios} onToggleFav={toggleFavStudio}/>
            )}
            {tab==='flash' && (
              <FlashTab favFlashes={favFlashes} onToggleFav={toggleFavFlash}/>
            )}
            {tab==='favoris' && (
              <FavorisTab
                favStudios={favStudios} favFlashes={favFlashes}
                onUnfavStudio={toggleFavStudio} onUnfavFlash={toggleFavFlash}/>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t z-10"
        style={{background:'rgba(13,13,13,0.97)',backdropFilter:'blur(12px)',borderColor:T.border,paddingBottom:'env(safe-area-inset-bottom,0px)'}}>
        {NAV_ITEMS.map(({id,Icon,label})=>{
          const active = tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative transition-all"
              style={{color:active?T.accent:T.muted}}>
              {active && (
                <motion.div layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{background:T.accent}}
                  transition={{type:'spring',stiffness:400,damping:35}}/>
              )}
              <Icon className="w-5 h-5" strokeWidth={active?2.4:1.6}/>
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
