const GEMINI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data: GeminiResponse = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function suggestPrice(description: string, placement: string, size: string): Promise<string> {
  const prompt = `Tu es un expert en tarification de tatouages en France. 
Basé sur les informations suivantes, suggère un prix en euros avec une fourchette (min-max) et une brève justification en 2-3 lignes.

Description: ${description}
Emplacement: ${placement}
Taille: ${size}

Réponds en français avec ce format:
Fourchette: XXX€ - XXX€
Justification: ...`;

  return callGemini(prompt);
}

export async function generateDescription(title: string, style: string, placement: string[]): Promise<string> {
  const prompt = `Tu es un tatoueur professionnel qui écrit des descriptions pour son portfolio.
Génère une description courte et accrocheuse (2-3 phrases max) pour ce tatouage:

Titre: ${title}
Style: ${style}
Emplacements suggérés: ${placement.join(', ')}

Réponds en français, ton professionnel mais accessible.`;

  return callGemini(prompt);
}

export async function suggestResponse(clientName: string, projectDescription: string, placement: string, budget: string): Promise<string> {
  const prompt = `Tu es un tatoueur professionnel qui répond à une demande de projet.
Génère une réponse professionnelle, chaleureuse et personnalisée pour ce client.

Client: ${clientName}
Projet: ${projectDescription}
Emplacement: ${placement || 'Non précisé'}
Budget: ${budget || 'Non précisé'}

Réponds en français en 4-5 lignes max. Commence par saluer le client par son prénom, montre de l'enthousiasme pour le projet, et propose de fixer un rendez-vous pour en discuter.`;

  return callGemini(prompt);
}

export async function analyzePortfolioImage(imageDescription: string): Promise<string[]> {
  const prompt = `Tu es un expert en tatouage. Basé sur cette description d'image de tatouage, génère 5-8 tags pertinents (style, technique, thème, emplacement).

Description: ${imageDescription}

Réponds avec uniquement les tags séparés par des virgules, sans numérotation.`;

  const result = await callGemini(prompt);
  return result.split(',').map(tag => tag.trim()).filter(Boolean);
}

export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}
