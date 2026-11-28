/* Display-only taxonomy for the template gallery.
 *
 * The server catalog already stores a machine `category` key on every template
 * (defaults.ts). It is deliberately left untouched: this file only maps those
 * existing keys to the nine human-facing buckets used by the gallery filters.
 * No template name, description, slug or category value is changed here.
 */

import type { Localized } from './factoryUtils';

export const DISPLAY_CATEGORIES = [
  'trade',
  'food',
  'health',
  'business',
  'auto',
  'property',
  'education',
  'creative',
  'services',
] as const;

export type DisplayCategory = (typeof DISPLAY_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<DisplayCategory, Localized> = {
  trade: { ar: 'تجارة وأزياء', fr: 'Commerce et mode', en: 'Commerce & fashion' },
  food: { ar: 'مطاعم وحلويات', fr: 'Restaurants et pâtisseries', en: 'Food & sweets' },
  health: { ar: 'صحة', fr: 'Santé', en: 'Health' },
  business: { ar: 'أعمال ومهن', fr: 'Affaires et métiers', en: 'Business' },
  auto: { ar: 'سيارات', fr: 'Automobile', en: 'Automotive' },
  property: { ar: 'سياحة وعقار', fr: 'Tourisme et immobilier', en: 'Travel & property' },
  education: { ar: 'تعليم ورياضة', fr: 'Éducation et sport', en: 'Education & sport' },
  creative: { ar: 'إبداع وتسويق', fr: 'Création et marketing', en: 'Creative & marketing' },
  services: { ar: 'خدمات وعناية', fr: 'Services et entretien', en: 'Services & care' },
};

/* Soft category tint used only while a real thumbnail is loading or missing. */
export const CATEGORY_TINT: Record<DisplayCategory, string> = {
  trade: 'bg-[#e8f0ff] dark:bg-[#111c33]',
  food: 'bg-[#fff1df] dark:bg-[#2b2013]',
  health: 'bg-[#e4f5f0] dark:bg-[#102924]',
  business: 'bg-[#e9eef8] dark:bg-[#151d31]',
  auto: 'bg-[#fdeaef] dark:bg-[#2d1620]',
  property: 'bg-[#e6f3f8] dark:bg-[#10252d]',
  education: 'bg-[#f0eafd] dark:bg-[#1e1831]',
  creative: 'bg-[#f7ecf6] dark:bg-[#2a1b2a]',
  services: 'bg-[#e9f5ea] dark:bg-[#132718]',
};

const BY_CATEGORY: Record<string, DisplayCategory> = {
  store: 'trade',
  boutique: 'trade',
  fashion: 'trade',
  electronics: 'trade',
  digital: 'trade',
  agriculture: 'trade',
  restaurant: 'food',
  food: 'food',
  bakery: 'food',
  bistro: 'food',
  medical: 'health',
  pharmacy: 'health',
  clinic: 'health',
  company: 'business',
  card: 'business',
  lawyer: 'business',
  construction: 'business',
  saas: 'business',
  nonprofit: 'business',
  showroom: 'auto',
  automotive: 'auto',
  carrental: 'auto',
  realestate: 'property',
  travel: 'property',
  hotel: 'property',
  education: 'education',
  fitness: 'education',
  gym: 'education',
  portfolio: 'creative',
  landing: 'creative',
  visual: 'creative',
  agency: 'creative',
  photography: 'creative',
  beauty: 'services',
  wedding: 'services',
  cleaning: 'services',
  service: 'services',
  events: 'services',
};

/* A few slugs need a more precise bucket than their coarse server category. */
const BY_SLUG: Record<string, DisplayCategory> = {
  'vibrant-commerce': 'trade',
  'premium-lifestyle': 'trade',
  'ecommerce-dz': 'trade',
  'fashion-boutique': 'trade',
  'jewelry-showroom': 'trade',
  handcrafts: 'trade',
  'digital-products': 'trade',
  'gradient-corporate': 'business',
  'translation-company': 'business',
  'lawyer-corporate': 'business',
  'accounting-office': 'business',
  'financial-advisor': 'business',
  'insurance-company': 'auto',
  'automotive-service': 'auto',
  'auto-tuning': 'auto',
  'car-wash': 'auto',
  'tire-service': 'auto',
  'online-courses': 'education',
  'language-school': 'education',
  'tutoring-service': 'education',
  'personal-trainer': 'education',
  'dance-studio': 'education',
  'yoga-studio': 'education',
  'hotel-resort': 'property',
  'travel-tourism': 'property',
  'airbnb-property': 'property',
  'bakery-patisserie': 'food',
  pizzeria: 'food',
  'coffee-cafe': 'food',
  'restaurant-mediterranean': 'food',
  'delivery-service': 'food',
  'private-clinic': 'health',
  'dental-center': 'health',
  'mental-health': 'health',
  hospital: 'health',
  'web-development': 'creative',
  'digital-marketing': 'creative',
  'seo-services': 'creative',
  'graphic-design': 'creative',
  'content-writer': 'creative',
  'video-production': 'creative',
  'photography-studio': 'creative',
  'dark-gallery': 'creative',
  'minimalist-portfolio': 'creative',
  'bold-branding': 'creative',
  neumorphic: 'creative',
  'elegant-portfolio': 'creative',
  'tech-dashboard': 'creative',
  storyteller: 'creative',
  'bold-portfolio': 'creative',
  'cleaning-service': 'services',
  'plumbing-service': 'services',
  'electrician-service': 'services',
  'pest-control': 'services',
  'moving-service': 'services',
  landscaping: 'services',
};

export function displayCategory(category: string, slug: string): DisplayCategory {
  return BY_SLUG[slug] || BY_CATEGORY[category] || 'services';
}
