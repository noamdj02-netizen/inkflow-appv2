import React, { useRef, useState, useEffect } from 'react';
import { Check, RotateCcw, Send } from 'lucide-react';

interface ConsentFormSignProps {
  template: string;
  clientName: string;
  appointmentDetails?: string;
  onSign: (signatureData: string) => Promise<void>;
}

export const ConsentFormSign: React.FC<ConsentFormSignProps> = ({ template, clientName, appointmentDetails, onSign }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const filledTemplate = template
    .replace('[NOM_CLIENT]', clientName)
    .replace('Date : _______________', `Date : ${new Date().toLocaleDateString('fr-FR')}`);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#171717';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!hasSignature || !agreed) return;
    setSubmitting(true);
    const signatureData = canvasRef.current?.toDataURL('image/png') || '';
    await onSign(signatureData);
    setDone(true);
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Formulaire signe</h2>
        <p className="text-neutral-600">Merci {clientName} ! Votre consentement a ete enregistre.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Formulaire de consentement</h2>
        {appointmentDetails && <p className="text-neutral-600 text-sm">{appointmentDetails}</p>}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-neutral-200">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 font-mono">{filledTemplate}</div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-neutral-200">
        <label className="block text-sm font-semibold mb-3">Votre signature</label>
        <div className="relative border-2 border-dashed border-neutral-300 rounded-xl overflow-hidden bg-neutral-50">
          <canvas
            ref={canvasRef}
            className="w-full h-40 cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-neutral-400 text-sm">Signez ici</span>
            </div>
          )}
        </div>
        {hasSignature && (
          <button onClick={clearSignature} className="mt-2 text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Effacer
          </button>
        )}
      </div>

      <label className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-neutral-200 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-neutral-300" />
        <span className="text-sm text-neutral-700">
          J'ai lu et compris le formulaire de consentement ci-dessus. Je confirme que les informations fournies sont exactes et je donne mon accord pour la realisation du tatouage.
        </span>
      </label>

      <button
        onClick={handleSubmit}
        disabled={!hasSignature || !agreed || submitting}
        className="w-full py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Send className="w-5 h-5" />
        {submitting ? 'Envoi...' : 'Signer et envoyer'}
      </button>
    </div>
  );
};
