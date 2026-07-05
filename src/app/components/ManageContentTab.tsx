import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteContent, updateSiteContent, addFAQItem, updateFAQItem, deleteFAQItem, addWhyUsFeature, updateWhyUsFeature, deleteWhyUsFeature, type SiteContent, type FAQItem, type WhyUsFeature } from '../utils/siteContentStorage';
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const sections = ['hero', 'whyUs', 'faq', 'about', 'services', 'footer'] as const;
type Section = typeof sections[number];

const sectionLabels: Record<Section, { ar: string; fr: string; en: string }> = {
  hero: { ar: 'القسم الرئيسي', fr: 'Section Héros', en: 'Hero Section' },
  whyUs: { ar: 'لماذا نحن', fr: 'Pourquoi nous', en: 'Why Us' },
  faq: { ar: 'الأسئلة الشائعة', fr: 'FAQ', en: 'FAQ' },
  about: { ar: 'عن المتجر', fr: 'À propos', en: 'About' },
  services: { ar: 'الخدمات', fr: 'Services', en: 'Services' },
  footer: { ar: 'التذييل', fr: 'Footer', en: 'Footer' },
};

const langs = ['ar', 'fr', 'en'] as const;

function LangInput({ label, value, onChange }: { label: string; value: { ar: string; fr: string; en: string }; onChange: (v: { ar: string; fr: string; en: string }) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-white/80">{label}</label>
      <div className="grid grid-cols-3 gap-2">
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
      <div className="grid grid-cols-3 gap-2">
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

function FeatureEditor({ feature, onUpdate, onDelete }: { feature: WhyUsFeature; onUpdate: (f: WhyUsFeature) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left">
        <span className="font-bold text-white">{feature.title.en || feature.title.ar}</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <LangInput label="Title" value={feature.title} onChange={v => onUpdate({ ...feature, title: v })} />
          <LangTextarea label="Description" value={feature.description} onChange={v => onUpdate({ ...feature, description: v })} />
          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/80">Color</label>
            <input value={feature.color} onChange={e => onUpdate({ ...feature, color: e.target.value })}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
          </div>
          <button onClick={onDelete} className="flex items-center gap-2 text-red-400 text-sm font-semibold hover:text-red-300">
            <Trash2 className="w-4 h-4" /> Delete Feature
          </button>
        </div>
      )}
    </div>
  );
}

function FAQItemEditor({ item, onUpdate, onDelete }: { item: FAQItem; onUpdate: (i: FAQItem) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left">
        <span className="font-bold text-white truncate">{item.question.en || item.question.ar}</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <LangInput label="Question" value={item.question} onChange={v => onUpdate({ ...item, question: v })} />
          <LangTextarea label="Answer" value={item.answer} onChange={v => onUpdate({ ...item, answer: v })} />
          <button onClick={onDelete} className="flex items-center gap-2 text-red-400 text-sm font-semibold hover:text-red-300">
            <Trash2 className="w-4 h-4" /> Delete FAQ
          </button>
        </div>
      )}
    </div>
  );
}

export function ManageContentTab() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState<SiteContent>(() => getSiteContent());
  const [activeSection, setActiveSection] = useState<Section>('hero');
  const [newFaqId, setNewFaqId] = useState('');
  const [newFeatureId, setNewFeatureId] = useState('');

  const save = (update: Partial<SiteContent>) => {
    const next = updateSiteContent(update);
    setContent(next);
    toast.success(t({ ar: 'تم الحفظ', fr: 'Sauvegardé', en: 'Saved' }));
  };

  const handleAddFAQ = () => {
    if (!newFaqId.trim()) return;
    const next = addFAQItem({
      id: newFaqId.trim().replace(/\s+/g, '-'),
      question: { ar: '', fr: '', en: '' },
      answer: { ar: '', fr: '', en: '' },
    });
    setContent(next);
    setNewFaqId('');
    toast.success(t({ ar: 'تمت الإضافة', fr: 'Ajouté', en: 'Added' }));
  };

  const handleAddFeature = () => {
    if (!newFeatureId.trim()) return;
    const next = addWhyUsFeature({
      id: newFeatureId.trim().replace(/\s+/g, '-'),
      title: { ar: '', fr: '', en: '' },
      description: { ar: '', fr: '', en: '' },
      color: 'from-blue-500 to-blue-600',
    });
    setContent(next);
    setNewFeatureId('');
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
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Hero Subtitle</h3>
          <LangInput label="Subtitle" value={content.hero.subtitle} onChange={v => setContent({ ...content, hero: { ...content.hero, subtitle: v } })} />
          <button onClick={() => save({ hero: content.hero })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
        </div>
      )}

      {activeSection === 'whyUs' && (
        <div className="space-y-4">
          <LangInput label="Section Title" value={content.whyUs.title} onChange={v => setContent({ ...content, whyUs: { ...content.whyUs, title: v } })} />
          <LangTextarea label="Section Subtitle" value={content.whyUs.subtitle} onChange={v => setContent({ ...content, whyUs: { ...content.whyUs, subtitle: v } })} />
          <button onClick={() => save({ whyUs: content.whyUs })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all mb-6">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>

          <h4 className="text-white font-bold text-base mt-6">Why Us Features</h4>
          <div className="space-y-3">
            {content.whyUs.features.map(f => (
              <FeatureEditor key={f.id} feature={f}
                onUpdate={(updated) => {
                  updateWhyUsFeature(f.id, updated);
                  setContent(getSiteContent());
                }}
                onDelete={() => { deleteWhyUsFeature(f.id); setContent(getSiteContent()); toast.success('Deleted'); }} />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input value={newFeatureId} onChange={e => setNewFeatureId(e.target.value)}
              placeholder="Feature ID (e.g. innovation)"
              className="flex-1 rounded-lg bg-slate-800 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-primary/50" />
            <button onClick={handleAddFeature} className="flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-2.5 font-bold text-sm hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      )}

      {activeSection === 'faq' && (
        <div className="space-y-4">
          <LangInput label="Section Title" value={content.faq.title} onChange={v => setContent({ ...content, faq: { ...content.faq, title: v } })} />
          <LangTextarea label="Section Subtitle" value={content.faq.subtitle} onChange={v => setContent({ ...content, faq: { ...content.faq, subtitle: v } })} />
          <button onClick={() => save({ faq: content.faq })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all mb-6">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>

          <h4 className="text-white font-bold text-base mt-6">FAQ Items</h4>
          <div className="space-y-3">
            {content.faq.items.map(item => (
              <FAQItemEditor key={item.id} item={item}
                onUpdate={(updated) => {
                  updateFAQItem(item.id, updated);
                  setContent(getSiteContent());
                }}
                onDelete={() => { deleteFAQItem(item.id); setContent(getSiteContent()); toast.success('Deleted'); }} />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input value={newFaqId} onChange={e => setNewFaqId(e.target.value)}
              placeholder="FAQ ID (e.g. shipping-info)"
              className="flex-1 rounded-lg bg-slate-800 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-primary/50" />
            <button onClick={handleAddFAQ} className="flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-2.5 font-bold text-sm hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      )}

      {activeSection === 'about' && (
        <div className="space-y-4">
          <LangTextarea label="About Content" value={content.about.content} onChange={v => setContent({ ...content, about: { content: v } })} />
          <button onClick={() => save({ about: content.about })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
        </div>
      )}

      {activeSection === 'services' && (
        <div className="space-y-4">
          <LangInput label="Section Title" value={content.services.title} onChange={v => setContent({ ...content, services: { ...content.services, title: v } })} />
          <LangTextarea label="Section Subtitle" value={content.services.subtitle} onChange={v => setContent({ ...content, services: { ...content.services, subtitle: v } })} />
          <button onClick={() => save({ services: content.services })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
          <p className="text-white/40 text-xs mt-2">Service cards (icons, images) are managed in Manage Services tab.</p>
        </div>
      )}

      {activeSection === 'footer' && (
        <div className="space-y-4">
          <LangTextarea label="Footer Description" value={content.footer.description} onChange={v => setContent({ ...content, footer: { description: v } })} />
          <button onClick={() => save({ footer: content.footer })} className="flex items-center gap-2 rounded-full bg-primary text-slate-950 px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" /> {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
          </button>
        </div>
      )}
    </div>
  );
}
