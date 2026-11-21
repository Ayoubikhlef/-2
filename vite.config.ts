import { defineConfig, loadEnv } from 'vite'
import fs from 'node:fs/promises'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { DEMO_SLUGS, renderTemplateDemo } from './server/src/site-factory/demo'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

/**
 * Every template ships a real, fully rendered demo website at
 * /templates/<slug>/ so visitors can browse the actual content of a template
 * before ordering. Files are generated with the same renderer used for
 * published sites, both in `vite dev` (in memory) and at build time (dist).
 */
function templatePreviews() {
  const lookup = (url: string) => {
    const clean = (url || '').split('?')[0]
    const match = /^\/templates\/([^/]+)(?:\/(.*))?$/.exec(clean)
    if (!match) return null
    const slug = decodeURIComponent(match[1])
    if (!DEMO_SLUGS.includes(slug)) return null
    let file = match[2] || ''
    if (!file || file.endsWith('/')) file += 'index.html'
    const site = renderTemplateDemo(slug, 'ar')
    const entry = site.files[file]
    if (!entry) return null
    return {
      type: entry.type,
      body: entry.encoding === 'base64' ? Buffer.from(entry.content, 'base64') : entry.content,
    }
  }

  return {
    name: 'template-previews',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const found = lookup(req.url || '')
        if (!found) return next()
        res.setHeader('Content-Type', found.type)
        res.setHeader('Cache-Control', 'no-store')
        res.end(found.body)
      })
    },
    async closeBundle(this: any) {
      const outDir = path.resolve(__dirname, 'dist/templates')
      await fs.rm(outDir, { recursive: true, force: true })
      let written = 0
      for (const slug of DEMO_SLUGS) {
        const site = renderTemplateDemo(slug, 'ar')
        for (const [file, entry] of Object.entries(site.files)) {
          const target = path.join(outDir, slug, file)
          await fs.mkdir(path.dirname(target), { recursive: true })
          const data = entry.encoding === 'base64' ? Buffer.from(entry.content, 'base64') : entry.content
          await fs.writeFile(target, data)
          written++
        }
      }
      this.info(`template previews: ${DEMO_SLUGS.length} templates, ${written} files`)
    },
  }
}

/**
 * Route-specific HTML shells for the standalone pages. Vite builds a single
 * index.html, so link previews and crawlers that do not execute JavaScript
 * would otherwise see the storefront title/description on every route. These
 * files keep the same bundle and boot screen but carry the right <title>,
 * description, canonical/OG tags and a matching no-JS fallback.
 */
const SEO_ROUTES = [
  {
    path: '/ai-tools',
    title: 'أدوات الذكاء الاصطناعي للمتاجر — 13 أداة جاهزة | AOS Tech Store',
    description: 'ثلاث عشرة أداة ذكاء اصطناعي للمتاجر: أوصاف منتجات، إعلانات، شعارات، صور، فيديو، ترجمة، صفحات هبوط ثلاثية الأبعاد وأكثر. جرّب أداة مجاناً.',
    fallback: `
        <h1>13 أداة ذكاء اصطناعي لمتجرك</h1>
        <p>اكتب وصف منتجك، صمّم إعلانك، وأنشئ صفحة هبوط احترافية في دقائق — أدوات جاهزة بالعربية والفرنسية والإنجليزية، مع تجربة مجانية لأداة واحدة.</p>
        <h2>ماذا يمكنك أن تصنع؟</h2>
        <ul>
          <li>أوصاف منتجات وإعلانات فيسبوك وإنستغرام</li>
          <li>شعارات وصور وفيديوهات قصيرة بالذكاء الاصطناعي</li>
          <li>سيرة ذاتية، ترجمة، شات بوت وأتمتة الرسائل</li>
          <li>صفحة هبوط ثلاثية الأبعاد مع صورة منتجك</li>
        </ul>
        <p><a href="/ai-tools/calculator">حاسبة أرباح المتجر</a> · <a href="/subscription">خطط الاشتراك</a> · <a href="/">المتجر</a></p>
      `,
  },
  {
    path: '/ai-tools/calculator',
    title: 'حاسبة أرباح المتجر — احسب هامشك قبل البيع | AOS Tech Store',
    description: 'خمس حاسبات مجانية للمتاجر الجزائرية: ربح المنتج، التسعير، تكلفة الطلب، سقف الإعلان والهدف الشهري. اعرف ربحك الصافي بالدينار قبل البيع.',
    fallback: `
        <h1>احسب أرباحك قبل أن تبيع</h1>
        <p>خمس حاسبات دقيقة تحسب ربحك الصافي وهامشك وسقف إعلانك وتكلفة طلبك بالدينار الجزائري؛ عدّل الأرقام وشاهد النتيجة مباشرة.</p>
        <h2>الحاسبات الخمس</h2>
        <ul>
          <li>ربح المنتج بعد التكلفة والتوصيل والإعلان</li>
          <li>سعر البيع المناسب لهامشك المستهدف</li>
          <li>تكلفة الطلب الكاملة قبل الإعلان</li>
          <li>أقصى تكلفة إعلان لكل طلب مُسلَّم</li>
          <li>عدد الطلبات اللازمة لهدفك الشهري</li>
        </ul>
        <p><a href="/ai-tools">كل أدوات الذكاء الاصطناعي</a> · <a href="/subscription">خطط الاشتراك</a> · <a href="/">المتجر</a></p>
      `,
  },
  {
    path: '/premium-services',
    title: 'الخدمات المميزة — مواقع وهوية بصرية وتسويق | AOS Tech Store',
    description: 'خمس عشرة خدمة مميزة لنمو متجرك: إنشاء مواقع ومتاجر، هوية بصرية، إدارة إعلانات، محتوى وتصوير واستشارات — بأسعار واضحة.',
    fallback: `
        <h1>خدماتنا المميزة لنمو أعمالك</h1>
        <p>من الفكرة إلى الإطلاق: مواقع ومتاجر إلكترونية، هوية بصرية، إدارة حملات إعلانية، محتوى وصور، واستشارات نمو — 15 خدمة بأسعار واضحة بالدينار الجزائري.</p>
        <h2>ماذا تشمل الخدمات؟</h2>
        <ul>
          <li>تصميم وتطوير مواقع ومتاجر إلكترونية</li>
          <li>هوية بصرية وشعارات واحترافية علامة تجارية</li>
          <li>إدارة إعلانات فيسبوك وإنستغرام وتيك توك</li>
          <li>كتابة المحتوى، التصوير، واستشارات النمو</li>
        </ul>
        <p><a href="/#booking">احجز خدمة</a> · <a href="/create-website">أنشئ موقعك</a> · <a href="/#contact">اتصل بنا</a></p>
      `,
  },
  {
    path: '/subscription',
    title: 'اشتراك أدوات الذكاء الاصطناعي — الخطط والأسعار | AOS Tech Store',
    description: 'افتح كل أدوات الذكاء الاصطناعي: 1 900 دج شهرياً، 4 900 دج لكل 3 أشهر، أو 17 900 دج سنوياً. دفع Chargily أو CCP أو BaridiMob وتفعيل سريع.',
    fallback: `
        <h1>اشتراك أدوات الذكاء الاصطناعي</h1>
        <p>خطة شهرية أو ربع سنوية أو سنوية تفتح لك 13 أداة داخل الاستخدام العادل، مع دفع إلكتروني أو تحويل CCP / BaridiMob وتفعيل بعد التحقق.</p>
        <h2>الخطط</h2>
        <ul>
          <li>شهري: 1 900 دج</li>
          <li>ثلاثة أشهر: 4 900 دج</li>
          <li>سنوي: 17 900 دج</li>
        </ul>
        <p><a href="/ai-tools">جرّب الأدوات</a> · <a href="/ai-tools/calculator">حاسبة الأرباح</a> · <a href="/">المتجر</a></p>
      `,
  },
];

function routeSeoPages() {
  return {
    name: 'route-seo-pages',
    apply: 'build' as const,
    async closeBundle(this: any) {
      const dist = path.resolve(__dirname, 'dist');
      const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

      for (const route of SEO_ROUTES) {
        const url = `https://aos-tech.store${route.path}`;
        const title = escapeHtml(route.title);
        const description = escapeHtml(route.description);
        let page = template;

        page = page.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
        page = page.replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`);
        page = page.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
        page = page.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`);
        page = page.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`);
        page = page.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
        page = page.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`);
        page = page.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`);
        page = page.replace(
          /(<div id="seo-fallback"[^>]*>)[\s\S]*?(<\/div>\s*<div id="boot-screen")/,
          `$1${route.fallback}\n      $2`,
        );

        const target = path.join(dist, route.path.replace(/^\//, ''), 'index.html');
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, page);
      }
      this.info(`route seo pages: ${SEO_ROUTES.length}`);
    },
  };
}

export default defineConfig(({ mode }) => {
  // Local preview can point at the deployed API when no local database exists.
  // Set VITE_API_PROXY (and VITE_API_URL=/api) in .env.local; default stays the
  // local Express server on port 3001.
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY || 'http://localhost:3001';
  const proxy = {
    '/api': { target: apiTarget, changeOrigin: true, secure: true },
    '/socket.io': { target: apiTarget, changeOrigin: true, ws: true },
  };

  return {
    plugins: [
      figmaAssetResolver(),
      templatePreviews(),
      routeSeoPages(),
      react(),
      tailwindcss(),
    ],
    // `vite preview` serves the production bundle on another port; without this
    // proxy its `/api` calls fall back to index.html and break the catalog.
    server: { proxy },
    preview: { proxy },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'motion'],
            ui: ['lucide-react', 'sonner'],
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      sourcemap: false,
    },
  };
});
