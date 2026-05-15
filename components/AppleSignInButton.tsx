import React from 'react';

/** Logo Apple monochrome (guidelines Sign in with Apple — contraste sur fond noir) */
const AppleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
    />
  </svg>
);

interface AppleSignInButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

const appleBtnBase =
  'w-full min-h-[48px] flex items-center justify-center gap-3 py-3 rounded-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ' +
  'bg-black text-white border border-black ' +
  'hover:bg-zinc-900 hover:border-zinc-900 ' +
  'dark:bg-white dark:text-black dark:border-white dark:hover:bg-zinc-100 dark:hover:border-zinc-100';

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onClick,
  disabled = false,
  label = 'Se connecter avec Apple',
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`${appleBtnBase} ${className}`.trim()}
    aria-label={label}
  >
    <AppleLogo className="shrink-0 text-white dark:text-black" />
    <span>{label}</span>
  </button>
);
