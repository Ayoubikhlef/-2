import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteSettings, getDefaultDeliveryConfig, updateContact, updateDelivery, updateSiteSettings, type SiteSettingsAll, type NavLink } from '../utils/siteSettingsStorage';
import { wilayas } from '../data/products';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const langs = ['ar', 'fr', 'en'] as const;
type SubTab = 'contact' | 'delivery' | 'nav' | 'footerLinks' | 'settings';

function LangInput({ label, value, onChange }: { label: string; value: { ar: string; fr: string; en: string }; onChange: (v: { ar: string; fr: string; en: string }) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-white/80">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {langs.map(l => (
          <input key={l} value={value[l]} onChange={e => onChange({ ...value, [l]: e.target.value })}
            placeholder={l === 'ar' ? 'عربي' : l === 'fr' ? 'Français' : 'English'}
            className="rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-primary/50" />
        ))}
      </div>
    </div>
  );
}

function NavLinkEditor({ link, onChange, onDelete }: { link: NavLink; onChange: (l: NavLink) => void; onDelete: () => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 font-mono">{link.href}</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-2">
        <label className="block text-xs text-white/60">href</label>
        <input value={link.href} onChange={e => onChange({ ...link, href: e.target.value })}
          className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
      </div>
      <LangInput label="Label" value={link.label} onChange={v => onChange({ ...link, label: v })} />
    </div>
  );
}

export function SiteSettingsTab() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<SiteSettingsAll>(() => getSiteSettings());
  const [sub, setSub] = useState<SubTab>('contact');

  const saveContact = () => { updateContact(data.contact); toast.success(t({ ar: 'تم حفظ معلومات الاتصال', fr: 'Coordonnées sauvegardées', en: 'Contact info saved' })); };
  const saveDelivery = () => { updateDelivery(data.delivery); toast.success(t({ ar: 'تم حفظ رسوم التوصيل', fr: 'Frais livraison sauvegardés', en: 'Delivery fees saved' })); };
  const saveSettings = () => { updateSiteSettings(data.settings); toast.success(t({ ar: 'تم حفظ الإعدادات', fr: 'Paramètres sauvegardés', en: 'Settings saved' })); };

  const resetDelivery = () => {
    const defaults = getDefaultDeliveryConfig();
    setData({ ...data, delivery: defaults });
    updateDelivery(defaults);
    toast.success(t({ ar: 'تمت استعادة تعريفة Yalidine الرسمية', fr: 'Tarif Yalidine officiel restauré', en: 'Official Yalidine tariff restored' }));
  };
  const updateFee = (id: number, field: 'homeFees' | 'deskFees', value: number) => {
    setData((prev) => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        [field]: { ...prev.delivery[field], [String(id)]: Math.max(0, Number(value) || 0) },
      },
    }));
  };
  const updateRule = (field: string, value: number | number[]) => {
    setData((prev) => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        rules: { ...prev.delivery.rules, [field]: value } as typeof prev.delivery.rules,
      },
    }));
  };
  const toggleRemote = (id: number) => {
    const current = data.delivery.rules.remoteLocalityIds;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id].sort((a, b) => a - b);
    updateRule('remoteLocalityIds', next);
  };

  const addNavLink = (key: 'headerNavLinks' | 'footerQuickLinks') => {
    const next = { ...data };
    next.settings[key].push({ href: '#', label: { ar: '', fr: '', en: '' } });
    setData(next);
  };
  const updateNavLink = (key: 'headerNavLinks' | 'footerQuickLinks', idx: number, link: NavLink) => {
    const next = { ...data }; next.settings[key][idx] = link; setData(next);
  };
  const removeNavLink = (key: 'headerNavLinks' | 'footerQuickLinks', idx: number) => {
    const next = { ...data }; next.settings[key] = next.settings[key].filter((_, i) => i !== idx); setData(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {(['contact', 'delivery', 'nav', 'footerLinks', 'settings'] as SubTab[]).map(s => (
          <button key={s} onClick={() => setSub(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              sub === s ? 'bg-primary text-slate-950 border-primary' : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}>
            {s === 'contact' ? t({ ar: 'معلومات الاتصال', fr: 'Coordonnées', en: 'Contact Info' }) :
             s === 'delivery' ? t({ ar: 'رسوم التوصيل', fr: 'Frais livraison', en: 'Delivery Fees' }) :
             s === 'nav' ? t({ ar: 'روابط القائمة', fr: 'Liens nav', en: 'Nav Links' }) :
             s === 'footerLinks' ? t({ ar: 'روابط التذييل', fr: 'Liens footer', en: 'Footer Links' }) :
             t({ ar: 'إعدادات الموقع', fr: 'Paramètres site', en: 'Site Settings' })}
          </button>
        ))}
      </div>

      {sub === 'contact' && (
        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              rows={3} placeholder="https://www.google.com/maps?q=Ayoub+Office+Services,+El+Milia,+Jijel&hl=ar&z=15&output=embed"
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 resize-none" />
          </div>
          <button onClick={saveContact} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ معلومات الاتصال', fr: 'Sauvegarder coordonnées', en: 'Save Contact Info' })}
          </button>
        </div>
      )}

      {sub === 'delivery' && (
        <div className="space-y-5 max-w-4xl">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-white/70">
            {t({
              ar: 'التعريفة الافتراضية مأخوذة من جدول Yalidine Express الرسمي لشهر جوان 2025. السعر يشمل أول 5 كغ، ثم تُضاف زيادة الوزن. يمكنك تعديل كل ولاية يدوياً.',
              fr: 'Les tarifs par défaut proviennent du tableau officiel Yalidine Express (juin 2025). Le prix couvre les 5 premiers kg, puis un supplément poids s\'applique. Chaque wilaya reste modifiable.',
              en: 'Default prices come from the official Yalidine Express June 2025 table. The first 5 kg are included; extra weight is charged. Every wilaya can be edited.',
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white/80">{t({ ar: 'حد التوصيل المجاني (د.ج)', fr: 'Seuil livraison gratuite (DZD)', en: 'Free delivery threshold (DZD)' })}</label>
              <input type="number" min={0} value={data.delivery.freeThreshold} onChange={e => setData({ ...data, delivery: { ...data.delivery, freeThreshold: Math.max(0, Number(e.target.value) || 0) } })}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
              <p className="text-xs text-white/40">{t({ ar: '0 لتعطيل التوصيل المجاني', fr: '0 pour désactiver', en: '0 to disable free delivery' })}</p>
            </div>
          </div>

          <h4 className="text-white font-bold text-base mt-4">{t({ ar: 'قواعد الوزن والحجم', fr: 'Règles poids et volume', en: 'Weight & size rules' })}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {([
              { key: 'includedWeightKg', label: { ar: 'الوزن المشمول (كغ)', fr: 'Poids inclus (kg)', en: 'Included weight (kg)' }, step: 0.5 },
              { key: 'extraKgFee', label: { ar: 'زيادة الكيلو (د.ج)', fr: 'Supplément / kg (DZD)', en: 'Extra per kg (DZD)' }, step: 10 },
              { key: 'extraKgFeeRemote', label: { ar: 'زيادة الكيلو للمناطق البعيدة', fr: 'Supplément / kg zone éloignée', en: 'Extra per kg (remote)' }, step: 10 },
              { key: 'volumetricDivisor', label: { ar: 'قاسم الوزن الحجمي', fr: 'Diviseur volumétrique', en: 'Volumetric divisor' }, step: 100 },
              { key: 'maxWeightKg', label: { ar: 'الحد الأقصى للطرد (كغ)', fr: 'Poids max par colis (kg)', en: 'Max weight per parcel (kg)' }, step: 1 },
              { key: 'oversizeFee', label: { ar: 'زيادة المنتج الكبير (د.ج)', fr: 'Supplément volumineux (DZD)', en: 'Large item surcharge (DZD)' }, step: 50 },
              { key: 'largeSideThresholdCm', label: { ar: 'أقصى طول مسموح (سم)', fr: 'Longueur max (cm)', en: 'Max side (cm)' }, step: 5 },
              { key: 'girthThresholdCm', label: { ar: 'محيط الطرد الأقصى (سم)', fr: 'Circonférence max (cm)', en: 'Max girth (cm)' }, step: 10 },
            ] as const).map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs text-white/60">{t(field.label)}</label>
                <input
                  type="number"
                  step={field.step}
                  min={0}
                  value={data.delivery.rules[field.key]}
                  onChange={(e) => updateRule(field.key, Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
            <h4 className="text-white font-bold text-base">{t({ ar: 'تعريفة الولايات والمناطق', fr: 'Tarifs par wilaya', en: 'Fees per wilaya' })}</h4>
            <span className="text-xs text-white/40">{wilayas.length} {t({ ar: 'ولاية/منطقة', fr: 'wilayas/zones', en: 'wilayas/zones' })}</span>
          </div>

          <div className="max-h-[30rem] overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white/60">
                <tr>
                  <th className="px-2 py-2 text-start">#</th>
                  <th className="px-2 py-2 text-start">{t({ ar: 'الولاية', fr: 'Wilaya', en: 'Wilaya' })}</th>
                  <th className="px-2 py-2 text-start">{t({ ar: 'المنزل', fr: 'Domicile', en: 'Home' })}</th>
                  <th className="px-2 py-2 text-start">{t({ ar: 'المكتب', fr: 'Point relais', en: 'Stop desk' })}</th>
                  <th className="px-2 py-2 text-center">{t({ ar: 'بعيد', fr: 'Éloigné', en: 'Remote' })}</th>
                </tr>
              </thead>
              <tbody>
                {wilayas.map((w) => (
                  <tr key={w.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-2 py-1.5 text-white/40">{w.id}</td>
                    <td className="px-2 py-1.5 text-white/80">
                      {language === 'ar' ? w.nameAr : language === 'fr' ? w.nameFr : w.nameEn}
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min={0}
                        value={data.delivery.homeFees[String(w.id)] ?? 0}
                        onChange={(e) => updateFee(w.id, 'homeFees', Number(e.target.value))}
                        className="w-20 rounded bg-slate-800 border border-white/10 px-2 py-1 text-white outline-none focus:border-primary/50"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min={0}
                        value={data.delivery.deskFees[String(w.id)] ?? 0}
                        onChange={(e) => updateFee(w.id, 'deskFees', Number(e.target.value))}
                        className="w-20 rounded bg-slate-800 border border-white/10 px-2 py-1 text-white outline-none focus:border-primary/50"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={data.delivery.rules.remoteLocalityIds.includes(w.id)}
                        onChange={() => toggleRemote(w.id)}
                        className="accent-primary"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={resetDelivery} className="rounded-full bg-slate-800 text-white/80 px-4 py-2.5 font-bold text-sm hover:bg-slate-700 transition-all border border-white/10">
              {t({ ar: 'استعادة تعريفة Yalidine 2025', fr: 'Restaurer le tarif Yalidine 2025', en: 'Restore Yalidine 2025 tariff' })}
            </button>
            <button onClick={saveDelivery} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
              <Save className="w-4 h-4" /> {t({ ar: 'حفظ رسوم التوصيل', fr: 'Sauvegarder frais', en: 'Save Delivery Fees' })}
            </button>
          </div>
        </div>
      )}

      {sub === 'nav' && (
        <div className="space-y-4 max-w-2xl">
          <h4 className="text-white font-bold text-base">{t({ ar: 'روابط القائمة العلوية', fr: 'Liens du menu header', en: 'Header Navigation Links' })}</h4>
          {data.settings.headerNavLinks.map((link, idx) => (
            <NavLinkEditor key={idx} link={link} onChange={l => updateNavLink('headerNavLinks', idx, l)} onDelete={() => removeNavLink('headerNavLinks', idx)} />
          ))}
          <button onClick={() => addNavLink('headerNavLinks')} className="flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-2.5 font-bold text-sm hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
            <Plus className="w-4 h-4" /> {t({ ar: 'إضافة رابط', fr: 'Ajouter lien', en: 'Add Link' })}
          </button>
          <button onClick={() => { updateSiteSettings({ headerNavLinks: data.settings.headerNavLinks }); toast.success('Saved'); }} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all ml-2">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
        </div>
      )}

      {sub === 'footerLinks' && (
        <div className="space-y-4 max-w-2xl">
          <LangInput label={t({ ar: 'عنوان الروابط السريعة', fr: 'Titre liens rapides', en: 'Quick Links Title' })} value={data.settings.footerQuickLinksTitle} onChange={v => setData({ ...data, settings: { ...data.settings, footerQuickLinksTitle: v } })} />
          <LangInput label={t({ ar: 'عنوان معلومات الاتصال', fr: 'Titre coordonnées', en: 'Contact Title' })} value={data.settings.footerContactTitle} onChange={v => setData({ ...data, settings: { ...data.settings, footerContactTitle: v } })} />

          <h4 className="text-white font-bold text-base mt-4">{t({ ar: 'روابط التذييل', fr: 'Liens footer', en: 'Footer Quick Links' })}</h4>
          {data.settings.footerQuickLinks.map((link, idx) => (
            <NavLinkEditor key={idx} link={link} onChange={l => updateNavLink('footerQuickLinks', idx, l)} onDelete={() => removeNavLink('footerQuickLinks', idx)} />
          ))}
          <button onClick={() => addNavLink('footerQuickLinks')} className="flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-2.5 font-bold text-sm hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
            <Plus className="w-4 h-4" /> {t({ ar: 'إضافة رابط', fr: 'Ajouter lien', en: 'Add Link' })}
          </button>
          <button onClick={() => { updateSiteSettings({ footerQuickLinks: data.settings.footerQuickLinks, footerQuickLinksTitle: data.settings.footerQuickLinksTitle, footerContactTitle: data.settings.footerContactTitle }); toast.success('Saved'); }} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all ml-2">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
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
          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">{t({ ar: 'اسم حقوق النشر', fr: 'Nom copyright', en: 'Copyright Name' })}</label>
            <input value={data.settings.copyrightName} onChange={e => setData({ ...data, settings: { ...data.settings, copyrightName: e.target.value } })}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">{t({ ar: 'سنة حقوق النشر', fr: 'Année copyright', en: 'Copyright Year' })}</label>
            <input type="number" value={data.settings.copyrightYear} onChange={e => setData({ ...data, settings: { ...data.settings, copyrightYear: Number(e.target.value) } })}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
          </div>
          <LangInput label={t({ ar: 'مطور الموقع', fr: 'Développeur', en: 'Developer Name' })} value={data.settings.developerName} onChange={v => setData({ ...data, settings: { ...data.settings, developerName: v } })} />
          <LangInput label={t({ ar: 'نص المطور', fr: 'Texte développeur', en: 'Developer Prefix' })} value={data.settings.developerPrefix} onChange={v => setData({ ...data, settings: { ...data.settings, developerPrefix: v } })} />
          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">{t({ ar: 'رابط المطور', fr: 'URL développeur', en: 'Developer URL' })}</label>
            <input value={data.settings.developerUrl} onChange={e => setData({ ...data, settings: { ...data.settings, developerUrl: e.target.value } })}
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
