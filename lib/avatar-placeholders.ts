/**
 * Avatars locaux pour éviter les images externes (pravatar.cc)
 * qui ne s'affichent pas en production (CSP, blocage, etc.)
 *
 * Photos stockées dans public/images/avatars/
 */
const AVATAR_IMAGES = [
  '/images/avatars/avatar-1.png',
  '/images/avatars/avatar-2.png',
  '/images/avatars/avatar-3.png',
  '/images/avatars/avatar-4.png',
  '/images/avatars/avatar-5.png',
];

/** Retourne une photo d'avatar par index (0, 1, 2, ...) */
export function getAvatarPlaceholder(index: number): string {
  return AVATAR_IMAGES[index % AVATAR_IMAGES.length];
}
