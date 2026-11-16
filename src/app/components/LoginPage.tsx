import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

type Mode =
  | 'login'
  | 'register'
  | 'registered'
  | 'forgot'
  | 'forgot-sent'
  | 'reset'
  | 'twofactor';

const REMEMBER_KEY = 'aos_remember_email';

const FEATURES = [
  { icon: ShieldCheck, ar: 'أمان عالي', fr: 'Sécurité élevée', en: 'High security' },
  { icon: Zap, ar: 'خدمة سريعة', fr: 'Service rapide', en: 'Fast service' },
  { icon: Headphones, ar: 'دعم فني متوفر', fr: 'Support technique disponible', en: 'Technical support' },
];

const SERVICES = [
  { ar: 'إنشاء المواقع', fr: 'Création de sites', en: 'Website creation' },
  { ar: 'بيع الإعلام الآلي', fr: 'Vente informatique', en: 'IT products' },
  { ar: 'التكوين', fr: 'Formation', en: 'Training' },
  { ar: 'الصيانة', fr: 'Maintenance', en: 'Maintenance' },
];

const AUTH_STYLES = `
  @keyframes aosAuthUp {
    from { opacity: 0; transform: translate3d(0, 22px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
  }
  @keyframes aosAuthFade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes aosAuthFloat {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: .5; }
    50% { transform: translate3d(0, -20px, 0) scale(1.05); opacity: .85; }
  }
  @keyframes aosAuthGlow {
    0%, 100% { filter: drop-shadow(0 0 16px rgba(56, 189, 248, .18)); }
    50% { filter: drop-shadow(0 0 34px rgba(56, 189, 248, .42)); }
  }
  @keyframes aosAuthSweep {
    0% { transform: translateX(-140%) skewX(-18deg); }
    60%, 100% { transform: translateX(260%) skewX(-18deg); }
  }
  .aos-auth-card { animation: aosAuthUp .72s cubic-bezier(.22, 1, .36, 1) .08s both; }
  .aos-auth-brand { animation: aosAuthFade 1s ease .05s both; }
  .aos-auth-panel { animation: aosAuthUp .5s cubic-bezier(.22, 1, .36, 1) both; }
  .aos-auth-logo { animation: aosAuthGlow 4.5s ease-in-out infinite; }
  .aos-auth-orb { animation: aosAuthFloat 15s ease-in-out infinite; }
  .aos-auth-sweep { position: relative; overflow: hidden; }
  .aos-auth-sweep::after {
    content: '';
    position: absolute;
    top: -35%;
    bottom: -35%;
    left: 0;
    width: 42%;
    pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .3), transparent);
    animation: aosAuthSweep 4.6s ease-in-out infinite;
  }
  .aos-auth-signature {
    font-family: 'Segoe Script', 'Brush Script MT', 'Lucida Handwriting', cursive;
    transform: rotate(-5deg);
    letter-spacing: .02em;
  }
  .aos-auth-input:-webkit-autofill,
  .aos-auth-input:-webkit-autofill:hover,
  .aos-auth-input:-webkit-autofill:focus {
    -webkit-text-fill-color: #e2e8f0;
    -webkit-box-shadow: 0 0 0 1000px #0a162b inset;
    caret-color: #e2e8f0;
    transition: background-color 9999s ease-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .aos-auth-card,
    .aos-auth-brand,
    .aos-auth-panel,
    .aos-auth-logo,
    .aos-auth-orb { animation: none !important; }
    .aos-auth-sweep::after { display: none; }
  }
`;

const inputClass =
  'aos-auth-input h-[54px] w-full rounded-2xl border border-white/[0.08] bg-[#0a162b]/90 px-5 text-[15px] text-slate-100 outline-none transition duration-300 placeholder:text-slate-500 hover:border-white/[0.14] focus:border-sky-500/70 focus:bg-[#0b1a32] focus:ring-4 focus:ring-sky-500/10';

const primaryClass =
  'aos-auth-sweep flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 text-[16px] font-bold text-white shadow-[0_18px_40px_-14px_rgba(37,99,235,.95)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-14px_rgba(56,189,248,.8)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0';

const linkClass =
  'text-[13px] font-medium text-slate-400 underline-offset-4 transition hover:text-sky-300 hover:underline disabled:opacity-60';

const eyeButtonClass =
  'absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50';

function readRememberedEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(REMEMBER_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Customer sign-in and registration. The owner's admin login lives in
 * #hqpanel (Admin.tsx); this dialog is the storefront account entry.
 */
export function LoginPage({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated?: () => void }) {
  const { t, language } = useLanguage();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(() => Boolean(readRememberedEmail()));
  const [form, setForm] = useState(() => ({ email: readRememberedEmail(), password: '' }));
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [forgotEmail, setForgotEmail] = useState(() => readRememberedEmail());
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });
  const [token, setToken] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Password-reset links may still arrive as ?token=... on the storefront;
  // the "invalid link" page links back with ?forgot=1 to open recovery.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const extracted = params.get('token');
    if (extracted) {
      setToken(extracted);
      setMode('reset');
      return;
    }
    if (params.get('forgot') === '1') setMode('forgot');
  }, []);

  // The dialog is full-screen; keep the storefront behind it from scrolling.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const rememberEmail = (email: string) => {
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* storage can be unavailable in private mode */
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

      rememberEmail(form.email.trim());
      toast.success(t({ ar: 'تم تسجيل الدخول', fr: 'Connecté', en: 'Signed in' }));
      // Customers land inside their account area, not back on the home page.
      (onAuthenticated ?? onClose)();
    } catch (err: any) {
      if (err?.code === 'ACCOUNT_BLOCKED') {
        setError(
          t({
            ar: 'تم حظر هذا الحساب من المتجر. إن كنت تعتقد أن ذلك خطأ، تواصل معنا.',
            fr: 'Ce compte a été bloqué par la boutique. Contactez-nous si vous pensez qu’il s’agit d’une erreur.',
            en: 'This account has been blocked by the store. Contact us if you think this is a mistake.',
          })
        );
        return;
      }
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
      // The reset token is single-use; keep it out of the address bar/history.
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('token');
      window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    } catch (err: any) {
      // The API answers with a generic English message; guide the customer in
      // their own language and point at the recovery form.
      const raw = String(err?.message || '');
      setError(
        /invalid|expired/i.test(raw)
          ? t({
              ar: 'الرابط غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً من «نسيت كلمة المرور؟».',
              fr: 'Lien invalide ou expiré. Demandez un nouveau lien via « Mot de passe oublié ? ».',
              en: 'Invalid or expired link. Request a new one from “Forgot password?”.',
            })
          : raw || t({ ar: 'تعذّر تغيير كلمة المرور', fr: 'Impossible de changer le mot de passe', en: 'Could not change the password' })
      );
    } finally {
      setLoading(false);
    }
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const showTabs = mode === 'login' || mode === 'register';

  const errorBlock = error ? (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-3.5 py-3 text-[12.5px] leading-6 text-red-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{error}</span>
    </div>
  ) : null;

  const passwordToggle = (
    visible: boolean,
    onToggle: () => void,
    labels: { show: string; hide: string }
  ) => (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? labels.hide : labels.show}
      aria-pressed={visible}
      className={eyeButtonClass}
    >
      {visible ? <EyeOff className="h-[17px] w-[17px]" aria-hidden="true" /> : <Eye className="h-[17px] w-[17px]" aria-hidden="true" />}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay)] overflow-y-auto bg-[#050b18]"
      onClick={onClose}
      dir={dir}
    >
      <style>{AUTH_STYLES}</style>

      {/* Ambient background: navy gradient, faint grid and slow blue light. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_15%_0%,#0d2144_0%,#071226_42%,#030814_100%)]" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.14) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
            maskImage: 'radial-gradient(85% 70% at 50% 40%, black 0%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(85% 70% at 50% 40%, black 0%, transparent 78%)',
          }}
        />
        <div className="aos-auth-orb absolute -left-24 top-10 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div
          className="aos-auth-orb absolute -right-20 bottom-0 h-[460px] w-[460px] rounded-full bg-sky-500/15 blur-[130px]"
          style={{ animationDelay: '-6s' }}
        />
        <div className="absolute -top-40 left-1/3 h-[520px] w-[220px] rotate-[24deg] bg-gradient-to-b from-sky-400/15 via-blue-500/5 to-transparent blur-3xl" />
        <div className="absolute -top-52 right-1/4 h-[620px] w-[160px] rotate-[24deg] bg-gradient-to-b from-white/10 via-sky-400/5 to-transparent blur-3xl" />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title()}
        onClick={(event) => event.stopPropagation()}
        dir="ltr"
        className="relative mx-auto flex min-h-full w-full max-w-[1120px] flex-col justify-center gap-7 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:py-12"
      >
        {/* Compact brand lockup on phones and tablets. */}
        <div className="aos-auth-brand mx-auto text-center lg:hidden" dir="ltr">
          <img
            src="/aos-logo-white.png"
            alt="AOS Tech Store"
            width="908"
            height="520"
            className="mx-auto w-[150px] drop-shadow-[0_0_28px_rgba(56,189,248,.25)]"
          />
          <p className="mt-2 text-[15px] font-extrabold tracking-[0.32em] text-white">TECH STORE</p>
          <p className="mt-1 text-[8px] font-semibold tracking-[0.38em] text-sky-300/80">AYOUB OFFICE SERVICES</p>
        </div>

        {/* Brand panel, matching the reference art direction. */}
        <section
          className="aos-auth-brand relative hidden min-h-[600px] flex-1 flex-col justify-between py-2 lg:flex"
          dir={dir}
          aria-label={t({ ar: 'هوية المتجر', fr: 'Identité de la boutique', en: 'Store identity' })}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-16%] bottom-[-6%] h-[54%]">
            <img
              src="/hero-bg.png"
              alt=""
              className="h-full w-full object-cover object-center opacity-60"
              style={{
                maskImage:
                  'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,.85) 45%, rgba(0,0,0,.25) 75%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,.85) 45%, rgba(0,0,0,.25) 75%, transparent 100%)',
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#050b18_0%,rgba(5,11,24,.6)_38%,rgba(5,11,24,0)_75%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,#050b18_0%,rgba(5,11,24,.25)_38%,transparent_72%)]" />
          </div>

          <div className="relative z-10">
            <div className="text-center" dir="ltr">
              <img
                src="/aos-logo-white.png"
                alt="AOS Tech Store"
                width="908"
                height="520"
                className="aos-auth-logo mx-auto w-[238px]"
              />
              <p className="mt-4 text-[27px] font-extrabold tracking-[0.36em] text-white">TECH STORE</p>
              <p className="mt-2 text-[9.5px] font-semibold uppercase tracking-[0.44em] text-sky-300/85">
                AYOUB OFFICE SERVICES
              </p>
            </div>

            <div className="mt-9 max-w-[440px]">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.34em] text-sky-300/80">
                {t({ ar: 'خدماتنا', fr: 'Nos services', en: 'Our services' })}
              </p>
              <ul className="mt-3.5 flex flex-wrap gap-2">
                {SERVICES.map((service) => (
                  <li
                    key={service.en}
                    className="rounded-full border border-sky-400/25 bg-sky-500/10 px-3.5 py-1.5 text-[12.5px] font-bold text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
                  >
                    {t(service)}
                  </li>
                ))}
              </ul>
              <span className="mt-4 block h-[3px] w-16 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 shadow-[0_0_18px_rgba(56,189,248,.7)]" />
            </div>

            <ul className="mt-8 space-y-3">
              {FEATURES.map(({ icon: Icon, ...label }) => (
                <li key={label.en} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-400/25 bg-sky-500/10 text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="text-[15px] font-bold text-slate-100">{t(label)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mt-10 flex items-end justify-between gap-6" dir="ltr">
            <p className="aos-auth-signature text-[23px] text-sky-300/90">Your Technology Partner</p>
            <span className="mb-2 hidden h-px flex-1 bg-gradient-to-r from-sky-400/40 to-transparent sm:block" />
          </div>
        </section>

        {/* Form card. */}
        <div className="aos-auth-card relative mx-auto w-full max-w-full shrink-0 overflow-hidden rounded-[30px] border border-sky-400/20 bg-[linear-gradient(155deg,rgba(15,32,58,0.98),rgba(7,17,33,0.99))] px-5 py-7 shadow-[0_36px_90px_-24px_rgba(2,8,23,.95),0_0_70px_-20px_rgba(37,99,235,.55)] sm:px-8 sm:py-8 lg:max-w-[446px]" dir={dir}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent"
          />

          {showTabs && (
            <div
              role="tablist"
              aria-label={t({ ar: 'نوع الحساب', fr: 'Type de compte', en: 'Account type' })}
              className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.07] bg-[#071326]/80 p-1.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`h-10 rounded-xl text-[13.5px] font-bold transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-[0_10px_26px_-10px_rgba(37,99,235,.95)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t({ ar: 'دخول', fr: 'Connexion', en: 'Sign in' })}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`h-10 rounded-xl text-[13.5px] font-bold transition-all duration-300 ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-[0_10px_26px_-10px_rgba(37,99,235,.95)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t({ ar: 'إنشاء حساب', fr: 'Créer un compte', en: 'Create account' })}
              </button>
            </div>
          )}

          <h1 className="mt-6 text-[26px] font-extrabold tracking-tight text-white sm:text-[28px]">{title()}</h1>

          {mode === 'login' && (
            <p className="mt-1.5 text-[13.5px] leading-6 text-slate-400">
              {t({
                ar: 'سجل الدخول ليصلك كل جديد',
                fr: 'Connectez-vous pour recevoir toutes les nouveautés',
                en: 'Sign in to get all the latest updates',
              })}
            </p>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="aos-auth-panel mt-6 space-y-3.5">
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" aria-hidden="true" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
                  aria-label={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
                  autoComplete="email"
                  required
                  className={`${inputClass} pl-[50px]`}
                />
              </div>

              <div className="group relative">
                <Lock className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" aria-hidden="true" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder={t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}
                  aria-label={t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}
                  autoComplete="current-password"
                  required
                  className={`${inputClass} pl-[50px] pr-[52px]`}
                />
                {passwordToggle(showLoginPassword, () => setShowLoginPassword((value) => !value), {
                  show: t({ ar: 'إظهار كلمة المرور', fr: 'Afficher le mot de passe', en: 'Show password' }),
                  hide: t({ ar: 'إخفاء كلمة المرور', fr: 'Masquer le mot de passe', en: 'Hide password' }),
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                  }}
                  className="text-[13px] font-semibold text-sky-400 underline-offset-4 transition hover:text-sky-300 hover:underline"
                >
                  {t({ ar: 'نسيت كلمة المرور؟', fr: 'Mot de passe oublié ?', en: 'Forgot password?' })}
                </button>

                <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-slate-400">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`grid h-[18px] w-[18px] place-items-center rounded-[6px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400/70 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0f203a] ${
                      remember
                        ? 'border-sky-400 bg-sky-500 shadow-[0_0_12px_rgba(56,189,248,.55)]'
                        : 'border-white/15 bg-white/5'
                    }`}
                  >
                    {remember && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  {t({ ar: 'تذكرني', fr: 'Se souvenir de moi', en: 'Remember me' })}
                </label>
              </div>

              {errorBlock}

              <button type="submit" disabled={loading} className={primaryClass}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                )}
                <span>{t({ ar: 'دخول', fr: 'Se connecter', en: 'Sign in' })}</span>
              </button>

              {unverifiedEmail && (
                <button
                  type="button"
                  onClick={() => handleResend(unverifiedEmail)}
                  disabled={loading}
                  className="mx-auto block text-[13px] font-semibold text-emerald-400 underline-offset-4 transition hover:text-emerald-300 hover:underline disabled:opacity-60"
                >
                  {t({ ar: 'إعادة إرسال رابط التأكيد', fr: 'Renvoyer le lien de confirmation', en: 'Resend confirmation link' })}
                </button>
              )}
            </form>
          )}

          {mode === 'twofactor' && (
            <form onSubmit={handleLogin} className="aos-auth-panel mt-5 space-y-3.5">
              <p className="text-[13px] leading-6 text-slate-400">
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
                className={`${inputClass} text-center text-[22px] font-bold tracking-[0.5em] placeholder:text-[15px] placeholder:font-normal placeholder:tracking-normal`}
              />

              {errorBlock}

              <button type="submit" disabled={loading} className={primaryClass}>
                {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                <span>{t({ ar: 'تأكيد', fr: 'Confirmer', en: 'Confirm' })}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`${linkClass} mx-auto block`}
              >
                {t({ ar: 'عودة', fr: 'Retour', en: 'Back' })}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="aos-auth-panel mt-6 space-y-3.5">
              <div className="group relative">
                <User className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" aria-hidden="true" />
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                  placeholder={t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full name' })}
                  aria-label={t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full name' })}
                  autoComplete="name"
                  required
                  className={`${inputClass} pl-[50px]`}
                />
              </div>

              <div className="group relative">
                <Mail className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" aria-hidden="true" />
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                  placeholder={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
                  aria-label={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
                  autoComplete="email"
                  required
                  className={`${inputClass} pl-[50px]`}
                />
              </div>

              <div className="group relative">
                <Lock className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" aria-hidden="true" />
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                  placeholder={t({ ar: 'كلمة المرور (10 أحرف على الأقل)', fr: 'Mot de passe (10 caractères min.)', en: 'Password (at least 10 characters)' })}
                  aria-label={t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}
                  autoComplete="new-password"
                  required
                  minLength={10}
                  className={`${inputClass} pl-[50px] pr-[52px]`}
                />
                {passwordToggle(showRegisterPassword, () => setShowRegisterPassword((value) => !value), {
                  show: t({ ar: 'إظهار كلمة المرور', fr: 'Afficher le mot de passe', en: 'Show password' }),
                  hide: t({ ar: 'إخفاء كلمة المرور', fr: 'Masquer le mot de passe', en: 'Hide password' }),
                })}
              </div>

              <div className="group relative">
                <Phone className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" aria-hidden="true" />
                <input
                  type="tel"
                  value={registerForm.phone}
                  onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })}
                  placeholder={t({ ar: 'رقم الهاتف (اختياري)', fr: 'Téléphone (optionnel)', en: 'Phone (optional)' })}
                  aria-label={t({ ar: 'رقم الهاتف', fr: 'Téléphone', en: 'Phone' })}
                  autoComplete="tel"
                  className={`${inputClass} pl-[50px]`}
                />
              </div>

              <p className="text-[12px] leading-5 text-slate-500">
                {t({ ar: 'سنرسل رابط تأكيد إلى بريدك. يلزم تأكيده قبل تسجيل الدخول.', fr: 'Nous enverrons un lien de confirmation. Confirmez-le avant de vous connecter.', en: 'We will send a confirmation link. Confirm it before signing in.' })}
              </p>

              {errorBlock}

              <button type="submit" disabled={loading} className={primaryClass}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <User className="h-5 w-5" aria-hidden="true" />
                )}
                <span>{t({ ar: 'إنشاء حساب', fr: 'Créer un compte', en: 'Create account' })}</span>
              </button>
            </form>
          )}

          {mode === 'registered' && (
            <div className="aos-auth-panel mt-5 flex flex-col items-center gap-4 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_30px_-6px_rgba(16,185,129,.6)]">
                <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <p className="text-[14px] leading-6 text-emerald-300">
                {t({ ar: 'تم إنشاء الحساب. أرسلنا رابط التأكيد إلى:', fr: 'Compte créé. Lien de confirmation envoyé à :', en: 'Account created. Confirmation link sent to:' })}
              </p>
              <p className="max-w-full break-all text-[15px] font-bold text-white">{registeredEmail}</p>
              <p className="text-[13px] leading-6 text-slate-400">
                {t({ ar: 'افتح الرسالة واضغط «تأكيد البريد»، ثم سجّل الدخول.', fr: 'Ouvrez l’email, cliquez sur « Confirmer », puis connectez-vous.', en: 'Open the email, click “Confirm”, then sign in.' })}
              </p>

              {errorBlock}

              <button type="button" onClick={() => handleResend()} disabled={loading} className={primaryClass}>
                {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                <span>{t({ ar: 'إعادة إرسال الرسالة', fr: 'Renvoyer l’email', en: 'Resend email' })}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={linkClass}
              >
                {t({ ar: 'لدي حساب مؤكد، دخول', fr: 'Compte confirmé, se connecter', en: 'My account is confirmed, sign in' })}
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="aos-auth-panel mt-5 space-y-3.5">
              <p className="text-[13px] leading-6 text-slate-400">
                {t({ ar: 'أدخل بريدك وسنرسل رابط إعادة تعيين كلمة المرور.', fr: 'Entrez votre email, un lien sera envoyé.', en: 'Enter your email and we will send a reset link.' })}
              </p>

              <div className="group relative">
                <Mail className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" aria-hidden="true" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  placeholder={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
                  aria-label={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
                  autoComplete="email"
                  required
                  className={`${inputClass} pl-[50px]`}
                />
              </div>

              {errorBlock}

              <button type="submit" disabled={loading} className={primaryClass}>
                {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                <span>{t({ ar: 'إرسال الرابط', fr: 'Envoyer le lien', en: 'Send link' })}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`${linkClass} mx-auto block`}
              >
                {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to sign in' })}
              </button>
            </form>
          )}

          {mode === 'forgot-sent' && (
            <div className="aos-auth-panel mt-5 flex flex-col items-center gap-4 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_30px_-6px_rgba(56,189,248,.6)]">
                <Mail className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="text-[14px] leading-6 text-sky-200">
                {t({ ar: 'إذا كان البريد مسجلاً فسيصلك رابط', fr: 'Si l’email est enregistré, un lien arrive', en: 'If the email is registered, a link is on its way' })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={linkClass}
              >
                {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to sign in' })}
              </button>
            </div>
          )}

          {mode === 'reset' && token && (
            <form onSubmit={handleReset} className="aos-auth-panel mt-5 space-y-3.5">
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" aria-hidden="true" />
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetForm.password}
                  onChange={(event) => setResetForm({ ...resetForm, password: event.target.value })}
                  placeholder={t({ ar: 'كلمة المرور الجديدة', fr: 'Nouveau mot de passe', en: 'New password' })}
                  aria-label={t({ ar: 'كلمة المرور الجديدة', fr: 'Nouveau mot de passe', en: 'New password' })}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  className={`${inputClass} pl-[50px] pr-[52px]`}
                />
                {passwordToggle(showResetPassword, () => setShowResetPassword((value) => !value), {
                  show: t({ ar: 'إظهار كلمة المرور', fr: 'Afficher le mot de passe', en: 'Show password' }),
                  hide: t({ ar: 'إخفاء كلمة المرور', fr: 'Masquer le mot de passe', en: 'Hide password' }),
                })}
              </div>

              <div className="group relative">
                <Lock className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" aria-hidden="true" />
                <input
                  type={showResetConfirm ? 'text' : 'password'}
                  value={resetForm.confirmPassword}
                  onChange={(event) => setResetForm({ ...resetForm, confirmPassword: event.target.value })}
                  placeholder={t({ ar: 'تأكيد كلمة المرور', fr: 'Confirmer le mot de passe', en: 'Confirm password' })}
                  aria-label={t({ ar: 'تأكيد كلمة المرور', fr: 'Confirmer le mot de passe', en: 'Confirm password' })}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  className={`${inputClass} pl-[50px] pr-[52px]`}
                />
                {passwordToggle(showResetConfirm, () => setShowResetConfirm((value) => !value), {
                  show: t({ ar: 'إظهار كلمة المرور', fr: 'Afficher le mot de passe', en: 'Show password' }),
                  hide: t({ ar: 'إخفاء كلمة المرور', fr: 'Masquer le mot de passe', en: 'Hide password' }),
                })}
              </div>

              {errorBlock}

              <button type="submit" disabled={loading} className={primaryClass}>
                {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                <span>{t({ ar: 'تعيين كلمة المرور', fr: 'Définir le mot de passe', en: 'Set password' })}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                }}
                className={`${linkClass} mx-auto block`}
              >
                {t({ ar: 'انتهت صلاحية الرابط؟ اطلب رابطاً جديداً', fr: 'Lien expiré ? Demandez-en un nouveau', en: 'Link expired? Request a new one' })}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setToken(null);
                }}
                className={`${linkClass} mx-auto block`}
              >
                {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to sign in' })}
              </button>
            </form>
          )}

          {mode === 'reset' && !token && (
            <div className="aos-auth-panel mt-5 flex flex-col items-center gap-4 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-red-400/30 bg-red-500/10 text-red-300">
                <AlertCircle className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="text-[18px] font-bold text-white">
                {t({ ar: 'رابط غير صالح', fr: 'Lien invalide', en: 'Invalid link' })}
              </h2>
              <p className="text-[13px] leading-6 text-slate-400">
                {t({ ar: 'الرابط غير صالح أو منتهي الصلاحية', fr: 'Le lien est invalide ou expiré', en: 'The link is invalid or expired' })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                }}
                className="aos-auth-sweep flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 text-[14px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(37,99,235,.95)] transition hover:-translate-y-0.5"
              >
                {t({ ar: 'طلب رابط جديد', fr: 'Demander un nouveau lien', en: 'Request a new link' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={linkClass}
              >
                {t({ ar: 'عودة للدخول', fr: 'Retour', en: 'Back to sign in' })}
              </button>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <button
              type="button"
              onClick={onClose}
              className="mx-auto mt-5 block text-[13px] font-medium text-slate-500 underline-offset-4 transition hover:text-slate-300 hover:underline"
            >
              {t({ ar: 'متابعة التصفح بدون حساب', fr: 'Continuer sans compte', en: 'Continue without an account' })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
