export const STYLES_LIST = [
  'réalisme',
  'old school',
  'japonais',
  'fine line',
  'blackwork',
  'neo-trad',
  'géométrique',
  'aquarelle',
  'tribal',
  'lettering',
  'dotwork',
  'illustratif',
  'surréalisme',
  'minimaliste',
  'biomécanique',
  'ornamental',
  'trash polka',
] as const;

export type TattooStyle = (typeof STYLES_LIST)[number];

export const STYLE_SLUGS: Record<string, string> = {
  réalisme:     'realisme',
  'old school': 'old-school',
  japonais:     'japonais',
  'fine line':  'fine-line',
  blackwork:    'blackwork',
  'neo-trad':   'neo-trad',
  géométrique:  'geometrique',
  aquarelle:    'aquarelle',
  tribal:       'tribal',
  lettering:    'lettering',
  dotwork:      'dotwork',
  illustratif:  'illustratif',
  surréalisme:  'surrealisme',
  minimaliste:  'minimaliste',
  biomécanique: 'biomecanique',
  ornamental:   'ornamental',
  'trash polka':'trash-polka',
};

// Inverse : slug → nom affiché
export const SLUG_TO_STYLE: Record<string, string> = Object.fromEntries(
  Object.entries(STYLE_SLUGS).map(([name, slug]) => [slug, name]),
);
