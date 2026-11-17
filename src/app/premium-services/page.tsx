'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { premiumServices as servicesData, PremiumService } from '../data/highValueServices';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Server,
  FileText,
  LayoutTemplate,
  TrendingUp,
  ShieldCheck,
  Users,
} from 'lucide-react';

// Expose the services data to the component scope
const premiumServices = servicesData;

export default function PremiumServicesPage() {
  const { t, language } = useLanguage();

  // Categories with icons and labels - mapping category keys to display names
  const CATEGORY_LABELS: Record<string, string> = {
    recurring: 'خدمات متكررة / Recurring Services',
    subscription: 'اشتراكات / Subscriptions',
    projectBased: 'مشاريع مفصلة / Project-Based Services',
    marketplace: 'منصة السوق / Marketplace',
  };

  const CATEGORY_ICONS: Record<string, React.ElementType> = {
    recurring: TrendingUp,
    subscription: Server,
    projectBased: FileText,
    marketplace: LayoutTemplate,
  };

  // Sort services by margin (descending) and then by recurringMonthly if exists
  const sortedServices = [...premiumServices].sort((a, b) => {
    if (b.recurringMonthly && a.recurringMonthly) return b.recurringMonthly - a.recurringMonthly;
    if (a.recurringMonthly) return 1;
    if (b.recurringMonthly) return -1;
    return b.margin - a.margin;
  });

  // Group services by category
  const groupedServices: Record<string, PremiumService[]> = {};

  sortedServices.forEach((service) => {
    // Normalize category key for grouping - remove hyphen if present
    const normCategory = service.category.replace('-', '') as keyof typeof CATEGORY_LABELS;

    if (!groupedServices[normCategory]) {
      groupedServices[normCategory] = [];
    }
    groupedServices[normCategory].push(service);
  });

  const CategoryCard = ({ service }: { service: PremiumService }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <div className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
          >
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg mb-1">
                {language === 'ar' ? service.nameAr : language === 'fr' ? service.nameFr : service.nameEn}
              </h3>

              <p className="text-sm text-gray-500 line-clamp-2">
                {language === 'ar' ? service.shortDescAr : language === 'fr' ? service.shortDescFr : service.shortDescEn}
              </p>
            </div>

            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {service.prices.standard.toLocaleString('en-US')} DZD
            </span>

            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-expanded={expanded}
              aria-controls={`service-content-${service.id}`}
            >
              <LayoutTemplate className="w-5 h-5 text-gray-400" />
            </button>
          </button>

          {expanded && (
            <motion.div
              id={`service-content-${service.id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="px-6 pb-5 pt-2 border-t"
            >
              <div className="py-4 space-y-4">
                <p className="text-sm text-gray-600">
                  {service.fullDescAr || service.fullDescFr || `${service.nameEn} - Full description`}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'الهامش' : language === 'fr' ? 'Marge' : 'Margin'}:</p>
                    <p className="font-semibold text-green-600">{service.margin}%</p>
                  </div>

                  {service.setupFee && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'رسوم الإعداد' : language === 'fr' ? 'Frais de configuration' : 'Setup Fee'}:</p>
                      <p className="font-semibold text-gray-700">{service.setupFee.toLocaleString('en-US')} DZD</p>
                    </div>
                  )}

                  {service.implementationTime && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'وقت التنفيذ' : language === 'fr' ? "Temps d'implémentation" : 'Implementation Time'}:</p>
                      <p className="font-semibold text-gray-700">{service.implementationTime}</p>
                    </div>
                  )}

                  {service.recurringMonthly && (
                    <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                      <p className="text-xs text-blue-600 mb-1">{language === 'ar' ? 'اشتراك شهري' : language === 'fr' ? 'Abonnement mensuel' : 'Monthly Subscription'}:</p>
                      <p className="font-semibold text-blue-700">+{service.recurringMonthly.toLocaleString('en-US')} DZD</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    {language === 'ar' ? 'اطلب الخدمة' : language === 'fr' ? 'Commander ce service' : 'Request this service'}
                  </button>

                  <div className="flex gap-2">
                    <Link
                      href={`/premium-services?category=${service.category}`}
                      className="p-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {language === 'ar' ? 'تصفح المزيد' : language === 'fr' ? 'Voir plus' : 'Browse more'} →
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/[0.1]" />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {language === 'ar' ? 'خدماتنا المميزة' : language === 'fr' ? 'Nos services premium' : 'Premium Services'}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              {language === 'ar'
                ? 'اكتشف خدماتنا المتميزة التي تمكّن نموّ أعمالك مع أرباح عالية وضمان موثوقية.'
                : language === 'fr'
                  ? 'Découvrez nos services premium qui permettent la croissance de votre entreprise avec des marges élevées et une fiabilité garantie.'
                  : 'Discover our premium services that empower your business growth with high margins and guaranteed reliability.'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">{language === 'ar' ? 'هامش عالي' : language === 'fr' ? 'Marge élevée' : 'High Margin'}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-semibold">{language === 'ar' ? 'موثوقية عالية' : language === 'fr' ? 'Haute fiabilité' : 'High Reliability'}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{language === 'ar' ? 'دعم مستمر' : language === 'fr' ? 'Support continu' : 'Continuous Support'}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {Object.entries(groupedServices).map(([categoryName, services], i) => (
          <section key={categoryName} className="mb-16 last:mb-0">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-800">{CATEGORY_LABELS[categoryName.replace(/\//, ' ') || categoryName]}</h2>
              <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full">
                {services.length} {language === 'ar' ? 'خدمة' : language === 'fr' ? 'service' : 'services'}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, j) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: j * 50 + i * 100 }}
                >
                  <CategoryCard service={service} />
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA Section */}
        <section className="mt-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.1]" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">{language === 'ar' ? 'جاهز لبدء العمل مع خدماتنا المميزة؟' : language === 'fr' ? 'Prêt à démarrer avec nos services premium ?' : 'Ready to get started with our premium services?'}</h2>
            <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
              {language === 'ar'
                ? 'تواصل مع فريقنا للمزيد من المعلومات حول كيفية الاستفادة القصوى من خدماتنا.'
                : language === 'fr'
                  ? 'Contactez notre équipe pour en savoir plus sur la façon de tirer le meilleur parti de nos services.'
                  : 'Contact our team to learn more about how to make the most of our services.'}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contactez-nous' : 'Contact Us'} →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-white font-semibold mb-3">{language === 'ar' ? 'عنا' : language === 'fr' ? 'À propos' : 'About Us'}</h3>
            <p className="text-sm">
              {language === 'ar'
                ? 'TechStore - حلول تقنية متكاملة للنمو الرقمي.'
                : language === 'fr'
                  ? 'TechStore - Solutions technologiques intégrées pour la croissance numérique.'
                  : 'TechStore - Integrated technology solutions for digital growth.'}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">{language === 'ar' ? 'الروابط السريعة' : language === 'fr' ? 'Liens rapides' : 'Quick Links'}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/premium-services" className="hover:text-white transition-colors">{language === 'ar' ? 'الصفحة الرئيسية' : language === 'fr' ? 'Accueil' : 'Home'}</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">{language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services'}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{language === 'ar' ? 'اتصل بنا' : language === 'fr' ? 'Contact' : 'Contact'}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">{language === 'ar' ? 'الدعم' : language === 'fr' ? 'Support' : 'Support'}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="hover:text-white transition-colors">{language === 'ar' ? 'الأسئلة الشائعة' : language === 'fr' ? 'FAQ' : 'FAQ'}</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
