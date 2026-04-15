/**
 * Onboarding — Photo de profil studio (Storage + avatar_url).
 */
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, UserCircle } from 'lucide-react';
import { Logo } from '../Logo';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

const heroImg = '/images/fallon-michael-EQucs66pts0-unsplash.jpg';

export interface OnboardingAvatarStepProps {
  studioId: string;
  /** Après upload réussi — pour mettre à jour le contexte utilisateur. */
  onAvatarSaved?: (publicUrl: string) => void;
  onComplete: () => void;
}

async function fileToJpegBlob(file: File): Promise<Blob> {
  const img = document.createElement('img');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(file);
  });
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('img'));
    img.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  const size = 200;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size);
  const jpegUrl = canvas.toDataURL('image/jpeg', 0.85);
  const res = await fetch(jpegUrl);
  return res.blob();
}

export const OnboardingAvatarStep: React.FC<OnboardingAvatarStepProps> = ({
  studioId,
  onAvatarSaved,
  onComplete,
}) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choisis une image (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (max 5 Mo)');
      return;
    }
    setUploading(true);
    try {
      const blob = await fileToJpegBlob(file);
      const fileName = `avatars/${studioId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('inkflow-assets')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

          if (uploadError) {
            toast.error(uploadError.message || "Erreur lors de l'upload");
            return;
          }
      const { data: urlData } = supabase.storage.from('inkflow-assets').getPublicUrl(fileName);
      if (!urlData?.publicUrl) {
        toast.error('URL publique introuvable');
        return;
      }
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase
        .from('inkflow_studios')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', studioId);
      onAvatarSaved?.(publicUrl);
      toast.success('Photo enregistrée');
      onComplete();
    } catch {
      toast.error('Traitement impossible');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex min-h-screen bg-white dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-labelledby="avatar-title"
    >
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void handleFile(e)} />

      <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] overflow-y-auto">
        <div className="lg:hidden flex-shrink-0 h-28 sm:h-36 relative overflow-hidden safe-top">
          <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover object-center" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-transparent" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-5 sm:py-8 safe-bottom min-h-0">
          <motion.div
            className="w-full max-w-sm mx-auto py-4 sm:py-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 mb-5 sm:mb-6">
              <Logo className="dark:invert" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
            </div>

            <h1 id="avatar-title" className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5">
              Photo de profil
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-5 sm:mb-6">
              Logo ou portrait : visible sur ton espace pro et sur la vitrine. Tu pourras la changer dans le menu compte.
            </p>

            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-28 h-28 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <UserCircle className="w-16 h-16 text-zinc-400" />
              </div>
              <button
                type="button"
                onClick={handlePick}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                {uploading ? 'Envoi…' : 'Choisir une photo'}
              </button>
            </div>

            <button
              type="button"
              onClick={onComplete}
              disabled={uploading}
              className="w-full min-h-[44px] text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              Passer pour l’instant
            </button>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] min-h-screen flex-shrink-0 relative overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img src={heroImg} alt="" className="absolute inset-0 w-full min-h-full object-cover object-bottom" loading="eager" />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Mets un visage sur ton studio.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">Ça rassure tes clients.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
