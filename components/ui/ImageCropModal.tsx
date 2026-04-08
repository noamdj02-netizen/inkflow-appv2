import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, MediaSize } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { getCroppedImgDataUrl } from '../../lib/cropImage';
import { resizeDataUrl } from '../../lib/imageResize';
import { useToast } from '../../contexts/ToastContext';

/** Zoom mini : valeur inférieure à 1 = dézoom (flash vertical dans un cadre large). */
const MIN_ZOOM = 0.08;
const MAX_ZOOM = 6;

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  /** Ratio largeur / hauteur (ex. 1 = carré, 3 = bannière 3:1) */
  aspect: number;
  cropShape?: 'rect' | 'round';
  title?: string;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void | Promise<void>;
  /**
   * `contain` (défaut si cadre peu allongé) ou `cover` (bannières / flashs larges).
   * Si omis : cover automatique lorsque aspect ≥ 1.35 (meilleur rendu des images verticales).
   */
  objectFit?: 'contain' | 'cover' | 'horizontal-cover' | 'vertical-cover';
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  aspect,
  cropShape = 'rect',
  title = 'Ajuster le cadrage',
  onClose,
  onConfirm,
  objectFit: objectFitProp,
}) => {
  const toast = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const pixelsRef = useRef<Area | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mediaFitDoneRef = useRef<string | null>(null);

  const effectiveObjectFit =
    objectFitProp ?? (aspect >= 1.35 ? 'cover' : 'contain');

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      pixelsRef.current = null;
      setSubmitting(false);
      mediaFitDoneRef.current = null;
    }
  }, [isOpen, imageSrc]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    pixelsRef.current = areaPixels;
  }, []);

  /** Ajuste le zoom initial quand l’image est plus « haute » que le cadre de cadrage (flash vertical, bannière 3:1, etc.). */
  const onMediaLoaded = useCallback(
    (ms: MediaSize) => {
      const key = `${imageSrc}:${ms.naturalWidth}x${ms.naturalHeight}`;
      if (mediaFitDoneRef.current === key) return;
      mediaFitDoneRef.current = key;

      const iw = ms.naturalWidth;
      const ih = ms.naturalHeight;
      if (!iw || !ih) return;

      const imgAspect = iw / ih;
      const cropAspect = aspect;

      if (imgAspect < cropAspect - 0.0001) {
        const raw = (imgAspect / cropAspect) * 0.94;
        const z = Math.max(MIN_ZOOM, Math.min(1, raw));
        setZoom(z);
      } else {
        setZoom(1);
      }
      setCrop({ x: 0, y: 0 });
    },
    [aspect, imageSrc],
  );

  const handleConfirm = async () => {
    const pixels = pixelsRef.current;
    if (!pixels || pixels.width < 1 || pixels.height < 1) {
      toast.error('L’image est encore en chargement. Patientez un instant puis réessayez.');
      return;
    }
    setSubmitting(true);
    try {
      let out = await getCroppedImgDataUrl(imageSrc, pixels);
      out = await resizeDataUrl(out);
      await onConfirm(out);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Déplacez l’image sous le cadre. Curseur à gauche = éloigner (tout voir sur un grand flash
          vertical) ; à droite = rapprocher.
        </p>
        <div
          className="relative w-full min-h-[240px] h-[min(56vh,420px)] sm:min-h-[280px] sm:h-[400px] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800"
        >
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              rotation={0}
              objectFit={effectiveObjectFit}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={onMediaLoaded}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              zoomSpeed={0.55}
              restrictPosition
              showGrid={false}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                },
              }}
              classes={{}}
              mediaProps={{}}
              cropperProps={{}}
              zoomWithScroll={false}
              keyboardStep={2}
            />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-zinc-400">
              Chargement de l’image…
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <span>Éloigner</span>
            <span className="text-zinc-600 dark:text-zinc-300">Zoom</span>
            <span>Rapprocher</span>
          </div>
          <input
            id="crop-zoom"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 accent-zinc-900 dark:accent-zinc-100"
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={submitting || !imageSrc}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement…
              </>
            ) : (
              'Valider'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
