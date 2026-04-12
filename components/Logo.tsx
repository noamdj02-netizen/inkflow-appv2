import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 max-h-8 max-w-8',
  md: 'w-10 h-10 max-h-10 max-w-10',
  lg: 'w-12 h-12 max-h-12 max-w-12',
  xl: 'w-16 h-16 max-h-16 max-w-16',
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  return (
    <img
      src="/icon.svg"
      alt="InkFlow"
      className={`flex-shrink-0 object-contain rounded-2xl ${sizeClasses[size as keyof typeof sizeClasses] ?? sizeClasses.md} ${className}`}
    />
  );
};
