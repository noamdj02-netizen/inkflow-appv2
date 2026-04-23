# -*- coding: utf-8 -*-
import json
import pathlib

# Placeholder in template — replaced with json.dumps(byId) for the Figma plugin
HEAD = r'''async function loadFontForText(t) {
  const interR = { family: "Inter", style: "Regular" };
  try {
    if (t.fontName === figma.mixed) {
      await figma.loadFontAsync(interR);
      t.fontName = interR;
      return;
    }
    const fn = t.fontName;
    if (fn && typeof fn === "object" && "family" in fn) {
      await figma.loadFontAsync(fn);
      return;
    }
  } catch (e) {}
  try {
    await figma.loadFontAsync(interR);
    t.fontName = interR;
  } catch (e2) {
    await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
    t.fontName = { family: "Roboto", style: "Regular" };
  }
}
async function main() {
  const designPage = figma.root.children.find((p) => p.name === "Design") || figma.root.children[0];
  await figma.setCurrentPageAsync(designPage);
  const byId = __BYID__;
  function walk(node) {
    if (node.type === "TEXT" && byId[node.id] !== undefined) return [node];
    const out = [];
    if ("children" in node) for (const c of node.children) out.push(...walk(c));
    return out;
  }
  const textNodes = walk(designPage);
  const updated = [];
  const errors = [];
  for (const t of textNodes) {
    const next = byId[t.id];
    try {
      await loadFontForText(t);
      t.characters = next;
      updated.push(t.id);
    } catch (e) {
      errors.push({ id: t.id, message: String(e) });
    }
  }
  return { page: designPage.name, updatedIds: updated, errorCount: errors.length, errors, mutatedNodeIds: updated };
}
return await main();'''


def full_code_from_byid(bi: dict) -> str:
    return HEAD.replace("__BYID__", json.dumps(bi, ensure_ascii=False))

root = pathlib.Path(__file__).resolve().parent
out_path = root / "figma-inkflow-pour-faq.payload.json"
# Rebuild CODE from first block for compatibility
# Parse byId from original CODE string — simpler: use dict below
BYID = {
    "2:7": "Moins d'allers-retours : brief, validation, acompte et rappel. Chaque étape est tracée pour vous et le client, dans InkFlow.",
    "2:8": "Vous encadrez l'expérience studio sans multiplier les canaux. Un seul outil, un seul fil.",
    "2:9": "Pourquoi\nadopter l'appli ?",
    "2:10": "Pour · InkFlow",
    "2:28": "Pour · InkFlow",
    "2:30": "Du matin (nouvelles demandes) au soir (rappel J-1) : l'appli pousse l'essentiel au bon moment, sans alourdir votre charge mentale.",
    "2:31": "Quand l'appli\ntravaille\npour vous ?",
    "3:81": "Pour qui ?",
    "3:83": "C'est",
    "3:84": "InkFlow",
    "3:86": "Indé, duo ou équipe : file d'attente, vitrine, book, règles, messages, tout au même endroit. Moins d'impro, plus d'assurance côté client.",
    "3:88": "Qu'est-ce",
    "3:89": "que j'y gagne ?",
    "3:92": "Du temps, des réponses plus rapides, moins d'oublis. Moins d'heures admin, plus d'heures en cabine.",
    "3:96": "POUR",
    "3:39": "POUR",
    "3:42": "Par où commencer ? Créez l'espace studio, partagez le book et la vitrine : dès le premier brief, vous tranchez le projet dans InkFlow.",
    "3:43": "Même sans équipe technique : en quelques clics, règles, aperçu flash, acomptes, statuts. Vous tenez le parcours, pas les conversations éparpillées.",
    "3:103": "Pour · InkFlow",
    "3:104": "L'appli, c'est quoi\nconcrètement ?",
    "3:105": "Dès qu'un client a besoin d'un cadre, que vous avez besoin d'une preuve, que l'agenda doit parler. Tout s'enchaîne dans l'appli, sans tableurs à côté.",
    "10:2": "POUR + FAQ",
    "10:11": "Pourquoi InkFlow ? Quand s'en servir ? Pour qui c'est ? Qu'est-ce qu'on y fait, au quotidien ? Tout tient en une suite d'écrans : briefs, book, rappels, statuts, messages.",
    "10:12": "INKFLOW",
    "10:13": "POUR VOTRE",
    "20:5": "Pour · InkFlow",
    "20:8": "Moins d'allers-retours, plus d'heures utiles. Galeries, dispos, messages, résa : le tout sur une seule appli pensée pour les studios de tatouage.",
    "102:76": "STUDIO",
    "102:78": "EN 1 CLIC",
}
CODE = full_code_from_byid(BYID)
payload = {
    "fileKey": "daYcLpdwAFzqKfJooIzsm6",
    "code": CODE,
    "description": "Each Instagram post: Pour + InkFlow + FAQ-style questions (FR)",
    "skillNames": "figma-use",
}
out_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
print("Wrote", out_path)
print("code length", len(CODE), "text nodes", len(BYID))
