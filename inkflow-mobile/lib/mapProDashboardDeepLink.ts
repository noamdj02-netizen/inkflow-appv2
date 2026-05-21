const DEFAULT_WEB_APP_ORIGIN = 'https://app.ink-flow.me';

/** Cible `inkflowpro://<host>` ou chemin → query dashboard web (aligné `DashboardPro` allowed tabs). */
const HOST_TO_DASHBOARD: Record<string, { tab?: string; open?: string }> = {
  agenda: { tab: 'agenda' },
  calendar: { tab: 'agenda' },
  planning: { tab: 'appointments' },
  appointments: { tab: 'appointments' },
  appointment: { tab: 'appointments' },
  requests: { tab: 'requests' },
  demandes: { tab: 'requests' },
  stock: { tab: 'stock' },
  messaging: { open: 'messaging' },
  messages: { open: 'messaging' },
  finance: { tab: 'finance' },
  clients: { tab: 'clients' },
  overview: { tab: 'overview' },
  dashboard: { tab: 'overview' },
  home: { tab: 'overview' },
  analytics: { tab: 'analytics' },
  stats: { tab: 'analytics' },
  flash: { tab: 'flash' },
  portfolio: { tab: 'portfolio' },
  settings: { tab: 'settings' },
  notifications: { tab: 'notifications' },
  account: { tab: 'account' },
  etablissement: { tab: 'etablissement' },
};

export function resolveWebAppOrigin(): string {
  const raw = (process.env.EXPO_PUBLIC_WEB_APP_URL ?? DEFAULT_WEB_APP_ORIGIN).trim();
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
    return u.origin;
  } catch {
    return DEFAULT_WEB_APP_ORIGIN;
  }
}

export function resolveWebAppDashboardUrl(): string {
  const origin = resolveWebAppOrigin();
  return `${origin}/dashboard`;
}

export function buildAllowedWebHosts(): Set<string> {
  const hosts = new Set(['app.ink-flow.me', 'ink-flow.me']);
  try {
    const host = new URL(resolveWebAppOrigin()).hostname.replace(/\.+$/, '').toLowerCase();
    if (host) hosts.add(host);
  } catch {
    /* ignore */
  }
  if (__DEV__) {
    hosts.add('localhost');
    hosts.add('127.0.0.1');
  }
  return hosts;
}

/**
 * `inkflowpro://agenda`, `inkflowpro://appointment/<id>`, ou URL https app déjà autorisée.
 */
export function mapProDashboardDeepLink(url: string, allowedHosts: Set<string>): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      const host = parsed.hostname.replace(/\.+$/, '').toLowerCase();
      if (allowedHosts.has(host) && parsed.pathname.startsWith('/dashboard')) {
        return parsed.toString();
      }
      return null;
    }

    if (parsed.protocol !== 'inkflowpro:') {
      return null;
    }

    const target = (parsed.hostname || parsed.pathname.split('/').filter(Boolean)[0] || '')
      .toLowerCase()
      .trim();
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const firstPathPart = pathParts[0]?.toLowerCase();
    const secondPathPart = pathParts[1];

    const appointmentHosts = new Set(['appointment', 'appointments', 'session']);
    const appointmentId = appointmentHosts.has(target)
      ? firstPathPart || secondPathPart
      : appointmentHosts.has(firstPathPart ?? '')
        ? secondPathPart
        : null;

    const mapped = new URL('/dashboard', resolveWebAppOrigin());
    const mapping = HOST_TO_DASHBOARD[target];
    if (mapping?.tab) mapped.searchParams.set('tab', mapping.tab);
    if (mapping?.open) mapped.searchParams.set('open', mapping.open);

    if (appointmentId) {
      mapped.searchParams.set('appointment', appointmentId);
    }

    for (const [key, value] of parsed.searchParams.entries()) {
      if (!mapped.searchParams.has(key)) mapped.searchParams.set(key, value);
    }

    return mapped.toString();
  } catch {
    return null;
  }
}
