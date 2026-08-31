import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage({ onClose }: { onClose: () => void; standalone?: boolean }) {
  const { t, language } = useLanguage();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset' | 'forgot-sent'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });
  const [resetMode, setResetMode] = useState<'code' | 'new-password'>('new-password');
  const [token, setToken] = useState<string | null>(null);

  // Extract token from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const extractedToken = urlParams.get('token');
    if (extractedToken) {
      setToken(extractedToken);
      setMode('reset');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success(t({ ar: 'تم تسجيل الدخول', fr: 'Connecté', en: 'Logged in' }));
      onClose();
    } catch (err: any) {
      setError(err.message || t({ ar: 'اسم مستخدم أو كلمة مرور خاطئة', fr: 'Identifiants incorrects', en: 'Invalid credentials' }));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      toast.success(t({
        ar: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
        fr: 'L\'e-mail de réinitialisation du mot de passe a été envoyé',
        en: 'Password reset link sent to your email',
      }));
      setMode('forgot-sent');
    } catch (err: any) {
      // Show generic error - don't reveal if email exists
      setError(t({ ar: 'إذا كان البريد الإلكتروني مسجلًا، فسيصلك رابط', fr: 'Si l\'email est enregistré, vous recevrez un lien', en: 'If email is registered, you will receive a link' }));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (resetMode === 'code') {
      // Verifying code mode - check if we have a valid session
      setLoading(true);
      try {
        // In the new system, we directly go to password entry after email sent
        // So we'll just transition to new-password mode
        setResetMode('new-password');
      } catch (err: any) {
        setError(err.message || 'Error verifying code');
      } finally {
        setLoading(false);
      }
    } else if (resetMode === 'new-password') {
      // Set new password
      const { password, confirmPassword } = resetForm;
      
      if (password.length < 8) {
        setError(t({ ar: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل', fr: 'Le mot de passe doit avoir au moins 8 caractères', en: 'Password must be at least 8 characters' }));
        return;
      }
      
      if (password !== confirmPassword) {
        setError(t({ ar: 'كلمة المرور غير متطابقة', fr: 'Les mots de passe ne correspondent pas', en: 'Passwords do not match' }));
        return;
      }
      
      setLoading(true);
      try {
        await api.post('/auth/reset-password', { email: forgotEmail, password });
        toast.success(t({ ar: 'تم تغيير كلمة المرور، سجّل الدخول الآن', fr: 'Mot de passe changé, connectez-vous', en: 'Password changed, log in now' }));
        setMode('login');
        setResetForm({ password: '', confirmPassword: '' });
        setToken(null);
      } catch (err: any) {
        setError(err.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    }
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
      dir={dir}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0f172a',
          borderRadius: '28px',
          boxShadow: '0 0 40px rgba(59,130,246,.15), 0 0 80px rgba(59,130,246,.05)',
          border: '1px solid rgba(59,130,246,.1)',
          width: '520px',
          minHeight: '620px',
          padding: '50px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        } as React.CSSProperties}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '35px' }}>
          <h1 style={{ margin: 0, fontSize: '38px', fontWeight: 700, color: '#f1f5f9' }}>
            {mode === 'login'
              ? t({ ar: 'دخول الأدمين', fr: 'Connexion Admin', en: 'Admin Login' })
              : mode === 'forgot'
                ? t({ ar: 'استرجاع كلمة المرور', fr: 'Récupération', en: 'Password Recovery' })
                : t({ ar: 'كلمة مرور جديدة', fr: 'Nouveau mot de passe', en: 'New Password' })}
            </h1>
          <button
            type="button"
            style={{
              width: '56px',
              height: '56px',
              border: 'none',
              borderRadius: '50%',
              background: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(251,191,36,.5), 0 0 40px rgba(251,191,36,.2)',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>?</span>
          </button>
        </div>

        {/* Form */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <input
              type="text"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
              required
              style={{
                width: '100%',
                height: '64px',
                padding: '20px 24px',
                fontSize: '19px',
                color: '#e2e8f0',
                background: '#1e293b',
                border: 'none',
                borderRadius: '20px',
                outline: 'none',
                boxShadow: 'inset 4px 4px 8px #0f172a, inset -4px -4px 8px #2d3a4c',
                boxSizing: 'border-box',
              }}
            />

            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}
              required
              minLength={6}
              style={{
                width: '100%',
                height: '64px',
                padding: '20px 24px',
                fontSize: '19px',
                color: '#e2e8f0',
                background: '#1e293b',
                border: 'none',
                borderRadius: '20px',
                outline: 'none',
                boxShadow: 'inset 4px 4px 8px #0f172a, inset -4px -4px 8px #2d3a4c',
                boxSizing: 'border-box',
              }}
            />

            {error && (
              <p style={{ margin: 0, fontSize: '16px', color: '#ef4444', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '64px',
                background: '#1e293b',
                color: '#e2e8f0',
                fontSize: '20px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '4px 4px 8px #0f172a, -4px -4px 8px #2d3a4c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : null}
              {t({ ar: 'دخول', fr: 'Connexion', en: 'Login' })}
            </button>

            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '15px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {t({ ar: 'نسيت كلمة المرور؟', fr: 'Mot de passe oublié ?', en: 'Forgot password?' })}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <p style={{ margin: 0, fontSize: '15px', color: '#94a3b8', textAlign: 'center' }}>
              {t({
                ar: 'أدخل بريدك الإلكتروني وسنرسل رابط إعادة تعيين كلمة المرور',
                fr: 'Entrez votre email, un lien sera envoyé',
                en: 'Enter your email and we will send a password reset link',
              })}
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
              required
              style={{
                width: '100%',
                height: '64px',
                padding: '20px 24px',
                fontSize: '19px',
                color: '#e2e8f0',
                background: '#1e293b',
                border: 'none',
                borderRadius: '20px',
                outline: 'none',
                boxShadow: 'inset 4px 4px 8px #0f172a, inset -4px -4px 8px #2d3a4c',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ margin: 0, fontSize: '16px', color: '#ef4444', textAlign: 'center' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '64px',
                background: '#1e293b',
                color: '#e2e8f0',
                fontSize: '20px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '4px 4px 8px #0f172a, -4px -4px 8px #2d3a4c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : null}
              {t({ ar: 'إرسال الرابط', fr: 'Envoyer le lien', en: 'Send link' })}
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '15px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to login' })}
            </button>
          </form>
        )}

        {mode === 'forgot-sent' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <p style={{ margin: 0, fontSize: '18px', color: '#22c55e' }}>
              {t({
                ar: 'تم إرسال الرابط بنجاح',
                fr: 'Lien envoyé avec succès',
                en: 'Link sent successfully',
              })}
            </p>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
              إذا كان البريد الإلكتروني مسجلاً، فسيصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.
            </p>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '15px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to login' })}
            </button>
          </div>
        )}

        {mode === 'reset' && token && (
          <form onSubmit={handleReset} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <input
              type="password"
              value={resetForm.password}
              onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
              placeholder={t({ ar: 'كلمة المرور الجديدة', fr: 'Nouveau mot de passe', en: 'New password' })}
              required
              minLength={8}
              style={{
                width: '100%',
                height: '64px',
                padding: '20px 24px',
                fontSize: '19px',
                color: '#e2e8f0',
                background: '#1e293b',
                border: 'none',
                borderRadius: '20px',
                outline: 'none',
                boxShadow: 'inset 4px 4px 8px #0f172a, inset -4px -4px 8px #2d3a4c',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="password"
              value={resetForm.confirmPassword}
              onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
              placeholder={t({ ar: 'تأكيد كلمة المرور', fr: 'Confirmation du mot de passe', en: 'Confirm password' })}
              required
              minLength={8}
              style={{
                width: '100%',
                height: '64px',
                padding: '20px 24px',
                fontSize: '19px',
                color: '#e2e8f0',
                background: '#1e293b',
                border: 'none',
                borderRadius: '20px',
                outline: 'none',
                boxShadow: 'inset 4px 4px 8px #0f172a, inset -4px -4px 8px #2d3a4c',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ margin: 0, fontSize: '16px', color: '#ef4444', textAlign: 'center' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '64px',
                background: '#1e293b',
                color: '#e2e8f0',
                fontSize: '20px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '4px 4px 8px #0f172a, -4px -4px 8px #2d3a4c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : null}
              {t({ ar: 'تعيين كلمة المرور', fr: 'Définir le mot de passe', en: 'Set password' })}
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setToken(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '15px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to login' })}
            </button>
          </form>
        )}

        {mode === 'reset' || mode === 'forgot-sent' && !token && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>{t({ ar: 'رابط غير صالح', fr: 'Lien invalide', en: 'Invalid link' })}</h2>
            <p>{t({ ar: 'الرابط غير صالح أو منتهي الصلاحية', fr: 'Le lien est invalide ou expiré', en: 'The link is invalid or expired' })}</p>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '15px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to login' })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}