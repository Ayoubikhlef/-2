import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage({ onClose }: { onClose: () => void }) {
  const { t, language } = useLanguage();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register({ email: form.email, password: form.password, name: form.name, phone: form.phone });
        toast.success(t({ ar: 'تم إنشاء الحساب', fr: 'Compte créé', en: 'Account created' }));
      } else {
        await login(form.email, form.password);
        toast.success(t({ ar: 'تم تسجيل الدخول', fr: 'Connecté', en: 'Logged in' }));
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md rounded-[32px] border border-border bg-background shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center gap-3 mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            {isRegister ? <UserPlus className="w-6 h-6 text-primary" /> : <LogIn className="w-6 h-6 text-primary" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {isRegister
                ? t({ ar: 'إنشاء حساب', fr: 'Créer un compte', en: 'Create Account' })
                : t({ ar: 'تسجيل الدخول', fr: 'Connexion', en: 'Sign In' })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRegister
                ? t({ ar: 'أنشئ حساب للاستفادة من الميزات', fr: 'Créez un compte pour profiter des fonctionnalités', en: 'Create an account to enjoy features' })
                : t({ ar: 'مرحباً بعودتك', fr: 'Bon retour', en: 'Welcome back' })}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-bold mb-1.5">{t({ ar: 'الاسم', fr: 'Nom', en: 'Name' })}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-2xl border-2 border-border bg-background pl-12 pr-5 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Ahmed Ben Ali"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-1.5">{t({ ar: 'البريد الإلكتروني', fr: 'Email', en: 'Email' })}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-2xl border-2 border-border bg-background pl-12 pr-5 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5">{t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-2xl border-2 border-border bg-background pl-12 pr-5 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-bold mb-1.5">{t({ ar: 'رقم الهاتف', fr: 'Téléphone', en: 'Phone' })}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-2xl border-2 border-border bg-background px-5 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="0674 11 32 90"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid w-full rounded-2xl bg-primary text-primary-foreground py-4 font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {isRegister
              ? t({ ar: 'إنشاء حساب', fr: 'Créer un compte', en: 'Create Account' })
              : t({ ar: 'تسجيل الدخول', fr: 'Se connecter', en: 'Sign In' })}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          {isRegister
            ? t({ ar: 'لديك حساب؟ ', fr: 'Vous avez un compte? ', en: 'Have an account? ' })
            : t({ ar: 'ليس لديك حساب؟ ', fr: "Vous n'avez pas de compte? ", en: "Don't have an account? " })}
          <button onClick={() => setIsRegister(!isRegister)} className="text-primary font-semibold hover:underline">
            {isRegister
              ? t({ ar: 'تسجيل الدخول', fr: 'Connectez-vous', en: 'Sign In' })
              : t({ ar: 'سجل الآن', fr: 'Inscrivez-vous', en: 'Register' })}
          </button>
        </p>
      </div>
    </div>
  );
}
