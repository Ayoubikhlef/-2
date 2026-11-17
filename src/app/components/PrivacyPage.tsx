import { useLanguage } from '../contexts/LanguageContext';
import { brand } from '../config/brand';

export function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-gradient-to-b from-white/80 to-slate-50/70 dark:from-transparent dark:to-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          {t({ ar: 'سياسة الخصوصية', fr: 'Politique de confidentialité', en: 'Privacy Policy' })}
        </h1>
        <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 lg:p-8 space-y-6 text-muted-foreground leading-relaxed">
          <p>{t({ ar: `نحن في ${brand.name} نأخذ خصوصيتك على محمل الجد. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية.`, fr: `Chez ${brand.name}, nous prenons votre vie privée au sérieux. Cette politique explique comment nous collectons et protégeons vos données.`, en: `At ${brand.name}, we take your privacy seriously. This policy explains how we collect and protect your data.` })}</p>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">{t({ ar: 'المعلومات التي نجمعها', fr: 'Informations collectées', en: 'Information We Collect' })}</h2>
            <p>{t({ ar: 'نقوم بجمع الاسم، رقم الهاتف، البريد الإلكتروني، والعنوان لغرض معالجة الطلبات والتوصيل فقط.', fr: 'Nous collectons nom, téléphone, email et adresse uniquement pour traiter les commandes.', en: 'We collect name, phone, email, and address solely for order processing and delivery.' })}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">{t({ ar: 'كيف نستخدم معلوماتك', fr: 'Utilisation des données', en: 'How We Use Your Data' })}</h2>
            <p>{t({ ar: 'تستخدم معلوماتك فقط لتأكيد الطلبات والتواصل معك بخصوص التوصيل. لا نشارك معلوماتك مع أطراف ثالثة.', fr: 'Vos données sont utilisées uniquement pour confirmer les commandes et communiquer la livraison. Aucun partage avec des tiers.', en: 'Your data is used only to confirm orders and communicate delivery. No sharing with third parties.' })}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">{t({ ar: 'حماية البيانات', fr: 'Protection des données', en: 'Data Protection' })}</h2>
            <p>{t({ ar: 'نستخدم إجراءات أمان مناسبة لحماية معلوماتك من الوصول غير المصرح به أو الاستخدام.', fr: 'Nous utilisons des mesures de sécurité appropriées pour protéger vos données.', en: 'We use appropriate security measures to protect your data from unauthorized access.' })}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">{t({ ar: 'أداة توليد النصوص (AI Studio)', fr: 'Générateur de texte (AI Studio)', en: 'Text generator (AI Studio)' })}</h2>
            <p>{t({ ar: 'عند استخدام أداة AI Studio، يُرسل النص الذي تكتبه في الحقول إلى مزوّد خدمة توليد النصوص لمعالجته وإرجاع النتيجة فقط. لا نحفظ هذه المدخلات في قاعدة بياناتنا ولا نستخدمها لأي غرض آخر. ننصح بعدم إدخال معلومات حساسة (كلمات المرور، أرقام البطاقات البنكية، معطيات صحية).', fr: 'Lorsque vous utilisez AI Studio, le texte saisi dans les champs est transmis à un fournisseur de génération de texte uniquement pour produire le résultat. Ces saisies ne sont pas enregistrées dans notre base de données et ne servent à aucune autre fin. Ne saisissez pas de données sensibles (mots de passe, numéros de carte bancaire, données de santé).', en: 'When you use AI Studio, the text you enter is sent to a text-generation provider only to produce the result. These inputs are not stored in our database and are not used for any other purpose. Do not enter sensitive information (passwords, bank card numbers, health data).' })}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
