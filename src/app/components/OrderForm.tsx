import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveOrder } from '../utils/orderStorage';
import { wilayas, getMunicipalities } from '../data/products';
import { Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function OrderForm() {
  const { items, total, clear } = useCart();
  const { t, language } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    wilaya: '1',
    municipality: '1',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'wilaya') {
      const nextMunicipality = getMunicipalities(Number(value))[0]?.id || '1';
      setFormData((prev) => ({ ...prev, wilaya: value, municipality: nextMunicipality }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert(t({ ar: 'أضف منتجات إلى السلة أولاً', fr: 'Ajoutez des produits au panier d’abord', en: 'Add items to the cart first' }));
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error(t({ ar: 'الرجاء ملء جميع الحقول', fr: 'Veuillez remplir tous les champs', en: 'Please fill all fields' }));
      return;
    }

    saveOrder({
      customer: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      wilaya: wilayas.find((w) => w.id.toString() === formData.wilaya)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn'] || '',
      municipality: getMunicipalities(Number(formData.wilaya)).find((m) => m.id === formData.municipality)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn'] || '',
      address: formData.address,
      note: '',
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      total,
      source: 'form',
    });

    const orderSummary = `
🛒 ${t({ ar: 'ملخص الطلب', fr: 'Résumé de la commande', en: 'Order Summary' })}
━━━━━━━━━━━━━━━━━━━━━
📋 ${t({ ar: 'المنتجات:', fr: 'Produits:', en: 'Products:' })}
${items.map((item) => `• ${item.name} × ${item.quantity}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━
💰 ${t({ ar: 'المجموع:', fr: 'Total:', en: 'Total:' })} ${total.toLocaleString()} د.ج
📍 ${t({ ar: 'الولاية:', fr: 'Wilaya:', en: 'Wilaya:' })} ${wilayas.find((w) => w.id.toString() === formData.wilaya)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn']}
🏙️ ${t({ ar: 'البلدية:', fr: 'Commune:', en: 'Municipality:' })} ${getMunicipalities(Number(formData.wilaya)).find((m) => m.id === formData.municipality)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn']}
📌 ${t({ ar: 'العنوان:', fr: 'Adresse:', en: 'Address:' })} ${formData.address}
👤 ${t({ ar: 'الاسم:', fr: 'Nom:', en: 'Name:' })} ${formData.fullName}
☎️ ${t({ ar: 'الهاتف:', fr: 'Téléphone:', en: 'Phone:' })} ${formData.phone}
📧 ${t({ ar: 'البريد:', fr: 'Email:', en: 'Email:' })} ${formData.email}
💳 ${t({ ar: 'الدفع:', fr: 'Paiement:', en: 'Payment:' })} ${t({ ar: 'عند الاستلام', fr: 'À la livraison', en: 'Cash on delivery' })}
━━━━━━━━━━━━━━━━━━━━━
    `;

    toast.success(t({ ar: 'تم إرسال الطلب! سيتم التواصل معك قريباً.', fr: 'Commande envoyée! Nous vous contacterons bientôt.', en: 'Order sent! We will contact you soon.' }));

    const whatsappMessage = `${orderSummary}\n\n✅ ${t({ ar: 'سيتم التواصل معك قريباً', fr: 'Nous vous contacterons bientôt', en: 'We will contact you soon' })}`;
    const whatsappNumber = '+213674113290';
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');

    setSubmitted(true);
    setFormData({ fullName: '', phone: '', email: '', address: '', wilaya: '1', municipality: '1' });
    clear();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="checkout" className="py-20 bg-gradient-to-b from-slate-50/80 to-white/70 dark:from-slate-900/30 dark:to-slate-950/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center mb-12">
          {t({ ar: '📦 إتمام الطلب', fr: '📦 Finaliser la commande', en: '📦 Checkout' })}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl shadow-lg border border-border">
              <h3 className="text-2xl font-bold mb-6">
                {t({ ar: 'بيانات التوصيل', fr: 'Données de livraison', en: 'Delivery Info' })}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 mb-2 font-semibold">
                    <Phone className="w-5 h-5 text-primary" />
                    {t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full Name' })}
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder={t({ ar: 'أدخل اسمك', fr: 'Entrez votre nom', en: 'Enter your name' })}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2 font-semibold">
                    <Phone className="w-5 h-5 text-primary" />
                    {t({ ar: 'رقم الهاتف', fr: 'Numéro de téléphone', en: 'Phone Number' })}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0698765432"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2 font-semibold">
                    <Mail className="w-5 h-5 text-primary" />
                    {t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium">
                    {t({ ar: 'الولاية', fr: 'Wilaya', en: 'Wilaya' })}
                    <select
                      name="wilaya"
                      value={formData.wilaya}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      {wilayas.map((w) => (
                        <option key={w.id} value={w.id}>
                          {language === 'ar' ? w.nameAr : language === 'fr' ? w.nameFr : w.nameEn}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm font-medium">
                    {t({ ar: 'البلدية', fr: 'Commune', en: 'Municipality' })}
                    <select
                      name="municipality"
                      value={formData.municipality}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      {getMunicipalities(Number(formData.wilaya)).map((municipality) => (
                        <option key={municipality.id} value={municipality.id}>
                          {language === 'ar' ? municipality.nameAr : language === 'fr' ? municipality.nameFr : municipality.nameEn}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2 font-semibold">
                    <MapPin className="w-5 h-5 text-primary" />
                    {t({ ar: 'العنوان', fr: 'Adresse', en: 'Address' })}
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t({ ar: 'أدخل عنوانك الكامل', fr: 'Entrez votre adresse complète', en: 'Enter complete address' })}
                    rows={3}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
                <div className="flex gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-300">
                      {t({ ar: '💳 الدفع عند الاستلام', fr: '💳 Paiement à la livraison', en: '💳 Cash on Delivery' })}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      {t({ ar: 'سنوصل منتجاتك إلى جميع ولايات الجزائر بأمان', fr: 'Livraison gratuite dans toutes les régions d\'Algérie', en: 'Free delivery to all regions of Algeria' })}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 active:scale-95"
              >
                {t({ ar: '✅ تأكيد الطلب', fr: '✅ Confirmer la commande', en: '✅ Confirm Order' })}
              </button>

              {submitted && (
                <div className="bg-green-500/10 border border-green-500 text-green-700 dark:text-green-400 p-4 rounded-lg text-center font-semibold animate-in">
                  ✅ {t({ ar: 'تم استقبال طلبك بنجاح!', fr: 'Votre commande a été reçue!', en: 'Order received successfully!' })}
                </div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border sticky top-20">
              <h3 className="text-xl font-bold mb-6">
                {t({ ar: 'ملخص الطلب', fr: 'Résumé', en: 'Summary' })}
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto mb-6 pb-6 border-b border-border">
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t({ ar: 'لا توجد منتجات', fr: 'Aucun produit', en: 'No products' })}
                  </p>
                ) : (
                  items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-semibold">{(item.price * item.quantity).toLocaleString()} د.ج</span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t({ ar: 'العدد:', fr: 'Nombre:', en: 'Items:' })}
                  </span>
                  <span className="font-semibold">{items.length}</span>
                </div>

                <div className="flex justify-between text-lg font-bold text-primary border-t border-border pt-3">
                  <span>{t({ ar: 'الإجمالي:', fr: 'Total:', en: 'Total:' })}</span>
                  <span>{total.toLocaleString()} د.ج</span>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-xs text-orange-700 dark:text-orange-400">
                  <p className="font-semibold mb-1">📦 {t({ ar: 'معلومات الشحن', fr: 'Infos livraison', en: 'Shipping Info' })}</p>
                  {t({
                    ar: 'توصيل إلى جميع ولايات الجزائر في 3-5 أيام عمل',
                    fr: 'Livraison à toutes les wilayas d\'Algérie en 3-5 jours',
                    en: 'Delivery to all Algerian provinces in 3-5 business days'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

