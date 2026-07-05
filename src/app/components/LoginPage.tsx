import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage({ onClose }: { onClose: () => void }) {
  const { t, language } = useLanguage();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

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
            {t({ ar: 'دخول الأدمين', fr: 'Connexion Admin', en: 'Admin Login' })}
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
            <span style={{ fontSize: '24px' }}>💡</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <input
            type="text"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t({ ar: 'اسم المستخدم', fr: "Nom d'utilisateur", en: 'Username' })}
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
        </form>
      </div>
    </div>
  );
}
