import React, { useState } from 'react';
import { Sparkles, DollarSign, FileText, MessageSquare, Tag, Loader2 } from 'lucide-react';
import { suggestPrice, generateDescription, suggestResponse, isGeminiConfigured } from '../../lib/geminiAI';

export const AIAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'price' | 'description' | 'response'>('price');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const [priceForm, setPriceForm] = useState({ description: '', placement: '', size: '' });
  const [descForm, setDescForm] = useState({ title: '', style: '', placement: '' });
  const [responseForm, setResponseForm] = useState({ clientName: '', description: '', placement: '', budget: '' });

  const configured = isGeminiConfigured();

  const handlePriceSuggest = async () => {
    setLoading(true); setResult('');
    try {
      const r = await suggestPrice(priceForm.description, priceForm.placement, priceForm.size);
      setResult(r);
    } catch (e) { setResult('Erreur: ' + (e instanceof Error ? e.message : 'Unknown')); }
    setLoading(false);
  };

  const handleDescGenerate = async () => {
    setLoading(true); setResult('');
    try {
      const r = await generateDescription(descForm.title, descForm.style, descForm.placement.split(',').map(s => s.trim()));
      setResult(r);
    } catch (e) { setResult('Erreur: ' + (e instanceof Error ? e.message : 'Unknown')); }
    setLoading(false);
  };

  const handleResponseSuggest = async () => {
    setLoading(true); setResult('');
    try {
      const r = await suggestResponse(responseForm.clientName, responseForm.description, responseForm.placement, responseForm.budget);
      setResult(r);
    } catch (e) { setResult('Erreur: ' + (e instanceof Error ? e.message : 'Unknown')); }
    setLoading(false);
  };

  if (!configured) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center">
        <Sparkles className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Assistant IA</h2>
        <p className="text-neutral-600 mb-4">Configurez VITE_GEMINI_API_KEY dans .env.local pour activer l'assistant IA.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'price' as const, label: 'Suggestion de prix', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'description' as const, label: 'Generation description', icon: <FileText className="w-4 h-4" /> },
    { id: 'response' as const, label: 'Reponse client', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Assistant IA</h2>
          <p className="text-neutral-600 text-sm">Propulse par Gemini</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResult(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-neutral-200">
        {activeTab === 'price' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Estimation de prix</h3>
            <textarea value={priceForm.description} onChange={e => setPriceForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Decrivez le projet (style, taille, complexite...)" rows={3}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl resize-none" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={priceForm.placement} onChange={e => setPriceForm(p => ({ ...p, placement: e.target.value }))}
                placeholder="Emplacement (bras, dos...)" className="px-4 py-3 border border-neutral-200 rounded-xl" />
              <input type="text" value={priceForm.size} onChange={e => setPriceForm(p => ({ ...p, size: e.target.value }))}
                placeholder="Taille (10cm, demi-bras...)" className="px-4 py-3 border border-neutral-200 rounded-xl" />
            </div>
            <button onClick={handlePriceSuggest} disabled={loading || !priceForm.description}
              className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Estimer le prix
            </button>
          </div>
        )}

        {activeTab === 'description' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Generation de description</h3>
            <input type="text" value={descForm.title} onChange={e => setDescForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Titre du flash / tattoo" className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={descForm.style} onChange={e => setDescForm(p => ({ ...p, style: e.target.value }))}
                placeholder="Style (realisme, minimaliste...)" className="px-4 py-3 border border-neutral-200 rounded-xl" />
              <input type="text" value={descForm.placement} onChange={e => setDescForm(p => ({ ...p, placement: e.target.value }))}
                placeholder="Emplacements suggeres" className="px-4 py-3 border border-neutral-200 rounded-xl" />
            </div>
            <button onClick={handleDescGenerate} disabled={loading || !descForm.title}
              className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generer
            </button>
          </div>
        )}

        {activeTab === 'response' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Reponse automatique client</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={responseForm.clientName} onChange={e => setResponseForm(p => ({ ...p, clientName: e.target.value }))}
                placeholder="Nom du client" className="px-4 py-3 border border-neutral-200 rounded-xl" />
              <input type="text" value={responseForm.budget} onChange={e => setResponseForm(p => ({ ...p, budget: e.target.value }))}
                placeholder="Budget (optionnel)" className="px-4 py-3 border border-neutral-200 rounded-xl" />
            </div>
            <textarea value={responseForm.description} onChange={e => setResponseForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description du projet du client" rows={3}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl resize-none" />
            <input type="text" value={responseForm.placement} onChange={e => setResponseForm(p => ({ ...p, placement: e.target.value }))}
              placeholder="Emplacement souhaite" className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
            <button onClick={handleResponseSuggest} disabled={loading || !responseForm.clientName || !responseForm.description}
              className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generer une reponse
            </button>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">Resultat IA</span>
            </div>
            <div className="whitespace-pre-wrap text-sm text-neutral-800 leading-relaxed">{result}</div>
            <button onClick={() => navigator.clipboard.writeText(result)}
              className="mt-3 text-sm text-purple-700 hover:text-purple-900 font-medium underline">
              Copier
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
