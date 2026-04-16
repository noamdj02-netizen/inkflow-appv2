import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Check, RotateCcw, Send } from 'lucide-react';
import {
  parseConsentUnderscoreFields,
  countConsentFields,
  buildFilledConsentText,
} from '../../lib/consentUnderscoreFields';

/** Données envoyées à l’enregistrement (signature + texte complété). */
export interface ConsentSignPayload {
  signatureData: string;
  filledTemplateText: string;
}

interface ConsentFormSignProps {
  template: string;
  clientName: string;
  appointmentDetails?: string;
  onSign: (payload: ConsentSignPayload) => Promise<void>;
  /** Messagerie / carte inline : marges et blocs réduits */
  embedded?: boolean;
}

export const ConsentFormSign: React.FC<ConsentFormSignProps> = ({
  template,
  clientName,
  appointmentDetails,
  onSign,
  embedded = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [fieldValues, setFieldValues] = useState<string[]>([]);

  const preparedTemplate = useMemo(
    () =>
      template
        .replace('[NOM_CLIENT]', clientName)
        .replace('Date : _______________', `Date : ${new Date().toLocaleDateString('fr-FR')}`),
    [template, clientName]
  );

  const segments = useMemo(() => parseConsentUnderscoreFields(preparedTemplate), [preparedTemplate]);
  const fieldCount = useMemo(() => countConsentFields(segments), [segments]);

  useEffect(() => {
    setFieldValues(Array(fieldCount).fill(''));
  }, [fieldCount, preparedTemplate]);

  const filledTemplateText = useMemo(
    () => buildFilledConsentText(segments, fieldValues),
    [segments, fieldValues]
  );

  const allFillFieldsOk = fieldCount === 0 || fieldValues.every(v => v.trim().length > 0);

  const setField = (index: number, value: string) => {
    setFieldValues(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  /** Initialise le canvas (DPR) — indispensable après layout ; sans ça rect peut être 0×0 au 1er paint → signature impossible. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const applySize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#171717';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    applySize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => applySize()) : null;
    if (ro) ro.observe(parent);
    window.addEventListener('resize', applySize);
    return () => {
      window.removeEventListener('resize', applySize);
      ro?.disconnect();
    };
  }, [embedded]);

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
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!hasSignature || !agreed || !allFillFieldsOk) return;
    setSubmitting(true);
    const signatureData = canvasRef.current?.toDataURL('image/png') || '';
    await onSign({ signatureData, filledTemplateText });
    setDone(true);
    setSubmitting(false);
  };

  if (done) {
    if (embedded) {
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mb-2 mx-auto">
            <Check className="w-5 h-5" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-emerald-900">Consentement enregistré</p>
          <p className="text-xs text-emerald-800/90 mt-1">Merci {clientName} — le studio en a été informé.</p>
        </div>
      );
    }
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Formulaire signe</h2>
        <p className="text-neutral-600">Merci {clientName} ! Votre consentement a ete enregistre.</p>
      </div>
    );
  }

  return (
    <div
      className={`select-text ${embedded ? 'max-w-full mx-auto space-y-4' : 'max-w-2xl mx-auto space-y-6'}`}
    >
      {!embedded ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Formulaire de consentement</h2>
          {appointmentDetails && <p className="text-neutral-600 text-sm">{appointmentDetails}</p>}
        </div>
      ) : null}

      <div className={`bg-white rounded-2xl border border-neutral-200 ${embedded ? 'p-3' : 'p-6'}`}>
        {fieldCount > 0 ? (
          <p
            className={`text-neutral-600 mb-3 ${embedded ? 'text-[11px] sm:text-xs' : 'text-sm'}`}
          >
            Complétez les champs soulignés ci-dessous (toutes les zones sont obligatoires), puis signez.
          </p>
        ) : null}
        <div
          className={`whitespace-pre-wrap leading-relaxed text-neutral-700 font-mono select-text ${
            embedded ? 'text-[11px] sm:text-xs max-h-[min(50vh,320px)] overflow-y-auto' : 'text-sm'
          }`}
        >
          {segments.map((seg, i) => {
            if (seg.type === 'text') {
              return <React.Fragment key={`t-${i}`}>{seg.value}</React.Fragment>;
            }
            const inputClass = embedded
              ? 'mx-0.5 inline-block align-baseline border-b border-neutral-400 bg-neutral-50 px-1 py-0.5 text-[11px] sm:text-xs text-neutral-900 rounded-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/80 focus:border-transparent min-h-[28px]'
              : 'mx-0.5 inline-block align-baseline border-b-2 border-neutral-300 bg-neutral-50/90 px-1.5 py-1 text-sm text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent min-h-[36px]';
            return (
              <input
                key={`f-${seg.index}`}
                type="text"
                value={fieldValues[seg.index] ?? ''}
                onChange={e => setField(seg.index, e.target.value)}
                className={inputClass}
                style={{ width: `${seg.widthCh}ch`, maxWidth: 'min(100%, 95vw)' }}
                autoComplete="section-consent"
                aria-label={`Réponse ${seg.index + 1}`}
              />
            );
          })}
        </div>
      </div>

      <div className={`bg-white rounded-2xl border border-neutral-200 ${embedded ? 'p-3' : 'p-6'}`}>
        <label className="block text-sm font-semibold mb-3">Votre signature</label>
        <div className="relative border-2 border-dashed border-neutral-300 rounded-xl overflow-hidden bg-neutral-50 min-h-[128px] sm:min-h-[160px]">
          <canvas
            ref={canvasRef}
            className={`block w-full cursor-crosshair touch-none ${embedded ? 'h-32' : 'h-40'}`}
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

      <label
        className={`flex items-start gap-3 bg-white rounded-2xl border border-neutral-200 cursor-pointer ${
          embedded ? 'p-3' : 'p-4'
        }`}
      >
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-neutral-300" />
        <span className={`text-neutral-700 ${embedded ? 'text-xs leading-snug' : 'text-sm'}`}>
          J'ai lu et compris le formulaire de consentement ci-dessus, complété les champs demandés et signé. Je confirme
          que les informations fournies sont exactes et je donne mon accord pour la realisation du tatouage.
        </span>
      </label>

      <button
        onClick={handleSubmit}
        disabled={!hasSignature || !agreed || !allFillFieldsOk || submitting}
        className={`w-full bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
          embedded ? 'py-3 text-sm' : 'py-4'
        }`}
      >
        <Send className="w-5 h-5" />
        {submitting ? 'Envoi...' : 'Signer et envoyer'}
      </button>
    </div>
  );
};
