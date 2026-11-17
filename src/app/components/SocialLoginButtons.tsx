'use client';

import { Loader2 } from 'lucide-react';

interface SocialLoginButtonProps {
  provider: 'google' | 'microsoft';
  onClick: (provider: 'google' | 'microsoft') => void;
  isLoading?: boolean;
}

interface SocialLoginButtonsProps {
  onSignIn: (provider: 'google' | 'microsoft') => void;
}

// SVG icons for social providers
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.63-2.23 1-3.71 1H12_v2.77z"
    />
    <path
      fill="#FBBC05"
      d="M5.5 2.8l3.57 2.7c-.96 1.39-1.4 3.04-1.4 4.7s.44 3.31 1.4 4.7L5.5 21.1c-2.08-1.92-3.28-4.74-3.28-8.09 0-3.35 1.2-6.17 3.28-8.09z"
    />
    <path
      fill="#EA4335"
      d="M12 17.7v-2.77l-.85-2.77h6.24c-1.01-2.6-3.72-4.49-7.02-4.49-2.97 0-5.46.98-7.28 2.66l3.57 2.77c.98-.63 2.23-1 3.71-1h3.71z"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#F25022" d="M0 14.5l6.73-8.75c-.28-.63-1.03-1.03-1.83-1.03L0 9.6v4.9z" />
    <path fill="#F25022" d="M24 14.5l-6.73-8.75c.28-.63 1.03-1.03 1.83-1.03v4.9l6.17-.64z" />
    <path fill="#F25022" d="M7.64 6.7L0 0H16.2l-8.56 6.7z" />
    <path fill="#F25022" d="M0 14.5h16.17v-7.34L0 9.6z" />
    <path fill="#F25022" d="M0 14.5l6.73-8.75c-.28-.63-1.03-1.03-1.83-1.03L0 9.6v4.9z" />
    <path fill="#71BCEF" d="M24 0l-8.56 6.7v4.9h16.17V0H24zm-16.17 14.5l6.73-8.75c-.28-.63-1.03-1.03-1.83-1.03L0 9.6v4.9z" />
    <path fill="#71BCEF" d="M24 0l-8.56 6.7v4.9h16.17V0H24zm-16.17 14.5l6.73-8.75c-.28-.63-1.03-1.03-1.83-1.03L0 9.6v4.9z" />
    <path fill="#F25022" d="M24 14.5l-6.73-8.75c.28-.63 1.03-1.03 1.83-1.03v4.9l6.17-.64z" />
    <path fill="#F25022" d="M24 0l-8.56 6.7v4.9h16.17V0H24zm-16.17 14.5l6.73-8.75c-.28-.63-1.03-1.03-1.83-1.03L0 9.6v4.9z" />
    <path fill="#71BCEF" d="M24 0l-8.56 6.7v4.9h16.17V0H24zm-16.17 14.5l6.73-8.75c-.28-.63-1.03-1.03-1.83-1.03L0 9.6v4.9z" />
    <path fill="#F25022" d="M17.26 0l6.74 8.75h-16.17V0h8.43z" />
    <path fill="#71BCEF" d="M17.26 0l6.74 8.75h-16.17V0h8.43z" />
    <path fill="#F2C92D" d="M17.26 0l6.74 8.75h-16.17V0h8.43z" />
    <path fill="#71BCEF" d="M17.26 0l6.74 8.75h-16.17V0h8.43z" />
    <path fill="#F2C92D" d="M17.26 0l6.74 8.75h-16.17V0h8.43z" />
    <path fill="#71BCEF" d="M0 14.5l6.73-8.75c-.28-.63-1.03-1.03-1.83-1.03L0 9.6v4.9z" />
    <path fill="#F2C92D" d="M0 14.5l6.73-8.75c-.28-.63-1.03-1.03-1.83-1.03L0 9.6v4.9z" />
    <path fill="#F2C92D" d="M0 0h24v14.5H0z" />
  </svg>
);

export function SocialLoginButton({ provider, onClick, isLoading }: SocialLoginButtonProps) {
  const buttonConfig = {
    google: { label: 'Google', icon: GoogleIcon },
    microsoft: { label: 'Microsoft', icon: MicrosoftIcon },
  }[provider];

  return (
    <button
      type="button"
      onClick={() => onClick(provider)}
      disabled={isLoading}
      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white/80" />
        ) : (
          <buttonConfig.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
        )}
        {!isLoading && <span>{buttonConfig.label}</span>}
      </div>
    </button>
  );
}

export function SocialLoginButtons({ onSignIn }: SocialLoginButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <SocialLoginButton provider="google" onClick={onSignIn} />
      <SocialLoginButton provider="microsoft" onClick={onSignIn} />
    </div>
  );
}
