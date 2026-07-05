import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteSettings, updateContact, updateDelivery, updateSiteSettings, type SiteSettingsAll } from '../utils/siteSettingsStorage';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const langs = ['ar', 'fr', 'en'] as const;
type SubTab = 'contact' | 'delivery' | 'settings';

export function SiteSettingsTab() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<SiteSettingsAll>(() => getSiteSettings());
  const [sub, setSub] = useState<SubTab>('contact');

  const saveContact = () => {
    updateContact(data.contact);
    toast.success(t({ ar: 'تم حفظ معلومات الاتصال', fr: 'Coordonnées sauvegardées', en: 'Contact info saved' }));
  };

  const saveDelivery = () => {
    updateDelivery(data.delivery);
    toast.success(t({ ar: 'تم حفظ رسوم التوصيل', fr: 'Frais de livraison sauvegardés', en: 'Delivery fees saved' }));
  };

  const saveSettings = () => {
    updateSiteSettings(data.settings);
    toast.success(t({ ar: 'تم حفظ الإعدادات', fr: 'Paramètres sauvegardés', en: 'Settings saved' }));
  };

  const addTier = () => {
    const next = { ...data };
    next.delivery.tiers.push({ label: `Tier ${next.delivery.tiers.length + 1}`, fee: 0, wilayaIds: [] });
    setData(next);
  };

  const removeTier = (idx: number) => {
    const next = { ...data };
    next.delivery.tiers = next.delivery.tiers.filter((_, i) => i !== idx);
    setData(next);
  };

  const updateTier = (idx: number, field: string, value: any) => {
    const next = { ...data };
    (next.delivery.tiers[idx] as any)[field] = value;
    setData(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {(['contact', 'delivery', 'settings'] as SubTab[]).map(s => (
          <button key={s} onClick={() => setSub(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              sub === s ? 'bg-primary text-slate-950 border-primary' : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}>
            {s === 'contact' ? t({ ar: 'معلومات الاتصال', fr: 'Coordonnées', en: 'Contact Info' }) :
             s === 'delivery' ? t({ ar: 'رسوم التوصيل', fr: 'Frais livraison', en: 'Delivery Fees' }) :
             t({ ar: 'إعدادات الموقع', fr: 'Paramètres site', en: 'Site Settings' })}
          </button>
        ))}
      </div>

      {sub === 'contact' && (
        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white/80">Phone</label>
              <input value={data.contact.phone} onChange={e => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white/80">Phone Display</label>
              <input value={data.contact.phoneDisplay} onChange={e => setData({ ...data, contact: { ...data.contact, phoneDisplay: e.target.value } })}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white/80">Phone (International)</label>
              <input value={data.contact.phoneInternational} onChange={e => setData({ ...data, contact: { ...data.contact, phoneInternational: e.target.value } })}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white/80">Email</label>
              <input value={data.contact.email} onChange={e => setData({ ...data, contact: { ...data.contact, email: e.target.value } })}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
            </div>
          </div>

          {langs.map(l => (
            <div key={l} className="space-y-2">
              <label className="block text-sm font-bold text-white/80">Address ({l})</label>
              <input value={(data.contact.address as any)[l]} onChange={e => setData({ ...data, contact: { ...data.contact, address: { ...data.contact.address, [l]: e.target.value } } })}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
            </div>
          ))}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">Facebook URL</label>
            <input value={data.contact.facebookUrl} onChange={e => setData({ ...data, contact: { ...data.contact, facebookUrl: e.target.value } })}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">Facebook Name</label>
            <input value={data.contact.facebookName} onChange={e => setData({ ...data, contact: { ...data.contact, facebookName: e.target.value } })}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
          </div>

          {langs.map(l => (
            <div key={l} className="space-y-2">
              <label className="block text-sm font-bold text-white/80">Working Hours ({l})</label>
              <input value={(data.contact.workingHours as any)[l]} onChange={e => setData({ ...data, contact: { ...data.contact, workingHours: { ...data.contact.workingHours, [l]: e.target.value } } })}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
            </div>
          ))}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">Google Maps Embed URL</label>
            <textarea value={data.contact.mapsEmbedUrl} onChange={e => setData({ ...data, contact: { ...data.contact, mapsEmbedUrl: e.target.value } })}
              rows={3} className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 resize-none" />
          </div>

          <button onClick={saveContact} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ معلومات الاتصال', fr: 'Sauvegarder coordonnées', en: 'Save Contact Info' })}
          </button>
        </div>
      )}

      {sub === 'delivery' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1">
              <label className="block text-sm font-bold text-white/80">{t({ ar: 'حد التوصيل المجاني (د.ج)', fr: 'Seuil livraison gratuite (DZD)', en: 'Free Delivery Threshold (DZD)' })}</label>
              <input type="number" value={data.delivery.freeThreshold} onChange={e => setData({ ...data, delivery: { ...data.delivery, freeThreshold: Number(e.target.value) } })}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
            </div>
          </div>

          <h4 className="text-white font-bold text-base mt-4">{t({ ar: 'فئات التوصيل', fr: 'Palier de livraison', en: 'Delivery Tiers' })}</h4>

          {data.delivery.tiers.map((tier, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-slate-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{tier.label}</span>
                <button onClick={() => removeTier(idx)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-white/60">Label</label>
                  <input value={tier.label} onChange={e => updateTier(idx, 'label', e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60">{t({ ar: 'الرسوم (د.ج)', fr: 'Frais (DZD)', en: 'Fee (DZD)' })}</label>
                  <input type="number" value={tier.fee} onChange={e => updateTier(idx, 'fee', Number(e.target.value))}
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">{t({ ar: 'أرقام الولايات (مفصولة بفواصل)', fr: 'IDs Wilayas (séparés par des virgules)', en: 'Wilaya IDs (comma separated)' })}</label>
                <input value={tier.wilayaIds.join(', ')} onChange={e => updateTier(idx, 'wilayaIds', e.target.value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)))}
                  className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
              </div>
            </div>
          ))}

          <button onClick={addTier} className="flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-2.5 font-bold text-sm hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
            <Plus className="w-4 h-4" /> {t({ ar: 'إضافة فئة', fr: 'Ajouter palier', en: 'Add Tier' })}
          </button>

          <button onClick={saveDelivery} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all ml-4">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ رسوم التوصيل', fr: 'Sauvegarder frais', en: 'Save Delivery Fees' })}
          </button>
        </div>
      )}

      {sub === 'settings' && (
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">{t({ ar: 'اسم الموقع', fr: 'Nom du site', en: 'Site Name' })}</label>
            <input value={data.settings.siteName} onChange={e => setData({ ...data, settings: { ...data.settings, siteName: e.target.value } })}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">{t({ ar: 'رابط الشعار', fr: 'URL du logo', en: 'Logo URL' })}</label>
            <input value={data.settings.logoUrl} onChange={e => setData({ ...data, settings: { ...data.settings, logoUrl: e.target.value } })}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
          </div>
          <button onClick={saveSettings} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ الإعدادات', fr: 'Sauvegarder paramètres', en: 'Save Settings' })}
          </button>
        </div>
      )}
    </div>
  );
}
