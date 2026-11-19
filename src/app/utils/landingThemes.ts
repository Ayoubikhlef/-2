import type { AiStudioLanguage } from './api';

/**
 * Art directions for the landing-page generator. Every theme is a complete
 * visual system (colors, type, motion, 3D scene) applied by a `data-theme`
 * attribute, so one HTML builder can produce genuinely different pages.
 */
export type LandingThemeId = 'aos' | 'noir' | 'aurora' | 'editorial' | 'neon';
export type LandingThemeChoice = LandingThemeId | 'auto';

type ThemeText = { ar: string; fr: string; en: string };

export const LANDING_THEMES: Array<{
  id: LandingThemeChoice;
  name: ThemeText;
  hint: ThemeText;
  tone: string;
}> = [
  {
    id: 'aos',
    name: { ar: 'هوية المتجر', fr: 'Identité AOS', en: 'Store identity' },
    hint: { ar: 'أخضر وذهبي — احترافي ودافئ', fr: 'Vert et or — professionnel', en: 'Emerald and gold — professional' },
    tone: '#0f766e',
  },
  {
    id: 'noir',
    name: { ar: 'فخامة سوداء', fr: 'Luxe noir', en: 'Black luxury' },
    hint: { ar: 'أسود وذهبي — لمسة فاخرة', fr: 'Noir et or — rendu luxueux', en: 'Black and gold — premium feel' },
    tone: '#e7b45a',
  },
  {
    id: 'aurora',
    name: { ar: 'أورورا', fr: 'Aurore', en: 'Aurora' },
    hint: { ar: 'تدرّج حيوي — جذاب وشبابي', fr: 'Dégradé vibrant — dynamique', en: 'Vivid gradient — energetic' },
    tone: '#7c3aed',
  },
  {
    id: 'editorial',
    name: { ar: 'مجلة أنيقة', fr: 'Éditorial', en: 'Editorial' },
    hint: { ar: 'أبيض ونظيف — ثقة ورقيّة', fr: 'Blanc épuré — style magazine', en: 'Clean white — magazine style' },
    tone: '#1d4ed8',
  },
  {
    id: 'neon',
    name: { ar: 'نيون تقني', fr: 'Néon tech', en: 'Tech neon' },
    hint: { ar: 'أزرق ساطع — إحساس مستقبلي', fr: 'Bleu néon — style futuriste', en: 'Bright blue — futuristic' },
    tone: '#22d3ee',
  },
  {
    id: 'auto',
    name: { ar: 'مفاجأة', fr: 'Surprise', en: 'Surprise me' },
    hint: { ar: 'نختار الشكل الأنسب للمنتج', fr: 'Nous choisissons le meilleur style', en: 'We pick the best fit for the product' },
    tone: '#6366f1',
  },
];

const THEME_IDS: LandingThemeId[] = ['aos', 'noir', 'aurora', 'editorial', 'neon'];

export function resolveLandingTheme(choice: string | undefined, seed: string): LandingThemeId {
  if (choice && (THEME_IDS as string[]).includes(choice)) return choice as LandingThemeId;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return THEME_IDS[(hash >>> 0) % THEME_IDS.length];
}

export function isLandingTheme(value: unknown): value is LandingThemeChoice {
  return typeof value === 'string' && LANDING_THEMES.some((theme) => theme.id === value);
}

export const LANDING_THEME_COLOR: Record<LandingThemeId, string> = {
  aos: '#0f766e',
  noir: '#111714',
  aurora: '#7c3aed',
  editorial: '#101828',
  neon: '#062433',
};

const SCENE_COLORS: Record<LandingThemeId, { primary: number; secondary: number; accent: number; particle: number; metal: number }> = {
  aos: { primary: 0x0f766e, secondary: 0x14b8a6, accent: 0xf59e0b, particle: 0x5eead4, metal: 0x115e59 },
  noir: { primary: 0xe7b45a, secondary: 0x8a6a2f, accent: 0xffd27a, particle: 0xd6b371, metal: 0x2a2318 },
  aurora: { primary: 0x7c3aed, secondary: 0xdb2777, accent: 0xf97316, particle: 0xf5b8ff, metal: 0x4c1d95 },
  editorial: { primary: 0x1d4ed8, secondary: 0x64748b, accent: 0xb45309, particle: 0x93a8d0, metal: 0x1e293b },
  neon: { primary: 0x22d3ee, secondary: 0xa78bfa, accent: 0x67e8f9, particle: 0x7dd3fc, metal: 0x0e7490 },
};

/** Shared variables, 3D depth layer and all five art directions. */
export const LANDING_THEME_CSS = `
:root{
  --font-body:"Inter","Cairo","Segoe UI","Noto Sans Arabic",Tahoma,Arial,sans-serif;
  --font-head:var(--font-body);
  --header-bg:rgba(251,247,239,.9);
  --header-line:rgba(232,224,210,.8);
  --hero-bg:var(--paper);
  --glow-1:rgba(15,118,110,.16);
  --glow-2:rgba(245,158,11,.2);
  --frame-bg:linear-gradient(145deg,#dff3ee,#f7e7c4);
  --frame-border:rgba(255,255,255,.7);
  --frame-shadow:0 30px 70px rgba(20,32,29,.16);
  --frame-transform:rotate(-1.2deg);
  --frame-hover:rotate(0deg) translateY(-6px);
  --frame-back:rgba(15,118,110,.16);
  --orb:rgba(245,158,11,.55);
  --photo-shadow:drop-shadow(0 18px 28px rgba(20,32,29,.22));
  --offer-bg:linear-gradient(135deg,#0b4f4a,#0f766e 62%,#12857a);
  --offer-text:#fff;
  --offer-muted:rgba(255,255,255,.86);
  --final-bg:#0b4f4a;
  --final-text:#fff;
  --final-muted:rgba(255,255,255,.78);
  --final-micro:rgba(255,255,255,.62);
  --btn-radius:999px;
  --card-radius:22px;
  --brand-soft:rgba(15,118,110,.1);
  --accent-soft:rgba(245,158,11,.12);
  --grid-color:transparent;
  --scene-opacity:.55;
}
html[lang="ar"]{--font-body:"Cairo","Noto Sans Arabic",Tahoma,Arial,sans-serif;--font-head:var(--font-body)}
html[lang="ar"] body[data-theme="editorial"],html[lang="ar"] body[data-theme="noir"]{--font-head:"Cairo","Noto Naskh Arabic",Tahoma,Arial,sans-serif}

/* Shared CSS 3D depth: works with no JavaScript at all. */
.hero-media{position:relative;perspective:1200px;perspective-origin:50% 40%}
.hero-media>.container{position:relative}
.scene{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:var(--scene-opacity)}
.scene canvas{width:100%!important;height:100%!important;display:block}
.media-frame{transform-style:preserve-3d;transform:var(--frame-transform);transition:transform .6s cubic-bezier(.2,.8,.2,1);will-change:transform}
.hero-media:hover .media-frame{transform:var(--frame-hover)}
.media-frame::before{content:"";position:absolute;inset:16px;border-radius:inherit;background:var(--frame-back);transform:translateZ(-28px);filter:blur(14px);z-index:-1}
.media-frame::after{content:"";position:absolute;inset-inline-end:-18px;top:-18px;width:90px;height:90px;border-radius:50%;background:var(--orb);filter:blur(26px);transform:translateZ(30px);z-index:-1;animation:aosFloat 7s ease-in-out infinite}
.media-frame img{transform:translateZ(24px);filter:var(--photo-shadow)}
.price-chip{transform:translateZ(46px)}
.hero::before,.hero::after{content:"";position:absolute;pointer-events:none;border-radius:50%;z-index:0}
.hero::before{width:280px;height:280px;inset-inline-start:-90px;top:-110px;border:1px solid var(--glow-2);background:var(--glow-1);filter:blur(6px);animation:aosFloat 9s ease-in-out infinite}
.hero::after{width:180px;height:180px;inset-inline-end:-60px;bottom:-90px;border:1px solid var(--glow-2);background:var(--glow-2);filter:blur(18px);animation:aosFloat 11s ease-in-out infinite reverse}
.hero>.container{position:relative;z-index:1}
@keyframes aosFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-14px,0)}}
@keyframes aosSpin{to{transform:rotate(360deg)}}
.reveal{opacity:1;transform:none;transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1)}
.js-ready .reveal{opacity:0;transform:translateY(22px)}
.js-ready .reveal.in{opacity:1;transform:none}
.benefit,.panel,.quote,.offer-box,.guarantee-card{transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s ease}
@media(hover:hover) and (pointer:fine){
  .benefit:hover,.quote:hover,.guarantee-card:hover{transform:perspective(900px) rotateX(4deg) rotateY(-5deg) translateY(-6px);box-shadow:0 28px 60px rgba(20,32,29,.16)}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  .reveal,.js-ready .reveal{opacity:1!important;transform:none!important}
}

/* AOS — the store's own identity. */
[data-theme="aos"] .brand-mark{background:linear-gradient(135deg,#0f766e,#0b4f4a)}

/* Noir — luxury black and gold. */
[data-theme="noir"]{
  --ink:#f6f2ea;--muted:#b6beb9;--paper:#0b1110;--card:#121b19;--line:#293833;
  --brand:#e7b45a;--brand-2:#f3cf8b;--accent:#f5c66b;--brand-soft:rgba(231,180,90,.16);--accent-soft:rgba(231,180,90,.13);
  --header-bg:rgba(11,17,16,.86);--header-line:rgba(255,255,255,.1);
  --hero-bg:#0b1110;--glow-1:rgba(231,180,90,.16);--glow-2:rgba(231,180,90,.22);
  --frame-bg:linear-gradient(145deg,#1d2a27,#0d1513);--frame-border:rgba(231,180,90,.3);
  --frame-shadow:0 40px 90px rgba(0,0,0,.55);--frame-transform:rotateY(9deg) rotateX(4deg);--frame-hover:rotateY(0deg) rotateX(0deg) translateY(-8px);
  --frame-back:rgba(231,180,90,.2);--orb:rgba(231,180,90,.6);--photo-shadow:drop-shadow(0 24px 34px rgba(0,0,0,.6));
  --offer-bg:linear-gradient(135deg,#151f1d,#26332f);--offer-text:#f6f2ea;--offer-muted:rgba(246,242,234,.7);
  --final-bg:#070c0b;--final-text:#f6f2ea;--final-muted:rgba(246,242,234,.74);--final-micro:rgba(246,242,234,.55);
  --btn-radius:14px;--card-radius:16px;--font-head:Georgia,"Times New Roman","Noto Naskh Arabic",serif;
}
[data-theme="noir"] .brand-mark,[data-theme="noir"] .steps li span{background:linear-gradient(135deg,#e7b45a,#b8862f);color:#0b1110}
[data-theme="noir"] .btn-ghost{color:var(--brand);border-color:rgba(231,180,90,.35)}
[data-theme="noir"] .btn-ghost:hover,[data-theme="neon"] .btn-ghost:hover,[data-theme="noir"] .chip:hover{background:var(--brand-soft)}
[data-theme="noir"] .offer-box,[data-theme="neon"] .offer-box{background:#101917;color:var(--ink)}
[data-theme="noir"] .offer-price,[data-theme="neon"] .offer-price{color:var(--brand)}
[data-theme="noir"] .offer-label,[data-theme="neon"] .offer-label{color:var(--muted)}
[data-theme="noir"] .eyebrow{color:var(--brand-2);border-color:rgba(231,180,90,.35);background:rgba(231,180,90,.08)}

/* Aurora — vivid gradient and playful motion. */
[data-theme="aurora"]{
  --ink:#21143d;--muted:#5e5478;--paper:#fff8f5;--card:#fff;--line:#efdce8;
  --brand:#7c3aed;--brand-2:#db2777;--accent:#f97316;--brand-soft:rgba(124,58,237,.11);--accent-soft:rgba(249,115,22,.14);
  --header-bg:rgba(255,248,245,.86);
  --hero-bg:linear-gradient(135deg,#fff6f0,#fdf0fa);--glow-1:rgba(124,58,237,.2);--glow-2:rgba(249,115,22,.22);
  --frame-bg:linear-gradient(145deg,#fde7f4,#ffedd5);--frame-border:rgba(255,255,255,.9);
  --frame-shadow:0 35px 70px rgba(124,58,237,.2);--frame-transform:rotate(-3deg) rotateY(-8deg);--frame-hover:rotate(0deg) rotateY(0deg) translateY(-8px);
  --frame-back:rgba(219,39,119,.18);--orb:rgba(249,115,22,.7);--photo-shadow:drop-shadow(0 20px 30px rgba(124,58,237,.22));
  --offer-bg:linear-gradient(120deg,#7c3aed,#db2777 55%,#f97316);
  --final-bg:#4c1d95;--font-head:"Trebuchet MS","Segoe UI",sans-serif;
}
[data-theme="aurora"] .hero::before{border:2px dashed rgba(124,58,237,.25);background:rgba(124,58,237,.08)}
[data-theme="aurora"] .hero::after{border:2px dashed rgba(249,115,22,.25);background:rgba(249,115,22,.08)}
[data-theme="aurora"] .brand-mark,[data-theme="aurora"] .steps li span{background:linear-gradient(135deg,#7c3aed,#db2777)}
[data-theme="aurora"] .benefit::after{background:linear-gradient(135deg,rgba(124,58,237,.16),rgba(249,115,22,.16))}

/* Editorial — clean magazine layout with a hard 3D shadow. */
[data-theme="editorial"]{
  --ink:#14161a;--muted:#606875;--paper:#f7f5f1;--card:#fff;--line:#e2ded5;
  --brand:#1d4ed8;--brand-2:#1e40af;--accent:#b45309;--brand-soft:rgba(29,78,216,.09);--accent-soft:rgba(180,83,9,.08);
  --header-bg:rgba(247,245,241,.92);
  --hero-bg:#f7f5f1;--glow-1:rgba(29,78,216,.07);--glow-2:rgba(180,83,9,.07);
  --frame-bg:#fff;--frame-border:#e3ded4;--frame-shadow:12px 12px 0 rgba(29,78,216,.12);
  --frame-transform:rotate(0deg);--frame-hover:translateY(-6px);--frame-back:rgba(29,78,216,.1);--orb:transparent;
  --photo-shadow:drop-shadow(0 10px 18px rgba(20,22,26,.12));
  --offer-bg:#101828;--final-bg:#101828;--btn-radius:6px;--card-radius:6px;
  --font-head:Georgia,"Noto Naskh Arabic","Times New Roman",serif;
}
[data-theme="editorial"] .eyebrow{border-radius:0;border-width:0 0 2px;padding:4px 0;text-transform:uppercase;letter-spacing:.18em}
[data-theme="editorial"] .hero h1,[data-theme="editorial"] .section h2,[data-theme="editorial"] .final-cta h2{letter-spacing:-.04em}
[data-theme="editorial"] .benefit,[data-theme="editorial"] .panel,[data-theme="editorial"] .quote{border-radius:6px}
[data-theme="editorial"] .benefit::after{display:none}

/* Neon — futuristic glass and grid. */
[data-theme="noir"],[data-theme="neon"]{--scene-opacity:.85}
[data-theme="neon"]{
  --ink:#e8f6ff;--muted:#9bb6c8;--paper:#06111c;--card:#0c1b29;--line:#1d3347;
  --brand:#22d3ee;--brand-2:#38bdf8;--accent:#a78bfa;--brand-soft:rgba(34,211,238,.14);--accent-soft:rgba(167,139,250,.14);
  --header-bg:rgba(6,17,28,.86);--header-line:rgba(34,211,238,.16);
  --hero-bg:linear-gradient(180deg,#06111c,#04101a);--glow-1:rgba(34,211,238,.18);--glow-2:rgba(167,139,250,.16);
  --frame-bg:linear-gradient(145deg,#0d2436,#07131f);--frame-border:rgba(34,211,238,.34);
  --frame-shadow:0 0 60px rgba(34,211,238,.16),0 30px 70px rgba(0,0,0,.5);
  --frame-transform:rotateY(-12deg) rotateX(6deg);--frame-hover:rotateY(0deg) rotateX(0deg) translateY(-8px);
  --frame-back:rgba(34,211,238,.22);--orb:rgba(34,211,238,.7);--photo-shadow:drop-shadow(0 0 24px rgba(34,211,238,.28));
  --offer-bg:linear-gradient(135deg,#083344,#0e7490);--offer-text:#e8f6ff;--offer-muted:rgba(232,246,255,.72);
  --final-bg:#062433;--final-text:#e8f6ff;--final-muted:rgba(232,246,255,.75);--final-micro:rgba(232,246,255,.55);
  --btn-radius:10px;--card-radius:14px;--grid-color:rgba(34,211,238,.07);--scene-opacity:1;
}
[data-theme="neon"] .hero{
  background-image:linear-gradient(var(--grid-color) 1px,transparent 1px),linear-gradient(90deg,var(--grid-color) 1px,transparent 1px),radial-gradient(circle at 12% 18%,var(--glow-1),transparent 38%),radial-gradient(circle at 88% 8%,var(--glow-2),transparent 34%);
  background-size:44px 44px,44px 44px,auto,auto;
}
[data-theme="neon"] .brand-mark,[data-theme="neon"] .steps li span{background:linear-gradient(135deg,#22d3ee,#0e7490);color:#04101a}
[data-theme="neon"] .btn-ghost{border-color:rgba(34,211,238,.35)}
[data-theme="neon"] .eyebrow{background:rgba(34,211,238,.08);border-color:rgba(34,211,238,.28);color:var(--brand-2)}
[data-theme="neon"] .quote,[data-theme="neon"] .panel,[data-theme="neon"] .benefit{backdrop-filter:blur(10px);background:rgba(12,27,41,.78)}
[data-theme="neon"] .chip{background:rgba(12,27,41,.8)}

@media(max-width:900px){
  [data-theme="noir"] .media-frame,[data-theme="neon"] .media-frame{transform:none}
  .scene{inset:0}
}
@media(max-width:600px){
  .hero::before,.hero::after{width:140px;height:140px}
  .media-frame::after{width:54px;height:54px;inset-inline-end:-8px;top:-8px}
  .scene{inset:0}
}
`;

function jsString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

/**
 * Real WebGL scene: distorted glowing sphere, orbiting rings, particle field
 * and the seller's photo as a floating 3D card. Degrades silently to the CSS
 * composition when WebGL/Three.js/animation are unavailable.
 */
export function buildLandingSceneScript(
  theme: LandingThemeId,
  image: string,
  productName: string,
  language: AiStudioLanguage,
): string {
  const colors = SCENE_COLORS[theme];
  const config = {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    particle: colors.particle,
    metal: colors.metal,
    image,
    productName,
    rtl: language === 'ar',
  };
  return `<script>
(function(){
  var cfg = ${jsString(JSON.stringify(config))};
  cfg = JSON.parse(cfg);
  var root = document.documentElement;
  var host = document.getElementById('aos-scene');
  var mount = document.getElementById('aos-canvas');
  var hero = document.querySelector('.hero');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js-ready');

  // Reveal-on-scroll without depending on GSAP.
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  if (reduce || !host || !mount || !window.THREE) return;
  var renderer, scene, camera, group, scrollGroup, sphere, wire, rings = [], points, product, frame, clock, running = true;
  var pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 }, basePositions;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);
    scrollGroup = new THREE.Group();
    group = new THREE.Group();
    scene.add(scrollGroup);
    scrollGroup.add(group);

    sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05, 4),
      new THREE.MeshStandardMaterial({ color: cfg.primary, emissive: cfg.secondary, emissiveIntensity: 0.35, roughness: 0.32, metalness: 0.28, transparent: true, opacity: 0.92 }),
    );
    sphere.position.set(cfg.rtl ? 3.5 : -3.5, -0.15, 0);
    group.add(sphere);
    basePositions = sphere.geometry.attributes.position.array.slice();
    wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.18, 2),
      new THREE.MeshBasicMaterial({ color: cfg.accent, wireframe: true, transparent: true, opacity: 0.16 }),
    );
    wire.position.copy(sphere.position);
    group.add(wire);

    [1.5, 1.78].forEach(function (radius, index) {
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.012, 8, 120),
        new THREE.MeshBasicMaterial({ color: index ? cfg.secondary : cfg.accent, transparent: true, opacity: 0.5 }),
      );
      ring.rotation.set(index ? 1.1 : 0.5, index ? 0.3 : -0.4, 0);
      ring.position.copy(sphere.position);
      group.add(ring);
      rings.push(ring);
    });

    var count = window.innerWidth < 700 ? 240 : 720;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i += 1) {
      var r = 2.1 + Math.random() * 2.6;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    points = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: cfg.particle, size: 0.035, transparent: true, opacity: 0.75, sizeAttenuation: true }));
    scene.add(points);

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    var key = new THREE.PointLight(cfg.primary, 2.4, 24); key.position.set(3, 3, 5); scene.add(key);
    var rim = new THREE.PointLight(cfg.secondary, 1.8, 24); rim.position.set(-4, -2, 4); scene.add(rim);

    if (cfg.image) {
      frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.24, 1.24, 0.08),
        new THREE.MeshStandardMaterial({ color: cfg.metal, metalness: 0.55, roughness: 0.4 }),
      );
      frame.position.set(cfg.rtl ? -2.35 : 2.35, 0.9, 0.4);
      frame.rotation.set(0.08, cfg.rtl ? 0.42 : -0.42, 0.04);
      group.add(frame);
      product = new THREE.Mesh(
        new THREE.PlaneGeometry(1.14, 1.14),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide }),
      );
      product.position.copy(frame.position);
      product.position.z += 0.06;
      product.rotation.copy(frame.rotation);
      group.add(product);
      new THREE.TextureLoader().load(cfg.image, function (texture) {
        if (texture.colorSpace !== undefined) texture.colorSpace = THREE.SRGBColorSpace;
        product.material.map = texture;
        product.material.needsUpdate = true;
      });
    }
  } catch (error) {
    if (renderer && renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    return;
  }
  host.classList.add('is-3d');

  function resize() {
    var w = mount.clientWidth || 1, h = mount.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(mount);
  else window.addEventListener('resize', resize);

  if (hero && window.addEventListener) {
    hero.addEventListener('pointermove', function (event) {
      var box = hero.getBoundingClientRect();
      target.x = ((event.clientX - box.left) / box.width - 0.5) * 0.5;
      target.y = ((event.clientY - box.top) / box.height - 0.5) * 0.35;
    });
    hero.addEventListener('pointerleave', function () { target.x = 0; target.y = 0; });
  }

  if (window.gsap && window.ScrollTrigger && hero) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.to(scrollGroup.rotation, { y: Math.PI * 0.85, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
    window.gsap.to(scrollGroup.scale, { x: 1.16, y: 1.16, z: 1.16, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
  } else if (hero && window.addEventListener) {
    window.addEventListener('scroll', function () {
      var progress = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight || 1)));
      scrollGroup.rotation.y = progress * Math.PI * 0.7;
      scrollGroup.scale.setScalar(1 + progress * 0.14);
    }, { passive: true });
  }

  clock = new THREE.Clock();
  var frames = 0;
  function render() {
    if (!running) return;
    frames += 1;
    if (frames % 30 === 0) host.dataset.frames = String(frames);
    try {
    var elapsed = clock.getElapsedTime();
    var attr = sphere.geometry.attributes.position;
    for (var i = 0; i < attr.count; i += 1) {
      var x = basePositions[i * 3], y = basePositions[i * 3 + 1], z = basePositions[i * 3 + 2];
      var wave = Math.sin(elapsed * 0.9 + x * 2.1 + y * 1.7) * 0.09 + Math.cos(elapsed * 0.7 + z * 2.4) * 0.06;
      attr.setXYZ(i, x * (1 + wave), y * (1 + wave), z * (1 + wave));
    }
    attr.needsUpdate = true;
    sphere.geometry.computeVertexNormals();
    wire.rotation.y = elapsed * 0.12;
    rings[0].rotation.z = elapsed * 0.22;
    rings[1].rotation.x = 1.1 + Math.sin(elapsed * 0.25) * 0.3;
    points.rotation.y = elapsed * 0.035;
    pointer.x += (target.x - pointer.x) * 0.045;
    pointer.y += (target.y - pointer.y) * 0.045;
    group.rotation.x = pointer.y + Math.sin(elapsed * 0.3) * 0.05;
    group.rotation.y = pointer.x * 0.4 + Math.sin(elapsed * 0.22) * 0.08;
    group.position.y = Math.sin(elapsed * 0.6) * 0.08;
    renderer.render(scene, camera);
    } catch (error) {
      host.dataset.error = String(error);
      running = false;
      renderer.setAnimationLoop(null);
    }
  }
  renderer.setAnimationLoop(render);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { running = false; renderer.setAnimationLoop(null); }
    else { running = true; clock.start(); renderer.setAnimationLoop(render); }
  });
})();
<\/script>`;
}
