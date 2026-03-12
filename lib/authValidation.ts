import { z } from 'zod';

const EMAIL_MAX = 320;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 256;
const NAME_MAX = 120;
const STUDIO_NAME_MAX = 120;

export const loginSchema = z.object({
  email: z.string().min(1, 'Email requis').max(EMAIL_MAX).email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis').max(PASSWORD_MAX),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(NAME_MAX).trim(),
  email: z.string().min(1, 'Email requis').max(EMAIL_MAX).email('Email invalide'),
  studioName: z.string().max(STUDIO_NAME_MAX).trim(),
  password: z.string().min(PASSWORD_MIN, `Minimum ${PASSWORD_MIN} caractères`).max(PASSWORD_MAX),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] });

export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Email requis').max(EMAIL_MAX).email('Email invalide'),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Minimum 8 caractères').max(PASSWORD_MAX),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Les mots de passe ne correspondent pas', path: ['confirm'] });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
