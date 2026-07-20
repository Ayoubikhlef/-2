import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LoyaltyCard } from './LoyaltyCard';
import { saveOrder } from '../utils/orderStorage';
import { wilayas, getMunicipalities } from '../data/products';
import { Mail, Phone, MapPin, DollarSign, Banknote, Percent, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '../lib/utils';
import { DeliveryCalculator } from './DeliveryCalculator';
import confetti from 'canvas-confetti';
import { generateInvoice } from './InvoicePDF';

type PaymentMethod = 'cod';

export function OrderForm() {
  const { items, total, deliveryFee, clear } = useCart();
  const { t, language } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [lastOrder, setLastOrder] = useState<any | null>(null);
  const [lastLoyalty, setLastLoyalty] = useState<{ name: string; phone: string; amount: number } | null>(null);
  const paymentMethod: PaymentMethod = 'cod';
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: 'percentage' | 'fixed' } | null>(null);
  const [couponError, setCouponError] = useState('');
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

  const validateCoupon = (code: string) => {
    const raw = localStorage.getItem('aos_coupons');
    if (!raw) return { valid: false, reason: t({ ar: 'الكود غير صحيح', fr: 'Code invalide', en: 'Invalid code' }) };
    const coupons = JSON.parse(raw);
    const coupon = coupons.find((c: any) => c.code.toLowerCase() === code.toLowerCase() && c.active);
    if (!coupon) return { valid: false, reason: t({ ar: 'الكود غير موجود أو غير نشط', fr: 'Code inexistant ou inactif', en: 'Code not found or inactive' }) };
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return { valid: false, reason: t({ ar: 'الكود منتهي الصلاحية', fr: 'Code expiré', en: 'Code expired' }) };
    if (coupon.minOrder > 0 && total < coupon.minOrder) return { valid: false, reason: t({ ar: `الحد الأدنى للطلب ${coupon.minOrder.toLocaleString()} د.ج`, fr: `Minimum de commande ${coupon.minOrder.toLocaleString()} DZD`, en: `Min order ${coupon.minOrder.toLocaleString()} DZD` }) };
    const usageRaw = localStorage.getItem('aos_coupon_usage');
    const usageData = usageRaw ? JSON.parse(usageRaw) : [];
    const usage = usageData.find((u: any) => u.code === coupon.code);
    const usedCount = usage?.usedCount || 0;
    if (coupon.maxUses > 0 && usedCount >= coupon.maxUses) return { valid: false, reason: t({ ar: 'الكود استنفذ عدد الاستخدامات', fr: 'Code épuisé', en: 'Code exhausted' }) };
    const discount = coupon.type === 'percentage' ? Math.round(total * (coupon.value / 100)) : coupon.value;
    return { valid: true, discount, type: coupon.type as 'percentage' | 'fixed', code: coupon.code };
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const result = validateCoupon(couponCode.trim());
    if (result.valid) {
      setAppliedCoupon({
        code: result.code!,
        discount: result.discount!,
        type: result.type as 'percentage' | 'fixed'
      });
      setCouponError('');
      toast.success(t({ ar: 'تم تطبيق الكود!', fr: 'Code appliqué!', en: 'Coupon applied!' }));
    } else {
      setAppliedCoupon(null);
      setCouponError(result.reason || '');
      toast.error(result.reason || '');
    }
  };

  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.discount, total) : 0;
  const grandTotal = total + deliveryFee - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert(t({ ar: 'أضف منتجات إلى السلة أولاً', fr: 'Ajoutez des produits au panier d’abord', en: 'Add items to the cart first' }));
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error(t({ ar: 'الرجاء ملء جميع الحقول', fr: 'Veuillez remplir tous les champs', en: 'Please fill all fields' }));
      return;
    }

    const savedRecord = await saveOrder({
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
      total: grandTotal,
      source: 'form',
      paymentMethod,
      discount: discountAmount > 0 ? discountAmount : undefined,
      discountCode: appliedCoupon?.code,
    });

    setLastOrder(savedRecord);

    const paymentLabel = t({ ar: 'عند الاستلام', fr: 'À la livraison', en: 'Cash on delivery' });

    const orderSummary = `
🛒 ${t({ ar: 'ملخص الطلب', fr: 'Résumé de la commande', en: 'Order Summary' })}
━━━━━━━━━━━━━━━━━━━━━
📋 ${t({ ar: 'المنتجات:', fr: 'Produits:', en: 'Products:' })}
${items.map((item) => `• ${item.name} × ${item.quantity}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━
💰 ${t({ ar: 'المجموع:', fr: 'Total:', en: 'Total:' })} ${formatPrice(total)}
${discountAmount > 0 ? `🎉 ${t({ ar: 'الخصم:', fr: 'Réduction:', en: 'Discount:' })} -${formatPrice(discountAmount)}` : ''}
📍 ${t({ ar: 'الولاية:', fr: 'Wilaya:', en: 'Wilaya:' })} ${wilayas.find((w) => w.id.toString() === formData.wilaya)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn']}
🏙️ ${t({ ar: 'البلدية:', fr: 'Commune:', en: 'Municipality:' })} ${getMunicipalities(Number(formData.wilaya)).find((m) => m.id === formData.municipality)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn']}
📌 ${t({ ar: 'العنوان:', fr: 'Adresse:', en: 'Address:' })} ${formData.address}
👤 ${t({ ar: 'الاسم:', fr: 'Nom:', en: 'Name:' })} ${formData.fullName}
☎️ ${t({ ar: 'الهاتف:', fr: 'Téléphone:', en: 'Phone:' })} ${formData.phone}
📧 ${t({ ar: 'البريد:', fr: 'Email:', en: 'Email:' })} ${formData.email}
💳 ${t({ ar: 'الدفع:', fr: 'Paiement:', en: 'Payment:' })} ${paymentLabel}
━━━━━━━━━━━━━━━━━━━━━
    `;

    toast.success(t({ ar: 'تم إرسال الطلب! سيتم التواصل معك قريباً.', fr: 'Commande envoyée! Nous vous contacterons bientôt.', en: 'Order sent! We will contact you soon.' }));

    // Trigger confetti explosion!
    try {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }

    const whatsappMessage = `${orderSummary}\n\n✅ ${t({ ar: 'سيتم التواصل معك قريباً', fr: 'Nous vous contacterons bientôt', en: 'We will contact you soon' })}`;
    const whatsappNumber = '+213674113290';
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');

    setSubmitted(true);
    setLastLoyalty({ name: formData.fullName, phone: formData.phone, amount: grandTotal });
    setFormData({ fullName: '', phone: '', email: '', address: '', wilaya: '1', municipality: '1' });
    clear();
    setTimeout(() => { setSubmitted(false); setLastLoyalty(null); setLastOrder(null); }, 15000);
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
            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg border border-border">
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

              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <Banknote className="w-5 h-5" />
                {t({ ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on Delivery' })}
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 active:scale-95"
              >
                {t({ ar: '✅ تأكيد الطلب', fr: '✅ Confirmer la commande', en: '✅ Confirm Order' })}
              </button>

              {submitted && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-6 rounded-2xl text-center font-semibold animate-fade-in flex flex-col items-center justify-center gap-4">
                  <div className="text-lg">✅ {t({ ar: 'تم استقبال طلبك بنجاح!', fr: 'Votre commande a été reçue!', en: 'Order received successfully!' })}</div>
                  {lastOrder && (
                    <button
                      type="button"
                      onClick={async () => {
                        await generateInvoice(lastOrder, language);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 text-sm font-bold text-white hover:from-emerald-400 hover:to-green-500 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                      <FileText className="w-4 h-4" />
                      {t({ ar: 'تحميل الفاتورة PDF', fr: 'Télécharger la facture PDF', en: 'Download PDF Invoice' })}
                    </button>
                  )}
                </div>
              )}
              {lastLoyalty && (
                <div className="mt-4">
                  <LoyaltyCard phone={lastLoyalty.phone} name={lastLoyalty.name} amount={lastLoyalty.amount} />
                </div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border lg:sticky top-20">
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
                      <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
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

                {/* Coupon */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    {t({ ar: 'كود الخصم', fr: 'Code promo', en: 'Coupon Code' })}
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <div>
                        <span className="font-bold text-green-700 dark:text-green-400">{appliedCoupon.code}</span>
                        <span className="text-sm text-green-600 dark:text-green-500 mr-2">
                          (-{formatPrice(discountAmount)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponError(''); }}
                        className="text-destructive hover:text-destructive/80 text-sm font-semibold"
                      >
                        {t({ ar: 'إلغاء', fr: 'Annuler', en: 'Remove' })}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder={t({ ar: 'أدخل الكود', fr: 'Entrez le code', en: 'Enter code' })}
                        className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
                      >
                        {t({ ar: 'تطبيق', fr: 'Appliquer', en: 'Apply' })}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                </div>

                <DeliveryCalculator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t({ ar: 'المجموع الفرعي', fr: 'Sous-total', en: 'Subtotal' })}
                  </span>
                  <span className="font-semibold">{formatPrice(total)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>{t({ ar: 'الخصم', fr: 'Réduction', en: 'Discount' })}</span>
                    <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold text-primary border-t border-border pt-3">
                  <span>{t({ ar: 'الإجمالي الكلي:', fr: 'Total général:', en: 'Grand total:' })}</span>
                  <span>{formatPrice(grandTotal)}</span>
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

