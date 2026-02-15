import type { VitrineData } from '../types/vitrine';

const STORAGE_PREFIX = 'inkflow-vitrine-';

export function getVitrineSlug(studioName: string): string {
  return studioName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') // collapse multiple dashes
    || 'mon-studio';
}

export const defaultVitrineData = (slug: string): VitrineData => ({
  name: "Ink & Art Studio",
  slug,
  tagline: "L'art du tatouage depuis 2015",
  description: "Studio de tatouage professionnel situé au cœur de Paris 11e. Nous sommes spécialisés en Neo-Traditional, Blackwork et créations 100% personnalisées.",
  avatar: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400",
  coverImage: "https://images.unsplash.com/photo-1590246814883-57c511e76917?w=1600&h=600&fit=crop",
  address: "42 Rue Oberkampf, 75011 Paris",
  phone: "+33 1 23 45 67 89",
  email: "contact@ink-art.fr",
  instagram: "@ink.art.paris",
  facebook: "InkArtParis",
  website: "www.ink-art.fr",
  rating: 4.9,
  reviewCount: 127,
  yearsExperience: 9,
  totalTattoos: 2500,
  satisfactionRate: 98,
  repeatClients: 85,
  services: [
    { name: "Tatouage personnalisé", price: "À partir de 150€", duration: "2-4h", description: "Design unique créé spécialement pour vous", icon: "sparkles", features: ["Consultation gratuite", "Design sur-mesure", "Retouche incluse"] },
    { name: "Flash Tattoo", price: "80-200€", duration: "1-2h", description: "Designs pré-dessinés disponibles immédiatement", icon: "award", features: ["Prix fixe", "Pas d'attente", "Qualité garantie"] },
    { name: "Retouche & Touch-up", price: "100€/h", duration: "1-3h", description: "Amélioration et réparation de tatouages existants", icon: "star", features: ["Consultation incluse", "Devis gratuit", "Expertise reconnue"] },
    { name: "Cover-up", price: "À partir de 200€", duration: "3-5h", description: "Recouvrir et transformer un ancien tatouage", icon: "camera", features: ["Étude personnalisée", "Plusieurs propositions", "Résultat garanti"] }
  ],
  openingHours: {
    monday: { open: "10:00", close: "19:00", closed: false },
    tuesday: { open: "10:00", close: "19:00", closed: false },
    wednesday: { open: "10:00", close: "19:00", closed: false },
    thursday: { open: "10:00", close: "19:00", closed: false },
    friday: { open: "10:00", close: "20:00", closed: false },
    saturday: { open: "11:00", close: "20:00", closed: false },
    sunday: { open: "10:00", close: "19:00", closed: true }
  },
  artists: [
    { name: "Alex Martin", role: "Fondateur & Artiste principal", specialties: ["Neo-Traditional", "Couleur", "Portrait"], experience: "12 ans", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex", bio: "Passionné par l'art du tatouage depuis 2010.", instagram: "@alex.ink.paris", portfolio: 450 },
    { name: "Sophie Dubois", role: "Artiste spécialisée", specialties: ["Blackwork", "Dotwork", "Géométrique"], experience: "8 ans", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sophie", bio: "Diplômée des Beaux-Arts de Paris, Sophie excelle dans les designs minimalistes.", instagram: "@sophie.dotwork", portfolio: 320 }
  ],
  testimonials: [
    { name: "Marie Laurent", rating: 5, date: "Il y a 2 jours", text: "Expérience incroyable ! Alex a parfaitement compris ma vision.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", tattoo: "Fleurs sur avant-bras", verified: true },
    { name: "Thomas Bernard", rating: 5, date: "Il y a 1 semaine", text: "Sophie est une vraie artiste. Mon tatouage géométrique est parfait.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", tattoo: "Mandala dos", verified: true },
    { name: "Emma Petit", rating: 5, date: "Il y a 2 semaines", text: "Premier tatouage et Alex m'a mise totalement à l'aise.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", tattoo: "Petit flash poignet", verified: true },
    { name: "Lucas Moreau", rating: 5, date: "Il y a 3 semaines", text: "Meilleur studio de Paris sans hésiter.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", tattoo: "Sleeve bras complet", verified: true }
  ],
  portfolio: [
    { url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800", category: "Neo-Traditional", artist: "Alex Martin", likes: 234, description: "Composition florale avec oiseau" },
    { url: "https://images.unsplash.com/photo-1590246814883-57c511e76917?w=800", category: "Blackwork", artist: "Sophie Dubois", likes: 189, description: "Mandala géométrique" },
    { url: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800", category: "Géométrique", artist: "Sophie Dubois", likes: 312, description: "Formes abstraites" },
    { url: "https://images.unsplash.com/photo-1565058379802-bbe93b2f703f?w=800", category: "Couleur", artist: "Alex Martin", likes: 267, description: "Tigre réaliste" },
    { url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800", category: "Portrait", artist: "Alex Martin", likes: 445, description: "Portrait en noir et gris" },
    { url: "https://images.unsplash.com/photo-1590246814883-57c511e76917?w=800", category: "Floral", artist: "Sophie Dubois", likes: 198, description: "Composition botanique" }
  ],
  flashDesigns: [
    { id: 'f1', title: 'Dragon Minimaliste', imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=600', price: 120, duration: 60, placement: ['Avant-bras', 'Épaule', 'Mollet'], size: 'S (8-10cm)', available: true, description: 'Design épuré inspiré de l\'art japonais traditionnel.', style: 'Minimaliste' },
    { id: 'f2', title: 'Rose Traditional', imageUrl: 'https://images.unsplash.com/photo-1590246814883-57c511e76917?w=600', price: 180, duration: 120, placement: ['Bras', 'Cuisse', 'Épaule'], size: 'M (12-15cm)', available: true, description: 'Rose old school avec palette de couleurs vibrantes.', style: 'Traditional' },
    { id: 'f3', title: 'Lune Géométrique', imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=600', price: 150, duration: 90, placement: ['Dos', 'Torse', 'Jambe'], size: 'M (10-12cm)', available: false, description: 'Composition céleste avec formes géométriques précises.', style: 'Géométrique' },
    { id: 'f4', title: 'Serpent Blackwork', imageUrl: 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703f?w=600', price: 200, duration: 150, placement: ['Avant-bras', 'Mollet', 'Dos'], size: 'L (15-20cm)', available: true, description: 'Serpent stylisé en technique blackwork pure.', style: 'Blackwork' }
  ],
  faqs: [
    { q: "Combien coûte un tatouage ?", a: "Les prix varient selon la taille, la complexité et le temps nécessaire. Un petit tatouage commence à 80€, un design moyen à 150€ et les grandes pièces à partir de 300€." },
    { q: "Est-ce que ça fait mal ?", a: "La douleur varie selon les zones du corps et votre sensibilité personnelle. La plupart des clients décrivent la sensation comme une égratignure continue, supportable." },
    { q: "Comment prendre rendez-vous ?", a: "Cliquez sur 'Réserver' en haut de page pour réserver en ligne, appelez-nous ou envoyez-nous un email. Nous vous répondons sous 24h." },
    { q: "Faut-il un acompte ?", a: "Oui, nous demandons un acompte de 50€ pour réserver votre créneau (30% pour les projets de plus de 300€). Cet acompte est déduit du prix final." },
    { q: "Quels sont les soins après tatouage ?", a: "Nous vous fournissons une fiche de soins détaillée. Garder le pansement 3-4h, laver délicatement 2x/jour, appliquer une crème cicatrisante." },
    { q: "Puis-je venir avec un ami ?", a: "Absolument ! Vous pouvez venir accompagné d'une personne pour vous soutenir." },
    { q: "Faites-vous des cover-ups ?", a: "Oui, nous sommes spécialisés dans les cover-ups ! Une consultation gratuite permettra d'étudier les possibilités." },
    { q: "Acceptez-vous les mineurs ?", a: "Nous tatouons les personnes à partir de 18 ans avec une pièce d'identité valide. Pour les 16-18 ans, c'est possible avec autorisation parentale." }
  ],
  whyChooseUs: [
    { icon: "award", title: "Artistes qualifiés", description: "Plus de 20 ans d'expérience cumulée, formés aux meilleures techniques" },
    { icon: "shield", title: "Hygiène irréprochable", description: "Matériel stérile à usage unique, respect des normes sanitaires strictes" },
    { icon: "heart", title: "Satisfaction garantie", description: "98% de clients satisfaits, retouches gratuites sous conditions" },
    { icon: "users", title: "Écoute personnalisée", description: "Consultation gratuite pour comprendre votre projet et vos envies" }
  ]
});

export function getVitrineData(slug: string): VitrineData {
  const normalizedSlug = slug.replace(/-+/g, '-');
  const key = `${STORAGE_PREFIX}${normalizedSlug}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<VitrineData>;
      return { ...defaultVitrineData(normalizedSlug), ...parsed, slug: normalizedSlug };
    }
  } catch {}
  return defaultVitrineData(normalizedSlug);
}

export function setVitrineData(slug: string, data: VitrineData): void {
  const normalizedSlug = slug.replace(/-+/g, '-');
  const key = `${STORAGE_PREFIX}${normalizedSlug}`;
  localStorage.setItem(key, JSON.stringify({ ...data, slug: normalizedSlug }));
}
