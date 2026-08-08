export interface ConsentFormPreset {
  title: string;
  icon?: string;
  color?: string;
  content: string;
}

export const CONSENT_FORM_PRESETS: ConsentFormPreset[] = [
  {
    title: 'Consentement standard tatouage',
    icon: 'standard',
    color: 'blue',
    content: `═══════════════════════════════════════════
        FORMULAIRE DE CONSENTEMENT - TATOUAGE
═══════════════════════════════════════════

Je soussigné(e) ________________________________, 
né(e) le ____/____/________, 

déclare avoir été informé(e) des points suivants :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NATURE DE LA PROCÉDURE

Le tatouage consiste en l'introduction de pigments colorés dans le derme au moyen d'aiguilles stériles à usage unique. Cette procédure est définitive et irréversible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. RISQUES POTENTIELS

J'ai été informé(e) que le tatouage comporte des risques, notamment :
• Réactions allergiques aux pigments
• Infections bactériennes
• Cicatrisation difficile ou chéloïdes
• Saignements
• Modifications de l'apparence avec le temps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. HYGIÈNE ET SÉCURITÉ

Le studio s'engage à utiliser :
• Du matériel stérile à usage unique
• Des encres conformes à la réglementation européenne (REACH)
• Des protocoles d'hygiène stricts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. CONTRE-INDICATIONS

J'affirme ne présenter aucune des contre-indications suivantes :
☐ Grossesse ou allaitement
☐ Diabète non stabilisé
☐ Maladies de peau (eczéma, psoriasis sur la zone)
☐ Traitement anticoagulant
☐ Troubles de la coagulation
☐ Maladies cardiaques
☐ Système immunitaire affaibli
☐ Allergie connue aux pigments de tatouage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. ENGAGEMENT DU CLIENT

Je m'engage à :
• Suivre les consignes de soins post-tatouage
• Informer l'artiste de tout problème de santé
• Ne pas être sous l'influence d'alcool ou de drogues
• Être majeur(e) ou accompagné(e) d'un représentant légal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. DESCRIPTION DU TATOUAGE

Motif : ________________________________________
Emplacement : _________________________________
Taille approximative : __________________________
Artiste : ______________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. CONSENTEMENT

En signant ce formulaire, je déclare :
• Avoir lu et compris les informations ci-dessus
• Avoir pu poser toutes mes questions
• Consentir librement à la réalisation du tatouage

Date : ____/____/________

Signature du client : _____________________________

Signature de l'artiste : ___________________________

═══════════════════════════════════════════`
  },
  {
    title: 'Consentement mineur',
    icon: 'minor',
    color: 'purple',
    content: `═══════════════════════════════════════════
    AUTORISATION PARENTALE - TATOUAGE MINEUR
═══════════════════════════════════════════

INFORMATIONS SUR LE MINEUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom et prénom : ________________________________
Date de naissance : ____/____/________
Âge : _____ ans

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMATIONS SUR LE REPRÉSENTANT LÉGAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Je soussigné(e) ________________________________,
agissant en qualité de : ☐ Père  ☐ Mère  ☐ Tuteur légal
Adresse : ______________________________________
Téléphone : ____________________________________
Pièce d'identité n° : ____________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AUTORISATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

J'autorise expressément mon enfant mineur à se faire 
tatouer selon les modalités suivantes :

Description du tatouage : _________________________
Emplacement : _________________________________
Taille : ________________________________________

Je déclare :
☐ Avoir pris connaissance des risques liés au tatouage
☐ Avoir compris que le tatouage est permanent
☐ M'engager à accompagner mon enfant le jour du RDV
☐ Présenter ma pièce d'identité et celle de mon enfant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT

Cette autorisation n'est valable QUE si le représentant 
légal est présent lors de la séance avec une pièce 
d'identité valide et le livret de famille.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date : ____/____/________

Signature du représentant légal : __________________

Signature du mineur : ___________________________

Signature de l'artiste : __________________________

═══════════════════════════════════════════`
  },
  {
    title: 'Consentement piercing',
    icon: 'piercing',
    color: 'green',
    content: `═══════════════════════════════════════════
        FORMULAIRE DE CONSENTEMENT - PIERCING
═══════════════════════════════════════════

Je soussigné(e) ________________________________, 
né(e) le ____/____/________, 

déclare avoir été informé(e) des points suivants :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PROCÉDURE

Le piercing consiste en la perforation de la peau ou du 
cartilage pour y insérer un bijou. La cicatrisation varie 
selon la zone (1 mois à 1 an).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. RISQUES

• Infections
• Réactions allergiques au bijou
• Chéloïdes
• Rejet du bijou
• Migration du piercing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. CONTRE-INDICATIONS

☐ Hémophilie ou troubles de coagulation
☐ Allergies aux métaux
☐ Grossesse (pour certains piercings)
☐ Maladies auto-immunes
☐ Traitement immunosuppresseur

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. DESCRIPTION DU PIERCING

Zone : _________________________________________
Type de bijou : _________________________________
Matière : ☐ Titane  ☐ Acier chirurgical  ☐ Or

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date : ____/____/________

Signature client : _______________________________

Signature pierceur : _____________________________

═══════════════════════════════════════════`
  },
  {
    title: 'Consentement simplifié',
    icon: 'simple',
    color: 'orange',
    content: `CONSENTEMENT AU TATOUAGE

Je soussigné(e) ________________________________
Né(e) le ____/____/________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Je déclare :

✓ Être majeur(e) et en pleine possession de mes moyens
✓ Avoir été informé(e) des risques (infection, allergie, 
  cicatrisation)
✓ Ne présenter aucune contre-indication médicale
✓ Ne pas être sous l'influence de substances
✓ Consentir librement à ce tatouage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tatouage : ____________________________________
Emplacement : _________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date : ____/____/________

Signature : ____________________________________`
  },
];

/** Classes Tailwind pour les puces « consentement » (alignées sur ConsentFormEditor). */
export function consentPresetChipClassName(color?: string): string {
  const base =
    'inline-flex items-center gap-1 rounded-md border text-left active:scale-[0.98] transition-all shrink-0 min-h-[32px] max-w-[10rem] sm:max-w-none px-1.5 py-1 text-[10px] sm:text-[11px] font-medium';
  switch (color) {
    case 'blue':
      return `${base} bg-blue-50/90 dark:bg-blue-500/10 text-blue-800 dark:text-blue-200 border-blue-200/90 dark:border-blue-500/20 hover:bg-blue-100/90 dark:hover:bg-blue-500/20`;
    case 'purple':
      return `${base} bg-purple-50/90 dark:bg-purple-500/10 text-purple-800 dark:text-purple-200 border-purple-200/90 dark:border-purple-500/20 hover:bg-purple-100/90 dark:hover:bg-purple-500/20`;
    case 'green':
      return `${base} bg-emerald-50/90 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-200/90 dark:border-emerald-500/20 hover:bg-emerald-100/90 dark:hover:bg-emerald-500/20`;
    case 'orange':
      return `${base} bg-orange-50/90 dark:bg-orange-500/10 text-orange-800 dark:text-orange-200 border-orange-200/90 dark:border-orange-500/20 hover:bg-orange-100/90 dark:hover:bg-orange-500/20`;
    default:
      return `${base} bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700`;
  }
}

/** Libellé court pour la barre d’outils messagerie. */
export function consentPresetCompactLabel(preset: ConsentFormPreset): string {
  const t = preset.title.toLowerCase();
  if (t.includes('simplifié')) return 'Simplifié';
  if (t.includes('mineur')) return 'Mineur';
  if (t.includes('piercing')) return 'Piercing';
  if (t.includes('standard')) return 'Tatouage';
  return preset.title.length > 20 ? `${preset.title.slice(0, 18)}…` : preset.title;
}