/**
 * Seed des données factices pour le compte noamdj02@gmail.com (mockups marketing).
 * Utilise SUPABASE_SERVICE_ROLE_KEY pour bypasser RLS.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-mockup-data.mjs
 * ou:
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-mockup-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Charger .env.local si pas déjà défini
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

const EMAIL = 'noamdj02@gmail.com';
const STUDIO_NAME = 'InkFlow Studio';
const STUDIO_SLUG = STUDIO_NAME.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
const DEFAULT_STUDIO_ID = `${EMAIL}::${STUDIO_SLUG}`;

const now = new Date().toISOString();
const today = now.split('T')[0];

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().split('T')[0];
}

async function main() {
  console.log('🌱 Seed mockup pour', EMAIL, '...\n');

  // 0. Récupérer ou créer le studio
  let STUDIO_ID = DEFAULT_STUDIO_ID;
  const { data: existingStudio } = await supabase
    .from('inkflow_studios')
    .select('id, slug')
    .eq('email', EMAIL)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingStudio?.id) {
    STUDIO_ID = existingStudio.id;
    console.log('✓ Studio existant trouvé:', existingStudio.id, '(' + (existingStudio.slug || '') + ')');
  }

  // 1. Studio (créer/mettre à jour si pas existant)
  const { error: studioErr } = await supabase.from('inkflow_studios').upsert(
    {
      id: STUDIO_ID,
      email: EMAIL,
      name: 'Noam',
      studio_name: STUDIO_NAME,
      slug: existingStudio?.slug || 'inkflow-studio',
      updated_at: now,
    },
    { onConflict: 'id' }
  );
  if (studioErr) {
    console.error('Studio:', studioErr.message);
    return;
  }
  if (!existingStudio) console.log('✓ Studio créé');

  // 2. Clients
  const clients = [
    { id: 'cl_mock_1', name: 'Jeanne Martin', email: 'jeanne.m@example.com', phone: '+33 6 12 34 56 78', total_spent: 450, appointments_count: 3, first_visit: addDays(today, -90), last_visit: addDays(today, -14), status: 'active', tags: ['VIP'], tattoos: [] },
    { id: 'cl_mock_2', name: 'Marc Dubois', email: 'marc.d@example.com', phone: '+33 6 23 45 67 89', total_spent: 280, appointments_count: 2, first_visit: addDays(today, -60), last_visit: addDays(today, -7), status: 'active', tags: [], tattoos: [] },
    { id: 'cl_mock_3', name: 'Léa Rousseau', email: 'lea.r@example.com', phone: '+33 6 45 67 89 01', total_spent: 150, appointments_count: 1, first_visit: addDays(today, -30), last_visit: addDays(today, -30), status: 'active', tags: ['Nouveau'], tattoos: [] },
    { id: 'cl_mock_4', name: 'Sophie Bernard', email: 'sophie.b@example.com', phone: '+33 6 78 90 12 34', total_spent: 1200, appointments_count: 3, first_visit: addDays(today, -180), last_visit: addDays(today, -3), status: 'vip', tags: ['VIP', 'Fidèle'], tattoos: [] },
    { id: 'cl_mock_5', name: 'Thomas Petit', email: 'thomas.p@example.com', phone: '+33 6 90 12 34 56', total_spent: 0, appointments_count: 0, first_visit: today, last_visit: null, status: 'active', tags: ['Prospect'], tattoos: [] },
  ];

  for (const c of clients) {
    const row = {
      id: c.id,
      studio_id: STUDIO_ID,
      name: c.name,
      email: c.email,
      phone: c.phone,
      total_spent: c.total_spent,
      appointments_count: c.appointments_count,
      first_visit: c.first_visit,
      last_visit: c.last_visit,
      status: c.status,
      tags: c.tags,
      tattoos: c.tattoos,
      updated_at: now,
    };
    const { error } = await supabase.from('inkflow_clients').upsert(row, { onConflict: 'id' });
    if (error) console.error('Client', c.id, error.message);
  }
  console.log('✓', clients.length, 'clients');

  // 3. Appointments (RDV)
  const appointments = [
    { id: 'apt_mock_1', client_id: 'cl_mock_1', client_name: 'Jeanne Martin', client_email: 'jeanne.m@example.com', client_phone: '+33 6 12 34 56 78', date: addDays(today, 2), time: '14:00', service: 'Flash Lune — 150€', duration: 90, price: 150, deposit: 50, deposit_paid: true, status: 'confirmed', tattoo_type: 'flash', flash_id: 'flash_mock_1', location: 'arm', size: 'small', consent_form_signed: true },
    { id: 'apt_mock_2', client_id: 'cl_mock_2', client_name: 'Marc Dubois', client_email: 'marc.d@example.com', client_phone: '+33 6 23 45 67 89', date: addDays(today, 3), time: '10:00', service: 'Manchette Japonaise', duration: 240, price: 400, deposit: 100, deposit_paid: false, status: 'pending', tattoo_type: 'custom', flash_id: null, location: 'arm', size: 'large', consent_form_signed: false },
    { id: 'apt_mock_3', client_id: 'cl_mock_3', client_name: 'Léa Rousseau', client_email: 'lea.r@example.com', client_phone: '+33 6 45 67 89 01', date: today, time: '16:00', service: 'Petit motif — 80€', duration: 60, price: 80, deposit: 30, deposit_paid: true, status: 'confirmed', tattoo_type: 'flash', flash_id: 'flash_mock_2', location: 'leg', size: 'small', consent_form_signed: true },
    { id: 'apt_mock_4', client_id: 'cl_mock_4', client_name: 'Sophie Bernard', client_email: 'sophie.b@example.com', client_phone: '+33 6 78 90 12 34', date: addDays(today, -5), time: '11:00', service: 'Dos complet — consultation', duration: 60, price: 0, deposit: 0, deposit_paid: false, status: 'completed', tattoo_type: 'custom', flash_id: null, location: 'back', size: 'extra_large', consent_form_signed: false },
    { id: 'apt_mock_5', client_id: 'cl_mock_1', client_name: 'Jeanne Martin', client_email: 'jeanne.m@example.com', client_phone: '+33 6 12 34 56 78', date: addDays(today, 7), time: '09:00', service: 'Bras Japonais — Carpe Koï', duration: 300, price: 600, deposit: 150, deposit_paid: false, status: 'pending', tattoo_type: 'custom', flash_id: null, location: 'arm', size: 'large', consent_form_signed: false },
  ];

  for (const a of appointments) {
    const row = {
      id: a.id,
      studio_id: STUDIO_ID,
      client_id: a.client_id,
      client_name: a.client_name,
      client_email: a.client_email,
      client_phone: a.client_phone,
      date: a.date,
      time: a.time,
      service: a.service,
      duration: a.duration,
      price: a.price,
      deposit: a.deposit,
      deposit_paid: a.deposit_paid,
      status: a.status,
      tattoo_type: a.tattoo_type,
      flash_id: a.flash_id,
      location: a.location,
      size: a.size,
      consent_form_signed: a.consent_form_signed,
      updated_at: now,
    };
    const { error } = await supabase.from('inkflow_appointments').upsert(row, { onConflict: 'id' });
    if (error) console.error('Appointment', a.id, error.message);
  }
  console.log('✓', appointments.length, 'rendez-vous');

  // 4. Flash designs
  const flashDesigns = [
    { id: 'flash_mock_1', title: 'Lune', description: 'Flash lune stylisée', image_url: null, price: 150, deposit_amount: 50, available: true, reserved: false, category: 'minimaliste', size: 'small', placement: [], estimated_duration: 90, tags: ['lune', 'minimaliste'] },
    { id: 'flash_mock_2', title: 'Fleur de cerisier', description: 'Sakura japonais', image_url: null, price: 80, deposit_amount: 30, available: true, reserved: false, category: 'japonais', size: 'small', placement: [], estimated_duration: 60, tags: ['fleur', 'japonais'] },
    { id: 'flash_mock_3', title: 'Dragon', description: 'Dragon asiatique', image_url: null, price: 250, deposit_amount: 80, available: true, reserved: false, category: 'traditionnel', size: 'medium', placement: [], estimated_duration: 120, tags: ['dragon', 'traditionnel'] },
    { id: 'flash_mock_4', title: 'Ancre marine', description: 'Ancre classique', image_url: null, price: 120, deposit_amount: 40, available: true, reserved: false, category: 'classique', size: 'small', placement: [], estimated_duration: 75, tags: ['ancre', 'marine'] },
  ];

  for (const f of flashDesigns) {
    const row = {
      id: f.id,
      studio_id: STUDIO_ID,
      title: f.title,
      description: f.description,
      image_url: f.image_url,
      price: f.price,
      deposit_amount: f.deposit_amount,
      available: f.available,
      reserved: f.reserved,
      category: f.category,
      size: f.size,
      placement: f.placement,
      estimated_duration: f.estimated_duration,
      tags: f.tags,
      updated_at: now,
    };
    const { error } = await supabase.from('inkflow_flash_designs').upsert(row, { onConflict: 'id' });
    if (error) console.error('Flash', f.id, error.message);
  }
  console.log('✓', flashDesigns.length, 'flash designs');

  // 5. Bookings (demandes RDV depuis vitrine) — avec images de référence
  const bookings = [
    { id: 'bk_mock_1', client_name: 'Emma Laurent', client_email: 'emma.l@example.com', description: 'Je souhaite un Flash Lune sur l\'avant-bras droit. Style minimaliste, lignes fines.', requested_date: addDays(today, 5), requested_time: '14:00', status: 'pending', reference_images: ['https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400&h=400&fit=crop'] },
    { id: 'bk_mock_2', client_name: 'Pierre Moreau', client_email: 'pierre.m@example.com', description: 'Consultation pour un dos japonais — carpes koï et vagues. Grande pièce.', requested_date: addDays(today, 10), requested_time: null, status: 'pending', reference_images: ['https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&h=400&fit=crop'] },
    { id: 'bk_mock_3', client_name: 'Chloé Lefebvre', client_email: 'chloe.l@example.com', description: 'Petit motif fleur de cerisier — 80€. Zone poignet ou cheville.', requested_date: addDays(today, 4), requested_time: '11:00', status: 'accepted', reference_images: ['https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&h=400&fit=crop'] },
  ];

  for (const b of bookings) {
    const row = {
      id: b.id,
      studio_id: STUDIO_ID,
      client_name: b.client_name,
      client_email: b.client_email,
      description: b.description,
      requested_date: b.requested_date,
      requested_time: b.requested_time,
      status: b.status,
      reference_images: b.reference_images || [],
      updated_at: now,
    };
    const { error } = await supabase.from('inkflow_bookings').upsert(row, { onConflict: 'id' });
    if (error) console.error('Booking', b.id, error.message);
  }
  console.log('✓', bookings.length, 'demandes RDV (bookings)');

  // 6. Project requests (demandes de projet) — avec images Unsplash pour aperçu visuel
  const projectRequests = [
    { id: 'pr_mock_1', client_name: 'Julie Garnier', client_email: 'julie.g@example.com', client_instagram: '@julie.tattoo', description: 'Je voudrais une manchette japonaise avec carpes koï et cerisiers. Style traditionnel, couleurs subtiles.', placement: 'Bras droit', size: '15-25 cm', budget: '400-600€', status: 'PENDING', reference_images: ['https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&h=400&fit=crop'] },
    { id: 'pr_mock_2', client_name: 'Antoine Roux', client_email: 'antoine.r@example.com', client_instagram: null, description: 'Flash dragon sur l\'épaule gauche. Style néo-traditionnel, lignes nettes.', placement: 'Épaule gauche', size: '10-15 cm', budget: '200-300€', status: 'PENDING', reference_images: ['https://images.unsplash.com/photo-1590246814883-57c511e76917?w=400&h=400&fit=crop'] },
    { id: 'pr_mock_3', client_name: 'Marie Simon', client_email: 'marie.s@example.com', client_instagram: '@marie.ink', description: 'Tatouage minimaliste — constellation au poignet. Lignes fines, points discrets.', placement: 'Poignet', size: '5-10 cm', budget: '80-120€', status: 'PENDING', reference_images: ['https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400&h=400&fit=crop'] },
  ];

  for (const p of projectRequests) {
    const row = {
      id: p.id,
      studio_id: STUDIO_ID,
      client_name: p.client_name,
      client_email: p.client_email,
      client_instagram: p.client_instagram,
      description: p.description,
      placement: p.placement,
      size: p.size,
      budget: p.budget,
      status: p.status,
      reference_images: p.reference_images,
      created_at: now,
    };
    const { error } = await supabase.from('inkflow_project_requests').upsert(row, { onConflict: 'id' });
    if (error) console.error('Project request', p.id, error.message);
  }
  console.log('✓', projectRequests.length, 'demandes de projet');

  // 7. Notifications
  const notifications = [
    { id: 'notif_mock_1', type: 'booking', title: 'Nouvelle demande RDV', message: 'Emma Laurent souhaite un Flash Lune le ' + addDays(today, 5), read: false, action_url: null },
    { id: 'notif_mock_2', type: 'reminder', title: 'RDV demain', message: 'Léa Rousseau — Petit motif à 16h', read: false, action_url: null },
    { id: 'notif_mock_3', type: 'payment', title: 'Acompte non reçu', message: '3 RDV sans acompte payé', read: false, action_url: null },
    { id: 'notif_mock_4', type: 'project', title: 'Nouvelle demande de projet', message: 'Julie Garnier — Manchette japonaise', read: false, action_url: null },
    { id: 'notif_mock_5', type: 'info', title: 'Bienvenue sur InkFlow', message: 'Votre studio est prêt. Explorez le dashboard.', read: true, action_url: null },
  ];

  for (const n of notifications) {
    const row = {
      id: n.id,
      studio_id: STUDIO_ID,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      action_url: n.action_url,
      created_at: now,
    };
    const { error } = await supabase.from('inkflow_notifications').upsert(row, { onConflict: 'id' });
    if (error) console.error('Notification', n.id, error.message);
  }
  console.log('✓', notifications.length, 'notifications');

  console.log('\n✅ Seed terminé. Connecte-toi avec noamdj02@gmail.com pour voir les mockups.');
}

main().catch(console.error);
