import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { getCroppedImgDataUrl } from '../../lib/cropImage';
import { resizeDataUrl } from '../../lib/imageResize';
import { useToast } from '../../contexts/ToastContext';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  /** Ratio largeur / hauteur (ex. 1 = carré, 3 = bannière 3:1) */
  aspect: number;
  cropShape?: 'rect' | 'round';
  title?: string;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void | Promise<void>;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  aspect,
  cropShape = 'rect',
  title = 'Ajuster le cadrage',
  onClose,
  onConfirm,
}) => {
  const toast = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const pixelsRef = useRef<Area | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      pixelsRef.current = null;
      setSubmitting(false);
    }
  }, [isOpen, imageSrc]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    pixelsRef.current = areaPixels;
  }, []);

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
          Déplacez l’image et utilisez le zoom pour cadrer comme souhaité.
        </p>
        <div className="relative w-full h-[min(52vh,300px)] sm:h-[340px] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
          {imageSrc ? (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            rotation={0}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            minZoom={1}
            maxZoom={4}
            zoomSpeed={0.65}
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
            keyboardStep={4}
          />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-zinc-400">
              Chargement de l’image…
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="crop-zoom">
            Zoom
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={4}
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
