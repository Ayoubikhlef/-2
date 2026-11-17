'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Contexts
import { LanguageContextProvider, useLanguage } from '@/contexts/LanguageContext';
import { ThemeContextProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthContextProvider, useAuth } from '@/contexts/AuthContext';

// Components - importing from parent directory level
import { GradientBackground } from '../components/GradientBackground';
import { SocialLoginButtons } from '../components/SocialLoginButtons';

// Icons (using Lucide React which should be available)
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

// Types for form state
interface FormState {
  mode: 'login' | 'register' | 'forgot' | 'reset' | 'twofactor' | 'magic-link';
  email: string;
  password: string;
  otpCode?: string;
}

export default function LoginPage() {
  const pathname = usePathname();
  const router = useRouter();

  // Hooks from contexts
  const { lang, rtl } = useLanguage();
  const theme = useTheme();

  // Auth context hooks - need to access state directly since we're outside provider structure
  // The actual auth logic will be handled by the existing backend endpoints

  // Local state for form
  const [formState, setFormState] = useState<FormState>({
    mode: 'login',
    email: '',
    password: '',
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Track reset token for password reset flow
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Helper: Navigate back to home
  const navigateBack = () => {
    router.push('/');
  };

  // Helper: Clear message and reset form
  const clearMessage = () => {
    setMessage(null);
    setFormState({ mode: 'login', email: '', password: '' });
    setResetToken(null);
  };

  // Format error messages based on language
  const formatError = (key: string): string => {
    if (!rtl) return lang.messages[`${pathname}.${key}`];
    return lang.messagesAr[`auth.${key}`] || lang.messages[`${pathname}.${key}`];
  };

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.email || !formState.password) {
      setMessage({ type: 'error', text: formatError('emptyFields') });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formState.email, password: formState.password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: 'error', text: formatError(data.error || 'invalidCredentials') });
      } else {
        // Success - redirect to dashboard or previous page
        router.push('/dashboard');
      }
    } catch (error) {
      setMessage({ type: 'error', text: formatError('networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formState.email || !formState.password) {
      setMessage({ type: 'error', text: formatError('emptyFields') });
      return;
    }

    // Password strength check (simple version)
    if (formState.password.length < 8) {
      setMessage({ type: 'error', text: formatError('passwordTooShort') });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formState.email, password: formState.password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: 'error', text: formatError(data.error || 'registrationFailed') });
      } else {
        setMessage({ type: 'success', text: formatError('emailVerificationSent') });
        setFormState(prev => ({ ...prev, mode: 'magic-link' }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: formatError('networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password (reset token email)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.email) {
      setMessage({ type: 'error', text: formatError('emptyFields') });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formState.email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: 'error', text: formatError(data.error || 'emailNotFound') });
      } else {
        setMessage({
          type: 'success',
          text: formatError('resetEmailSent')
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: formatError('networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP/2FA verification
  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.otpCode || !resetToken) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/${resetToken}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formState.otpCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: 'error', text: formatError(data.error || 'invalidOtp') });
      } else {
        // OTP verified, now need new password
        setFormState(prev => ({ ...prev, mode: 'reset' }));
        setMessage({ type: 'info', text: formatError('otpVerifiedChangePassword') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: formatError('networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.password) return;

    if (resetToken) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/auth/${resetToken}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: formState.password }),
        });

        if (!res.ok) {
          const data = await res.json();
          setMessage({ type: 'error', text: formatError(data.error || 'passwordResetFailed') });
        } else {
          router.push('/login');
        }
      } catch (error) {
        setMessage({ type: 'error', text: formatError('networkError') });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle magic link verification (for email verification during registration)
  const handleMagicLinkVerification = async () => {
    if (!formState.email) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/${formState.email}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setMessage({ type: 'error', text: formatError('emailVerificationFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: formatError('networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle social login clicks
  const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
    try {
      setIsLoading(true);
      const redirectUrl = `/api/auth/oauth/${provider}?redirect_after=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    } catch (error) {
      setMessage({ type: 'error', text: formatError('socialLoginFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <GradientBackground>
        {/* Branding - Top left */}
        <div className="relative z-10 mx-auto mt-4 flex w-full max-w-md justify-start px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-white/90 transition-all hover:text-white">
            <span className="text-xl font-bold tracking-tight">AOS TECH STORE</span>
          </Link>
        </div>

        {/* Main content - Centered glass-morphism card */}
        <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12 sm:px-8 lg:px-16">
          <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8 sm:p-10 transition-all">

            {/* Page title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {formState.mode === 'login' && lang.t('auth.loginTitle')}
                {formState.mode === 'register' && lang.t('auth.registerTitle')}
                {formState.mode === 'forgot' && lang.t('auth.forgotPasswordTitle')}
                {formState.mode === 'twofactor' && lang.t('auth.twoFactorTitle')}
                {formState.mode === 'reset' && lang.t('auth.resetPasswordTitle')}
                {formState.mode === 'magic-link' && lang.t('auth.verifyEmailTitle')}
              </h1>

              {/* Subtitle */}
              <p className="mt-2 text-sm text-white/60">
                {formState.mode === 'login' && lang.t('auth.loginSubtitle')}
                {formState.mode === 'register' && lang.t('auth.registerSubtitle')}
                {formState.mode === 'forgot' && lang.t('auth.forgotPasswordSubtitle')}
                {formState.mode === 'twofactor' && lang.t('auth.twoFactorSubtitle')}
                {formState.mode === 'reset' && lang.t('auth.resetPasswordSubtitle')}
                {formState.mode === 'magic-link' && lang.t('auth.verifyEmailSubtitle')}
              </p>
            </div>

            {/* Success message */}
            {message?.type === 'success' && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {/* Error message */}
            {message?.type === 'error' && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {/* Info message */}
            {message?.type === 'info' && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-blue-500/10 p-3 text-blue-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={formState.mode === 'login' ? handleLogin : formState.mode === 'register' ? handleRegister : null}>

              {formState.mode === 'magic-link' && (
                <div className="mb-6 text-center">
                  <p className="text-sm text-white/70">{lang.t('auth.checkEmail')}</p>
                  <button
                    type="button"
                    onClick={handleMagicLinkVerification}
                    disabled={isLoading}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {lang.t('auth.verifying')}
                      </>
                    ) : (
                      lang.t('auth.verifyNow')
                    )}
                  </button>
                </div>
              )}

              {/* Email input */}
              {(formState.mode === 'login' || formState.mode === 'register' || formState.mode === 'forgot') && (
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-white/80">
                    {rtl ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={rtl ? 'مثال: user@example.com' : 'example@domain.com'}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none ring-2 transition-all focus:border-blue-500/50 focus:bg-white/10 focus:ring-blue-500/30 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Password input - shown for login, register, 2FA reset */}
              {(formState.mode === 'login' || formState.mode === 'register' || formState.mode === 'twofactor' || formState.mode === 'reset') && (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-white/80">
                    {rtl ? 'كلمة المرور' : 'Password'}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formState.password}
                    onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={rtl ? 'أدخل كلمة المرور' : 'Enter your password'}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none ring-2 transition-all focus:border-blue-500/50 focus:bg-white/10 focus:ring-blue-500/30 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* OTP input (for 2FA) */}
              {formState.mode === 'twofactor' && (
                <div className="space-y-2">
                  <label htmlFor="otpCode" className="text-sm font-medium text-white/80">
                    {rtl ? 'رمز التحقق' : 'Verification Code'}
                  </label>
                  <input
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formState.otpCode || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, otpCode: e.target.value }))}
                    placeholder="123456"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center tracking-[0.5em] text-white placeholder-white/40 outline-none ring-2 transition-all focus:border-blue-500/50 focus:bg-white/10 focus:ring-blue-500/30 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !formState.email || (formState.mode === 'login' && !formState.password)}
                className={`mt-6 w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all ${
                  formState.mode === 'reset'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                } focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {formState.mode === 'login' && lang.t('auth.loggingIn')}
                    {formState.mode === 'register' && lang.t('auth.registering')}
                  </span>
                ) : (
                  formState.mode === 'reset'
                    ? lang.t('auth.resetPasswordButton')
                    : formState.mode === 'twofactor'
                      ? lang.t('auth.verifyCode')
                      : formState.mode === 'forgot'
                        ? lang.t('auth.sendResetEmail')
                        : lang.t('auth.submit')
                )}
              </button>

            </form>

            {/* Social login buttons */}
            {formState.mode === 'login' && (
              <div className="mt-6">
                <p className="text-center text-xs text-white/50 mb-3">{lang.t('auth.orContinueWith')}</p>
                <SocialLoginButtons onSignIn={handleSocialLogin} />
              </div>
            )}

            {/* Footer links */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs">
              {formState.mode === 'login' && (
                <>
                  <Link
                    href="/auth/forgot-password"
                    onClick={clearMessage}
                    className="text-white/60 underline-offset-2 transition-colors hover:text-white/80"
                  >
                    {rtl ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </Link>
                  <span className="text-white/30">•</span>
                  <Link
                    href="/register"
                    onClick={clearMessage}
                    className="text-white/60 underline-offset-2 transition-colors hover:text-white/80"
                  >
                    {rtl ? 'سجل حساب جديد' : 'Create an account'}
                  </Link>
                </>
              )}

              {formState.mode === 'register' && (
                <>
                  <Link
                    href="/login"
                    onClick={clearMessage}
                    className="text-white/60 underline-offset-2 transition-colors hover:text-white/80"
                  >
                    {rtl ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
                  </Link>
                </>
              )}

              {formState.mode === 'forgot' && (
                <>
                  <button
                    type="button"
                    onClick={() => { setFormState(prev => ({ ...prev, mode: 'login' })); clearMessage(); }}
                    className="text-white/60 underline-offset-2 transition-colors hover:text-white/80"
                  >
                    ← {rtl ? 'عودة' : 'Back to login'}
                  </button>
                </>
              )}

              {formState.mode === 'twofactor' && (
                <>
                  <button
                    type="button"
                    onClick={() => { setFormState(prev => ({ ...prev, mode: 'login' })); clearMessage(); }}
                    className="text-white/60 underline-offset-2 transition-colors hover:text-white/80"
                  >
                    ← {rtl ? 'عودة' : 'Back to login'}
                  </button>
                </>
              )}

              {formState.mode === 'reset' && (
                <>
                  <button
                    type="button"
                    onClick={() => { setFormState(prev => ({ ...prev, mode: 'twofactor' })); clearMessage(); }}
                    className="text-white/60 underline-offset-2 transition-colors hover:text-white/80"
                  >
                    ← {rtl ? 'عودة' : 'Back'}
                  </button>
                </>
              )}
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 mx-auto mt-8 w-full max-w-md px-6 text-center text-xs text-white/40">
          © 2026 AOS TECH STORE
        </footer>
      </GradientBackground>
    </div>
  );
}
