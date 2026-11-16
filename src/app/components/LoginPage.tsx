import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../utils/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Mode =
  | 'login'
  | 'register'
  | 'registered'
  | 'forgot'
  | 'forgot-sent'
  | 'reset'
  | 'twofactor';

/**
 * Customer sign-in and registration. The owner's admin login lives in
 * #hqpanel (Admin.tsx); this dialog is the storefront account entry.
 */
export function LoginPage({ onClose }: { onClose: () => void }) {
  const { t, language } = useLanguage();
  const { login, register } = useAuth();
  const { theme } = useTheme();
  const lightMode = theme === 'light';

  const C = {
    card: lightMode ? '#ffffff' : '#0f172a',
    cardBorder: lightMode ? 'rgba(15,23,42,0.08)' : 'rgba(59,130,246,.1)',
    cardShadow: lightMode ? '0 10px 40px rgba(15,23,42,0.10)' : '0 0 40px rgba(59,130,246,.15), 0 0 80px rgba(59,130,246,.05)',
    title: lightMode ? '#1e293b' : '#f1f5f9',
    field: lightMode ? '#f1f5f9' : '#1e293b',
    fieldText: lightMode ? '#1e293b' : '#e2e8f0',
    in1: lightMode ? '#cbd5e1' : '#0f172a',
    in2: lightMode ? '#ffffff' : '#2d3a4c',
    btn1: lightMode ? '#cbd5e1' : '#0f172a',
    btn2: lightMode ? '#ffffff' : '#2d3a4c',
  };

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });
  const [token, setToken] = useState<string | null>(null);

  // Password-reset links may still arrive as ?token=... on the storefront.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const extracted = params.get('token');
    if (extracted) {
      setToken(extracted);
      setMode('reset');
    }
  }, []);

  const fieldStyle = {
    width: '100%',
    height: '60px',
    padding: '18px 22px',
    fontSize: '17px',
    color: C.fieldText,
    background: C.field,
    border: 'none',
    borderRadius: '20px',
    outline: 'none',
    boxShadow: `inset 4px 4px 8px ${C.in1}, inset -4px -4px 8px ${C.in2}`,
    boxSizing: 'border-box',
  } as const;

  const buttonStyle = {
    width: '100%',
    height: '60px',
    background: C.field,
    color: C.fieldText,
    fontSize: '19px',
    fontWeight: 700,
    border: 'none',
    borderRadius: '20px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    boxShadow: `${C.btn1} 4px 4px 8px, -4px -4px 8px ${C.btn2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  } as const;

  const linkStyle = {
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    fontSize: '15px',
    cursor: 'pointer',
    textDecoration: 'underline',
  } as const;

  const title = () => {
    switch (mode) {
      case 'register':
        return t({ ar: 'إنشاء حساب', fr: 'Créer un compte', en: 'Create account' });
      case 'registered':
        return t({ ar: 'تأكيد البريد', fr: 'Confirmer l’email', en: 'Confirm email' });
      case 'forgot':
        return t({ ar: 'استرجاع كلمة المرور', fr: 'Récupération', en: 'Password recovery' });
      case 'forgot-sent':
        return t({ ar: 'تحقق من بريدك', fr: 'Vérifiez votre email', en: 'Check your email' });
      case 'reset':
        return t({ ar: 'كلمة مرور جديدة', fr: 'Nouveau mot de passe', en: 'New password' });
      case 'twofactor':
        return t({ ar: 'التحقق بخطوتين', fr: 'Double authentification', en: 'Two-factor authentication' });
      default:
        return t({ ar: 'تسجيل الدخول', fr: 'Connexion', en: 'Sign in' });
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setLoading(true);
    try {
      const result = await login(
        form.email.trim(),
        form.password,
        mode === 'twofactor' ? twoFactorCode.trim() : undefined
      );

      if (result.setupRequired) {
        setError(
          t({
            ar: 'هذا الحساب إداري. أكمل إعداد التحقق بخطوتين من لوحة #hqpanel.',
            fr: 'Compte administrateur : terminez la double authentification depuis #hqpanel.',
            en: 'Admin account: complete two-factor setup from the #hqpanel panel.',
          })
        );
        return;
      }

      if (result.twoFactorRequired) {
        setMode('twofactor');
        setTwoFactorCode('');
        return;
      }

      toast.success(t({ ar: 'تم تسجيل الدخول', fr: 'Connecté', en: 'Signed in' }));
      onClose();
    } catch (err: any) {
      if (err?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(form.email.trim());
        setError(
          t({
            ar: 'أكّد بريدك الإلكتروني أولاً. افتح رسالة التأكيد في بريدك، أو أعد إرسالها من الأسفل.',
            fr: 'Confirmez d’abord votre email. Ouvrez le message de confirmation ou renvoyez-le ci-dessous.',
            en: 'Confirm your email first. Open the confirmation message or send it again below.',
          })
        );
        return;
      }
      setError(err.message || t({ ar: 'بريد إلكتروني أو كلمة مرور خاطئة', fr: 'Identifiants incorrects', en: 'Invalid email or password' }));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (registerForm.password.length < 10) {
      setError(t({ ar: 'كلمة المرور يجب أن تكون 10 أحرف على الأقل', fr: 'Le mot de passe doit contenir au moins 10 caractères', en: 'Password must be at least 10 characters' }));
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerForm.password)) {
      setError(t({ ar: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم', fr: 'Le mot de passe doit contenir majuscule, minuscule et chiffre', en: 'Password must contain an uppercase letter, a lowercase letter and a number' }));
      return;
    }

    setLoading(true);
    try {
      await register({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim() || undefined,
        password: registerForm.password,
      });
      setRegisteredEmail(registerForm.email.trim());
      setRegisterForm({ email: '', password: '', name: '', phone: '' });
      setMode('registered');
    } catch (err: any) {
      if (err?.status === 409) {
        setError(
          t({
            ar: 'هذا البريد مسجّل مسبقاً. سجّل الدخول أو استرجع كلمة المرور.',
            fr: 'Cet email est déjà enregistré. Connectez-vous ou récupérez votre mot de passe.',
            en: 'This email is already registered. Sign in or recover your password.',
          })
        );
        return;
      }
      if (err?.status === 502 || err?.status === 503) {
        setError(
          t({
            ar: 'إنشاء الحسابات متوقف مؤقتاً لسبب تقني. يمكنك إتمام الطلب كزائر، وسنعيد تشغيل التسجيل قريباً.',
            fr: 'La création de comptes est momentanément indisponible. Vous pouvez commander en tant qu’invité.',
            en: 'Account creation is temporarily unavailable. You can still order as a guest.',
          })
        );
        return;
      }
      setError(err.message || t({ ar: 'تعذّر إنشاء الحساب', fr: 'Impossible de créer le compte', en: 'Could not create the account' }));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (emailArg?: string) => {
    const email = emailArg || registeredEmail;
    setError('');
    setLoading(true);
    try {
      await api.auth.resendVerification(email);
      toast.success(t({ ar: 'أُرسلت رسالة التأكيد مرة أخرى', fr: 'Email de confirmation renvoyé', en: 'Confirmation email sent again' }));
    } catch {
      toast.error(t({ ar: 'تعذّر إرسال الرسالة، حاول لاحقاً', fr: 'Envoi impossible, réessayez plus tard', en: 'Could not send the email, try again later' }));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setMode('forgot-sent');
    } catch {
      // Generic message: never reveal whether the address exists.
      setError(t({ ar: 'إذا كان البريد مسجلاً فسيصلك رابط', fr: 'Si l’email existe, vous recevrez un lien', en: 'If the email is registered, you will receive a link' }));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const { password, confirmPassword } = resetForm;
    if (password.length < 12) {
      setError(t({ ar: 'كلمة المرور يجب أن تكون 12 حرفاً على الأقل', fr: 'Le mot de passe doit contenir au moins 12 caractères', en: 'Password must be at least 12 characters' }));
      return;
    }
    if (password !== confirmPassword) {
      setError(t({ ar: 'كلمتا المرور غير متطابقتين', fr: 'Les mots de passe ne correspondent pas', en: 'Passwords do not match' }));
      return;
    }
    if (!token) {
      setError(t({ ar: 'الرابط غير صالح أو منتهي', fr: 'Lien invalide ou expiré', en: 'Invalid or expired link' }));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success(t({ ar: 'تم تغيير كلمة المرور، سجّل الدخول الآن', fr: 'Mot de passe modifié, connectez-vous', en: 'Password changed, sign in now' }));
      setResetForm({ password: '', confirmPassword: '' });
      setToken(null);
      setMode('login');
    } catch (err: any) {
      setError(err.message || t({ ar: 'تعذّر تغيير كلمة المرور', fr: 'Impossible de changer le mot de passe', en: 'Could not change the password' }));
    } finally {
      setLoading(false);
    }
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const authModes: Mode[] = ['login', 'register'];
  const showTabs = authModes.includes(mode);

  const errorBlock = error ? (
    <p style={{ margin: 0, fontSize: '15px', color: '#ef4444', textAlign: 'center', lineHeight: 1.5 }}>
      {error}
    </p>
  ) : null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      dir={dir}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title()}
        onClick={(event) => event.stopPropagation()}
        style={{
          background: C.card,
          borderRadius: '28px',
          boxShadow: C.cardShadow,
          border: `1px solid ${C.cardBorder}`,
          width: '520px',
          maxWidth: '100%',
          minHeight: '560px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          maxHeight: '92vh',
          overflowY: 'auto',
        } as React.CSSProperties}
      >
        {showTabs && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              aria-pressed={mode === 'login'}
              style={{
                padding: '10px 22px',
                border: 'none',
                borderRadius: '16px',
                background: mode === 'login' ? '#3b82f6' : 'transparent',
                color: mode === 'login' ? '#fff' : C.fieldText,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t({ ar: 'دخول', fr: 'Connexion', en: 'Sign in' })}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              aria-pressed={mode === 'register'}
              style={{
                padding: '10px 22px',
                border: 'none',
                borderRadius: '16px',
                background: mode === 'register' ? '#10b981' : 'transparent',
                color: mode === 'register' ? '#fff' : C.fieldText,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t({ ar: 'إنشاء حساب', fr: 'Créer un compte', en: 'Create account' })}
            </button>
          </div>
        )}

        <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 700, color: C.title }}>
          {title()}
        </h1>

        {mode === 'login' && (
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#94a3b8' }}>
            {t({ ar: 'تابع طلباتك ونقاط الولاء من مكان واحد', fr: 'Suivez vos commandes et vos points de fidélité', en: 'Track your orders and loyalty points in one place' })}
          </p>
        )}

        {(mode === 'register' || mode === 'twofactor') && <div style={{ height: '16px' }} />}

        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
              aria-label={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
              autoComplete="email"
              required
              style={fieldStyle}
            />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}
              aria-label={t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}
              autoComplete="current-password"
              required
              style={fieldStyle}
            />

            {errorBlock}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? <Loader2 className="animate-spin" size={22} /> : null}
              {t({ ar: 'دخول', fr: 'Se connecter', en: 'Sign in' })}
            </button>

            <button type="button" onClick={() => { setMode('forgot'); setError(''); }} style={linkStyle}>
              {t({ ar: 'نسيت كلمة المرور؟', fr: 'Mot de passe oublié ?', en: 'Forgot password?' })}
            </button>

            {unverifiedEmail && (
              <button
                type="button"
                onClick={() => handleResend(unverifiedEmail)}
                disabled={loading}
                style={{ ...linkStyle, color: '#22c55e' }}
              >
                {t({ ar: 'إعادة إرسال رابط التأكيد', fr: 'Renvoyer le lien de confirmation', en: 'Resend confirmation link' })}
              </button>
            )}
          </form>
        )}

        {mode === 'twofactor' && (
          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              {t({ ar: 'أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة، أو أحد رموز الاحتياط.', fr: 'Entrez le code à 6 chiffres de votre application, ou un code de secours.', en: 'Enter the 6-digit code from your authenticator app, or a backup code.' })}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={twoFactorCode}
              onChange={(event) => setTwoFactorCode(event.target.value)}
              placeholder="123456"
              aria-label={t({ ar: 'رمز التحقق', fr: 'Code de vérification', en: 'Verification code' })}
              autoComplete="one-time-code"
              required
              style={{ ...fieldStyle, textAlign: 'center', letterSpacing: '6px', fontSize: '22px' }}
            />

            {errorBlock}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? <Loader2 className="animate-spin" size={22} /> : null}
              {t({ ar: 'تأكيد', fr: 'Confirmer', en: 'Confirm' })}
            </button>

            <button type="button" onClick={() => { setMode('login'); setError(''); }} style={linkStyle}>
              {t({ ar: 'عودة', fr: 'Retour', en: 'Back' })}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <input
              type="text"
              value={registerForm.name}
              onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
              placeholder={t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full name' })}
              aria-label={t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full name' })}
              autoComplete="name"
              required
              style={fieldStyle}
            />
            <input
              type="email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
              placeholder={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
              aria-label={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
              autoComplete="email"
              required
              style={fieldStyle}
            />
            <input
              type="password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
              placeholder={t({ ar: 'كلمة المرور (10 أحرف على الأقل)', fr: 'Mot de passe (10 caractères min.)', en: 'Password (at least 10 characters)' })}
              aria-label={t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}
              autoComplete="new-password"
              required
              minLength={10}
              style={fieldStyle}
            />
            <input
              type="tel"
              value={registerForm.phone}
              onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })}
              placeholder={t({ ar: 'رقم الهاتف (اختياري)', fr: 'Téléphone (optionnel)', en: 'Phone (optional)' })}
              aria-label={t({ ar: 'رقم الهاتف', fr: 'Téléphone', en: 'Phone' })}
              autoComplete="tel"
              style={fieldStyle}
            />

            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
              {t({ ar: 'سنرسل رابط تأكيد إلى بريدك. يلزم تأكيده قبل تسجيل الدخول.', fr: 'Nous enverrons un lien de confirmation. Confirmez-le avant de vous connecter.', en: 'We will send a confirmation link. Confirm it before signing in.' })}
            </p>

            {errorBlock}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? <Loader2 className="animate-spin" size={22} /> : null}
              {t({ ar: 'إنشاء الحساب', fr: 'Créer le compte', en: 'Create account' })}
            </button>
          </form>
        )}

        {mode === 'registered' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            <p style={{ margin: 0, fontSize: '16px', color: '#22c55e', lineHeight: 1.6 }}>
              {t({ ar: 'تم إنشاء الحساب. أرسلنا رابط التأكيد إلى:', fr: 'Compte créé. Lien de confirmation envoyé à :', en: 'Account created. Confirmation link sent to:' })}
            </p>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: C.title, wordBreak: 'break-all' }}>
              {registeredEmail}
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              {t({ ar: 'افتح الرسالة واضغط «تأكيد البريد»، ثم سجّل الدخول.', fr: 'Ouvrez l’email, cliquez sur « Confirmer », puis connectez-vous.', en: 'Open the email, click “Confirm”, then sign in.' })}
            </p>
            {errorBlock}
            <button type="button" onClick={() => handleResend()} disabled={loading} style={buttonStyle}>
              {loading ? <Loader2 className="animate-spin" size={22} /> : null}
              {t({ ar: 'إعادة إرسال الرسالة', fr: 'Renvoyer l’email', en: 'Resend email' })}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} style={linkStyle}>
              {t({ ar: 'لدي حساب مؤكد، دخول', fr: 'Compte confirmé, se connecter', en: 'My account is confirmed, sign in' })}
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              {t({ ar: 'أدخل بريدك وسنرسل رابط إعادة تعيين كلمة المرور.', fr: 'Entrez votre email, un lien sera envoyé.', en: 'Enter your email and we will send a reset link.' })}
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              placeholder={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
              aria-label={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
              autoComplete="email"
              required
              style={fieldStyle}
            />

            {errorBlock}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? <Loader2 className="animate-spin" size={22} /> : null}
              {t({ ar: 'إرسال الرابط', fr: 'Envoyer le lien', en: 'Send link' })}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} style={linkStyle}>
              {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to sign in' })}
            </button>
          </form>
        )}

        {mode === 'forgot-sent' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            <p style={{ margin: 0, fontSize: '16px', color: '#22c55e' }}>
              {t({ ar: 'إذا كان البريد مسجلاً فسيصلك رابط', fr: 'Si l’email est enregistré, un lien arrive', en: 'If the email is registered, a link is on its way' })}
            </p>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} style={linkStyle}>
              {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to sign in' })}
            </button>
          </div>
        )}

        {mode === 'reset' && token && (
          <form onSubmit={handleReset} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <input
              type="password"
              value={resetForm.password}
              onChange={(event) => setResetForm({ ...resetForm, password: event.target.value })}
              placeholder={t({ ar: 'كلمة المرور الجديدة', fr: 'Nouveau mot de passe', en: 'New password' })}
              aria-label={t({ ar: 'كلمة المرور الجديدة', fr: 'Nouveau mot de passe', en: 'New password' })}
              autoComplete="new-password"
              required
              minLength={12}
              style={fieldStyle}
            />
            <input
              type="password"
              value={resetForm.confirmPassword}
              onChange={(event) => setResetForm({ ...resetForm, confirmPassword: event.target.value })}
              placeholder={t({ ar: 'تأكيد كلمة المرور', fr: 'Confirmer le mot de passe', en: 'Confirm password' })}
              aria-label={t({ ar: 'تأكيد كلمة المرور', fr: 'Confirmer le mot de passe', en: 'Confirm password' })}
              autoComplete="new-password"
              required
              minLength={12}
              style={fieldStyle}
            />

            {errorBlock}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? <Loader2 className="animate-spin" size={22} /> : null}
              {t({ ar: 'تعيين كلمة المرور', fr: 'Définir le mot de passe', en: 'Set password' })}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError(''); setToken(null); }} style={linkStyle}>
              {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to sign in' })}
            </button>
          </form>
        )}

        {mode === 'reset' && !token && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, color: C.title }}>{t({ ar: 'رابط غير صالح', fr: 'Lien invalide', en: 'Invalid link' })}</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
              {t({ ar: 'الرابط غير صالح أو منتهي الصلاحية', fr: 'Le lien est invalide ou expiré', en: 'The link is invalid or expired' })}
            </p>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} style={linkStyle}>
              {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to sign in' })}
            </button>
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
          <button
            type="button"
            onClick={onClose}
            style={{ ...linkStyle, marginTop: '18px', color: '#64748b', textDecoration: 'none' }}
          >
            {t({ ar: 'متابعة التصفح بدون حساب', fr: 'Continuer sans compte', en: 'Continue without an account' })}
          </button>
        )}
      </div>
    </div>
  );
}
