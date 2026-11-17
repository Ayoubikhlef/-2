// PaymentProvider - إدارة مزيج طرق الدفع الإلكتروني
// يدعم: CIB, DZAPI, PayPal, الدفع عند الاستلام

export type PaymentMethod = 'cod' | 'cib' | 'dzapi' | 'paypal';
export type PaymentLanguage = 'ar' | 'fr' | 'en';

export interface LocalizedText {
  ar: string;
  fr: string;
  en: string;
}

export interface PaymentGatewayConfig {
  id: PaymentMethod;
  icon: string;
  description: LocalizedText;
  fees: { fixed?: number; percentage?: number };
  processingTime: LocalizedText;
  available: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export const PAYMENT_METHODS: PaymentMethod[] = ['cod', 'cib', 'dzapi', 'paypal'];

// إعدادات البوابات المتاحة - عدّل حسب اشتراكك مع كل بوابة
export const PAYMENT_GATEWAYS: PaymentGatewayConfig[] = [
  {
    id: 'cod',
    icon: '💵',
    description: {
      ar: 'الدفع نقداً عند استلام الطلب أو المنتج',
      fr: 'Paiement en espèces à la réception de la commande ou du produit',
      en: 'Pay cash when you receive the order or product',
    },
    fees: { percentage: 0 }, // لا رسوم على البائع - يدفع العميل فقط
    processingTime: { ar: 'فوري', fr: 'Immédiat', en: 'Instant' },
    available: true,
    minAmount: 0,
    maxAmount: Infinity,
  },
  {
    id: 'cib',
    icon: '🏦',
    description: {
      ar: 'الدفع عبر بوابة CIB أو شاري - VISA/Mastercard محلية ودولية',
      fr: 'Paiement via CIB ou Chari - VISA/Mastercard locales et internationales',
      en: 'Pay through CIB or Chari - local and international VISA/Mastercard',
    },
    fees: { percentage: 1.5 }, // رسوم تقريبية من البائع
    processingTime: { ar: '3-5 دقائق', fr: '3-5 minutes', en: '3-5 minutes' },
    available: true,
    minAmount: 1000, // دج
    maxAmount: 500000, // دج
  },
  {
    id: 'dzapi',
    icon: '🔐',
    description: {
      ar: 'واجهة الدفع الرسمية من البنوك الجزائرية',
      fr: 'Interface de paiement officielle des banques algériennes',
      en: 'Official payment interface from Algerian banks',
    },
    fees: { percentage: 2.0 },
    processingTime: { ar: '5-10 دقائق', fr: '5-10 minutes', en: '5-10 minutes' },
    available: false, // غير متوفر حالياً للشركات الناشئة - يتطلب إجراءات بيروقراطية
    minAmount: 5000,
    maxAmount: 1000000,
  },
  {
    id: 'paypal',
    icon: '💳',
    description: {
      ar: 'الدفع عبر PayPal Business - يدعم الجزائر',
      fr: 'Paiement via PayPal Business - l’Algérie est prise en charge',
      en: 'Pay via PayPal Business - Algeria is supported',
    },
    fees: { percentage: 3.5 }, // رسوم PayPal + VAT
    processingTime: { ar: 'فوري تقريباً', fr: 'Quasi instantané', en: 'Almost instant' },
    available: true,
    minAmount: 1000,
    maxAmount: 200000,
  },
];

const PAYMENT_LABELS: Record<PaymentMethod, LocalizedText> = {
  cod: {
    ar: 'الدفع عند الاستلام',
    fr: 'Paiement à la livraison',
    en: 'Cash on delivery',
  },
  cib: {
    ar: 'بطاقة بنكية (CIB/شاري)',
    fr: 'Carte bancaire (CIB/Chari)',
    en: 'Bank card (CIB/Chari)',
  },
  dzapi: {
    ar: 'DZAPI',
    fr: 'DZAPI',
    en: 'DZAPI',
  },
  paypal: {
    ar: 'PayPal',
    fr: 'PayPal',
    en: 'PayPal',
  },
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (PAYMENT_METHODS as string[]).includes(value);
}

// يحوّل أي قيمة قادمة من الخادم أو التخزين المحلي إلى طريقة دفع معروفة.
export function normalizePaymentMethod(value: unknown): PaymentMethod {
  return isPaymentMethod(value) ? value : 'cod';
}

// الـ default payment method حسب مبلغ الطلب
export function getDefaultPaymentMethod(orderTotal: number): PaymentMethod {
  const cod = PAYMENT_GATEWAYS.find((g) => g.id === 'cod');
  if (orderTotal < (cod?.maxAmount ?? Infinity)) {
    return 'cod'; // الدفع عند الاستلام للمبالغ العادية
  }
  return 'cib'; // البطاقة للمبالغ الكبيرة
}

// حساب الإجمالي النهائي مع الرسوم
export function calculateOrderTotal(
  productPrice: number,
  paymentMethodId: PaymentMethod | null = null,
  discount?: number
): { total: number; fee: number; discount: number } {
  const method = paymentMethodId
    ? PAYMENT_GATEWAYS.find((g) => g.id === paymentMethodId)
    : null;

  const discountAmount = discount || 0;

  if (!method || !method.available) {
    // استخدام default إذا كان البوابة غير متوفرة
    return {
      total: productPrice,
      fee: 0,
      discount: discountAmount,
    };
  }

  const subtotal = Math.max(0, productPrice - discountAmount);

  // حساب الرسوم (تجاهل COD) - النسبة مخزنة كنسبة مئوية (1.5 = 1.5%)
  const feeRate = method.fees.percentage || 0;
  const fee = Math.round(subtotal * (feeRate / 100) * 100) / 100;

  return {
    total: subtotal + fee,
    fee,
    discount: discountAmount,
  };
}

// التحقق من صلاحية طريقة الدفع حسب المبلغ
export function isPaymentMethodAvailable(methodId: PaymentMethod, amount: number): boolean {
  const method = PAYMENT_GATEWAYS.find((g) => g.id === methodId);

  if (!method || !method.available) return false;

  return amount >= (method.minAmount || 0) && amount <= (method.maxAmount ?? Infinity);
}

// تحويل PaymentMethod إلى label حسب اللغة
export function getPaymentLabel(methodId: unknown, language: PaymentLanguage): string {
  return PAYMENT_LABELS[normalizePaymentMethod(methodId)][language];
}

// وصف البوابة حسب اللغة
export function getPaymentDescription(
  methodId: PaymentMethod,
  language: PaymentLanguage
): string {
  const method = PAYMENT_GATEWAYS.find((g) => g.id === methodId);
  return method ? method.description[language] : '';
}
