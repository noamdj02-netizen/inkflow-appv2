/**
 * Seed Mode Démo Marketing — InkFlow
 * Peuple le studio noamdj02@gmail.com avec des fausses données valorisantes
 * pour captures d'écran et vidéos promotionnelles.
 *
 * Inclut : clients avec avatars (Unsplash, portraits) + chiffres en paliers (mockup crédible).
 * Marqueur : préfixe "demo_" dans les IDs
 * Nettoyage : node scripts/seed-demo-marketing.mjs --clean
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-demo-marketing.mjs
 *   node --env-file=.env.local scripts/seed-demo-marketing.mjs --clean
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const EMAIL = 'noamdj02@gmail.com';
const ID_PREFIX = 'demo_';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (existsSync(envPath) && !process.env.VITE_SUPABASE_URL) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) {
        const key = m[1].trim();
        const val = m[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Définir VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (ex: .env.local)');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

// Portraits Unsplash (400×400, recadrage visage) — https://unsplash.com/fr/s/photos/avatar
const unsplashFace = (photoSlug) =>
  `https://images.unsplash.com/${photoSlug}?w=400&h=400&fit=crop&crop=faces&auto=format&q=86`;

const FAKE_CLIENTS = [
  { name: 'Sophie Martin', email: 'sophie.martin@email.com', avatar: unsplashFace('photo-1494790108377-be9c29b29330') },
  { name: 'Thomas Dubois', email: 'thomas.dubois@email.com', avatar: unsplashFace('photo-1507003211169-0a1dd7228f2d') },
  { name: 'Emma Lemaire', email: 'emma.lemaire@email.com', avatar: unsplashFace('photo-1500648767791-00dcc994a43e') },
  { name: 'Lucas Bernard', email: 'lucas.bernard@email.com', avatar: unsplashFace('photo-1534528741775-53994a69daeb') },
  { name: 'Chloé Petit', email: 'chloe.petit@email.com', avatar: unsplashFace('photo-1508214751196-bcfd4ca60f91') },
  { name: 'Hugo Moreau', email: 'hugo.moreau@email.com', avatar: unsplashFace('photo-1521572267360-ee0c29002914') },
  { name: 'Léa Laurent', email: 'lea.laurent@email.com', avatar: unsplashFace('photo-1527980965255-d3b416303d12') },
  { name: 'Nathan Simon', email: 'nathan.simon@email.com', avatar: unsplashFace('photo-1438761681033-6461ffad8d80') },
  { name: 'Manon Michel', email: 'manon.michel@email.com', avatar: unsplashFace('photo-1524504388940-b1c1722653e1') },
  { name: 'Enzo Lefebvre', email: 'enzo.lefebvre@email.com', avatar: unsplashFace('photo-1506794778202-cad84cf45f1d') },
  { name: 'Julie Roux', email: 'julie.roux@email.com', avatar: unsplashFace('photo-1472099645785-5658abf4ff4e') },
  { name: 'Louis David', email: 'louis.david@email.com', avatar: unsplashFace('photo-1519345182560-3f2917c472ef') },
  { name: 'Camille Bertrand', email: 'camille.bertrand@email.com', avatar: unsplashFace('photo-1517841905240-472988babdf9') },
  { name: 'Raphaël Garnier', email: 'raphael.garnier@email.com', avatar: unsplashFace('photo-1539578705396-6b6a182fe6f4') },
  { name: 'Océane Faure', email: 'oceane.faure@email.com', avatar: unsplashFace('photo-1521119989653-a83eee488004') },
  { name: 'Arthur Mercier', email: 'arthur.mercier@email.com', avatar: unsplashFace('photo-1544005313-94ddf0286df2') },
  { name: 'Inès Rousseau', email: 'ines.rousseau@email.com', avatar: unsplashFace('photo-1507591064344-4c6ce0b0e8a4') },
  { name: 'Jules Vincent', email: 'jules.vincent@email.com', avatar: unsplashFace('photo-1487412720507-e7ab37603c6f') },
  { name: 'Margot Fournier', email: 'margot.fournier@email.com', avatar: unsplashFace('photo-1502823403499-6ccfcf4fb453') },
  { name: 'Marie Dupont', email: 'marie.dupont@email.com', avatar: unsplashFace('photo-1580489944761-15a19d654956') },
  { name: 'Paul Leroy', email: 'paul.leroy@email.com', avatar: unsplashFace('photo-1566492031773-4f4c3a73b0f7') },
  { name: 'Clara Garnier', email: 'clara.garnier@email.com', avatar: unsplashFace('photo-1619895862022-09114b41f16f') },
  { name: 'Léo Bonnet', email: 'leo.bonnet@email.com', avatar: unsplashFace('photo-1628157588553-5eeea01af4c2') },
  { name: 'Zoé Lambert', email: 'zoe.lambert@email.com', avatar: unsplashFace('photo-1607746882042-944635dfe10c') },
  { name: 'Adam Fontaine', email: 'adam.fontaine@email.com', avatar: unsplashFace('photo-1599566150163-38294d4cc2d5') },
];

/** Chiffres cohérents (mockup) : gros comptes + milieu de gamme + nouveaux */
function clientStatsForDemo(i, today) {
  if (i < 5) {
    const aptCount = 7 + (i % 4);
    const totalSpent = 1850 + i * 210 + (i % 3) * 80;
    return {
      aptCount,
      totalSpent,
      first_visit: addDays(today, -(140 + i * 11)),
      last_visit: addDays(today, -(2 + (i % 5))),
      status: 'vip',
      tags: ['VIP', 'Fidèle'],
    };
  }
  if (i < 15) {
    const aptCount = 2 + (i % 4);
    const totalSpent = 240 + (i % 7) * 95 + (i % 2) * 40;
    return {
      aptCount,
      totalSpent,
      first_visit: addDays(today, -(100 - i * 2)),
      last_visit: addDays(today, -(1 + (i % 20))),
      status: 'active',
      tags: aptCount >= 3 ? ['Régulier'] : ['Nouveau'],
    };
  }
  if (i < 22) {
    const aptCount = 1 + (i % 3);
    const totalSpent = 70 + (i % 5) * 45;
    return {
      aptCount,
      totalSpent,
      first_visit: addDays(today, -(45 - i)),
      last_visit: addDays(today, -(i % 18)),
      status: 'active',
      tags: ['Nouveau'],
    };
  }
  return {
    aptCount: i % 2,
    totalSpent: (i % 2) * 40 + 20,
    first_visit: addDays(today, -7 + (i % 4)),
    last_visit: (i % 2) === 0 ? addDays(today, -1) : null,
    status: 'active',
    tags: ['Prospect'],
  };
}

const SERVICES = [
  'Flash Lune — 150€',
  'Manchette Japonaise — 400€',
  'Petit motif fleur — 80€',
  'Dos complet — consultation',
  'Bras Japonais — Carpe Koï',
  'Tatouage minimaliste — 120€',
  'Épaule dragon — 250€',
  'Poignet constellation — 90€',
  'Avant-bras sakura — 180€',
  'Cheville ancre — 100€',
];

const DESCRIPTIONS = [
  'Je souhaite un Flash Lune sur l\'avant-bras',
  'Consultation pour un dos japonais',
  'Petit motif fleur de cerisier',
  'Manchette avec carpes koï et cerisiers',
  'Tatouage minimaliste constellation',
  'Dragon asiatique sur l\'épaule',
  'Ancre marine classique',
  'Sakura japonais sur le bras',
];

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().split('T')[0];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function phoneFormat() {
  return `+33 6 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`;
}

async function cleanup(supabaseClient, studioId) {
  console.log('🧹 Nettoyage des données DEMO...\n');

  const { error: errApt } = await supabaseClient
    .from('inkflow_appointments')
    .delete()
    .eq('studio_id', studioId)
    .like('id', `${ID_PREFIX}%`);

  if (errApt) {
    console.error('Appointments:', errApt.message);
    return false;
  }

  const { error: errBk } = await supabaseClient
    .from('inkflow_bookings')
    .delete()
    .eq('studio_id', studioId)
    .like('id', `${ID_PREFIX}%`);

  if (errBk) {
    console.error('Bookings:', errBk.message);
    return false;
  }

  const { error: errCl } = await supabaseClient
    .from('inkflow_clients')
    .delete()
    .eq('studio_id', studioId)
    .like('id', `${ID_PREFIX}%`);

  if (errCl) {
    console.error('Clients:', errCl.message);
    return false;
  }

  console.log('✓ Données DEMO supprimées (clients, appointments, bookings)\n');
  return true;
}

async function main() {
  const isClean = process.argv.includes('--clean');

  console.log('🌱 Seed Mode Démo Marketing — InkFlow\n');
  console.log('Cible :', EMAIL, '\n');

  const { data: studio, error: studioErr } = await supabase
    .from('inkflow_studios')
    .select('id, slug')
    .eq('email', EMAIL)
    .maybeSingle();

  if (studioErr || !studio) {
    console.error('Studio introuvable pour', EMAIL, studioErr?.message || '');
    process.exit(1);
  }

  const STUDIO_ID = studio.id;
  console.log('✓ Studio trouvé:', STUDIO_ID, '(' + (studio.slug || '') + ')\n');

  if (isClean) {
    const ok = await cleanup(supabase, STUDIO_ID);
    process.exit(ok ? 0 : 1);
  }

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // === 0. CLIENTS — Unsplash + stats en paliers (crédible en mockup)
  const clients = [];
  for (let i = 0; i < FAKE_CLIENTS.length; i++) {
    const c = FAKE_CLIENTS[i];
    const s = clientStatsForDemo(i, today);

    clients.push({
      id: `${ID_PREFIX}cl_${i + 1}`,
      studio_id: STUDIO_ID,
      name: c.name,
      email: c.email,
      phone: phoneFormat(),
      avatar_url: c.avatar,
      total_spent: s.totalSpent,
      appointments_count: s.aptCount,
      first_visit: s.first_visit,
      last_visit: s.last_visit,
      status: s.status,
      tags: s.tags,
      tattoos: [],
      updated_at: now,
    });
  }

  for (const c of clients) {
    const { error } = await supabase.from('inkflow_clients').upsert(c, { onConflict: 'id' });
    if (error) console.error('Client', c.id, error.message);
  }
  console.log('✓', clients.length, 'clients (avec photos de profil)');

  // === 1. BOOKINGS (~35) — fausses demandes RDV vitrine avec photos (majorité pending) ===
  const bookings = [];
  const usedBkSlots = new Set();
  for (let i = 1; i <= 35; i++) {
    const dayOffset = randomInt(-7, 21);
    const date = addDays(today, dayOffset);
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    const time = pick(times);
    const slotKey = `${date}-${time}-${i}`;
    if (usedBkSlots.has(slotKey)) continue;
    usedBkSlots.add(slotKey);

    const client = pick(clients);
    const statuses = ['pending', 'pending', 'pending', 'pending', 'confirmed', 'accepted', 'rejected'];
    const status = pick(statuses);

    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - randomInt(0, 5));
    bookings.push({
      id: `${ID_PREFIX}bk_${i}`,
      studio_id: STUDIO_ID,
      client_name: client.name,
      client_email: client.email,
      description: pick(DESCRIPTIONS),
      requested_date: date,
      requested_time: time,
      status,
      created_at: createdDate.toISOString(),
      updated_at: now,
    });
  }

  for (const b of bookings) {
    const { error } = await supabase.from('inkflow_bookings').upsert(b, { onConflict: 'id' });
    if (error) console.error('Booking', b.id, error.message);
  }
  console.log('✓', bookings.length, 'bookings (demandes RDV)');

  // === 2. APPOINTMENTS (~50) — RDV avec clients liés, dont ~18 en attente (Demandes) ===
  const appointments = [];
  const usedAptSlots = new Set();
  const pendingCount = 18;
  let pendingCreated = 0;
  for (let i = 1; i <= 50; i++) {
    const dayOffset = i <= pendingCount ? randomInt(0, 14) : randomInt(-45, -1);
    const date = addDays(today, dayOffset);
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    const time = pick(times);
    const slotKey = `${date}-${time}`;
    if (usedAptSlots.has(slotKey)) continue;
    usedAptSlots.add(slotKey);

    const client = pick(clients);
    const deposit = randomInt(50, 200);
    const price = deposit + randomInt(80, 450);
    const depositPaid = Math.random() > 0.2;
    const status = pendingCreated < pendingCount ? 'pending' : (Math.random() > 0.15 ? 'completed' : (depositPaid ? 'confirmed' : 'pending'));
    if (status === 'pending') pendingCreated++;

    appointments.push({
      id: `${ID_PREFIX}apt_${i}`,
      studio_id: STUDIO_ID,
      client_id: client.id,
      client_name: client.name,
      client_email: client.email,
      client_phone: client.phone,
      date,
      time,
      service: pick(SERVICES),
      duration: randomInt(60, 240),
      price,
      deposit,
      deposit_paid: depositPaid,
      status,
      tattoo_type: Math.random() > 0.5 ? 'flash' : 'custom',
      flash_id: null,
      location: pick(['arm', 'leg', 'back', 'chest', 'shoulder']),
      size: pick(['small', 'medium', 'large']),
      consent_form_signed: status === 'completed',
      updated_at: now,
    });
  }

  for (const a of appointments) {
    const { error } = await supabase.from('inkflow_appointments').upsert(a, { onConflict: 'id' });
    if (error) console.error('Appointment', a.id, error.message);
  }
  console.log('✓', appointments.length, 'appointments (RDV)');

  const totalRevenue = appointments
    .filter((a) => a.status === 'completed')
    .reduce((s, a) => s + Number(a.price), 0);
  const monthlyRev = appointments
    .filter((a) => a.status === 'completed' && a.date >= addDays(today, -30))
    .reduce((s, a) => s + Number(a.price), 0);

  console.log('\n📊 Stats générées :');
  console.log('   Revenu total (completed):', totalRevenue, '€');
  console.log('   Revenu dernier mois:', monthlyRev, '€');
  console.log('   Clients:', clients.length, '(avec photos)');
  console.log('\n✅ Seed terminé. Connecte-toi avec', EMAIL, 'pour les captures marketing.');
  console.log('\n💡 Pour supprimer : node --env-file=.env.local scripts/seed-demo-marketing.mjs --clean');
}

main().catch(console.error);
