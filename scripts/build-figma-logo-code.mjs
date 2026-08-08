import fs from "fs";

const b = fs.readFileSync(
  new URL("../.tmp-logo-b64.txt", import.meta.url),
  "utf8"
).trim();

const chunk = 8000;
const parts = [];
for (let i = 0; i < b.length; i += chunk) parts.push(b.slice(i, i + chunk));

const header = `const parts = ${JSON.stringify(parts)};
const b64 = parts.join("");
const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const img = await figma.createImageAsync(buf);
const imageHash = img.hash;
`;

const rest = `
const page = figma.root.children.find((p) => p.name === "QR Codes") || figma.root.children[0];
await figma.setCurrentPageAsync(page);
const parent = page.findOne((n) => n.name === "InkFlow · Vitrine (impression 2 variantes)");
if (!parent) return { error: "parent missing" };
const updated = [];
for (const plancheName of ["Planche — fond blanc", "Planche — fond noir"]) {
  const planche = parent.findOne((n) => n.name === plancheName);
  if (!planche || planche.type !== "FRAME") continue;
  const headerFrame = planche.findOne((n) => n.name === "En-tête marque");
  if (!headerFrame || headerFrame.type !== "FRAME") continue;
  const logo = headerFrame.findOne((n) => n.name === "Logo InkFlow");
  if (logo && logo.type === "RECTANGLE") {
    logo.fills = [{ type: "IMAGE", imageHash, scaleMode: "FIT" }];
    updated.push(logo.id);
  }
}
return { success: true, imageHash, updatedIds: updated };
`;

const out = header + rest;
fs.writeFileSync(new URL("../.figma-logo-code.js", import.meta.url), out);
console.log("bytes", out.length);
