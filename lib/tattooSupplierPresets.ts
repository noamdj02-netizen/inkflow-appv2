/**
 * Fournisseurs courants pour tatoueurs (Europe / France) — suggestions d’import dans le stock.
 * Données descriptives pour l’UI ; pas d’URL imposée (le studio peut compléter le site plus tard).
 */
export interface TattooSupplierPreset {
  name: string;
  /** Court, affiché en title / aide */
  blurb: string;
}

export interface TattooSupplierPresetGroup {
  category: string;
  suppliers: TattooSupplierPreset[];
}

export const TATTOO_SUPPLIER_PRESET_GROUPS: TattooSupplierPresetGroup[] = [
  {
    category: 'Grands distributeurs',
    suppliers: [
      {
        name: 'Killer Ink Tattoo',
        blurb:
          'Leader européen, large choix de marques (World Famous, Kuro Sumi, FK Irons). Idéal pour comparer consommables standards.',
      },
      {
        name: 'Barber DTS',
        blurb:
          'Historique du milieu, catalogue très complet, réputation solide sur les délais de livraison.',
      },
      {
        name: 'ITC Tattoo',
        blurb:
          'Très implanté en France (ITC Piercing / Tattoo) — matériel tatouage et piercing, acteur majeur.',
      },
    ],
  },
  {
    category: 'Marques fabricantes',
    suppliers: [
      {
        name: 'Cheyenne Tattoo',
        blurb: 'Référence machines rotatives et cartouches haute précision.',
      },
      {
        name: 'FK Irons',
        blurb: 'Machines haut de gamme, appréciées confort et poids.',
      },
      {
        name: 'Bishop Rotary',
        blurb: 'Segment premium, machines très recherchées.',
      },
    ],
  },
  {
    category: 'Autres spécialisés',
    suppliers: [
      {
        name: 'Pro-Tattoo',
        blurb: 'Acteur français bien présent — niches, encres, hygiène, stencils.',
      },
      {
        name: 'Tattoo Store',
        blurb: 'Souvent utilisé par les pros en France pour la rapidité de livraison.',
      },
    ],
  },
];

export function flattenTattooSupplierPresets(): TattooSupplierPreset[] {
  return TATTOO_SUPPLIER_PRESET_GROUPS.flatMap((g) => g.suppliers);
}
