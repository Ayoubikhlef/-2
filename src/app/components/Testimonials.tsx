import { Star, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface Testimonial {
  name: string;
  role: { ar: string; fr: string; en: string };
  text: { ar: string; fr: string; en: string };
  color: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'أمين بوعلام',
    role: { ar: 'صاحب مكتب - الميلية', fr: 'Gérant de bureau - El Milia', en: 'Office manager - El Milia' },
    text: {
      ar: 'طلبت طابعة متعددة الوظائف ووصلت خلال يومين مع الدفع عند الاستلام. تعامل راقي وسعر مناسب جداً.',
      fr: 'J\'ai commandé une imprimante multifonction, livrée en 2 jours. Service très professionnel.',
      en: 'Ordered a multifunction printer, delivered in 2 days with cash on delivery. Very professional.',
    },
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'سارة مرابط',
    role: { ar: 'أستاذة جامعية - جيجل', fr: 'Enseignante - Jijel', en: 'Lecturer - Jijel' },
    text: {
      ar: 'اشتريت لابتوب وملحقاته، البائع شرح لي كل التفاصيل قبل الشراء. جودة عالية وضمان فعلي.',
      fr: 'Achat d\'un ordinateur portable, très bon conseil avant achat. Qualité garantie.',
      en: 'Bought a laptop with accessories; got great advice before buying. Real warranty.',
    },
    color: 'from-cyan-500 to-blue-600',
  },
  {
    name: 'مهدي زروقي',
    role: { ar: 'راتب حر - قسنطينة', fr: 'Freelance - Constantine', en: 'Freelancer - Constantine' },
    text: {
      ar: 'أصلحوا لي حاسوب محترق بسرعة قياسية، والأسعار واضحة بدون مفاجآت. أنصح بهم بشدة.',
      fr: 'Réparation express de mon PC. Prix clairs, aucun surprise. Je recommande.',
      en: 'Fast PC repair, transparent pricing, no surprises. Highly recommended.',
    },
    color: 'from-indigo-500 to-blue-500',
  },
  {
    name: 'خديجة بن يوسف',
    role: { ar: 'مقاولة - برج بوعريريج', fr: 'Entrepreneuse - Bordj Bou Arreridj', en: 'Business owner - Bordj Bou Arreridj' },
    text: {
      ar: 'تجهزت بمكتبي كاملاً من عندهم: طابعات، مستلزمات، وخدمة تركيب. فريق متمكن وسريع الاستجابة.',
      fr: 'Bureau entièrement équipé chez eux. Installation faite, équipe réactive.',
      en: 'Fully equipped my office: printers, supplies, installation service. Responsive team.',
    },
    color: 'from-sky-500 to-cyan-600',
  },
];

export function Testimonials() {
  const { t } = useLanguage();

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      id="testimonials"
      className="relative py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-bold text-primary mb-4">
            <Quote className="w-4 h-4" />
            {t({ ar: 'آراء عملائنا', fr: 'Avis de nos clients', en: 'Client Reviews' })}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
            {t({ ar: 'ثقة العملاء هي رأس مالنا', fr: 'La confiance, notre capital', en: 'Trust is our capital' })}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t({ ar: 'مئات العملاء عبر 58 ولاية يثقون في Ayoub Office Services', fr: 'Des centaines de clients dans 58 wilayas nous font confiance', en: 'Hundreds of customers across 58 wilayas trust us' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col rounded-3xl border border-border bg-card/70 backdrop-blur-md p-6 shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40 transition-all duration-300"
            >
              <Quote className="absolute top-5 left-5 w-8 h-8 text-primary/15 group-hover:text-primary/30 transition-colors" />
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground mb-6 flex-1">
                “{t(item.text)}”
              </p>
              <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}>
                  {item.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t(item.role)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}