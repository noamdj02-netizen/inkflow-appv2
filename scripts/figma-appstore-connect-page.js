// Executed in Figma via use_figma MCP
async function main() {
  const FRAME_NAME = "InkFlow — textes App Store (FR)";

  let page = figma.root.children.find((p) => p.name === "App Store Connect");
  if (!page) {
    page = figma.createPage();
    page.name = "App Store Connect";
  }
  await figma.setCurrentPageAsync(page);

  for (const n of page.children) {
    if (n.name === FRAME_NAME) n.remove();
  }

  const body =
    "NOM (max 30 caractères)\n" +
    "InkFlow\n\n" +
    "SOUS-TITRE (max 30 caractères)\n" +
    "RDV, demandes, vitrine studio\n\n" +
    "TEXTE PROMOTIONNEL (max 170, modifiable sans nouvelle version)\n" +
    "Gérez demandes, réservations, rappels et vitrine depuis une seule appli. Moins d’allers-retours, plus de clarté pour vos clients et votre équipe — pensé pour les tatoueurs et les studios.\n\n" +
    "DESCRIPTION (App Store, extrait + corps)\n" +
    "InkFlow, c’est l’app pour les studios de tatouage : une base simple pour le travail, pas un calendrier générique.\n" +
    "Pilotez l’arrivée des demandes, le book, l’agenda, les rappels et l’image de votre vitrine, sans jongler entre cinq outils.\n\n" +
    "Avec InkFlow vous pouvez :\n" +
    "• Centraliser briefs, messages et statuts de projet.\n" +
    "• Proposer un parcours de réservation clair (créneaux, acompte, confirmation).\n" +
    "• Suivre l’agenda, la file d’attente et les rappels côté studio et côté client.\n" +
    "• Mettre en avant flash book, dispos et l’essentiel de votre page vitrine.\n" +
    "• Réduire le bruit : notifications utiles, pas de chaos.\n\n" +
    "Pour qui : tatoueurs en solo, duos, petites équipes et studios qui veulent un fil conducteur du premier message à la dernière retouche.\n" +
    "Téléchargez InkFlow et reprenez le contrôle de l’orga du studio, sans lourdeur d’un logiciel d’entreprise.\n\n" +
    "MOTS-CLÉS (100 caractères max, virgules, sans espace après)\n" +
    "tatouage,studio,booking,rdv,agenda,tattoo,flash,flashbook,rendezvous,calendrier,client,resa,demande,brief\n\n" +
    "EXEMPLE « Quoi de neuf » (notes de version)\n" +
    "• Améliorations de stabilité et de clarté dans le parcours client.\n" +
    "• Ajustements de l’agenda et des notifications.";

  let fn = { family: "Inter", style: "Regular" };
  try {
    await figma.loadFontAsync(fn);
  } catch (e) {
    fn = { family: "Roboto", style: "Regular" };
    await figma.loadFontAsync(fn);
  }

  const frame = figma.createFrame();
  frame.name = FRAME_NAME;
  frame.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.99 } }];

  const t = figma.createText();
  t.name = "Métadonnées ASO (FR)";
  t.fontName = fn;
  t.fontSize = 14;
  t.lineHeight = { unit: "PIXELS", value: 20 };
  t.fills = [{ type: "SOLID", color: { r: 0.12, g: 0.12, b: 0.15 } }];
  t.textAutoResize = "HEIGHT";
  t.resize(860, 10);
  t.characters = body;

  frame.appendChild(t);
  t.x = 32;
  t.y = 32;
  frame.resizeWithoutConstraints(860 + 64, t.height + 64);
  page.appendChild(frame);
  frame.x = 0;
  frame.y = 0;

  return { page: page.name, frameId: frame.id, textId: t.id, frameName: frame.name, createdNodeIds: [frame.id, t.id] };
}
return await main();
