import React from 'react';
import { CX } from './clientExperienceTypes';

interface SkeletonCardProps {
  height?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ height = 180 }) => (
  <div
    className="rounded-3xl overflow-hidden animate-pulse"
    style={{ height, background: CX.surface, border: `1px solid ${CX.border}` }}
  >
    <div className="h-full flex flex-col justify-end p-3">
      <div className="h-3 w-3/4 rounded-full mb-2" style={{ background: CX.surfaceGlass }} />
      <div className="h-2 w-1/2 rounded-full" style={{ background: CX.surfaceGlass }} />
    </div>
  </div>
);

export const SkeletonFlashGrid: React.FC = () => (
  <div className="flex gap-3">
    <div className="flex-1 space-y-3">
      <SkeletonCard height={170} />
      <SkeletonCard height={200} />
      <SkeletonCard height={150} />
    </div>
    <div className="flex-1 space-y-3 pt-8">
      <SkeletonCard height={190} />
      <SkeletonCard height={160} />
      <SkeletonCard height={220} />
    </div>
  </div>
);
