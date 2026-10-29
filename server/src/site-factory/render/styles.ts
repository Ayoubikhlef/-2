/**
 * Shared stylesheet for every generated client website.
 * Template-specific sections are scoped with body.tpl-*.
 */
export const SITE_CSS = String.raw`
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font);font-size:16px;line-height:1.7;overflow-x:hidden}
html[lang="ar"] body{letter-spacing:0}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button,input,select,textarea{font:inherit;color:inherit}
button{cursor:pointer}
h1,h2,h3,h4,p{margin:0}
ul{margin:0;padding:0;list-style:none}
::selection{background:var(--p);color:var(--p-ink)}
:focus-visible{outline:3px solid color-mix(in srgb,var(--p) 55%,white);outline-offset:3px}
.container{width:min(1180px,100% - 40px);margin-inline:auto}
.section{padding:88px 0}
.section-sm{padding:52px 0}
.bg-soft{background:var(--soft)}
.bg-ink{background:var(--ink);color:#fff}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--p)}
.eyebrow::before{content:"";width:24px;height:2px;background:var(--p);border-radius:2px}
.h1,.h2,.h3{font-weight:800;line-height:1.12;letter-spacing:-.025em}
.h1{font-size:clamp(2.35rem,5.4vw,4.6rem)}
.h2{font-size:clamp(1.85rem,3.6vw,3rem)}
.h3{font-size:clamp(1.2rem,2vw,1.55rem)}
.lead{font-size:clamp(1rem,1.5vw,1.15rem);color:var(--muted);max-width:62ch;line-height:1.85}
.muted{color:var(--muted)}
.center{text-align:center}
.center .lead{margin-inline:auto}
.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:42px}
.section-head .lead{margin-top:10px}
.grid{display:grid;gap:22px}
.g2{grid-template-columns:repeat(2,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g4{grid-template-columns:repeat(4,1fr)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow-sm)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:48px;padding:12px 22px;border-radius:999px;border:1px solid transparent;font-weight:800;font-size:.95rem;transition:transform .2s,box-shadow .2s,background .2s;white-space:nowrap}
.btn:hover{transform:translateY(-2px)}
.btn:active{transform:translateY(0)}
.btn-primary{background:var(--p);color:var(--p-ink);box-shadow:0 12px 28px -12px color-mix(in srgb,var(--p) 70%,transparent)}
.btn-primary:hover{background:color-mix(in srgb,var(--p) 88%,black)}
.btn-dark{background:var(--ink);color:#fff}
.btn-light{background:#fff;color:var(--ink);border-color:var(--line)}
.btn-ghost{background:transparent;border-color:color-mix(in srgb,var(--ink) 18%,transparent);color:var(--ink)}
.btn-wa{background:#25d366;color:#053d22}
.btn-sm{min-height:40px;padding:8px 16px;font-size:.85rem}
.btn-block{width:100%}
.icon{width:20px;height:20px;flex:0 0 auto;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.badge{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;background:color-mix(in srgb,var(--p) 10%,white);color:var(--p);font-size:.78rem;font-weight:800}
.dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.16)}

/* header */
.site-header{position:sticky;top:0;z-index:60;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(18px);border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);transition:box-shadow .25s}
.site-header.is-scrolled{box-shadow:0 10px 40px -18px rgba(15,23,42,.28)}
.header-inner{display:flex;align-items:center;gap:16px;min-height:74px}
.brand{display:inline-flex;align-items:center;gap:11px;font-weight:900;font-size:1.05rem;letter-spacing:-.02em}
.brand-logo{width:44px;height:44px;border-radius:13px;object-fit:cover;border:1px solid var(--line);background:#fff}
.brand-mark{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,var(--p),var(--p2));color:#fff;font-weight:900;font-size:1.1rem;box-shadow:0 8px 20px -8px color-mix(in srgb,var(--p) 70%,transparent)}
.brand small{display:block;font-size:.67rem;font-weight:600;color:var(--muted);letter-spacing:.02em;margin-top:1px}
.nav{display:flex;align-items:center;gap:2px;margin-inline-start:auto}
.nav a{padding:9px 13px;border-radius:10px;font-size:.88rem;font-weight:700;color:color-mix(in srgb,var(--ink) 72%,transparent);transition:.2s}
.nav a:hover{background:color-mix(in srgb,var(--p) 8%,transparent);color:var(--p)}
.header-actions{display:flex;align-items:center;gap:8px;margin-inline-start:6px}
.lang-switch{display:flex;align-items:center;padding:3px;border:1px solid var(--line);border-radius:999px;background:var(--surface)}
.lang-switch a,.lang-switch span{font-size:.68rem;font-weight:800;padding:4px 7px;border-radius:999px;color:var(--muted);line-height:1}
.lang-switch .active{background:var(--ink);color:#fff}
.cart-btn{position:relative;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center}
.cart-count{position:absolute;top:-3px;inset-inline-end:-3px;min-width:19px;height:19px;padding:0 4px;border-radius:999px;background:var(--p);color:var(--p-ink);font-size:.65rem;font-weight:900;display:grid;place-items:center}
.menu-toggle{display:none;width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--surface);place-items:center}
.mobile-panel{position:fixed;inset:0;z-index:90;display:none;background:rgba(8,15,30,.55);backdrop-filter:blur(6px)}
.mobile-panel.is-open{display:block}
.mobile-sheet{position:absolute;inset-block:0;inset-inline-end:0;width:min(340px,86vw);background:var(--bg);padding:22px;display:flex;flex-direction:column;gap:6px;box-shadow:-20px 0 60px rgba(0,0,0,.25);overflow-y:auto}
.mobile-sheet .brand{margin-bottom:18px}
.mobile-sheet a.m-link{padding:13px 12px;border-radius:12px;font-weight:700;border-bottom:1px solid var(--line)}
.mobile-sheet a.m-link:hover{background:var(--soft)}
.mobile-sheet .btn{margin-top:10px}
.mobile-close{position:absolute;top:18px;inset-inline-end:18px;width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center}

/* hero */
.hero{padding:64px 0 56px;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;width:520px;height:520px;border-radius:50%;background:color-mix(in srgb,var(--p) 12%,transparent);filter:blur(90px);top:-220px;inset-inline-end:-140px;pointer-events:none}
.hero-grid{display:grid;grid-template-columns:1.04fr .96fr;gap:52px;align-items:center;position:relative}
.hero-copy .lead{margin-top:20px}
.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.hero-stats{display:flex;gap:30px;margin-top:38px;padding-top:26px;border-top:1px solid var(--line);flex-wrap:wrap}
.hero-stats .num{font-size:1.55rem;font-weight:900;line-height:1;letter-spacing:-.03em}
.hero-stats .lbl{font-size:.78rem;color:var(--muted);margin-top:5px}
.hero-media{position:relative;border-radius:30px;overflow:hidden;aspect-ratio:5/6;background:linear-gradient(150deg,var(--p),var(--p2));box-shadow:var(--shadow)}
.hero-media img{width:100%;height:100%;object-fit:cover}
.hero-media.no-img::after{content:"AOS";position:absolute;inset:0;display:grid;place-items:center;font-size:5rem;font-weight:900;color:rgba(255,255,255,.18);letter-spacing:.1em}
.float-card{position:absolute;bottom:20px;inset-inline-start:20px;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:11px;box-shadow:0 20px 40px -20px rgba(0,0,0,.4);color:#0f172a}
.float-card strong{display:block;font-size:.85rem;line-height:1.2}
.float-card span{font-size:.72rem;color:#64748b}
.float-icon{width:38px;height:38px;border-radius:11px;background:color-mix(in srgb,var(--p) 14%,white);color:var(--p);display:grid;place-items:center}
.hero-orb{position:absolute;border-radius:50%;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);pointer-events:none}

/* strip / logos / trust */
.trust-strip{border-block:1px solid var(--line);background:var(--surface)}
.trust-strip .container{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:10px;font-size:.85rem;font-weight:700;color:var(--muted)}
.trust-item .icon{color:var(--p)}
.feature{display:flex;gap:15px;align-items:flex-start;padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--line)}
.feature .f-icon{width:46px;height:46px;border-radius:13px;background:color-mix(in srgb,var(--p) 10%,white);color:var(--p);display:grid;place-items:center;flex:0 0 auto}
.feature h3{font-size:1rem;margin-bottom:4px}
.feature p{font-size:.85rem;color:var(--muted);line-height:1.65}

/* about */
.about-grid{display:grid;grid-template-columns:.95fr 1.05fr;gap:52px;align-items:center}
.about-media{position:relative;border-radius:26px;overflow:hidden;aspect-ratio:4/3.4;background:linear-gradient(150deg,color-mix(in srgb,var(--p) 22%,white),var(--p2))}
.about-media img{width:100%;height:100%;object-fit:cover}
.about-media::after{content:"";position:absolute;inset:auto 0 0 0;height:45%;background:linear-gradient(transparent,rgba(0,0,0,.35))}
.about-badge{position:absolute;bottom:20px;inset-inline-start:20px;z-index:2;padding:12px 16px;border-radius:14px;background:rgba(255,255,255,.95);color:#0f172a;font-weight:800;font-size:.85rem;display:flex;align-items:center;gap:8px}
.checklist{display:grid;gap:12px;margin-top:24px}
.checklist li{display:flex;align-items:flex-start;gap:11px;font-size:.92rem;color:var(--muted)}
.checklist .tick{width:22px;height:22px;border-radius:50%;background:color-mix(in srgb,var(--p) 13%,white);color:var(--p);display:grid;place-items:center;flex:0 0 auto;margin-top:2px}

/* services */
.service-card{padding:30px 26px;border-radius:var(--radius);background:var(--surface);border:1px solid var(--line);position:relative;overflow:hidden;transition:transform .25s,box-shadow .25s}
.service-card::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--p),var(--p2));transform:scaleX(0);transform-origin:inline-start;transition:transform .3s}
.service-card:hover{transform:translateY(-5px);box-shadow:var(--shadow)}
.service-card:hover::before{transform:scaleX(1)}
.service-num{font-size:.72rem;font-weight:900;letter-spacing:.14em;color:var(--p);margin-bottom:16px}
.service-icon{width:54px;height:54px;border-radius:15px;display:grid;place-items:center;background:color-mix(in srgb,var(--p) 10%,white);color:var(--p);margin-bottom:18px}
.service-card h3{margin-bottom:8px}
.service-card p{color:var(--muted);font-size:.9rem;line-height:1.75}

/* process */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;counter-reset:step}
.step{position:relative;padding:26px 20px;border-radius:18px;background:var(--surface);border:1px solid var(--line)}
.step .n{width:38px;height:38px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:900;font-size:.85rem;margin-bottom:16px}
.step h3{font-size:1rem;margin-bottom:5px}
.step p{font-size:.82rem;color:var(--muted);line-height:1.65}

/* stats band */
.stats-band{padding:44px 0;background:linear-gradient(120deg,var(--p2),var(--p));color:#fff;position:relative;overflow:hidden}
.stats-band::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% -20%,rgba(255,255,255,.18),transparent 45%)}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;position:relative;z-index:1}
.stat .num{font-size:clamp(1.8rem,3.4vw,2.7rem);font-weight:900;line-height:1;letter-spacing:-.03em}
.stat .lbl{font-size:.8rem;opacity:.78;margin-top:7px}

/* testimonials */
.quote{padding:28px;border-radius:var(--radius);background:var(--surface);border:1px solid var(--line);position:relative}
.quote .stars{color:#f59e0b;letter-spacing:2px;font-size:.9rem;margin-bottom:12px}
.quote p{font-size:.92rem;line-height:1.8;color:color-mix(in srgb,var(--ink) 80%,transparent)}
.quote .who{display:flex;align-items:center;gap:10px;margin-top:20px}
.quote .avatar{width:38px;height:38px;border-radius:50%;background:color-mix(in srgb,var(--p) 14%,white);color:var(--p);display:grid;place-items:center;font-weight:900;font-size:.8rem}
.quote .who strong{display:block;font-size:.82rem}
.quote .who span{font-size:.72rem;color:var(--muted)}

/* CTA */
.cta-band{border-radius:28px;padding:56px 48px;background:linear-gradient(120deg,var(--p2),var(--p));color:#fff;display:flex;align-items:center;justify-content:space-between;gap:30px;position:relative;overflow:hidden}
.cta-band::after{content:"";position:absolute;width:340px;height:340px;border-radius:50%;background:rgba(255,255,255,.1);top:-140px;inset-inline-end:-80px}
.cta-band h2{max-width:620px}
.cta-band p{opacity:.8;margin-top:10px;max-width:560px}
.cta-band .btn{position:relative;z-index:1;flex:0 0 auto}

/* footer */
.site-footer{background:#0b1220;color:#cbd5e1;padding:64px 0 0;margin-top:0}
.footer-grid{display:grid;grid-template-columns:1.4fr .8fr 1fr;gap:44px;padding-bottom:44px}
.site-footer .brand{color:#fff}
.site-footer p{font-size:.86rem;color:#94a3b8;line-height:1.8;margin-top:14px;max-width:38ch}
.f-title{color:#fff;font-size:.82rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px}
.f-links{display:grid;gap:9px}
.f-links a{font-size:.86rem;color:#94a3b8;transition:.2s}
.f-links a:hover{color:#fff}
.f-contact{display:grid;gap:12px}
.f-contact a,.f-contact span{display:flex;align-items:flex-start;gap:10px;font-size:.86rem;color:#94a3b8}
.f-contact .icon{color:var(--p);margin-top:3px;width:17px;height:17px}
.socials{display:flex;gap:8px;margin-top:18px}
.socials a{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);color:#e2e8f0;transition:.2s}
.socials a:hover{background:var(--p);border-color:var(--p);color:var(--p-ink)}
.footer-bottom{border-top:1px solid rgba(255,255,255,.08);padding:18px 0;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:.75rem;color:#64748b}

/* floating whatsapp */
.wa-float{position:fixed;bottom:20px;inset-inline-end:20px;z-index:70;width:56px;height:56px;border-radius:50%;background:#25d366;color:#053d22;display:grid;place-items:center;box-shadow:0 18px 40px -12px rgba(37,211,102,.65);transition:transform .2s}
.wa-float:hover{transform:scale(1.06)}
.wa-float .icon{width:28px;height:28px}
.to-top{position:fixed;bottom:86px;inset-inline-end:24px;z-index:65;width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;opacity:0;pointer-events:none;transition:.25s}
.to-top.show{opacity:1;pointer-events:auto}

/* reveal */
[data-reveal]{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
[data-reveal].in{opacity:1;transform:none}

/* forms */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.field{display:grid;gap:6px}
.field.full{grid-column:1/-1}
.field label{font-size:.78rem;font-weight:800;color:color-mix(in srgb,var(--ink) 80%,transparent)}
.field input,.field select,.field textarea{width:100%;min-height:48px;padding:11px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);transition:border .2s,box-shadow .2s;font-size:.9rem}
.field textarea{min-height:110px;resize:vertical}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--p);box-shadow:0 0 0 4px color-mix(in srgb,var(--p) 12%,transparent)}
.field .err{font-size:.72rem;color:#dc2626;display:none}
.field.invalid input,.field.invalid select,.field.invalid textarea{border-color:#dc2626}
.field.invalid .err{display:block}
.form-note{font-size:.72rem;color:var(--muted)}
.form-status{margin-top:12px;padding:12px 14px;border-radius:12px;font-size:.85rem;display:none}
.form-status.ok{display:block;background:#dcfce7;color:#166534}
.form-status.bad{display:block;background:#fee2e2;color:#991b1b}
.contact-wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:44px;align-items:start}
.contact-list{display:grid;gap:16px;margin-top:26px}
.contact-item{display:flex;gap:14px;align-items:flex-start}
.contact-item .ci{width:44px;height:44px;border-radius:13px;background:color-mix(in srgb,var(--p) 10%,white);color:var(--p);display:grid;place-items:center;flex:0 0 auto}
.contact-item strong{display:block;font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:2px}
.contact-item a,.contact-item span{font-size:.92rem;font-weight:700;word-break:break-word}
.contact-form{padding:30px;border-radius:22px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-sm)}

/* store */
.shop-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:26px}
.chip{padding:8px 15px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font-size:.8rem;font-weight:800;color:var(--muted);transition:.2s}
.chip.active,.chip:hover{background:var(--ink);border-color:var(--ink);color:#fff}
.search-box{position:relative;margin-inline-start:auto;min-width:230px}
.search-box input{width:100%;min-height:42px;padding:9px 38px 9px 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font-size:.82rem}
[dir="rtl"] .search-box input{padding:9px 14px 9px 38px}
.search-box .icon{position:absolute;top:50%;inset-inline-end:13px;transform:translateY(-50%);width:16px;height:16px;color:var(--muted)}
.product-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.product-card{border-radius:18px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .22s,box-shadow .22s}
.product-card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.product-thumb{position:relative;aspect-ratio:1/1;background:linear-gradient(145deg,color-mix(in srgb,var(--p) 10%,white),color-mix(in srgb,var(--p2) 16%,white));overflow:hidden}
.product-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.product-card:hover .product-thumb img{transform:scale(1.05)}
.product-thumb .ph{position:absolute;inset:0;display:grid;place-items:center;font-size:2.6rem;font-weight:900;color:color-mix(in srgb,var(--p) 55%,white)}
.product-body{padding:14px 15px 16px;display:flex;flex-direction:column;gap:5px;flex:1}
.product-body .cat{font-size:.65rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--p)}
.product-body h3{font-size:.92rem;line-height:1.45;font-weight:800}
.product-body p{font-size:.75rem;color:var(--muted);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.price-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:10px}
.price{font-weight:900;font-size:1rem;letter-spacing:-.02em}
.add-btn{width:36px;height:36px;border-radius:50%;border:none;background:var(--p);color:var(--p-ink);display:grid;place-items:center;transition:.2s}
.add-btn:hover{transform:scale(1.08);background:color-mix(in srgb,var(--p) 88%,black)}
.product-empty{grid-column:1/-1;padding:60px 20px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:18px}

/* cart + modal */
.overlay{position:fixed;inset:0;background:rgba(8,15,30,.55);backdrop-filter:blur(5px);z-index:100;opacity:0;pointer-events:none;transition:.25s}
.overlay.open{opacity:1;pointer-events:auto}
.drawer{position:fixed;top:0;bottom:0;inset-inline-end:0;width:min(420px,100%);background:var(--bg);z-index:110;box-shadow:-20px 0 60px rgba(0,0,0,.2);transform:translateX(110%);transition:transform .3s cubic-bezier(.2,.7,.2,1);display:flex;flex-direction:column}
[dir="rtl"] .drawer{transform:translateX(-110%)}
.drawer.open{transform:none}
.drawer-head{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid var(--line)}
.drawer-head h3{font-size:1.05rem}
.drawer-body{padding:18px 22px;overflow-y:auto;flex:1;display:grid;gap:14px;align-content:start}
.drawer-foot{padding:18px 22px;border-top:1px solid var(--line);display:grid;gap:12px;background:var(--surface)}
.cart-item{display:grid;grid-template-columns:58px 1fr auto;gap:12px;align-items:center}
.cart-thumb{width:58px;height:58px;border-radius:11px;overflow:hidden;background:var(--soft);display:grid;place-items:center;font-weight:900;color:var(--p)}
.cart-thumb img{width:100%;height:100%;object-fit:cover}
.cart-item h4{font-size:.82rem;line-height:1.4}
.cart-item .p{font-size:.78rem;color:var(--muted);margin-top:2px}
.qty{display:inline-flex;align-items:center;gap:10px;margin-top:6px}
.qty button{width:26px;height:26px;border-radius:7px;border:1px solid var(--line);background:var(--surface);line-height:1}
.qty span{font-size:.8rem;font-weight:800;min-width:16px;text-align:center}
.cart-remove{border:none;background:none;color:#dc2626;font-size:.72rem;font-weight:700;padding:4px}
.cart-total{display:flex;justify-content:space-between;font-weight:900;font-size:1.05rem}
.empty-cart{text-align:center;color:var(--muted);padding:40px 10px;font-size:.9rem}
.modal-wrap{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(8,15,30,.62);backdrop-filter:blur(6px)}
.modal-wrap.open{display:flex}
.modal{width:min(620px,100%);max-height:90dvh;overflow-y:auto;background:var(--bg);border-radius:22px;padding:26px;box-shadow:0 40px 90px rgba(0,0,0,.35);position:relative}
.modal-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}
.modal-head h3{font-size:1.15rem}
.modal-close{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center}
.order-lines{display:grid;gap:8px;margin:14px 0;padding:14px;border-radius:12px;background:var(--soft);font-size:.82rem}
.order-line{display:flex;justify-content:space-between;gap:12px}

/* portfolio */
.tpl-portfolio{--bg:#f7f5f0;--soft:#efece4;--surface:#fffdf9;--ink:#12100d;--muted:#6b6459;--line:#e2ddd2}
.portfolio-hero{padding:90px 0 64px}
.portfolio-hero .h1{font-size:clamp(2.8rem,7vw,6rem);line-height:.98}
.portfolio-hero .role{font-size:clamp(1rem,2vw,1.3rem);color:var(--muted);margin-top:16px;max-width:60ch}
.portfolio-meta{display:flex;gap:22px;flex-wrap:wrap;margin-top:30px;font-size:.8rem;color:var(--muted)}
.portfolio-meta strong{color:var(--ink)}
.portfolio-hero .hero-media{aspect-ratio:4/5;border-radius:8px 80px 8px 8px}
.work-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}
.work-card{position:relative;border-radius:18px;overflow:hidden;min-height:320px;background:linear-gradient(150deg,color-mix(in srgb,var(--p) 22%,white),var(--p2));display:flex;align-items:flex-end;padding:26px;color:#fff;isolation:isolate}
.work-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;transition:transform .5s}
.work-card::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 25%,rgba(8,10,20,.82));z-index:-1}
.work-card:hover img{transform:scale(1.05)}
.work-card .num{position:absolute;top:18px;inset-inline-start:20px;font-size:.7rem;font-weight:900;letter-spacing:.12em;opacity:.8}
.work-card h3{font-size:1.15rem}
.work-card p{font-size:.8rem;opacity:.8;margin-top:4px}
.work-card .go{position:absolute;top:16px;inset-inline-end:18px;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);display:grid;place-items:center;backdrop-filter:blur(6px)}
.skill{display:inline-flex;padding:9px 14px;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:.8rem;font-weight:700}
.skills{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
.portrait-card{border-radius:26px;overflow:hidden;background:var(--surface);border:1px solid var(--line);padding:18px}
.portrait-card .ph{aspect-ratio:1/1.1;border-radius:18px;background:linear-gradient(150deg,color-mix(in srgb,var(--p) 20%,white),var(--p2));display:grid;place-items:center;color:rgba(255,255,255,.6);font-size:4rem;font-weight:900;overflow:hidden}
.portrait-card .ph img{width:100%;height:100%;object-fit:cover}

/* digital card */
.tpl-card{--bg:#0c0a12;--surface:#15121d;--ink:#f8fafc;--muted:#a1a1b5;--line:#2a2537;--soft:#1d1828}
.tpl-card .site-header{background:transparent;border:none;position:absolute;top:0;inset-inline:0;color:#fff}
.tpl-card .site-footer{background:transparent;border:none;padding:0}
.tpl-card .footer-grid,.tpl-card .footer-bottom{display:none}
.vcard-page{min-height:100dvh;display:grid;place-items:center;padding:40px 18px;position:relative;overflow:hidden}
.vcard-page::before{content:"";position:absolute;width:720px;height:720px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--p) 34%,transparent),transparent 65%);top:-320px;filter:blur(20px)}
.vcard-page::after{content:"";position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--p2) 38%,transparent),transparent 65%);bottom:-340px;inset-inline-end:-140px;filter:blur(20px)}
.vcard{position:relative;z-index:1;width:min(440px,100%);background:color-mix(in srgb,var(--surface) 88%,transparent);border:1px solid var(--line);border-radius:30px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.55);backdrop-filter:blur(18px)}
.vcard-cover{height:132px;background:linear-gradient(120deg,var(--p),var(--p2));position:relative;overflow:hidden}
.vcard-cover::after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;border:36px solid rgba(255,255,255,.1);top:-110px;inset-inline-end:-70px}
.vcard-logo{width:104px;height:104px;border-radius:28px;object-fit:cover;border:5px solid var(--surface);background:var(--surface);margin:-52px auto 0;display:grid;place-items:center;font-size:2rem;font-weight:900;color:var(--p);position:relative;z-index:2;overflow:hidden}
.vcard-logo img{width:100%;height:100%;object-fit:cover}
.vcard-body{padding:18px 28px 30px;text-align:center}
.vcard-body h1{font-size:1.5rem;line-height:1.2}
.vcard-body .role{color:var(--p);font-weight:800;font-size:.82rem;margin-top:6px}
.vcard-body .bio{color:var(--muted);font-size:.85rem;line-height:1.75;margin-top:14px}
.quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}
.quick-actions .btn{min-height:46px;font-size:.82rem}
.quick-actions .wide{grid-column:1/-1}
.vcard-info{display:grid;gap:10px;margin-top:22px;text-align:start;border-top:1px solid var(--line);padding-top:20px}
.vcard-info a,.vcard-info span{display:flex;align-items:center;gap:11px;font-size:.82rem;color:var(--muted)}
.vcard-info .icon{color:var(--p);width:18px;height:18px}
.vcard-socials{display:flex;justify-content:center;gap:9px;margin-top:20px}
.vcard-socials a{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;color:var(--muted)}
.vcard-socials a:hover{background:var(--p);color:#fff;border-color:var(--p)}
.powered{position:relative;z-index:1;text-align:center;color:#6b6880;font-size:.68rem;margin-top:18px}

/* restaurant */
.tpl-restaurant{--bg:#fffaf3;--soft:#fdf1e3;--surface:#fff;--ink:#2a1c12;--muted:#7c6a5a;--line:#eee0cf}
.rest-hero{position:relative;min-height:620px;display:flex;align-items:center;color:#fff;padding:80px 0;overflow:hidden}
.rest-hero .bg{position:absolute;inset:0;background:linear-gradient(120deg,#2a1608,#7a3d12);z-index:-2}
.rest-hero .bg img{width:100%;height:100%;object-fit:cover;opacity:.42}
.rest-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,10,4,.88),rgba(20,10,4,.38));z-index:-1}
[dir="ltr"] .rest-hero::after{background:linear-gradient(90deg,rgba(20,10,4,.88),rgba(20,10,4,.38))}
.rest-hero .h1{max-width:14ch}
.rest-hero .lead{color:rgba(255,255,255,.8)}
.rest-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.1);backdrop-filter:blur(8px);padding:8px 14px;border-radius:999px;font-size:.78rem;font-weight:700}
.menu-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:26px;scrollbar-width:none}
.menu-tabs::-webkit-scrollbar{display:none}
.menu-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.menu-item{display:grid;grid-template-columns:1fr 92px;gap:16px;padding:18px;border-radius:16px;background:var(--surface);border:1px solid var(--line);align-items:center}
.menu-item h3{font-size:1rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.menu-item p{font-size:.8rem;color:var(--muted);margin-top:5px;line-height:1.65}
.menu-item .price{color:var(--p);font-weight:900;font-size:.95rem;margin-top:8px;display:block}
.menu-thumb{width:92px;height:92px;border-radius:13px;overflow:hidden;background:linear-gradient(145deg,var(--soft),color-mix(in srgb,var(--p) 16%,white));display:grid;place-items:center;font-weight:900;color:var(--p);font-size:1.4rem}
.menu-thumb img{width:100%;height:100%;object-fit:cover}
.hours-card{padding:30px;border-radius:20px;background:var(--surface);border:1px solid var(--line)}
.hours-row{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px dashed var(--line);font-size:.86rem}
.hours-row:last-child{border:none}
.hours-row span:last-child{font-weight:800}
.reserve-card{padding:32px;border-radius:22px;background:var(--ink);color:#fff}
.reserve-card .field label{color:rgba(255,255,255,.7)}
.reserve-card .field input,.reserve-card .field select,.reserve-card textarea{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.16);color:#fff}
.reserve-card .field input::placeholder,.reserve-card textarea::placeholder{color:rgba(255,255,255,.35)}

/* landing */
.tpl-landing{--bg:#fffdf9;--soft:#fff4ea;--surface:#fff}
.landing-hero{padding:76px 0 54px;text-align:center;position:relative;overflow:hidden}
.landing-hero::before{content:"";position:absolute;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--p) 14%,transparent),transparent 65%);top:-420px;left:50%;transform:translateX(-50%);pointer-events:none}
.landing-hero .h1{max-width:900px;margin-inline:auto}
.landing-hero .lead{margin:20px auto 0;max-width:640px}
.landing-hero .hero-actions{justify-content:center}
.landing-preview{max-width:940px;margin:46px auto 0;border-radius:22px;overflow:hidden;border:1px solid var(--line);box-shadow:0 40px 100px -30px rgba(15,23,42,.35);background:var(--surface);position:relative}
.landing-preview img{width:100%;aspect-ratio:16/9;object-fit:cover}
.landing-preview .browser{height:34px;display:flex;align-items:center;gap:6px;padding:0 13px;border-bottom:1px solid var(--line);background:var(--soft)}
.landing-preview .browser i{width:8px;height:8px;border-radius:50%;background:var(--line);display:block}
.landing-preview .browser i:first-child{background:#f87171}
.benefit{display:flex;gap:14px;align-items:flex-start;padding:22px;border-radius:16px;background:var(--surface);border:1px solid var(--line)}
.benefit .b-icon{width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--p) 11%,white);color:var(--p);display:grid;place-items:center;flex:0 0 auto}
.benefit h3{font-size:.98rem;margin-bottom:4px}
.benefit p{font-size:.82rem;color:var(--muted);line-height:1.7}
.offer-card{border-radius:26px;padding:40px;background:linear-gradient(145deg,var(--ink),#1a1520);color:#fff;position:relative;overflow:hidden;max-width:720px;margin-inline:auto;text-align:center}
.offer-card::before{content:"";position:absolute;width:320px;height:320px;border-radius:50%;background:color-mix(in srgb,var(--p) 40%,transparent);filter:blur(80px);top:-150px;inset-inline-end:-80px}
.offer-card .price{font-size:3rem;font-weight:900;letter-spacing:-.04em;margin:18px 0 4px}
.offer-card .price small{font-size:1rem;font-weight:700;color:rgba(255,255,255,.55)}
.offer-list{display:grid;gap:10px;text-align:start;margin:24px 0;font-size:.85rem;color:rgba(255,255,255,.8)}
.offer-list li{display:flex;gap:9px;align-items:flex-start}
.offer-list .icon{color:#4ade80;margin-top:3px;width:16px;height:16px}
.faq-item{border-bottom:1px solid var(--line);padding:18px 0}
.faq-q{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;border:none;background:none;text-align:start;font-weight:800;font-size:.95rem;padding:0}
.faq-q .icon{transition:transform .25s;color:var(--p)}
.faq-item.open .faq-q .icon{transform:rotate(45deg)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease;color:var(--muted);font-size:.86rem;line-height:1.8}
.faq-item.open .faq-a{max-height:260px;padding-top:10px}

/* lightbox */
.lightbox{position:fixed;inset:0;z-index:130;background:rgba(5,8,16,.9);display:none;align-items:center;justify-content:center;padding:20px}
.lightbox.open{display:flex}
.lightbox img{max-width:min(1000px,100%);max-height:86dvh;border-radius:12px}
.lightbox .close{position:absolute;top:20px;inset-inline-end:20px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;display:grid;place-items:center}

/* preview watermark */
.preview-banner{position:fixed;top:0;inset-inline:0;z-index:200;background:#111827;color:#fbbf24;text-align:center;padding:8px 14px;font-size:.75rem;font-weight:800;letter-spacing:.03em;box-shadow:0 6px 20px rgba(0,0,0,.25)}
body.has-preview{padding-top:36px}
body.has-preview .site-header{top:36px}

/* company hero variant */
.company-hero{background:linear-gradient(125deg,#0b1220 0%,#132a44 58%,var(--p2) 130%);color:#fff;overflow:hidden}
.company-hero::before{background:color-mix(in srgb,var(--p) 32%,transparent);opacity:.4}
.company-hero .lead{color:rgba(255,255,255,.72)}
.company-hero .badge{background:rgba(255,255,255,.1);color:#fff}
.company-hero .btn-ghost{color:#fff;border-color:rgba(255,255,255,.28)}
.company-hero .hero-stats{border-color:rgba(255,255,255,.16)}
.company-hero .hero-stats .lbl{color:rgba(255,255,255,.6)}
.company-hero .hero-media{box-shadow:0 40px 90px -30px rgba(0,0,0,.65)}

/* digital card header override */
.tpl-card .site-header{position:fixed;inset-inline:0;top:0;background:transparent;border:0;backdrop-filter:none;box-shadow:none}
.tpl-card .header-inner{min-height:64px;justify-content:flex-end}
.tpl-card .site-header .brand,.tpl-card .site-header .nav,.tpl-card .site-header .menu-toggle{display:none}
.tpl-card .header-actions .btn{display:none}
.tpl-card .lang-switch{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14)}
.tpl-card .lang-switch a,.tpl-card .lang-switch span{color:#cbd5e1}
.tpl-card .lang-switch .active{background:#fff;color:#0b1220}
.tpl-card .wa-float{bottom:24px}
.about-media.no-img{background:linear-gradient(145deg,color-mix(in srgb,var(--p) 22%,white),var(--p2))}
.about-media.no-img::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.22),transparent 55%)}

/* toast */
.toast{position:fixed;bottom:26px;left:50%;z-index:220;transform:translate(-50%,18px);opacity:0;pointer-events:none;background:#0b1220;color:#fff;padding:12px 20px;border-radius:999px;font-size:.82rem;font-weight:700;box-shadow:0 18px 50px rgba(0,0,0,.35);transition:.25s;max-width:calc(100% - 32px);text-align:center}
.toast.show{opacity:1;transform:translate(-50%,0)}
.toast.bad{background:#b91c1c}

/* utilities */
.mt-0{margin-top:0}.mt-1{margin-top:8px}.mt-2{margin-top:16px}.mt-3{margin-top:24px}.mt-4{margin-top:34px}.mt-5{margin-top:48px}
.hide{display:none!important}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.skip-link{position:fixed;top:8px;inset-inline-start:8px;z-index:300;background:var(--p);color:var(--p-ink);padding:10px 16px;border-radius:8px;transform:translateY(-150%);font-weight:800}
.skip-link:focus{transform:none}

@media (max-width:1020px){
  .nav{display:none}
  .menu-toggle{display:grid}
  .header-actions .btn{display:none}
  .hero-grid,.about-grid,.contact-wrap{grid-template-columns:1fr;gap:34px}
  .hero-media{aspect-ratio:16/11;max-height:460px}
  .g4,.product-grid{grid-template-columns:repeat(3,1fr)}
  .footer-grid{grid-template-columns:1fr 1fr}
  .steps{grid-template-columns:repeat(2,1fr)}
  .work-grid{grid-template-columns:1fr}
  .menu-grid{grid-template-columns:1fr}
}
@media (max-width:720px){
  .container{width:min(100% - 28px,1180px)}
  .header-inner{gap:8px}
  .site-header .brand{min-width:0;gap:8px}
  .site-header .brand > span{min-width:0}
  .site-header .brand-name{display:block;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .site-header .brand small{display:none}
  .header-actions{gap:6px}
  .lang-switch a,.lang-switch span{padding:4px 5px}
  .section{padding:62px 0}
  .g2,.g3,.g4,.product-grid,.form-grid,.stats-grid{grid-template-columns:1fr 1fr}
  .product-grid{gap:12px}
  .hero{padding:42px 0 36px}
  .hero-actions .btn{flex:1 1 auto}
  .cta-band{padding:36px 24px;flex-direction:column;text-align:center;align-items:stretch}
  .cta-band .btn{width:100%}
  .section-head{flex-direction:column;align-items:flex-start;margin-bottom:30px}
  .footer-grid{grid-template-columns:1fr;gap:30px}
  .search-box{margin-inline-start:0;width:100%}
  .drawer{width:100%}
  .modal{padding:20px}
  .quick-actions{grid-template-columns:1fr}
  .menu-item{grid-template-columns:1fr 76px}
  .menu-thumb{width:76px;height:76px}
  .search-box{min-width:0}
  .trust-strip .container{justify-content:flex-start}
  .hero-stats{gap:20px}
  .product-body h3{font-size:.85rem}
}
@media (max-width:460px){
  .g2,.g3,.g4,.product-grid,.form-grid,.stats-grid{grid-template-columns:1fr}
  .product-grid{grid-template-columns:1fr 1fr}
  .product-body{padding:11px}
  .price{font-size:.9rem}
  .brand span.brand-name{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .hero-media{aspect-ratio:4/3}
  .h1{font-size:2.1rem}
  .vcard-body{padding-inline:20px}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
  [data-reveal]{opacity:1;transform:none}
}
`;
