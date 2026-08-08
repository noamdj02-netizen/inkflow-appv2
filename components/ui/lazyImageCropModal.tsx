import { lazy } from 'react';

/** Recadrage image (react-easy-crop) — chargé à la demande pour réduire le bundle initial. */
export const LazyImageCropModal = lazy(() =>
  import('./ImageCropModal').then((m) => ({ default: m.ImageCropModal })),
);
