// ============================================
// 🔒 MIDDLEWARE SÉCURITÉ - InkFlow
// middleware.ts (Next.js 13+)
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ============================================
  // 1. SECURITY HEADERS
  // ============================================

  // Strict Transport Security (force HTTPS)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.ink-flow.me;
    frame-ancestors 'self';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

// Routes où appliquer le middleware
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


// ============================================
// 🛡️ RATE LIMITING
// lib/rate-limit.ts
// ============================================

import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (token: string, limit: number) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Usage dans une API route :
/*
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    await limiter.check(ip, 10); // 10 requêtes par minute max
  } catch {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Votre logique ici
}
*/


// ============================================
// 🔐 INPUT VALIDATION
// lib/validation.ts
// ============================================

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Schema pour l'inscription
export const signupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Une majuscule requise')
    .regex(/[a-z]/, 'Une minuscule requise')
    .regex(/[0-9]/, 'Un chiffre requis')
    .regex(/[^A-Za-z0-9]/, 'Un caractère spécial requis'),
  studioName: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères')
    .regex(/^[a-zA-Z0-9\s\-']+$/, 'Caractères non autorisés'),
});

// Schema pour rendez-vous
export const appointmentSchema = z.object({
  clientName: z.string().min(2).max(100),
  clientEmail: z.string().email(),
  clientPhone: z.string().regex(/^[0-9\s\-\+\(\)]{10,20}$/),
  date: z.string().datetime(),
  duration: z.number().min(30).max(480),
  notes: z.string().max(1000).optional(),
});

// Sanitize HTML user input
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

// Sanitize plain text
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .substring(0, 10000); // Max length
}

// Usage :
/*
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validation
  const validated = signupSchema.parse(body);
  
  // Sanitization
  const cleanName = sanitizeText(validated.studioName);
  
  // Utiliser validated et cleanName...
}
*/


// ============================================
// 🔑 AUTHENTICATION HELPERS
// lib/auth.ts
// ============================================

import { hash, compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 12;

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: object, expiresIn = '7d'): string {
  return sign(payload, JWT_SECRET, { expiresIn });
}

// Verify JWT token
export function verifyToken<T = any>(token: string): T {
  return verify(token, JWT_SECRET) as T;
}

// Generate refresh token
export function generateRefreshToken(userId: string): string {
  return sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });
}

// Middleware pour routes protégées
export async function requireAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Non autorisé');
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch {
    throw new Error('Token invalide');
  }
}

// Usage dans API route :
/*
export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    // user est authentifié
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
*/


// ============================================
// 📁 FILE UPLOAD SÉCURISÉ
// lib/upload.ts
// ============================================

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.',
    };
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Fichier trop volumineux. Maximum 10MB.',
    };
  }

  return { valid: true };
}

export function generateSecureFilename(originalName: string): string {
  const extension = originalName.split('.').pop();
  const randomString = crypto.randomUUID();
  return `${randomString}.${extension}`;
}

// Vérifier que c'est vraiment une image (pas juste l'extension)
export async function verifyImageFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }
      
      // Check magic numbers
      const jpegMagic = 'ffd8ff';
      const pngMagic = '89504e47';
      const webpMagic = '52494646'; // RIFF
      
      resolve(
        header.startsWith(jpegMagic) ||
        header.startsWith(pngMagic) ||
        header.startsWith(webpMagic)
      );
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}


// ============================================
// 🚫 CSRF PROTECTION
// lib/csrf.ts
// ============================================

import { randomBytes } from 'crypto';

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}

// Usage dans API route :
/*
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const csrfToken = request.headers.get('x-csrf-token');
  const storedToken = cookieStore.get('csrf-token')?.value;

  if (!csrfToken || !storedToken || csrfToken !== storedToken) {
    return new Response('CSRF validation failed', { status: 403 });
  }

  // Continuer...
}
*/


// ============================================
// 📊 SECURITY LOGGING
// lib/security-logger.ts
// ============================================

type SecurityEvent = {
  type: 'login_attempt' | 'login_failed' | 'unauthorized_access' | 'rate_limit_exceeded';
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details?: any;
};

export function logSecurityEvent(event: SecurityEvent) {
  // Log to your logging service (Sentry, LogRocket, etc.)
  console.log('[SECURITY]', JSON.stringify(event));
  
  // Alert si critique
  if (event.type === 'unauthorized_access') {
    // Envoyer alerte (email, Slack, etc.)
  }
}

// Usage :
/*
logSecurityEvent({
  type: 'login_failed',
  userId: email,
  ip: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown',
  timestamp: new Date(),
  details: { reason: 'Invalid password' },
});
*/


// ============================================
// ✅ CHECKLIST D'IMPLÉMENTATION
// ============================================

/*
□ Copier middleware.ts à la racine du projet
□ Installer dépendances : npm install lru-cache bcrypt jsonwebtoken zod isomorphic-dompurify
□ Créer JWT_SECRET dans .env (générer avec: openssl rand -base64 32)
□ Implémenter rate limiting sur routes sensibles (/api/auth/login, /api/auth/signup)
□ Ajouter validation Zod sur tous les formulaires
□ Sanitizer tous les inputs utilisateurs
□ Utiliser bcrypt pour hasher les passwords
□ Implémenter CSRF tokens sur formulaires
□ Valider les uploads de fichiers
□ Configurer CSP selon vos domaines externes
□ Activer HTTPS en production
□ Tester avec : npm audit, Lighthouse Security
*/
