-- Adresses à ne plus contacter (bounces Resend, plaintes spam, désinscription marketing).
-- RLS : aucune policy = accès refusé sauf service_role (Edge Functions).

create table if not exists public.email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  reason text,
  source text,
  created_at timestamptz not null default now()
);

comment on table public.email_suppressions is
  'Emails bloqués pour envois marketing / suivi (bounce, complaint, unsubscribe).';

create index if not exists email_suppressions_email_lower_idx on public.email_suppressions (lower(email));

alter table public.email_suppressions enable row level security;

grant select, insert, update, delete on table public.email_suppressions to service_role;
