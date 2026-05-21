/**
 * Seed — rendez-vous factices pour tout le mois de mai 2026
 * Compte cible : noamdj02@gmail.com (auth.users + inkflow_studios)
 *
 * Usage :
 *   npm run seed:mai-2026
 *   npm run seed:mai-2026 -- --clean
 *
 * Prérequis (.env.local) :
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { Database } from '../types/database.js';

type AppointmentInsert = Database['public']['Tables']['inkflow_appointments']['Insert'];
type ClientInsert = Database['public']['Tables']['inkflow_clients']['Insert'];

const OWNER_EMAIL = 'noamdj02@gmail.com';
const ID_PREFIX = 'seed_mai_';
const MAY_YEAR = 2026;
const MAY_MONTH = 5; // 1–31 mai
const TARGET_COUNT = 20; // entre 15 et 25

const SLOT_TIMES = ['09:00', '10:30', '14:00', '15:30', '17:00'] as const;

type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface FakeClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string;
}

function loadEnv(): void {
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

function unsplashFace(photoSlug: string): string {
  return `https://images.unsplash.com/${photoSlug}?w=400&h=400&fit=crop&crop=faces&auto=format&q=86`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function statusForMayDay(day: number): AppointmentStatus {
  // Référence « aujourd’hui » : 18 mai 2026 (MVP)
  if (day < 12) return 'completed';
  if (day < 18) return day % 3 === 0 ? 'cancelled' : 'completed';
  if (day === 18) return 'in_progress';
  if (day < 24) return day % 4 === 0 ? 'pending' : 'confirmed';
  return day % 5 === 0 ? 'pending' : 'confirmed';
}

const FAKE_CLIENTS: Omit<FakeClient, 'id' | 'phone'>[] = [
  {
    name: 'Sophie Martin',
    email: 'sophie.martin.seed@example.com',
    avatar_url: unsplashFace('photo-1494790108377-be9c29b29330'),
  },
  {
    name: 'Thomas Dubois',
    email: 'thomas.dubois.seed@example.com',
    avatar_url: unsplashFace('photo-1507003211169-0a1dd7228f2d'),
  },
  {
    name: 'Emma Lemaire',
    email: 'emma.lemaire.seed@example.com',
    avatar_url: unsplashFace('photo-1500648767791-00dcc994a43e'),
  },
  {
    name: 'Lucas Bernard',
    email: 'lucas.bernard.seed@example.com',
    avatar_url: unsplashFace('photo-1534528741775-53994a69daeb'),
  },
  {
    name: 'Chloé Petit',
    email: 'chloe.petit.seed@example.com',
    avatar_url: unsplashFace('photo-1508214751196-bcfd4ca60f91'),
  },
  {
    name: 'Hugo Moreau',
    email: 'hugo.moreau.seed@example.com',
    avatar_url: unsplashFace('photo-1521572267360-ee0c29002914'),
  },
  {
    name: 'Léa Laurent',
    email: 'lea.laurent.seed@example.com',
    avatar_url: unsplashFace('photo-1527980965255-d3b416303d12'),
  },
  {
    name: 'Nathan Simon',
    email: 'nathan.simon.seed@example.com',
    avatar_url: unsplashFace('photo-1438761681033-6461ffad8d80'),
  },
  {
    name: 'Manon Michel',
    email: 'manon.michel.seed@example.com',
    avatar_url: unsplashFace('photo-1524504388940-b1c1722653e1'),
  },
  {
    name: 'Enzo Lefebvre',
    email: 'enzo.lefebvre.seed@example.com',
    avatar_url: unsplashFace('photo-1506794778202-cad84cf45f1d'),
  },
  {
    name: 'Julie Roux',
    email: 'julie.roux.seed@example.com',
    avatar_url: unsplashFace('photo-1472099645785-5658abf4ff4e'),
  },
  {
    name: 'Louis David',
    email: 'louis.david.seed@example.com',
    avatar_url: unsplashFace('photo-1519345182560-3f2917c472ef'),
  },
  {
    name: 'Camille Bertrand',
    email: 'camille.bertrand.seed@example.com',
    avatar_url: unsplashFace('photo-1517841905240-472988babdf9'),
  },
  {
    name: 'Raphaël Garnier',
    email: 'raphael.garnier.seed@example.com',
    avatar_url: unsplashFace('photo-1539578705396-6b6a182fe6f4'),
  },
  {
    name: 'Océane Faure',
    email: 'oceane.faure.seed@example.com',
    avatar_url: unsplashFace('photo-1521119989653-a83eee488004'),
  },
  {
    name: 'Arthur Mercier',
    email: 'arthur.mercier.seed@example.com',
    avatar_url: unsplashFace('photo-1544005313-94ddf0286df2'),
  },
  {
    name: 'Inès Rousseau',
    email: 'ines.rousseau.seed@example.com',
    avatar_url: unsplashFace('photo-1507591064344-4c6ce0b0e8a4'),
  },
  {
    name: 'Jules Vincent',
    email: 'jules.vincent.seed@example.com',
    avatar_url: unsplashFace('photo-1487412720507-e7ab37603c6f'),
  },
  {
    name: 'Margot Fournier',
    email: 'margot.fournier.seed@example.com',
    avatar_url: unsplashFace('photo-1502823403499-6ccfcf4fb453'),
  },
  {
    name: 'Paul Leroy',
    email: 'paul.leroy.seed@example.com',
    avatar_url: unsplashFace('photo-1566492031773-4f4c3a73b0f7'),
  },
];

const TATTOO_BRIEFS: {
  service: string;
  tattoo_type: 'custom' | 'flash';
  location: string;
  size: string;
  duration: number;
  price: number;
  deposit: number;
}[] = [
  {
    service: 'Flash projet bras — lignes fines',
    tattoo_type: 'flash',
    location: 'arm',
    size: 'small',
    duration: 90,
    price: 150,
    deposit: 50,
  },
  {
    service: 'Lignes fines dos — motif botanique',
    tattoo_type: 'custom',
    location: 'back',
    size: 'medium',
    duration: 180,
    price: 320,
    deposit: 80,
  },
  {
    service: 'Manchette japonaise — carpes koï',
    tattoo_type: 'custom',
    location: 'arm',
    size: 'large',
    duration: 240,
    price: 480,
    deposit: 120,
  },
  {
    service: 'Poignet constellation — minimaliste',
    tattoo_type: 'custom',
    location: 'arm',
    size: 'small',
    duration: 60,
    price: 90,
    deposit: 30,
  },
  {
    service: 'Épaule dragon — néo-traditionnel',
    tattoo_type: 'custom',
    location: 'chest',
    size: 'medium',
    duration: 150,
    price: 280,
    deposit: 70,
  },
  {
    service: 'Flash lune — avant-bras',
    tattoo_type: 'flash',
    location: 'arm',
    size: 'small',
    duration: 75,
    price: 120,
    deposit: 40,
  },
  {
    service: 'Cheville sakura — 2h',
    tattoo_type: 'flash',
    location: 'leg',
    size: 'small',
    duration: 120,
    price: 180,
    deposit: 60,
  },
  {
    service: 'Consultation dos complet',
    tattoo_type: 'custom',
    location: 'back',
    size: 'extra_large',
    duration: 60,
    price: 0,
    deposit: 0,
  },
  {
    service: 'Torse géométrique — blackwork',
    tattoo_type: 'custom',
    location: 'chest',
    size: 'large',
    duration: 210,
    price: 420,
    deposit: 100,
  },
  {
    service: 'Flash ancre marine',
    tattoo_type: 'flash',
    location: 'leg',
    size: 'small',
    duration: 90,
    price: 130,
    deposit: 45,
  },
];

function phoneFormat(seed: number): string {
  const a = 10 + (seed % 80);
  const b = 10 + ((seed * 3) % 80);
  const c = 10 + ((seed * 7) % 80);
  const d = 10 + ((seed * 11) % 80);
  return `+33 6 ${a} ${b} ${c} ${d}`;
}

async function resolveAuthUserId(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.warn('⚠ auth.admin.listUsers:', error.message);
    return null;
  }
  const users = data?.users ?? [];
  const user = users.find((u) => (u.email ?? '').trim().toLowerCase() === normalized);
  return user?.id ?? null;
}

async function resolveStudio(
  supabase: SupabaseClient<Database>,
  email: string,
  authUserId: string | null
): Promise<{ id: string; slug: string | null }> {
  const normalized = email.trim().toLowerCase();

  const { data: byEmail, error: emailErr } = await supabase
    .from('inkflow_studios')
    .select('id, slug, email')
    .ilike('email', normalized)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (emailErr) throw new Error(`Studio (email): ${emailErr.message}`);
  if (byEmail?.id) return { id: byEmail.id, slug: byEmail.slug };

  if (authUserId) {
    const { data: byId, error: idErr } = await supabase
      .from('inkflow_studios')
      .select('id, slug')
      .eq('id', authUserId)
      .maybeSingle();
    if (idErr) throw new Error(`Studio (id): ${idErr.message}`);
    if (byId?.id) return { id: byId.id, slug: byId.slug };
  }

  throw new Error(
    `Aucun studio trouvé pour ${email}. Connecte-toi une fois au dashboard ou crée inkflow_studios.`
  );
}

async function cleanup(supabase: SupabaseClient<Database>, studioId: string): Promise<void> {
  console.log('🧹 Suppression des données', ID_PREFIX, '...\n');

  const { error: aptErr } = await supabase
    .from('inkflow_appointments')
    .delete()
    .eq('studio_id', studioId)
    .like('id', `${ID_PREFIX}%`);
  if (aptErr) throw new Error(`RDV: ${aptErr.message}`);

  const { error: clErr } = await supabase
    .from('inkflow_clients')
    .delete()
    .eq('studio_id', studioId)
    .like('id', `${ID_PREFIX}%`);
  if (clErr) throw new Error(`Clients: ${clErr.message}`);

  console.log('✓ Données seed mai 2026 supprimées.\n');
}

/** Un créneau par jour, réparti sur tout le mois (pas plusieurs RDV le même jour). */
function buildMaySlots(count: number): { day: number; time: string }[] {
  const slots: { day: number; time: string }[] = [];
  const step = Math.max(1, Math.floor(31 / count));
  let timeIdx = 0;

  for (let day = 1; day <= 31 && slots.length < count; day += step) {
    slots.push({
      day,
      time: SLOT_TIMES[timeIdx % SLOT_TIMES.length],
    });
    timeIdx += 1;
  }

  for (let day = 1; day <= 31 && slots.length < count; day += 1) {
    if (slots.some((s) => s.day === day)) continue;
    slots.push({
      day,
      time: SLOT_TIMES[slots.length % SLOT_TIMES.length],
    });
  }

  return slots.slice(0, count).sort((a, b) => a.day - b.day);
}

function buildClients(studioId: string, now: string): ClientInsert[] {
  return FAKE_CLIENTS.map((c, i) => ({
    id: `${ID_PREFIX}cl_${i + 1}`,
    studio_id: studioId,
    name: c.name,
    email: c.email,
    phone: phoneFormat(i + 1),
    avatar_url: c.avatar_url,
    total_spent: 0,
    appointments_count: 0,
    first_visit: ymd(MAY_YEAR, MAY_MONTH, 3),
    last_visit: null,
    status: 'active',
    tags: ['Seed mai 2026'],
    tattoos: [],
    updated_at: now,
  }));
}

function buildAppointments(
  studioId: string,
  clients: ClientInsert[],
  now: string
): AppointmentInsert[] {
  const slots = buildMaySlots(TARGET_COUNT);
  const rows: AppointmentInsert[] = [];

  for (let i = 0; i < slots.length; i++) {
    const { day, time } = slots[i];
    const client = clients[i % clients.length];
    const brief = TATTOO_BRIEFS[i % TATTOO_BRIEFS.length];
    const status = statusForMayDay(day);
    const depositPaid =
      status === 'completed' || status === 'in_progress' || (status === 'confirmed' && i % 2 === 0);

    rows.push({
      id: `${ID_PREFIX}apt_${i + 1}`,
      studio_id: studioId,
      client_id: client.id,
      client_name: client.name,
      client_email: client.email,
      client_phone: client.phone ?? null,
      date: ymd(MAY_YEAR, MAY_MONTH, day),
      time,
      service: brief.service,
      duration: brief.duration,
      price: brief.price,
      deposit: brief.deposit,
      deposit_paid: depositPaid,
      status,
      tattoo_type: brief.tattoo_type,
      flash_id: null,
      location: brief.location,
      size: brief.size,
      consent_form_signed: status === 'completed' || status === 'in_progress',
      updated_at: now,
    });
  }

  return rows;
}

async function main(): Promise<void> {
  loadEnv();

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Définir VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local');
    process.exit(1);
  }

  const isClean = process.argv.includes('--clean');
  const supabase = createClient<Database>(url, serviceKey);

  console.log('🌱 Seed rendez-vous — mai 2026\n');
  console.log('Email propriétaire :', OWNER_EMAIL, '\n');

  const authUserId = await resolveAuthUserId(supabase, OWNER_EMAIL);
  if (authUserId) {
    console.log('✓ auth.users id :', authUserId);
  } else {
    console.warn(
      '⚠ Utilisateur auth introuvable pour',
      OWNER_EMAIL,
      '(studio quand même si présent)'
    );
  }

  const studio = await resolveStudio(supabase, OWNER_EMAIL, authUserId);
  console.log('✓ Studio id      :', studio.id, studio.slug ? `(${studio.slug})` : '');
  if (authUserId && studio.id !== authUserId) {
    console.log('  ℹ studio_id ≠ auth user_id (normal si legacy composite id)');
  }
  console.log('');

  if (isClean) {
    await cleanup(supabase, studio.id);
    process.exit(0);
  }

  const now = new Date().toISOString();
  const clientRows = buildClients(studio.id, now);
  const appointmentRows = buildAppointments(studio.id, clientRows, now);

  const { error: clientsErr } = await supabase.from('inkflow_clients').upsert(clientRows, {
    onConflict: 'id',
  });
  if (clientsErr) {
    console.error('Clients:', clientsErr.message);
    process.exit(1);
  }
  console.log('✓', clientRows.length, 'clients (avatar_url Unsplash)');

  const { data: inserted, error: aptErr } = await supabase
    .from('inkflow_appointments')
    .upsert(appointmentRows, { onConflict: 'id' })
    .select('id, date, time, client_name, status, price, deposit, deposit_paid');

  if (aptErr) {
    console.error('Rendez-vous:', aptErr.message);
    if (aptErr.message.includes('idx_appointments_slot_unique')) {
      console.error('→ Créneau déjà pris : relance avec --clean ou change les horaires.');
    }
    process.exit(1);
  }

  console.log('✓', appointmentRows.length, 'rendez-vous injectés (mai 2026)\n');
  console.log('📅 Détail (studio', studio.id, '| user', authUserId ?? 'n/a', '):\n');

  const sorted = [...(inserted ?? [])].sort((a, b) => {
    const d = (a.date ?? '').localeCompare(b.date ?? '');
    return d !== 0 ? d : (a.time ?? '').localeCompare(b.time ?? '');
  });

  for (const row of sorted) {
    const dep = row.deposit_paid ? 'acompte ✓' : 'acompte —';
    console.log(
      `  ${row.date} ${row.time} · ${row.client_name} · ${row.status} · ${row.price}€ (${dep}) · ${row.id}`
    );
  }

  const byStatus = appointmentRows.reduce<Record<string, number>>((acc, a) => {
    const s = a.status ?? 'unknown';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Répartition statuts :', byStatus);
  console.log('\n✅ Terminé. Ouvre /dashboard → Agenda (mai 2026).');
  console.log('💡 Supprimer : npm run seed:mai-2026 -- --clean\n');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
