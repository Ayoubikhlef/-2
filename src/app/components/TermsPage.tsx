import { useLanguage } from '../contexts/LanguageContext';

export function TermsPage() {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  return (
    <section className="py-20 bg-gradient-to-b from-white/80 to-slate-50/70 dark:from-slate-950/80 dark:to-slate-900/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          {t({ ar: 'الشروط والأحكام', fr: 'Conditions générales', en: 'Terms & Conditions' })}
        </h1>
        <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 lg:p-8 space-y-6 text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">1. {t({ ar: 'القبول', fr: 'Acceptation', en: 'Acceptance' })}</h2>
            <p>{t({ ar: 'باستخدامك لهذا الموقع، فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام الموقع.', fr: 'En utilisant ce site, vous acceptez ces conditions. Si vous n\'acceptez pas une partie, veuillez ne pas utiliser le site.', en: 'By using this site, you agree to these terms. If you disagree with any part, please do not use the site.' })}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">2. {t({ ar: 'المنتجات والخدمات', fr: 'Produits et services', en: 'Products & Services' })}</h2>
            <p>{t({ ar: 'نحن نسعى لعرض معلومات دقيقة عن منتجاتنا وخدماتنا. ومع ذلك، قد تحدث أخطاء في الأسعار أو المواصفات، ونحتفظ بالحق في تصحيحها.', fr: 'Nous nous efforçons d\'afficher des informations précises. Cependant, des erreurs de prix ou de spécifications peuvent survenir.', en: 'We strive to display accurate information. However, price or specification errors may occur.' })}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">3. {t({ ar: 'الطلبات والدفع', fr: 'Commandes et paiement', en: 'Orders & Payment' })}</h2>
            <p>{t({ ar: 'يتم تأكيد الطلب بعد التواصل مع العميل. طرق الدفع المتاحة: الدفع عند الاستلام، بطاقة CIB، Edahabia، BaridiMob.', fr: 'La commande est confirmée après contact avec le client. Paiement: livraison, CIB, Edahabia, BaridiMob.', en: 'Order is confirmed after contacting the customer. Payment: cash on delivery, CIB, Edahabia, BaridiMob.' })}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">4. {t({ ar: 'التوصيل', fr: 'Livraison', en: 'Delivery' })}</h2>
            <p>{t({ ar: 'نوصل لجميع ولايات الجزائر في مدة 3-5 أيام عمل. رسوم التوصيل حسب الولاية.', fr: 'Livraison dans toutes les wilayas d\'Algérie sous 3-5 jours ouvrés. Frais selon la wilaya.', en: 'Delivery to all Algerian provinces in 3-5 business days. Fee depends on wilaya.' })}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">5. {t({ ar: 'سياسة الإرجاع', fr: 'Politique de retour', en: 'Return Policy' })}</h2>
            <p>{t({ ar: 'يمكن إرجاع المنتجات خلال 7 أيام من الاستلام بشرط أن تكون بحالتها الأصلية. يتم استبدال المنتجات المعيبة مجاناً.', fr: 'Les produits peuvent être retournés sous 7 jours dans leur état d\'origine. Les produits défectueux sont échangés gratuitement.', en: 'Products can be returned within 7 days in original condition. Defective products are replaced free of charge.' })}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
