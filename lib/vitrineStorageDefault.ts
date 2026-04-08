import type { VitrineData } from '../types/vitrine';

/** Vitrine démo avec images locales pour /studio/demo */
const demoVitrineData = (): VitrineData => ({
  name: "Jade",
  slug: 'demo',
  tagline: "L'art du tatouage depuis 2015",
  description: "Studio de tatouage professionnel situé au cœur de Paris 11e. Spécialisé en Neo-Traditional, Blackwork et créations personnalisées. Nos artistes transforment vos idées en œuvres uniques.",
  avatar: "/images/avatar-studio.png",
  coverImage: "/images/cover-studio.png",
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
    { name: "Alex Martin", role: "Fondateur & Artiste principal", specialties: ["Neo-Traditional", "Couleur", "Portrait"], experience: "12 ans", avatar: "/images/avatars/avatar-hero-2.png", bio: "Passionné par l'art du tatouage depuis 2010. Formé aux Beaux-Arts, Alex excelle dans les compositions florales et japonaises.", instagram: "@alex.ink.paris", portfolio: 450 },
    { name: "Sophie Dubois", role: "Artiste spécialisée", specialties: ["Blackwork", "Dotwork", "Géométrique"], experience: "8 ans", avatar: "/images/avatars/avatar-hero-1.png", bio: "Diplômée des Beaux-Arts de Paris. Sophie excelle dans les designs minimalistes et géométriques.", instagram: "@sophie.dotwork", portfolio: 320 }
  ],
  testimonials: [
    { name: "Marie Laurent", rating: 5, date: "Il y a 2 jours", text: "Expérience incroyable ! Alex a parfaitement compris ma vision. Mon tatouage floral dépasse toutes mes attentes.", avatar: "/images/avatars/avatar-1.png", tattoo: "Fleurs sur avant-bras", verified: true },
    { name: "Thomas Bernard", rating: 5, date: "Il y a 1 semaine", text: "Sophie est une vraie artiste. Mon mandala géométrique est parfait, finitions impeccables.", avatar: "/images/avatars/avatar-2.png", tattoo: "Mandala dos", verified: true },
    { name: "Léa Moreau", rating: 5, date: "Il y a 3 semaines", text: "Studio au top ! Ambiance pro et détendue. Je reviendrai pour mon prochain projet.", avatar: "/images/avatars/avatar-3.png", tattoo: "Carpe Koï mollet", verified: true },
    { name: "Julien Petit", rating: 5, date: "Il y a 1 mois", text: "Alex a su transformer mon idée en une œuvre magnifique. Je recommande à 100%.", avatar: "/images/avatars/avatar-4.png", tattoo: "Portrait réaliste", verified: true },
    { name: "Camille Roux", rating: 5, date: "Il y a 2 mois", text: "Ma marguerite flash est magnifique. Rapide, propre, et le résultat dépasse mes attentes !", avatar: "/images/avatars/avatar-5.png", tattoo: "Marguerite flash", verified: true }
  ],
  portfolio: [
    { url: "/gallery/tattoo-1.webp", category: "Japonais", artist: "Alex Martin", likes: 234, description: "Manchette japonaise traditionnelle" },
    { url: "/gallery/tattoo-2.webp", category: "Botanique", artist: "Sophie Dubois", likes: 189, description: "Composition florale bras complet" },
    { url: "/gallery/tattoo-3.webp", category: "Réaliste", artist: "Alex Martin", likes: 312, description: "Portrait réaliste noir et blanc" },
    { url: "/gallery/iris-jambe.webp", category: "Botanique", artist: "Sophie Dubois", likes: 156, description: "Iris détaillé sur mollet" },
    { url: "/gallery/botanique-main.webp", category: "Botanique", artist: "Alex Martin", likes: 278, description: "Fleurs et feuilles main" },
    { url: "/gallery/botanique.webp", category: "Botanique", artist: "Sophie Dubois", likes: 201, description: "Composition botanique épaule" },
    { url: "/gallery/leopard.webp", category: "Réaliste", artist: "Alex Martin", likes: 345, description: "Léopard réaliste bras" },
    { url: "/gallery/iris-floral.webp", category: "Botanique", artist: "Sophie Dubois", likes: 198, description: "Iris floral avant-bras" },
    { url: "/gallery/carpe-koi.webp", category: "Japonais", artist: "Alex Martin", likes: 267, description: "Carpe Koï mollet" },
    { url: "/gallery/mandala.webp", category: "Géométrique", artist: "Sophie Dubois", likes: 223, description: "Mandala poignet" },
    { url: "/gallery/marguerite.webp", category: "Botanique", artist: "Alex Martin", likes: 176, description: "Marguerite épaule" }
  ],
  flashDesigns: [
    { id: 'f1', title: 'Marguerite', imageUrl: '/gallery/marguerite.webp', price: 80, duration: 60, placement: ['Avant-bras', 'Épaule'], size: 'S (8-10cm)', available: true, description: 'Flash botanique élégant, parfait pour une première pièce.', style: 'Botanique' },
    { id: 'f2', title: 'Carpe Koï', imageUrl: '/gallery/carpe-koi.webp', price: 120, duration: 90, placement: ['Bras', 'Mollet'], size: 'M (12-15cm)', available: true, description: 'Inspiration japonaise traditionnelle, symbole de chance.', style: 'Japonais' },
    { id: 'f3', title: 'Mandala', imageUrl: '/gallery/mandala.webp', price: 60, duration: 45, placement: ['Poignet', 'Cheville'], size: 'S (6-8cm)', available: true, description: 'Design géométrique minimaliste et intemporel.', style: 'Géométrique' },
    { id: 'f4', title: 'Léopard', imageUrl: '/gallery/leopard.webp', price: 150, duration: 120, placement: ['Bras', 'Cuisse'], size: 'L (15-20cm)', available: true, description: 'Réalisme animalier, détails soignés.', style: 'Réaliste' },
    { id: 'f5', title: 'Iris floral', imageUrl: '/gallery/iris-floral.webp', price: 90, duration: 75, placement: ['Avant-bras', 'Épaule'], size: 'M (10-12cm)', available: true, description: 'Fleur détaillée aux tons subtils.', style: 'Botanique' },
    { id: 'f6', title: 'Botanique', imageUrl: '/gallery/botanique.webp', price: 100, duration: 80, placement: ['Épaule', 'Omoplate'], size: 'M (12-14cm)', available: true, description: 'Composition feuilles et fleurs, style naturaliste.', style: 'Botanique' }
  ],
  faqs: [
    { q: "Combien coûte un tatouage ?", a: "Les prix varient selon la taille et la complexité. Un petit flash commence à 60€, un projet sur-mesure à partir de 150€." },
    { q: "Comment prendre rendez-vous ?", a: "Cliquez sur 'Réserver' pour choisir un créneau en ligne. Vous recevrez une confirmation par email." },
    { q: "Faut-il payer un acompte ?", a: "Oui, un acompte de 30 à 50€ est demandé pour confirmer votre RDV. Il est déduit du prix final." },
    { q: "Puis-je annuler ou modifier ?", a: "Oui, contactez-nous au moins 48h avant pour modifier ou annuler sans frais." }
  ],
  whyChooseUs: [
    { icon: "award", title: "Artistes qualifiés", description: "Plus de 20 ans d'expérience cumulée" },
    { icon: "shield", title: "Hygiène irréprochable", description: "Matériel stérile à usage unique" },
    { icon: "heart", title: "Satisfaction garantie", description: "98% de clients satisfaits" }
  ]
});

export const defaultVitrineData = (slug: string): VitrineData => {
  if (slug === 'demo') return demoVitrineData();
  return ({
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
    { name: "Thomas Bernard", rating: 5, date: "Il y a 1 semaine", text: "Sophie est une vraie artiste. Mon tatouage géométrique est parfait.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", tattoo: "Mandala dos", verified: true }
  ],
  portfolio: [],
  flashDesigns: [
    { id: 'f1', title: 'Dragon Minimaliste', imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=600', price: 120, duration: 60, placement: ['Avant-bras', 'Épaule', 'Mollet'], size: 'S (8-10cm)', available: true, description: 'Design épuré inspiré de l\'art japonais traditionnel.', style: 'Minimaliste' },
    { id: 'f2', title: 'Rose Traditional', imageUrl: 'https://images.unsplash.com/photo-1590246814883-57c511e76917?w=600', price: 180, duration: 120, placement: ['Bras', 'Cuisse', 'Épaule'], size: 'M (12-15cm)', available: true, description: 'Rose old school avec palette de couleurs vibrantes.', style: 'Traditional' }
  ],
  faqs: [
    { q: "Combien coûte un tatouage ?", a: "Les prix varient selon la taille et la complexité. Un petit tatouage commence à 80€." },
    { q: "Comment prendre rendez-vous ?", a: "Cliquez sur 'Réserver' pour réserver en ligne." }
  ],
  whyChooseUs: [
    { icon: "award", title: "Artistes qualifiés", description: "Plus de 20 ans d'expérience cumulée" },
    { icon: "shield", title: "Hygiène irréprochable", description: "Matériel stérile à usage unique" }
  ]
});
}
