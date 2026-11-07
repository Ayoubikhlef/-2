/**
 * Fast catalog access for the website factory.
 *
 * The public catalog lives behind a free hosting tier that can take up to a
 * minute to wake up. Waiting for it before rendering makes /create-website
 * feel broken, so the UI starts from the built-in defaults (or the last live
 * copy cached in localStorage) and refreshes from the API in the background.
 */

import { DEFAULT_FACTORY_SETTINGS, PACKAGES, TEMPLATES } from '../../../server/src/site-factory/defaults';
import { api } from './api';
import type {
  FactoryConfig,
  FactoryPackage,
  FactorySettings,
  FactoryTemplate,
} from '../components/site-factory/factoryUtils';

const CACHE_KEY = 'aos_site_factory_config_v1';

/** Catalog compiled from the same defaults the server seeds on boot. */
export function fallbackFactoryConfig(): FactoryConfig {
  return {
    templates: TEMPLATES.map(
      (template): FactoryTemplate => ({
        id: `seed-${template.slug}`,
        slug: template.slug,
        nameAr: template.name.ar,
        nameFr: template.name.fr,
        nameEn: template.name.en,
        descAr: template.description.ar,
        descFr: template.description.fr,
        descEn: template.description.en,
        category: template.category,
        accent: template.accent,
        isActive: true,
      }),
    ),
    packages: PACKAGES.map(
      (pack): FactoryPackage => ({
        id: `seed-${pack.slug}`,
        slug: pack.slug,
        nameAr: pack.name.ar,
        nameFr: pack.name.fr,
        nameEn: pack.name.en,
        descAr: pack.description.ar,
        descFr: pack.description.fr,
        descEn: pack.description.en,
        price: pack.price,
        oldPrice: pack.oldPrice || null,
        features: pack.features,
        deliveryDays: pack.deliveryDays,
        revisions: pack.revisions,
        isPopular: pack.isPopular,
      }),
    ),
    settings: {
      ...DEFAULT_FACTORY_SETTINGS,
      paymentNote: { ...DEFAULT_FACTORY_SETTINGS.paymentNote },
      customDomainNote: { ...DEFAULT_FACTORY_SETTINGS.customDomainNote },
    } satisfies FactorySettings,
    cloudflareConfigured: false,
  };
}

let memoryCache: FactoryConfig | null = null;

function normalize(raw: any): FactoryConfig | null {
  if (!raw || !Array.isArray(raw.templates) || !Array.isArray(raw.packages) || !raw.settings) {
    return null;
  }
  return {
    templates: raw.templates as FactoryTemplate[],
    packages: raw.packages as FactoryPackage[],
    settings: raw.settings as FactorySettings,
    cloudflareConfigured: Boolean(raw.cloudflareConfigured),
  };
}

/** Last live catalog saved on this device, if any. */
export function readCachedFactoryConfig(): FactoryConfig | null {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const config = normalize(JSON.parse(raw));
    if (!config || !config.templates.length) return null;
    memoryCache = config;
    return config;
  } catch {
    return null;
  }
}

export function writeCachedFactoryConfig(config: FactoryConfig): void {
  memoryCache = config;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...config, savedAt: Date.now() }));
  } catch {
    // Storage may be disabled or full; the in-memory copy still works.
  }
}

/** Render the factory immediately: saved live copy first, then defaults. */
export function getInitialFactoryConfig(): FactoryConfig {
  return readCachedFactoryConfig() || fallbackFactoryConfig();
}

let inFlight: Promise<FactoryConfig> | null = null;

/**
 * Fetch the live catalog and cache it. Concurrent callers (idle prefetch and
 * the factory page) share the same request.
 */
export function loadFactoryConfig(): Promise<FactoryConfig> {
  if (inFlight) return inFlight;
  inFlight = api.siteFactory
    .config()
    .then((response) => {
      const config = normalize(response);
      if (!config) throw new Error('Invalid catalog response');
      writeCachedFactoryConfig(config);
      return config;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Warm the API in the background as soon as the visitor lands on the site. */
export function prefetchFactoryConfig(): void {
  void loadFactoryConfig().catch(() => {
    // Offline or cold server: the page already has a usable catalog.
  });
}
