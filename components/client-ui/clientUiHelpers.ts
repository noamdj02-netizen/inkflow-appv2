/** Banques d’images génériques — on préfère placeholder gradient si URL match. */
export function isStockPhoto(url: string): boolean {
  return /unsplash\.com|pexels\.com|pixabay\.com|stocksnap\.io/i.test(url);
}

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}
