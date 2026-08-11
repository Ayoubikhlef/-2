import { useState } from 'react';
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
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({ code: '', password: '' });

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
        ar: 'تم إرسال رمز الاسترجاع إلى هاتفك عبر واتساب (إن وجد)',
        fr: 'Code de récupération envoyé sur votre téléphone (WhatsApp)',
        en: 'Reset code sent to your phone via WhatsApp (if on file)',
      }));
      setMode('reset');
    } catch (err: any) {
      setError(err.message || t({ ar: 'حدث خطأ، تحقق من البريد', fr: 'Erreur, vérifiez votre email', en: 'Error, check your email' }));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetForm.password.length < 8) {
      setError(t({ ar: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل', fr: 'Le mot de passe doit avoir au moins 8 caractères', en: 'Password must be at least 8 characters' }));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: forgotEmail, code: resetForm.code.trim(), password: resetForm.password });
      toast.success(t({ ar: 'تم تغيير كلمة المرور، سجّل الدخول الآن', fr: 'Mot de passe changé, connectez-vous', en: 'Password changed, log in now' }));
      setMode('login');
      setResetForm({ code: '', password: '' });
    } catch (err: any) {
      setError(err.message || t({ ar: 'فشل الاسترجاع', fr: 'Échec de la récupération', en: 'Reset failed' }));
    } finally {
      setLoading(false);
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
              : t({ ar: 'استرجاع كلمة المرور', fr: 'Récupération', en: 'Password Recovery' })}
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
                ar: 'أدخل بريدك الإلكتروني وسنرسل رمز استرجاع إلى هاتفك عبر واتساب',
                fr: 'Entrez votre email, un code sera envoyé sur votre téléphone via WhatsApp',
                en: 'Enter your email and we will send a recovery code to your phone via WhatsApp',
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
              {t({ ar: 'إرسال الرمز', fr: 'Envoyer le code', en: 'Send code' })}
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
              {t({ ar: 'العودة للدخول', fr: 'Retour', en: 'Back to login' })}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <input
              type="text"
              value={resetForm.code}
              onChange={(e) => setResetForm({ ...resetForm, code: e.target.value })}
              placeholder={t({ ar: 'رمز الاسترجاع (6 أرقام)', fr: 'Code (6 chiffres)', en: 'Recovery code (6 digits)' })}
              required
              inputMode="numeric"
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
              {t({ ar: 'تغيير كلمة المرور', fr: 'Changer le mot de passe', en: 'Reset password' })}
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
              {t({ ar: 'العودة للدخول', fr: 'Retour', en: 'Back to login' })}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
