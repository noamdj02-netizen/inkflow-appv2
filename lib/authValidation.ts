import { z } from 'zod';

const EMAIL_MAX = 320;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 256;
const NAME_MAX = 120;
const STUDIO_NAME_MAX = 120;

export function getLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z
      .string()
      .min(1, t('auth.error.emailRequired'))
      .max(EMAIL_MAX)
      .email(t('auth.error.emailInvalid')),
    password: z.string().min(1, t('auth.error.passwordRequired')).max(PASSWORD_MAX),
  });
}

export function getSignupSchema(t: (key: string) => string) {
  return z
    .object({
      name: z.string().min(1, t('auth.error.nameRequired')).max(NAME_MAX).trim(),
      email: z
        .string()
        .min(1, t('auth.error.emailRequired'))
        .max(EMAIL_MAX)
        .email(t('auth.error.emailInvalid')),
      studioName: z.string().max(STUDIO_NAME_MAX).trim(),
      password: z
        .string()
        .min(PASSWORD_MIN, t('auth.error.passwordMin').replace('{min}', String(PASSWORD_MIN)))
        .max(PASSWORD_MAX),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('auth.error.passwordMismatch'),
      path: ['confirmPassword'],
    });
}

const frAuthFallback = (key: string): string => {
  const map: Record<string, string> = {
    'auth.error.emailRequired': 'Email requis',
    'auth.error.emailInvalid': 'Email invalide',
    'auth.error.passwordRequired': 'Mot de passe requis',
    'auth.error.nameRequired': 'Nom requis',
    'auth.error.passwordMin': 'Minimum 6 caractères',
    'auth.error.passwordMismatch': 'Les mots de passe ne correspondent pas',
  };
  return map[key] ?? key;
};

/** Schémas statiques FR — préférer getLoginSchema(t) / getSignupSchema(t) */
export const loginSchema = getLoginSchema(frAuthFallback);
export const signupSchema = getSignupSchema(frAuthFallback);

export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Email requis').max(EMAIL_MAX).email('Email invalide'),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Minimum 8 caractères').max(PASSWORD_MAX),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
