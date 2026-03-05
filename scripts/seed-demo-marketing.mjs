/**
 * Seed Mode Démo Marketing — InkFlow
 * Peuple le studio noamdj02@gmail.com avec des fausses données valorisantes
 * pour captures d'écran et vidéos promotionnelles.
 *
 * Marqueur : préfixe "demo_" dans les IDs + "DEMO_" dans description (bookings)
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

// Noms et emails réalistes
const FAKE_CLIENTS = [
  { name: 'Sophie Martin', email: 'sophie.martin@email.com' },
  { name: 'Thomas Dubois', email: 'thomas.dubois@email.com' },
  { name: 'Emma Lemaire', email: 'emma.lemaire@email.com' },
  { name: 'Lucas Bernard', email: 'lucas.bernard@email.com' },
  { name: 'Chloé Petit', email: 'chloe.petit@email.com' },
  { name: 'Hugo Moreau', email: 'hugo.moreau@email.com' },
  { name: 'Léa Laurent', email: 'lea.laurent@email.com' },
  { name: 'Nathan Simon', email: 'nathan.simon@email.com' },
  { name: 'Manon Michel', email: 'manon.michel@email.com' },
  { name: 'Enzo Lefebvre', email: 'enzo.lefebvre@email.com' },
  { name: 'Julie Roux', email: 'julie.roux@email.com' },
  { name: 'Louis David', email: 'louis.david@email.com' },
  { name: 'Camille Bertrand', email: 'camille.bertrand@email.com' },
  { name: 'Raphaël Garnier', email: 'raphael.garnier@email.com' },
  { name: 'Océane Faure', email: 'oceane.faure@email.com' },
  { name: 'Arthur Mercier', email: 'arthur.mercier@email.com' },
  { name: 'Inès Rousseau', email: 'ines.rousseau@email.com' },
  { name: 'Jules Vincent', email: 'jules.vincent@email.com' },
  { name: 'Margot Fournier', email: 'margot.fournier@email.com' },
];

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

  console.log('✓ Données DEMO supprimées (appointments + bookings)\n');
  return true;
}

async function main() {
  const isClean = process.argv.includes('--clean');

  console.log('🌱 Seed Mode Démo Marketing — InkFlow\n');
  console.log('Cible :', EMAIL, '\n');

  // Récupérer le studio
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

  // === 1. BOOKINGS (~20) — répartis sur le mois dernier + semaine en cours ===
  const bookings = [];
  const usedSlots = new Set();
  for (let i = 1; i <= 20; i++) {
    const dayOffset = randomInt(-28, 7);
    const date = addDays(today, dayOffset);
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    const time = pick(times);
    const slotKey = `${date}-${time}`;
    if (usedSlots.has(slotKey)) continue;
    usedSlots.add(slotKey);

    const client = pick(FAKE_CLIENTS);
    const statuses = ['pending', 'pending', 'pending', 'confirmed', 'accepted', 'rejected'];
    const status = pick(statuses);

    bookings.push({
      id: `${ID_PREFIX}bk_${i}`,
      studio_id: STUDIO_ID,
      client_name: client.name,
      client_email: client.email,
      description: `DEMO_ ${pick(DESCRIPTIONS)}`,
      requested_date: date,
      requested_time: time,
      status,
      updated_at: now,
    });
  }

  for (const b of bookings) {
    const { error } = await supabase.from('inkflow_bookings').upsert(b, { onConflict: 'id' });
    if (error) console.error('Booking', b.id, error.message);
  }
  console.log('✓', bookings.length, 'bookings (demandes RDV)');

  // === 2. APPOINTMENTS (~20) — montants 50€-300€, répartis mois dernier + semaine ===
  const appointments = [];
  const usedAptSlots = new Set();
  for (let i = 1; i <= 20; i++) {
    // Répartition : 70% mois dernier + 30% semaine en cours (pour historique + à venir)
    const dayOffset = Math.random() > 0.3 ? randomInt(-28, -1) : randomInt(0, 7);
    const date = addDays(today, dayOffset);
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    const time = pick(times);
    const slotKey = `${date}-${time}`;
    if (usedAptSlots.has(slotKey)) continue;
    usedAptSlots.add(slotKey);

    const client = pick(FAKE_CLIENTS);
    const deposit = randomInt(50, 300);
    const price = deposit + randomInt(50, 400);
    const depositPaid = Math.random() > 0.25;
    const status = Math.random() > 0.15 ? 'completed' : (depositPaid ? 'confirmed' : 'pending');

    appointments.push({
      id: `${ID_PREFIX}apt_${i}`,
      studio_id: STUDIO_ID,
      client_id: null,
      client_name: client.name,
      client_email: client.email,
      client_phone: `+33 6 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
      date,
      time,
      service: pick(SERVICES),
      duration: randomInt(60, 180),
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
  console.log('\n✅ Seed terminé. Connecte-toi avec', EMAIL, 'pour les captures marketing.');
  console.log('\n💡 Pour supprimer ces données : node --env-file=.env.local scripts/seed-demo-marketing.mjs --clean');
}

main().catch(console.error);
