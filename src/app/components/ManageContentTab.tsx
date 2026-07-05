import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteContent, updateSiteContent, addFAQItem, updateFAQItem, deleteFAQItem, addWhyUsFeature, updateWhyUsFeature, deleteWhyUsFeature, addServiceCard, updateServiceCard, deleteServiceCard, type SiteContent, type FAQItem, type WhyUsFeature, type ServiceCard } from '../utils/siteContentStorage';
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const sections = ['hero', 'whyUs', 'faq', 'about', 'services', 'serviceCards', 'footer'] as const;
type Section = typeof sections[number];

const sectionLabels: Record<Section, { ar: string; fr: string; en: string }> = {
  hero: { ar: 'القسم الرئيسي', fr: 'Section Héros', en: 'Hero Section' },
  whyUs: { ar: 'لماذا نحن', fr: 'Pourquoi nous', en: 'Why Us' },
  faq: { ar: 'الأسئلة الشائعة', fr: 'FAQ', en: 'FAQ' },
  about: { ar: 'عن المتجر', fr: 'À propos', en: 'About' },
  services: { ar: 'الخدمات', fr: 'Services', en: 'Services' },
  serviceCards: { ar: 'بطاقات الخدمات', fr: 'Cartes services', en: 'Service Cards' },
  footer: { ar: 'التذييل', fr: 'Footer', en: 'Footer' },
};

const langs = ['ar', 'fr', 'en'] as const;

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

function LangTextarea({ label, value, onChange }: { label: string; value: { ar: string; fr: string; en: string }; onChange: (v: { ar: string; fr: string; en: string }) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-white/80">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {langs.map(l => (
          <textarea key={l} value={value[l]} onChange={e => onChange({ ...value, [l]: e.target.value })}
            placeholder={l === 'ar' ? 'عربي' : l === 'fr' ? 'Français' : 'English'}
            rows={3}
            className="rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-primary/50 resize-none" />
        ))}
      </div>
    </div>
  );
}

function CollapsibleCard({ title, children, onDelete }: { title: string; children: React.ReactNode; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-left">
          {open ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
          <span className="font-bold text-white truncate">{title}</span>
        </button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-300 shrink-0"><Trash2 className="w-4 h-4" /></button>
      </div>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

export function ManageContentTab() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState<SiteContent>(() => getSiteContent());
  const [activeSection, setActiveSection] = useState<Section>('hero');
  const [newId, setNewId] = useState('');

  const save = (update: Partial<SiteContent>) => {
    const next = updateSiteContent(update);
    setContent(next);
    toast.success(t({ ar: 'تم الحفظ', fr: 'Sauvegardé', en: 'Saved' }));
  };

  const handleAdd = (type: 'faq' | 'feature' | 'card') => {
    if (!newId.trim()) return;
    const id = newId.trim().replace(/\s+/g, '-');
    if (type === 'faq') {
      const next = addFAQItem({ id, question: { ar: '', fr: '', en: '' }, answer: { ar: '', fr: '', en: '' } });
      setContent(next);
    } else if (type === 'feature') {
      const next = addWhyUsFeature({ id, title: { ar: '', fr: '', en: '' }, description: { ar: '', fr: '', en: '' }, color: 'from-blue-500 to-blue-600' });
      setContent(next);
    } else {
      const next = addServiceCard({ id, title: { ar: '', fr: '', en: '' }, description: { ar: '', fr: '', en: '' }, image: '', color: 'from-blue-500 to-blue-600' });
      setContent(next);
    }
    setNewId('');
    toast.success(t({ ar: 'تمت الإضافة', fr: 'Ajouté', en: 'Added' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {sections.map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              activeSection === s ? 'bg-primary text-slate-950 border-primary' : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}>
            {(sectionLabels[s] as any)[language]}
          </button>
        ))}
      </div>

      {activeSection === 'hero' && (
        <div className="space-y-4 max-w-3xl">
          <LangInput label={t({ ar: 'نص الترحيب', fr: 'Texte d\'accueil', en: 'Welcome Text' })} value={content.hero.title} onChange={v => setContent({ ...content, hero: { ...content.hero, title: v } })} />
          <LangInput label={t({ ar: 'اسم العلامة التجارية', fr: 'Nom de marque', en: 'Brand Name' })} value={content.hero.brandName} onChange={v => setContent({ ...content, hero: { ...content.hero, brandName: v } })} />
          <LangTextarea label={t({ ar: 'النص الفرعي', fr: 'Sous-titre', en: 'Subtitle' })} value={content.hero.subtitle} onChange={v => setContent({ ...content, hero: { ...content.hero, subtitle: v } })} />
          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">{t({ ar: 'رابط صورة الخلفية', fr: 'URL image de fond', en: 'Background Image URL' })}</label>
            <input value={content.hero.bgImage} onChange={e => setContent({ ...content, hero: { ...content.hero, bgImage: e.target.value } })}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50" />
          </div>
          <button onClick={() => save({ hero: content.hero })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
        </div>
      )}

      {activeSection === 'whyUs' && (
        <div className="space-y-4 max-w-3xl">
          <LangInput label={t({ ar: 'عنوان القسم', fr: 'Titre section', en: 'Section Title' })} value={content.whyUs.title} onChange={v => setContent({ ...content, whyUs: { ...content.whyUs, title: v } })} />
          <LangTextarea label={t({ ar: 'النص الفرعي', fr: 'Sous-titre', en: 'Section Subtitle' })} value={content.whyUs.subtitle} onChange={v => setContent({ ...content, whyUs: { ...content.whyUs, subtitle: v } })} />
          <button onClick={() => save({ whyUs: content.whyUs })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all mb-4">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
          <h4 className="text-white font-bold text-base">{t({ ar: 'الميزات', fr: 'Caractéristiques', en: 'Features' })}</h4>
          <div className="space-y-3">
            {content.whyUs.features.map(f => (
              <CollapsibleCard key={f.id} title={f.title.en || f.title.ar} onDelete={() => { deleteWhyUsFeature(f.id); setContent(getSiteContent()); toast.success('Deleted'); }}>
                <LangInput label="Title" value={f.title} onChange={v => { updateWhyUsFeature(f.id, { title: v }); setContent(getSiteContent()); }} />
                <LangTextarea label="Description" value={f.description} onChange={v => { updateWhyUsFeature(f.id, { description: v }); setContent(getSiteContent()); }} />
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-white/80">Color</label>
                  <input value={f.color} onChange={e => { updateWhyUsFeature(f.id, { color: e.target.value }); setContent(getSiteContent()); }}
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
                </div>
              </CollapsibleCard>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input value={newId} onChange={e => setNewId(e.target.value)} placeholder="Feature ID (e.g. innovation)" className="flex-1 rounded-lg bg-slate-800 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-primary/50" />
            <button onClick={() => handleAdd('feature')} className="flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-2.5 font-bold text-sm hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      )}

      {activeSection === 'faq' && (
        <div className="space-y-4 max-w-3xl">
          <LangInput label={t({ ar: 'عنوان القسم', fr: 'Titre section', en: 'Section Title' })} value={content.faq.title} onChange={v => setContent({ ...content, faq: { ...content.faq, title: v } })} />
          <LangTextarea label={t({ ar: 'النص الفرعي', fr: 'Sous-titre', en: 'Section Subtitle' })} value={content.faq.subtitle} onChange={v => setContent({ ...content, faq: { ...content.faq, subtitle: v } })} />
          <button onClick={() => save({ faq: content.faq })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all mb-4">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
          <h4 className="text-white font-bold text-base">{t({ ar: 'الأسئلة', fr: 'Questions', en: 'FAQ Items' })}</h4>
          <div className="space-y-3">
            {content.faq.items.map(item => (
              <CollapsibleCard key={item.id} title={item.question.en || item.question.ar} onDelete={() => { deleteFAQItem(item.id); setContent(getSiteContent()); toast.success('Deleted'); }}>
                <LangInput label="Question" value={item.question} onChange={v => { updateFAQItem(item.id, { question: v }); setContent(getSiteContent()); }} />
                <LangTextarea label="Answer" value={item.answer} onChange={v => { updateFAQItem(item.id, { answer: v }); setContent(getSiteContent()); }} />
              </CollapsibleCard>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input value={newId} onChange={e => setNewId(e.target.value)} placeholder="FAQ ID (e.g. shipping-info)" className="flex-1 rounded-lg bg-slate-800 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-primary/50" />
            <button onClick={() => handleAdd('faq')} className="flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-2.5 font-bold text-sm hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      )}

      {activeSection === 'about' && (
        <div className="space-y-4 max-w-3xl">
          <LangInput label={t({ ar: 'عنوان الصفحة', fr: 'Titre page', en: 'Page Title' })} value={content.about.title} onChange={v => setContent({ ...content, about: { ...content.about, title: v } })} />
          <LangTextarea label={t({ ar: 'محتوى الصفحة', fr: 'Contenu page', en: 'Page Content' })} value={content.about.content} onChange={v => setContent({ ...content, about: { ...content.about, content: v } })} />
          <button onClick={() => save({ about: content.about })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
        </div>
      )}

      {activeSection === 'services' && (
        <div className="space-y-4 max-w-3xl">
          <LangInput label={t({ ar: 'عنوان القسم', fr: 'Titre section', en: 'Section Title' })} value={content.services.title} onChange={v => setContent({ ...content, services: { ...content.services, title: v } })} />
          <LangTextarea label={t({ ar: 'النص الفرعي', fr: 'Sous-titre', en: 'Section Subtitle' })} value={content.services.subtitle} onChange={v => setContent({ ...content, services: { ...content.services, subtitle: v } })} />
          <button onClick={() => save({ services: content.services })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
        </div>
      )}

      {activeSection === 'serviceCards' && (
        <div className="space-y-4 max-w-3xl">
          <h4 className="text-white font-bold text-base">{t({ ar: 'بطاقات الخدمات', fr: 'Cartes de services', en: 'Service Cards' })}</h4>
          <div className="space-y-3">
            {content.services.cards.map(card => (
              <CollapsibleCard key={card.id} title={card.title.en || card.title.ar} onDelete={() => { deleteServiceCard(card.id); setContent(getSiteContent()); toast.success('Deleted'); }}>
                <LangInput label="Title" value={card.title} onChange={v => { updateServiceCard(card.id, { title: v }); setContent(getSiteContent()); }} />
                <LangTextarea label="Description" value={card.description} onChange={v => { updateServiceCard(card.id, { description: v }); setContent(getSiteContent()); }} />
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-white/80">Image URL</label>
                  <input value={card.image} onChange={e => { updateServiceCard(card.id, { image: e.target.value }); setContent(getSiteContent()); }}
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-white/80">Color</label>
                  <input value={card.color} onChange={e => { updateServiceCard(card.id, { color: e.target.value }); setContent(getSiteContent()); }}
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
                </div>
              </CollapsibleCard>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input value={newId} onChange={e => setNewId(e.target.value)} placeholder="Card ID (e.g. printing)" className="flex-1 rounded-lg bg-slate-800 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-primary/50" />
            <button onClick={() => handleAdd('card')} className="flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-2.5 font-bold text-sm hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <h4 className="text-white font-bold text-base mt-8">{t({ ar: 'بطاقات الرقمنة', fr: 'Cartes numérisation', en: 'Digitization Cards' })}</h4>
          {content.services.digitizationItems.map((item, idx) => (
            <CollapsibleCard key={idx} title={item.title.en || item.title.ar} onDelete={() => {
              const next = { ...content };
              next.services.digitizationItems = next.services.digitizationItems.filter((_, i) => i !== idx);
              setContent(next as SiteContent);
              save({ services: next.services });
            }}>
              <LangInput label="Title" value={item.title} onChange={v => {
                const next = { ...content };
                next.services.digitizationItems[idx] = { ...next.services.digitizationItems[idx], title: v };
                setContent(next as SiteContent);
              }} />
              <LangTextarea label="Description" value={item.description} onChange={v => {
                const next = { ...content };
                next.services.digitizationItems[idx] = { ...next.services.digitizationItems[idx], description: v };
                setContent(next as SiteContent);
              }} />
              <div className="space-y-2">
                <label className="block text-sm font-bold text-white/80">Color</label>
                <input value={item.color} onChange={e => {
                  const next = { ...content };
                  next.services.digitizationItems[idx] = { ...next.services.digitizationItems[idx], color: e.target.value };
                  setContent(next as SiteContent);
                }} className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
              </div>
              <button onClick={() => {
                save({ services: content.services });
              }} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-4 py-2 font-bold text-xs hover:bg-primary/90 transition-all">
                <Save className="w-3 h-3" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
              </button>
            </CollapsibleCard>
          ))}
        </div>
      )}

      {activeSection === 'footer' && (
        <div className="space-y-4 max-w-3xl">
          <LangTextarea label={t({ ar: 'وصف التذييل', fr: 'Description footer', en: 'Footer Description' })} value={content.footer.description} onChange={v => setContent({ ...content, footer: { description: v } })} />
          <button onClick={() => save({ footer: content.footer })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
        </div>
      )}
    </div>
  );
}
