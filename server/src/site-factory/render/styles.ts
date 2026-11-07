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
.bg-ink{background:var(--solid);color:var(--solid-ink)}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--p-text)}
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
.btn-dark{background:var(--solid);color:var(--solid-ink)}
.btn-light{background:var(--surface);color:var(--ink);border-color:var(--line)}
.btn-ghost{background:transparent;border-color:color-mix(in srgb,var(--ink) 18%,transparent);color:var(--ink)}
.btn-wa{background:#25d366;color:#053d22}
.btn-sm{min-height:40px;padding:8px 16px;font-size:.85rem}
.btn-block{width:100%}
.icon{width:20px;height:20px;flex:0 0 auto;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.badge{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;background:var(--tint);color:var(--p-text);font-size:.78rem;font-weight:800}
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
.nav a:hover{background:color-mix(in srgb,var(--p) 8%,transparent);color:var(--p-text)}
.header-actions{display:flex;align-items:center;gap:8px;margin-inline-start:6px}
.lang-switch{display:flex;align-items:center;padding:3px;border:1px solid var(--line);border-radius:999px;background:var(--surface)}
.lang-switch a,.lang-switch span{font-size:.68rem;font-weight:800;padding:4px 7px;border-radius:999px;color:var(--muted);line-height:1}
.lang-switch .active{background:var(--solid);color:var(--solid-ink)}
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
.hero-media.no-img::after{content:attr(data-mark);position:absolute;inset:0;display:grid;place-items:center;font-size:5rem;font-weight:900;color:rgba(255,255,255,.18);letter-spacing:.1em}
.float-card{position:absolute;bottom:20px;inset-inline-start:20px;background:var(--glass);backdrop-filter:blur(12px);border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:11px;box-shadow:0 20px 40px -20px rgba(0,0,0,.4);color:var(--glass-ink)}
.float-card strong{display:block;font-size:.85rem;line-height:1.2}
.float-card span{font-size:.72rem;color:#64748b}
.float-icon{width:38px;height:38px;border-radius:11px;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center}
.hero-orb{position:absolute;border-radius:50%;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);pointer-events:none}

/* strip / logos / trust */
.trust-strip{border-block:1px solid var(--line);background:var(--surface)}
.trust-strip .container{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:10px;font-size:.85rem;font-weight:700;color:var(--muted)}
.trust-item .icon{color:var(--p-text)}
.feature{display:flex;gap:15px;align-items:flex-start;padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--line)}
.feature .f-icon{width:46px;height:46px;border-radius:13px;background:var(--tint);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto}
.feature h3{font-size:1rem;margin-bottom:4px}
.feature p{font-size:.85rem;color:var(--muted);line-height:1.65}

/* about */
.about-grid{display:grid;grid-template-columns:.95fr 1.05fr;gap:52px;align-items:center}
.about-media{position:relative;border-radius:26px;overflow:hidden;aspect-ratio:4/3.4;background:linear-gradient(150deg,var(--tint-2),var(--p2))}
.about-media img{width:100%;height:100%;object-fit:cover}
.about-media::after{content:"";position:absolute;inset:auto 0 0 0;height:45%;background:linear-gradient(transparent,rgba(0,0,0,.35))}
.about-badge{position:absolute;bottom:20px;inset-inline-start:20px;z-index:2;padding:12px 16px;border-radius:14px;background:var(--glass);color:var(--glass-ink);font-weight:800;font-size:.85rem;display:flex;align-items:center;gap:8px}
.checklist{display:grid;gap:12px;margin-top:24px}
.checklist li{display:flex;align-items:flex-start;gap:11px;font-size:.92rem;color:var(--muted)}
.checklist .tick{width:22px;height:22px;border-radius:50%;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto;margin-top:2px}

/* services */
.service-card{padding:30px 26px;border-radius:var(--radius);background:var(--surface);border:1px solid var(--line);position:relative;overflow:hidden;transition:transform .25s,box-shadow .25s}
.service-card::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--p),var(--p2));transform:scaleX(0);transform-origin:inline-start;transition:transform .3s}
.service-card:hover{transform:translateY(-5px);box-shadow:var(--shadow)}
.service-card:hover::before{transform:scaleX(1)}
.service-num{font-size:.72rem;font-weight:900;letter-spacing:.14em;color:var(--p-text);margin-bottom:16px}
.service-icon{width:54px;height:54px;border-radius:15px;display:grid;place-items:center;background:var(--tint);color:var(--p-text);margin-bottom:18px}
.service-card h3{margin-bottom:8px}
.service-card p{color:var(--muted);font-size:.9rem;line-height:1.75}

/* process */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;counter-reset:step}
.step{position:relative;padding:26px 20px;border-radius:18px;background:var(--surface);border:1px solid var(--line)}
.step .n{width:38px;height:38px;border-radius:50%;background:var(--solid);color:var(--solid-ink);display:grid;place-items:center;font-weight:900;font-size:.85rem;margin-bottom:16px}
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
.quote .avatar{width:38px;height:38px;border-radius:50%;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center;font-weight:900;font-size:.8rem}
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
.f-contact .icon{color:var(--p-text);margin-top:3px;width:17px;height:17px}
.socials{display:flex;gap:8px;margin-top:18px}
.socials a{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);color:#e2e8f0;transition:.2s}
.socials a:hover{background:var(--p);border-color:var(--p-text);color:var(--p-ink)}
.footer-bottom{border-top:1px solid rgba(255,255,255,.08);padding:18px 0;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:.75rem;color:#94a3b8}

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
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--p-text);box-shadow:0 0 0 4px color-mix(in srgb,var(--p) 12%,transparent)}
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
.contact-item .ci{width:44px;height:44px;border-radius:13px;background:var(--tint);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto}
.contact-item strong{display:block;font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:2px}
.contact-item a,.contact-item span{font-size:.92rem;font-weight:700;word-break:break-word}
.contact-form{padding:30px;border-radius:22px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-sm)}

/* store */
.shop-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:26px}
.chip{padding:8px 15px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font-size:.8rem;font-weight:800;color:var(--muted);transition:.2s}
.chip.active,.chip:hover{background:var(--solid);border-color:var(--solid);color:var(--solid-ink)}
.search-box{position:relative;margin-inline-start:auto;min-width:230px}
.search-box input{width:100%;min-height:42px;padding:9px 38px 9px 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font-size:.82rem}
[dir="rtl"] .search-box input{padding:9px 14px 9px 38px}
.search-box .icon{position:absolute;top:50%;inset-inline-end:13px;transform:translateY(-50%);width:16px;height:16px;color:var(--muted)}
.product-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.product-card{border-radius:18px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .22s,box-shadow .22s}
.product-card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.product-thumb{position:relative;aspect-ratio:1/1;background:linear-gradient(145deg,var(--tint),var(--tint-2));overflow:hidden}
.product-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.product-card:hover .product-thumb img{transform:scale(1.05)}
.product-thumb .ph{position:absolute;inset:0;display:grid;place-items:center;font-size:2.6rem;font-weight:900;color:var(--tint-ink)}
.product-body{padding:14px 15px 16px;display:flex;flex-direction:column;gap:5px;flex:1}
.product-body .cat{font-size:.65rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--p-text)}
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
.cart-thumb{width:58px;height:58px;border-radius:11px;overflow:hidden;background:var(--soft);display:grid;place-items:center;font-weight:900;color:var(--p-text)}
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
.work-card{position:relative;border-radius:18px;overflow:hidden;min-height:320px;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:flex;align-items:flex-end;padding:26px;color:#fff;isolation:isolate}
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
.portrait-card .ph{aspect-ratio:1/1.1;border-radius:18px;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:grid;place-items:center;color:rgba(255,255,255,.6);font-size:4rem;font-weight:900;overflow:hidden}
.portrait-card .ph img{width:100%;height:100%;object-fit:cover}

/* digital card */
.tpl-card{--bg:#0c0a12;--surface:#15121d;--ink:#f8fafc;--muted:#a1a1b5;--line:#2a2537;--soft:#1d1828}
.tpl-card .site-header{background:transparent;border:none;position:absolute;top:0;inset-inline:0;color:#fff}
.tpl-card .site-footer{background:transparent;border:none;padding:0}
.tpl-card .footer-grid,.tpl-card .footer-bottom{display:none}
.vcard-page{min-height:100dvh;display:grid;place-items:center;padding:40px 18px;position:relative;overflow:hidden}
.vcard-page>div{width:min(440px,100%)}
.vcard-page::before{content:"";position:absolute;width:720px;height:720px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--p) 34%,transparent),transparent 65%);top:-320px;filter:blur(20px)}
.vcard-page::after{content:"";position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--p2) 38%,transparent),transparent 65%);bottom:-340px;inset-inline-end:-140px;filter:blur(20px)}
.vcard{position:relative;z-index:1;width:min(440px,100%);background:color-mix(in srgb,var(--surface) 88%,transparent);border:1px solid var(--line);border-radius:30px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.55);backdrop-filter:blur(18px)}
.vcard-cover{height:132px;background:linear-gradient(120deg,var(--p),var(--p2));position:relative;overflow:hidden}
.vcard-cover::after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;border:36px solid rgba(255,255,255,.1);top:-110px;inset-inline-end:-70px}
.vcard-logo{width:104px;height:104px;border-radius:28px;object-fit:cover;border:5px solid var(--surface);background:var(--surface);margin:-52px auto 0;display:grid;place-items:center;font-size:2rem;font-weight:900;color:var(--p-text);position:relative;z-index:2;overflow:hidden}
.vcard-logo img{width:100%;height:100%;object-fit:cover}
.vcard-body{padding:18px 28px 30px;text-align:center}
.vcard-body h1{font-size:1.5rem;line-height:1.2}
.vcard-body .role{color:var(--p-text);font-weight:800;font-size:.82rem;margin-top:6px}
.vcard-body .bio{color:var(--muted);font-size:.85rem;line-height:1.75;margin-top:14px}
.quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}
.quick-actions .btn{min-height:46px;font-size:.82rem}
.quick-actions .wide{grid-column:1/-1}
.vcard-info{display:grid;gap:10px;margin-top:22px;text-align:start;border-top:1px solid var(--line);padding-top:20px}
.vcard-info a,.vcard-info span{display:flex;align-items:center;gap:11px;font-size:.82rem;color:var(--muted)}
.vcard-info .icon{color:var(--p-text);width:18px;height:18px}
.vcard-socials{display:flex;justify-content:center;gap:9px;margin-top:20px}
.vcard-socials a{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;color:var(--muted)}
.vcard-socials a:hover{background:var(--p);color:#fff;border-color:var(--p-text)}
.vcard-lang{position:relative;z-index:1;display:flex;justify-content:center;margin-top:18px}
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
.menu-item .price{color:var(--p-text);font-weight:900;font-size:.95rem;margin-top:8px;display:block}
.menu-thumb{width:92px;height:92px;border-radius:13px;overflow:hidden;background:linear-gradient(145deg,var(--soft),var(--tint-2));display:grid;place-items:center;font-weight:900;color:var(--p-text);font-size:1.4rem}
.menu-thumb img{width:100%;height:100%;object-fit:cover}
.hours-card{padding:30px;border-radius:20px;background:var(--surface);border:1px solid var(--line)}
.hours-row{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px dashed var(--line);font-size:.86rem}
.hours-row:last-child{border:none}
.hours-row span:last-child{font-weight:800}
.reserve-card{padding:32px;border-radius:22px;background:var(--solid);color:var(--solid-ink)}
.reserve-card .field label{color:rgba(255,255,255,.7)}
.reserve-card .field input,.reserve-card .field select,.reserve-card textarea{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.16);color:#fff}
.reserve-card .field input::placeholder,.reserve-card textarea::placeholder{color:rgba(255,255,255,.35)}

/* landing */
.tpl-landing{--bg:#fffdf9;--soft:#fff4ea;--surface:#fff}
/* Extended template themes */
.tpl-medical{--bg:#f6fbff;--soft:#e8f4fd;--surface:#fff;--line:#d8eaf7}
.tpl-pharmacy{--bg:#f6fdf8;--soft:#e6f8ec;--surface:#fff;--line:#d5f0de}
.tpl-lawyer{--bg:#f7f8fa;--soft:#eceef2;--surface:#fff;--line:#dfe3ea}
.tpl-realestate{--bg:#f6fbfa;--soft:#e4f4f1;--surface:#fff;--line:#d2eae5}
.tpl-education{--bg:#f6f9ff;--soft:#e8efff;--surface:#fff;--line:#d8e3f8}
.tpl-fitness{--bg:#0f0f13;--surface:#18181f;--ink:#f8fafc;--muted:#a1a1b5;--line:#2a2a35;--soft:#1d1d26}
.tpl-beauty{--bg:#fff9fc;--soft:#fdeaf3;--surface:#fff;--line:#f7dbe8}
.tpl-photography{--bg:#0c0a12;--surface:#15121d;--ink:#f8fafc;--muted:#a1a1b5;--line:#2a2537;--soft:#1d1828}
.tpl-wedding{--bg:#fff9fe;--soft:#fbeaff;--surface:#fff;--line:#f3d9fb}
.tpl-travel{--bg:#f5fcff;--soft:#e2f6fd;--surface:#fff;--line:#cfedf7}
.tpl-construction{--bg:#fffbf5;--soft:#fdf1e0;--surface:#fff;--line:#f2e2c9}
.tpl-agriculture{--bg:#f8fdf3;--soft:#ecf7df;--surface:#fff;--line:#dcefc7}
.tpl-electronics{--bg:#f6f9ff;--soft:#e6efff;--surface:#fff;--line:#d6e3fb}
.tpl-fashion{--bg:#fff8fa;--soft:#fde8ee;--surface:#fff;--line:#f7d7e0}
.tpl-bakery{--bg:#fffaf4;--soft:#fdf0e0;--surface:#fff;--line:#f0e0c9}
.tpl-carrental{--bg:#f7f8fa;--soft:#e9ebef;--surface:#fff;--line:#dde0e6;--muted:#52606f}
.tpl-nonprofit{--bg:#f6fdf9;--soft:#e4f8ee;--surface:#fff;--line:#d2efdf}
.tpl-events{--bg:#fbf8ff;--soft:#f2eaff;--surface:#fff;--line:#e6d8fb}
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
.benefit .b-icon{width:44px;height:44px;border-radius:12px;background:var(--tint);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto}
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
.faq-q .icon{transition:transform .25s;color:var(--p-text)}
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
.about-media.no-img{background:linear-gradient(145deg,var(--tint-2),var(--p2))}
.about-media.no-img::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.22),transparent 55%)}

/* car rental */
.rental-hero .hero-media{aspect-ratio:4/3.2}
.rental-hero .hero-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(8,12,22,.55));pointer-events:none}
.rental-hero .float-card{background:var(--glass);color:var(--glass-ink)}
.fleet-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.fleet-card{border-radius:20px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.fleet-card:hover{transform:translateY(-6px);box-shadow:0 34px 70px -34px rgba(0,0,0,.35);border-color:color-mix(in srgb,var(--p) 35%,var(--line))}
.fleet-media{position:relative;aspect-ratio:16/11;overflow:hidden;background:linear-gradient(145deg,var(--tint),var(--tint-2))}
.fleet-media img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.fleet-card:hover .fleet-media img{transform:scale(1.06)}
.fleet-badge{position:absolute;top:14px;inset-inline-start:14px;padding:6px 12px;border-radius:999px;background:var(--solid);color:var(--solid-ink);font-size:.66rem;font-weight:900;letter-spacing:.02em;box-shadow:0 8px 20px -8px rgba(0,0,0,.4)}
.fleet-badge.popular{background:var(--p);color:#fff}
.fleet-badge.new{background:#16a34a;color:#fff}
.fleet-badge.deal{background:#f59e0b;color:#1a1206}
.fleet-body{padding:20px;display:flex;flex-direction:column;gap:11px;flex:1}
.fleet-body .cat{font-size:.65rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--p-text)}
.fleet-body h3{font-size:1.1rem;line-height:1.35}
.fleet-desc{font-size:.78rem;color:var(--muted);line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fleet-specs{display:flex;flex-wrap:wrap;gap:6px}
.spec{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:8px;background:var(--soft);border:1px solid var(--line);font-size:.7rem;color:var(--muted);white-space:nowrap}
.spec .icon{width:14px;height:14px;color:var(--p-text);flex:0 0 auto}
.fleet-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding-top:13px;border-top:1px solid var(--line)}
.fleet-price{font-weight:900;color:var(--ink);font-size:1.12rem;line-height:1.1;white-space:nowrap}
.fleet-price small{display:block;font-size:.66rem;font-weight:600;color:var(--muted);margin-top:2px}
.fleet-book{padding:10px 15px;font-size:.78rem;flex:0 0 auto}
.rental-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.rental-step{position:relative;padding:26px 22px;border-radius:18px;background:var(--surface);border:1px solid var(--line);overflow:hidden}
.rental-step::before{content:"";position:absolute;inset-inline-start:0;top:0;width:3px;height:100%;background:linear-gradient(var(--p),var(--p2));opacity:.75}
.rental-step .s-ic{width:46px;height:46px;border-radius:14px;background:var(--tint);color:var(--p-text);display:grid;place-items:center;margin-bottom:16px}
.rental-step .s-ic .icon{width:22px;height:22px}
.rental-step h3{font-size:.98rem}
.rental-step p{font-size:.78rem;color:var(--muted);line-height:1.7;margin-top:6px}
.rental-step .n{position:absolute;top:16px;inset-inline-end:18px;font-size:.8rem;font-weight:900;color:var(--line)}
.feature-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
.feature{display:flex;gap:14px;align-items:flex-start;padding:22px;border-radius:16px;background:var(--surface);border:1px solid var(--line)}
.feature .f-ic{width:46px;height:46px;border-radius:13px;background:var(--tint);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto}
.feature h3{font-size:.95rem}
.feature p{font-size:.78rem;color:var(--muted);line-height:1.65;margin-top:4px}
.booking-wrap{display:grid;grid-template-columns:.85fr 1.15fr;gap:36px;align-items:start}
.booking-copy .checklist{margin-top:20px}
.booking-card{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:30px;box-shadow:var(--shadow-sm)}
.booking-card h3{font-size:1.15rem}
.booking-sub{font-size:.8rem;color:var(--muted);line-height:1.7;margin:6px 0 18px}
.rental-summary{display:grid;gap:8px;margin-top:18px;padding:16px 18px;border-radius:14px;background:var(--soft);border:1px solid var(--line);font-size:.82rem}
.rental-summary>div{display:flex;align-items:center;justify-content:space-between;gap:12px}
.rental-summary span{color:var(--muted);white-space:nowrap}
.rental-summary strong{font-weight:800;color:var(--ink);text-align:end}
.rental-summary .grand{padding-top:9px;border-top:1px dashed var(--line);font-size:1rem}
.rental-summary .grand strong{color:var(--p-text);font-size:1.15rem}
.appt-summary .grand strong{font-size:.98rem}
.faq-list{display:grid;gap:10px;max-width:840px;margin-inline:auto}
.faq{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:0 20px;transition:border-color .2s}
.faq[open]{border-color:color-mix(in srgb,var(--p) 45%,var(--line))}
.faq summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 0;font-weight:800;font-size:.92rem}
.faq summary::-webkit-details-marker{display:none}
.faq summary::marker{content:""}
.faq .faq-ic{width:30px;height:30px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;flex:0 0 auto;color:var(--p-text);transition:transform .25s,background .25s}
.faq .faq-ic .icon{width:15px;height:15px}
.faq[open] .faq-ic{transform:rotate(45deg);background:var(--tint)}
.faq p{padding:0 0 18px;color:var(--muted);font-size:.84rem;line-height:1.8}

/* medical */
.medical-hero{background:linear-gradient(165deg,var(--soft) 0%,var(--bg) 48%,color-mix(in srgb,var(--p) 12%,var(--bg)) 100%)}
.medical-hero::after{content:"";position:absolute;width:420px;height:420px;border-radius:50%;border:48px solid color-mix(in srgb,var(--p) 7%,transparent);bottom:-260px;inset-inline-start:-160px;pointer-events:none}
.medical-hero .hero-media{aspect-ratio:4/4.7;border-radius:34px}
.medical-hero .hero-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(5,20,40,.38));pointer-events:none}
.medical-hero .float-card{background:var(--glass);color:var(--glass-ink)}
.ecg-card{display:flex;align-items:center;gap:12px;max-width:440px;margin-top:26px;padding:11px 15px;border-radius:14px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-sm)}
.ecg-label{display:inline-flex;align-items:center;gap:7px;flex:0 1 auto;min-width:0;font-size:.7rem;font-weight:800;color:var(--p-text);line-height:1.35}
.ecg-label .icon{width:16px;height:16px;animation:aos-beat 1.6s ease-in-out infinite}
.ecg-line{flex:1 1 90px;min-width:60px;height:32px}
.ecg-line path{fill:none;stroke:var(--p);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.ecg-line .ecg-base{opacity:.2;stroke-dasharray:none;stroke-dashoffset:0}
.ecg-line .ecg-pulse{stroke-dasharray:100;stroke-dashoffset:100;animation:aos-ecg 3.2s linear infinite}
@keyframes aos-ecg{0%{stroke-dashoffset:100}55%{stroke-dashoffset:0}100%{stroke-dashoffset:-100}}
@keyframes aos-beat{0%,100%{transform:scale(1)}18%{transform:scale(1.22)}32%{transform:scale(1)}46%{transform:scale(1.14)}60%{transform:scale(1)}}
.specialty-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.specialty-card{position:relative;padding:28px 24px;border-radius:20px;background:var(--surface);border:1px solid var(--line);overflow:hidden;transition:transform .25s,box-shadow .25s,border-color .25s}
.specialty-card::after{content:"";position:absolute;width:130px;height:130px;border-radius:50%;background:var(--tint);top:-64px;inset-inline-end:-56px;pointer-events:none;transition:transform .35s}
.specialty-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.specialty-card:hover::after{transform:scale(1.18)}
.specialty-icon{position:relative;z-index:1;width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:var(--tint-2);color:var(--p-text);margin-bottom:18px}
.specialty-icon .icon{width:25px;height:25px}
.specialty-num{position:absolute;top:20px;inset-inline-end:22px;font-size:.72rem;font-weight:900;letter-spacing:.12em;color:color-mix(in srgb,var(--p) 45%,var(--muted))}
.specialty-card h3{font-size:1.05rem;margin-bottom:6px}
.specialty-card p{font-size:.82rem;color:var(--muted);line-height:1.7}
.med-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.med-service{border-radius:20px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.med-service:hover{transform:translateY(-5px);box-shadow:0 32px 65px -34px color-mix(in srgb,var(--p) 45%,transparent);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.med-service-media{position:relative;aspect-ratio:16/10;overflow:hidden;background:linear-gradient(145deg,var(--tint),var(--tint-2))}
.med-service-media img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.med-service:hover .med-service-media img{transform:scale(1.06)}
.med-tag{position:absolute;top:12px;inset-inline-start:12px;padding:5px 11px;border-radius:999px;background:var(--glass);color:var(--glass-ink);font-size:.65rem;font-weight:900;letter-spacing:.02em;backdrop-filter:blur(8px)}
.med-service-body{padding:18px 19px 20px;display:flex;flex-direction:column;gap:7px;flex:1}
.med-service-body h3{font-size:1.02rem;line-height:1.35}
.med-service-body p{font-size:.79rem;color:var(--muted);line-height:1.65}
.med-service-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:auto;padding-top:14px;border-top:1px solid var(--line)}
.med-price{font-weight:900;font-size:1.1rem;color:var(--ink);line-height:1.15;white-space:nowrap}
.med-price small{display:block;font-size:.62rem;font-weight:700;color:var(--muted);margin-bottom:2px}
.med-service-foot .btn{font-size:.72rem;padding:9px 13px;min-height:38px}
.doctor-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.doctor-card{border-radius:22px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.doctor-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.doctor-media{position:relative;aspect-ratio:4/4.5;overflow:hidden;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:grid;place-items:center}
.doctor-media img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.doctor-card:hover .doctor-media img{transform:scale(1.05)}
.doctor-initials{font-size:2.6rem;font-weight:900;color:rgba(255,255,255,.55);letter-spacing:.08em}
.doctor-tag{position:absolute;top:12px;inset-inline-start:12px;padding:5px 10px;border-radius:999px;background:var(--glass);color:var(--glass-ink);font-size:.62rem;font-weight:900;backdrop-filter:blur(8px)}
.doctor-body{padding:16px 17px 18px;display:flex;flex-direction:column;gap:5px;flex:1}
.doctor-body h3{font-size:.98rem;line-height:1.35}
.doctor-role{font-size:.76rem;color:var(--p-text);font-weight:800;line-height:1.45}
.doctor-exp{display:inline-flex;align-items:center;gap:5px;font-size:.68rem;color:var(--muted);margin:2px 0 10px}
.doctor-exp .icon{width:14px;height:14px;color:var(--p-text)}
.doctor-body .btn{margin-top:auto;font-size:.7rem;padding:9px 10px;min-height:38px}
.insurance-band{background:var(--surface);border-block:1px solid var(--line)}
.insurance-inner{display:flex;align-items:center;justify-content:space-between;gap:28px;flex-wrap:wrap}
.insurance-logos{display:flex;flex-wrap:wrap;gap:9px}
.insurance-chip{display:inline-flex;align-items:center;gap:7px;padding:10px 15px;border-radius:12px;border:1px solid var(--line);background:var(--bg);font-size:.78rem;font-weight:900;letter-spacing:.02em;color:var(--ink);transition:border-color .2s,transform .2s}
.insurance-chip:hover{border-color:color-mix(in srgb,var(--p) 45%,var(--line));transform:translateY(-2px)}
.insurance-chip .icon{width:16px;height:16px;color:var(--p-text)}
.med-hours{margin-top:22px;padding:6px 16px;border-radius:14px;background:var(--surface);border:1px solid var(--line)}
.med-hours .hours-row{align-items:center;font-size:.8rem}
.med-hours .hours-row span{display:inline-flex;align-items:center;gap:8px;color:var(--muted)}
.med-hours .hours-row .icon{width:16px;height:16px;color:var(--p-text)}
.med-hours .hours-row strong{font-size:.78rem;text-align:end}
.med-contact-actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
.med-contact-actions .btn{flex:1 1 140px;font-size:.82rem;min-height:44px}
.appointment-card{position:relative}
.appointment-card::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;border-radius:24px 24px 0 0;background:linear-gradient(90deg,var(--p),var(--p2),var(--p));background-size:200% 100%;animation:aos-gradient 6s linear infinite}

/* pharmacy */
.tpl-pharmacy .pharmacy-hero{background:linear-gradient(165deg,var(--soft) 0%,var(--bg) 48%,color-mix(in srgb,var(--p) 12%,var(--bg)) 100%)}
.tpl-pharmacy .pharmacy-hero::after{content:"";position:absolute;width:420px;height:420px;border-radius:50%;border:48px solid color-mix(in srgb,var(--p) 7%,transparent);bottom:-260px;inset-inline-start:-160px;pointer-events:none}
.tpl-pharmacy .pharmacy-hero .hero-media{aspect-ratio:4/4.7;border-radius:34px}
.tpl-pharmacy .pharmacy-hero .hero-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(5,20,40,.38));pointer-events:none}
.tpl-pharmacy .pharmacy-hero .float-card{background:var(--glass);color:var(--glass-ink)}
.tpl-pharmacy .pharmacy-hero .hero-stats{gap:20px}
.tpl-pharmacy .pharmacy-hero .hero-stats .num{font-size:1.55rem;font-weight:900;line-height:1;letter-spacing:-.03em}
.tpl-pharmacy .pharmacy-hero .hero-stats .lbl{font-size:.78rem;color:var(--muted);margin-top:5px}
.tpl-pharmacy .trust-strip{border-block:1px solid var(--line);background:var(--surface)}
.tpl-pharmacy .trust-strip .container{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0;flex-wrap:wrap}
.tpl-pharmacy .trust-strip .trust-item{font-size:.85rem;transition:color .2s,transform .2s}
.tpl-pharmacy .trust-strip .trust-item:hover{color:var(--ink);transform:translateY(-1px)}
.tpl-pharmacy .trust-strip .trust-item .icon{transition:transform .25s}
.tpl-pharmacy .trust-strip .trust-item:hover .icon{transform:rotate(-8deg) scale(1.08)}
.tpl-pharmacy .pharm-cat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}
.tpl-pharmacy .pharm-cat{padding:20px;border-radius:16px;background:var(--surface);border:1px solid var(--line);text-align:center;transition:transform .25s,border-color .25s}
.tpl-pharmacy .pharm-cat:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-pharmacy .pharm-cat-icon{width:48px;height:48px;border-radius:12px;display:grid;place-items:center;background:var(--tint-2);color:var(--p-text);margin:0 auto 12px}
.tpl-pharmacy .pharm-product-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.tpl-pharmacy .pharm-product-grid .product-empty{grid-column:1/-1;padding:60px 20px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:18px}
.tpl-pharmacy .shop-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:26px}
.tpl-pharmacy .chip{padding:8px 15px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font-size:.8rem;font-weight:800;color:var(--muted);transition:.2s}
.tpl-pharmacy .chip.active,.tpl-pharmacy .chip:hover{background:var(--solid);border-color:var(--solid);color:var(--solid-ink)}
.tpl-pharmacy .product-card{border-radius:18px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .22s,box-shadow .22s}
.tpl-pharmacy .product-card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.tpl-pharmacy .product-thumb{position:relative;aspect-ratio:1/1;background:linear-gradient(145deg,var(--tint),var(--tint-2));overflow:hidden}
.tpl-pharmacy .product-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.tpl-pharmacy .product-card:hover .product-thumb img{transform:scale(1.05)}
.tpl-pharmacy .price-row{display:flex;align-items:center;justify-content:space-between;padding:12px;border-top:1px solid var(--line)}
.tpl-pharmacy .price{font-weight:900;font-size:1.1rem;color:var(--p-text);line-height:1.15;white-space:nowrap}
.tpl-pharmacy .pharm-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.tpl-pharmacy .pharm-service{border-radius:20px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-pharmacy .pharm-service:hover{transform:translateY(-5px);box-shadow:0 32px 65px -34px color-mix(in srgb,var(--p) 45%,transparent);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-pharmacy .pharm-service-icon{width:48px;height:48px;border-radius:12px;display:grid;place-items:center;background:var(--tint-2);color:var(--p-text);margin:0 auto 12px}
.tpl-pharmacy .pharm-service h3{font-size:.98rem;margin-bottom:4px;text-align:center}
.tpl-pharmacy .pharm-service p{font-size:.78rem;color:var(--muted);line-height:1.65;text-align:center}
.tpl-pharmacy .pharm-rx .pharm-rx-inner{max-width:800px;margin-inline:auto}
.tpl-pharmacy .pharm-rx .pharm-rx-step{padding:20px;border-radius:16px;background:var(--surface);border:1px solid var(--line);margin-bottom:16px}
.tpl-pharmacy .pharm-rx .n{position:absolute;top:14px;inset-inline-end:16px;font-size:.7rem;font-weight:900;color:var(--line)}
.tpl-pharmacy .pharm-rx .rx-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.tpl-pharmacy .pharm-rx .rx-cross{width:24px;height:24px}
.tpl-pharmacy .pharm-rx .rx-line{width:20px;height:2px;background:var(--line);margin:4px 0}
.tpl-pharmacy .pharm-rx .rx-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}
.tpl-pharmacy .pharm-rx .rx-stamp{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:.8rem}
.tpl-pharmacy .pharm-team-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px}
.tpl-pharmacy .pharm-team-card{border-radius:20px;overflow:hidden;background:var(--surface);border:1px solid var(--line);padding:20px;text-align:center;transition:transform .25s}
.tpl-pharmacy .pharm-team-card:hover{transform:translateY(-4px)}
.tpl-pharmacy .pharm-avatar{ border-radius:50%;overflow:hidden;aspect-ratio:1/1;margin:0 auto 12px}
.tpl-pharmacy .pharm-avatar img{width:100%;height:100%;object-fit:cover}
.tpl-pharmacy .pharm-role{font-size:.85rem;margin-top:8px;color:var(--muted)}
.tpl-pharmacy .pharm-specialty{font-size:.7rem;color:var(--muted);margin-top:4px}
.tpl-pharmacy .pharm-exp{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.7rem;color:var(--muted)}
.tpl-pharmacy .pharm-about-grid{display:grid;grid-template-columns:.95fr 1.05fr;gap:52px;align-items:center}
.tpl-pharmacy .pharm-about-media{position:relative;border-radius:26px;overflow:hidden;aspect-ratio:4/3.4;background:linear-gradient(150deg,var(--tint-2),var(--p2))}
.tpl-pharmacy .pharm-about-media img{width:100%;height:100%;object-fit:cover}
.tpl-pharmacy .pharm-about-media .about-badge{position:absolute;bottom:20px;inset-inline-start:20px;z-index:2;padding:12px 16px;border-radius:14px;background:var(--glass);color:var(--glass-ink);font-weight:800;font-size:.85rem;display:flex;align-items:center;gap:8px}
.tpl-pharmacy .pharm-about-media .about-badge .icon{width:20px;height:20px}
.tpl-pharmacy .pharm-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px}
.tpl-pharmacy .pharm-info{display:flex;align-items:flex-start;gap:12px;padding:16px;border-radius:14px;background:var(--surface);border:1px solid var(--line)}
.tpl-pharmacy .pharm-info .pharm-info-icon{width:24px;height:24px;flex-shrink:0}
.tpl-pharmacy .pharm-info .pharm-info-icon .icon{width:24px;height:24px}
.tpl-pharmacy .pharm-info strong{font-weight:800;color:var(--ink)}
.tpl-pharmacy .pharm-info span{color:var(--muted);font-size:.85rem}
.tpl-pharmacy .pharm-info a{color:var(--p);text-decoration:underline}
.tpl-pharmacy .stats-band{padding:44px 0;background:linear-gradient(120deg,var(--p2),var(--p));color:#fff;position:relative;overflow:hidden}
.tpl-pharmacy .stats-band .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;position:relative;z-index:1}
.tpl-pharmacy .section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:42px}
.tpl-pharmacy .section-head .lead{margin-top:10px}
.tpl-pharmacy .faq-list{display:grid;gap:10px;max-width:840px;margin-inline:auto}
.tpl-pharmacy .faq{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:0 20px;transition:border-color .2s}
.tpl-pharmacy .faq[open]{border-color:color-mix(in srgb,var(--p) 45%,var(--line))}
.tpl-pharmacy .faq summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 0;font-weight:800;font-size:.92rem}
.tpl-pharmacy .faq summary::-webkit-details-marker{display:none}
.tpl-pharmacy .faq summary::marker{content:""}
.tpl-pharmacy .faq .faq-ic{width:30px;height:30px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;flex:0 0 auto;color:var(--p-text);transition:transform .25s,background .25s}
.tpl-pharmacy .faq .faq-ic .icon{width:15px;height:15px}
.tpl-pharmacy .faq[open] .faq-ic{transform:rotate(45deg);background:var(--tint)}
.tpl-pharmacy .faq p{padding:0 0 18px;color:var(--muted);font-size:.84rem;line-height:1.8}
.tpl-pharmacy .hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.tpl-pharmacy .badge{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;background:var(--tint);color:var(--p-text);font-size:.78rem;font-weight:800}
.tpl-pharmacy .pharm-badges{display:flex;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-pharmacy .pharm-badges .trust-item{font-size:.85rem;color:var(--muted)}
.tpl-pharmacy .hero-stats{display:flex;gap:30px;margin-top:38px;padding-top:26px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-pharmacy .product-empty.hide{display:none!important}
/* lawyer */
.tpl-lawyer .lawyer-badges{display:flex;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-lawyer .hero-stats{display:flex;gap:30px;margin-top:38px;padding-top:26px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-lawyer .areas-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.tpl-lawyer .area-card{padding:26px 22px;border-radius:20px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:10px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-lawyer .area-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-lawyer .area-icon{width:46px;height:46px;border-radius:14px;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto;margin-bottom:4px}
.tpl-lawyer .area-icon .icon{width:22px;height:22px}
.tpl-lawyer .lawyer-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tpl-lawyer .lawyer-service{padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-lawyer .lawyer-service:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-lawyer .service-num{font-size:.75rem;font-weight:900;color:color-mix(in srgb,var(--p) 45%,var(--muted))}
.tpl-lawyer .lawyer-service h3{font-size:1rem;margin-bottom:4px}
.tpl-lawyer .lawyer-service p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-lawyer .lawyer-team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-lawyer .lawyer-card{border-radius:22px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-lawyer .lawyer-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-lawyer .lawyer-avatar{position:relative;aspect-ratio:4/4.5;overflow:hidden;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:grid;place-items:center}
.tpl-lawyer .lawyer-avatar img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-lawyer .lawyer-card:hover .lawyer-avatar img{transform:scale(1.05)}
.tpl-lawyer .lawyer-initials{font-size:2.4rem;font-weight:900;color:rgba(255,255,255,.55);letter-spacing:.08em}
.tpl-lawyer .lawyer-body{padding:16px 17px 18px;display:flex;flex-direction:column;gap:5px;flex:1}
.tpl-lawyer .lawyer-body h3{font-size:.98rem;line-height:1.35}
.tpl-lawyer .lawyer-role{font-size:.76rem;color:var(--p-text);font-weight:800;line-height:1.45}
.tpl-lawyer .lawyer-specialty{font-size:.7rem;color:var(--muted);margin-top:4px}
.tpl-lawyer .lawyer-exp{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.7rem;color:var(--muted)}
.tpl-lawyer .consult-wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:44px;align-items:start}
.tpl-lawyer .consult-card{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:30px;box-shadow:var(--shadow-sm)}
.tpl-lawyer .consult-card h3{font-size:1.15rem}
.tpl-lawyer .lawyer-hours{margin-top:18px}
.tpl-lawyer .hours-row{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.85rem;margin:6px 0}
.tpl-lawyer .hours-row strong{color:var(--ink);font-weight:800}
.tpl-lawyer .lawyer-contact-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.tpl-lawyer .lawyer-contact-actions .btn{flex:1 1 auto}
/* real estate */
.tpl-realestate .estate-badges{display:flex;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-realestate .hero-stats{display:flex;gap:30px;margin-top:38px;padding-top:26px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-realestate .types-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.tpl-realestate .type-card{padding:26px 22px;border-radius:20px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:10px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-realestate .type-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-realestate .type-icon{width:46px;height:46px;border-radius:14px;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto;margin-bottom:4px}
.tpl-realestate .type-icon .icon{width:22px;height:22px}
.tpl-realestate .property-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-realestate .property-card{border-radius:20px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-realestate .property-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-realestate .property-thumb{position:relative;aspect-ratio:4/3;overflow:hidden;background:linear-gradient(145deg,var(--tint),var(--tint-2))}
.tpl-realestate .property-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-realestate .property-card:hover .property-thumb img{transform:scale(1.06)}
.tpl-realestate .property-body{padding:18px 20px 22px;display:flex;flex-direction:column;gap:6px;flex:1}
.tpl-realestate .property-body .cat{font-size:.65rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--p-text)}
.tpl-realestate .property-body h3{font-size:1rem;line-height:1.4}
.tpl-realestate .property-body p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-realestate .property-body .price{margin-top:auto;padding-top:10px;color:var(--p-text);font-weight:900}
.tpl-realestate .estate-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tpl-realestate .estate-service{padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-realestate .estate-service:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-realestate .service-num{font-size:.75rem;font-weight:900;color:color-mix(in srgb,var(--p) 45%,var(--muted))}
.tpl-realestate .estate-service h3{font-size:1rem;margin-bottom:4px}
.tpl-realestate .estate-service p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-realestate .estate-team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-realestate .estate-card{border-radius:22px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-realestate .estate-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-realestate .estate-avatar{position:relative;aspect-ratio:4/4.5;overflow:hidden;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:grid;place-items:center}
.tpl-realestate .estate-avatar img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-realestate .estate-card:hover .estate-avatar img{transform:scale(1.05)}
.tpl-realestate .estate-initials{font-size:2.4rem;font-weight:900;color:rgba(255,255,255,.55);letter-spacing:.08em}
.tpl-realestate .estate-body{padding:16px 17px 18px;display:flex;flex-direction:column;gap:5px;flex:1}
.tpl-realestate .estate-body h3{font-size:.98rem;line-height:1.35}
.tpl-realestate .estate-role{font-size:.76rem;color:var(--p-text);font-weight:800;line-height:1.45}
.tpl-realestate .estate-specialty{font-size:.7rem;color:var(--muted);margin-top:4px}
.tpl-realestate .estate-exp{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.7rem;color:var(--muted)}
.tpl-realestate .viewing-wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:44px;align-items:start}
.tpl-realestate .viewing-card{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:30px;box-shadow:var(--shadow-sm)}
.tpl-realestate .viewing-card h3{font-size:1.15rem}
.tpl-realestate .estate-hours{margin-top:18px}
.tpl-realestate .hours-row{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.85rem;margin:6px 0}
.tpl-realestate .hours-row strong{color:var(--ink);font-weight:800}
.tpl-realestate .estate-contact-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.tpl-realestate .estate-contact-actions .btn{flex:1 1 auto}
/* education */
.tpl-education .edu-badges{display:flex;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-education .hero-stats{display:flex;gap:30px;margin-top:38px;padding-top:26px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-education .programs-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.tpl-education .program-card{padding:26px 22px;border-radius:20px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:10px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-education .program-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-education .program-icon{width:46px;height:46px;border-radius:14px;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto;margin-bottom:4px}
.tpl-education .program-icon .icon{width:22px;height:22px}
.tpl-education .course-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-education .course-card{border-radius:20px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-education .course-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-education .course-thumb{position:relative;aspect-ratio:4/3;overflow:hidden;background:linear-gradient(145deg,var(--tint),var(--tint-2))}
.tpl-education .course-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-education .course-card:hover .course-thumb img{transform:scale(1.06)}
.tpl-education .course-body{padding:18px 20px 22px;display:flex;flex-direction:column;gap:6px;flex:1}
.tpl-education .course-body .cat{font-size:.65rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--p-text)}
.tpl-education .course-body h3{font-size:1rem;line-height:1.4}
.tpl-education .course-body p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-education .course-body .price{margin-top:auto;padding-top:10px;color:var(--p-text);font-weight:900}
.tpl-education .edu-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tpl-education .edu-service{padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-education .edu-service:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-education .service-num{font-size:.75rem;font-weight:900;color:color-mix(in srgb,var(--p) 45%,var(--muted))}
.tpl-education .edu-service h3{font-size:1rem;margin-bottom:4px}
.tpl-education .edu-service p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-education .edu-team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-education .edu-card{border-radius:22px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-education .edu-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-education .edu-avatar{position:relative;aspect-ratio:4/4.5;overflow:hidden;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:grid;place-items:center}
.tpl-education .edu-avatar img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-education .edu-card:hover .edu-avatar img{transform:scale(1.05)}
.tpl-education .edu-initials{font-size:2.4rem;font-weight:900;color:rgba(255,255,255,.55);letter-spacing:.08em}
.tpl-education .edu-body{padding:16px 17px 18px;display:flex;flex-direction:column;gap:5px;flex:1}
.tpl-education .edu-body h3{font-size:.98rem;line-height:1.35}
.tpl-education .edu-role{font-size:.76rem;color:var(--p-text);font-weight:800;line-height:1.45}
.tpl-education .edu-specialty{font-size:.7rem;color:var(--muted);margin-top:4px}
.tpl-education .edu-exp{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.7rem;color:var(--muted)}
.tpl-education .register-wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:44px;align-items:start}
.tpl-education .register-card{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:30px;box-shadow:var(--shadow-sm)}
.tpl-education .register-card h3{font-size:1.15rem}
.tpl-education .edu-hours{margin-top:18px}
.tpl-education .hours-row{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.85rem;margin:6px 0}
.tpl-education .hours-row strong{color:var(--ink);font-weight:800}
.tpl-education .edu-contact-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.tpl-education .edu-contact-actions .btn{flex:1 1 auto}
/* hotel */
.tpl-hotel .hotel-badges{display:flex;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-hotel .hero-stats{display:flex;gap:30px;margin-top:38px;padding-top:26px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-hotel .hotel-rooms-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.tpl-hotel .room-type-card{padding:26px 22px;border-radius:20px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:10px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-hotel .room-type-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-hotel .room-type-icon{width:46px;height:46px;border-radius:14px;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto;margin-bottom:4px}
.tpl-hotel .room-type-icon .icon{width:22px;height:22px}
.tpl-hotel .room-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-hotel .room-card{border-radius:20px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-hotel .room-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-hotel .room-thumb{position:relative;aspect-ratio:4/3;overflow:hidden;background:linear-gradient(145deg,var(--tint),var(--tint-2))}
.tpl-hotel .room-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-hotel .room-card:hover .room-thumb img{transform:scale(1.06)}
.tpl-hotel .room-body{padding:18px 20px 22px;display:flex;flex-direction:column;gap:6px;flex:1}
.tpl-hotel .room-body .cat{font-size:.65rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--p-text)}
.tpl-hotel .room-body h3{font-size:1rem;line-height:1.4}
.tpl-hotel .room-body p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-hotel .room-body .price{margin-top:auto;padding-top:10px;color:var(--p-text);font-weight:900}
.tpl-hotel .hotel-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tpl-hotel .hotel-service{padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-hotel .hotel-service:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-hotel .service-num{font-size:.75rem;font-weight:900;color:color-mix(in srgb,var(--p) 45%,var(--muted))}
.tpl-hotel .hotel-service h3{font-size:1rem;margin-bottom:4px}
.tpl-hotel .hotel-service p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-hotel .amenities-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.tpl-hotel .amenity-card{padding:22px;border-radius:16px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-hotel .amenity-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-hotel .amenity-icon{width:40px;height:40px;border-radius:12px;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto;margin-bottom:4px}
.tpl-hotel .amenity-icon .icon{width:20px;height:20px}
.tpl-hotel .amenity-card h3{font-size:1rem;margin-bottom:4px}
.tpl-hotel .hotel-team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-hotel .hotel-card{border-radius:22px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-hotel .hotel-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-hotel .hotel-avatar{position:relative;aspect-ratio:4/4.5;overflow:hidden;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:grid;place-items:center}
.tpl-hotel .hotel-avatar img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-hotel .hotel-card:hover .hotel-avatar img{transform:scale(1.05)}
.tpl-hotel .hotel-initials{font-size:2.4rem;font-weight:900;color:rgba(255,255,255,.55);letter-spacing:.08em}
.tpl-hotel .hotel-body{padding:16px 17px 18px;display:flex;flex-direction:column;gap:5px;flex:1}
.tpl-hotel .hotel-body h3{font-size:.98rem;line-height:1.35}
.tpl-hotel .hotel-role{font-size:.76rem;color:var(--p-text);font-weight:800;line-height:1.45}
.tpl-hotel .hotel-specialty{font-size:.7rem;color:var(--muted);margin-top:4px}
.tpl-hotel .hotel-exp{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.7rem;color:var(--muted)}
.tpl-hotel .book-wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:44px;align-items:start}
.tpl-hotel .book-card{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:30px;box-shadow:var(--shadow-sm)}
.tpl-hotel .book-card h3{font-size:1.15rem}
.tpl-hotel .hotel-hours{margin-top:18px}
.tpl-hotel .hours-row{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.85rem;margin:6px 0}
.tpl-hotel .hours-row strong{color:var(--ink);font-weight:800}
.tpl-hotel .hotel-contact-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.tpl-hotel .hotel-contact-actions .btn{flex:1 1 auto}
.tpl-hotel input[type="date"]{background:var(--surface);border-color:var(--line);color:var(--ink)}
/* showroom */
.tpl-showroom .showroom-badges{display:flex;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-showroom .hero-stats{display:flex;gap:30px;margin-top:38px;padding-top:26px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-showroom .showroom-cats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.tpl-showroom .cat-card{padding:26px 22px;border-radius:20px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:10px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-showroom .cat-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-showroom .cat-icon{width:46px;height:46px;border-radius:14px;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto;margin-bottom:4px}
.tpl-showroom .cat-icon .icon{width:22px;height:22px}
.tpl-showroom .car-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-showroom .car-card{border-radius:20px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-showroom .car-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-showroom .car-thumb{position:relative;aspect-ratio:16/10;overflow:hidden;background:linear-gradient(145deg,var(--tint),var(--tint-2))}
.tpl-showroom .car-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-showroom .car-card:hover .car-thumb img{transform:scale(1.06)}
.tpl-showroom .car-body{padding:18px 20px 22px;display:flex;flex-direction:column;gap:6px;flex:1}
.tpl-showroom .car-body .cat{font-size:.65rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--p-text)}
.tpl-showroom .car-body h3{font-size:1rem;line-height:1.4}
.tpl-showroom .car-body p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-showroom .car-body .price{margin-top:auto;padding-top:10px;color:var(--p-text);font-weight:900}
.tpl-showroom .showroom-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tpl-showroom .showroom-service{padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-showroom .showroom-service:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-showroom .service-num{font-size:.75rem;font-weight:900;color:color-mix(in srgb,var(--p) 45%,var(--muted))}
.tpl-showroom .showroom-service h3{font-size:1rem;margin-bottom:4px}
.tpl-showroom .showroom-service p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-showroom .showroom-team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-showroom .showroom-card{border-radius:22px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-showroom .showroom-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-showroom .showroom-avatar{position:relative;aspect-ratio:4/4.5;overflow:hidden;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:grid;place-items:center}
.tpl-showroom .showroom-avatar img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-showroom .showroom-card:hover .showroom-avatar img{transform:scale(1.05)}
.tpl-showroom .showroom-initials{font-size:2.4rem;font-weight:900;color:rgba(255,255,255,.55);letter-spacing:.08em}
.tpl-showroom .showroom-body{padding:16px 17px 18px;display:flex;flex-direction:column;gap:5px;flex:1}
.tpl-showroom .showroom-body h3{font-size:.98rem;line-height:1.35}
.tpl-showroom .showroom-role{font-size:.76rem;color:var(--p-text);font-weight:800;line-height:1.45}
.tpl-showroom .showroom-specialty{font-size:.7rem;color:var(--muted);margin-top:4px}
.tpl-showroom .showroom-exp{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.7rem;color:var(--muted)}
.tpl-showroom .quote-wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:44px;align-items:start}
.tpl-showroom .quote-card{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:30px;box-shadow:var(--shadow-sm)}
.tpl-showroom .quote-card h3{font-size:1.15rem}
.tpl-showroom .showroom-hours{margin-top:18px}
.tpl-showroom .hours-row{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.85rem;margin:6px 0}
.tpl-showroom .hours-row strong{color:var(--ink);font-weight:800}
.tpl-showroom .showroom-contact-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.tpl-showroom .showroom-contact-actions .btn{flex:1 1 auto}
.tpl-showroom input[type="date"]{background:var(--surface);border-color:var(--line);color:var(--ink)}
/* clinic */
.tpl-clinic .clinic-badges{display:flex;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-clinic .hero-stats{display:flex;gap:30px;margin-top:38px;padding-top:26px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-clinic .clinic-depts-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.tpl-clinic .dept-card{padding:26px 22px;border-radius:20px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:10px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-clinic .dept-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-clinic .dept-icon{width:46px;height:46px;border-radius:14px;background:var(--tint-2);color:var(--p-text);display:grid;place-items:center;flex:0 0 auto;margin-bottom:4px}
.tpl-clinic .dept-icon .icon{width:22px;height:22px}
.tpl-clinic .treatment-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-clinic .treatment-card{border-radius:20px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-clinic .treatment-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-clinic .treatment-thumb{position:relative;aspect-ratio:16/10;overflow:hidden;background:linear-gradient(145deg,var(--tint),var(--tint-2))}
.tpl-clinic .treatment-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-clinic .treatment-card:hover .treatment-thumb img{transform:scale(1.06)}
.tpl-clinic .treatment-body{padding:18px 20px 22px;display:flex;flex-direction:column;gap:6px;flex:1}
.tpl-clinic .treatment-body .cat{font-size:.65rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--p-text)}
.tpl-clinic .treatment-body h3{font-size:1rem;line-height:1.4}
.tpl-clinic .treatment-body p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-clinic .treatment-body .price{margin-top:auto;padding-top:10px;color:var(--p-text);font-weight:900}
.tpl-clinic .clinic-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tpl-clinic .clinic-service{padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-clinic .clinic-service:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-clinic .service-num{font-size:.75rem;font-weight:900;color:color-mix(in srgb,var(--p) 45%,var(--muted))}
.tpl-clinic .clinic-service h3{font-size:1rem;margin-bottom:4px}
.tpl-clinic .clinic-service p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-clinic .clinic-team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-clinic .clinic-card{border-radius:22px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-clinic .clinic-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-clinic .clinic-avatar{position:relative;aspect-ratio:4/4.5;overflow:hidden;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:grid;place-items:center}
.tpl-clinic .clinic-avatar img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-clinic .clinic-card:hover .clinic-avatar img{transform:scale(1.05)}
.tpl-clinic .clinic-initials{font-size:2.4rem;font-weight:900;color:rgba(255,255,255,.55);letter-spacing:.08em}
.tpl-clinic .clinic-body{padding:16px 17px 18px;display:flex;flex-direction:column;gap:5px;flex:1}
.tpl-clinic .clinic-body h3{font-size:.98rem;line-height:1.35}
.tpl-clinic .clinic-role{font-size:.76rem;color:var(--p-text);font-weight:800;line-height:1.45}
.tpl-clinic .clinic-specialty{font-size:.7rem;color:var(--muted);margin-top:4px}
.tpl-clinic .clinic-exp{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.7rem;color:var(--muted)}
.tpl-clinic .book-wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:44px;align-items:start}
.tpl-clinic .book-card{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:30px;box-shadow:var(--shadow-sm)}
.tpl-clinic .book-card h3{font-size:1.15rem}
.tpl-clinic .clinic-hours{margin-top:18px}
.tpl-clinic .hours-row{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.85rem;margin:6px 0}
.tpl-clinic .hours-row strong{color:var(--ink);font-weight:800}
.tpl-clinic .clinic-contact-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.tpl-clinic .clinic-contact-actions .btn{flex:1 1 auto}
.tpl-clinic input[type="date"]{background:var(--surface);border-color:var(--line);color:var(--ink)}
/* construction */
.tpl-construction .build-badges{display:flex;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-construction .hero-stats{display:flex;gap:30px;margin-top:38px;padding-top:26px;border-top:1px solid var(--line);flex-wrap:wrap}
.tpl-construction .build-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tpl-construction .build-service{padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-construction .build-service:hover{transform:translateY(-4px);box-shadow:var(--shadow-sm);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-construction .service-num{font-size:.75rem;font-weight:900;color:color-mix(in srgb,var(--p) 45%,var(--muted))}
.tpl-construction .build-service h3{font-size:1rem;margin-bottom:4px}
.tpl-construction .build-service p{font-size:.82rem;color:var(--muted);line-height:1.65}
.tpl-construction .build-team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tpl-construction .build-card{border-radius:22px;overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.tpl-construction .build-card:hover{transform:translateY(-5px);box-shadow:var(--shadow);border-color:color-mix(in srgb,var(--p) 32%,var(--line))}
.tpl-construction .build-avatar{position:relative;aspect-ratio:4/4.5;overflow:hidden;background:linear-gradient(150deg,var(--tint-2),var(--p2));display:grid;place-items:center}
.tpl-construction .build-avatar img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tpl-construction .build-card:hover .build-avatar img{transform:scale(1.05)}
.tpl-construction .build-initials{font-size:2.4rem;font-weight:900;color:rgba(255,255,255,.55);letter-spacing:.08em}
.tpl-construction .build-body{padding:16px 17px 18px;display:flex;flex-direction:column;gap:5px;flex:1}
.tpl-construction .build-body h3{font-size:.98rem;line-height:1.35}
.tpl-construction .build-role{font-size:.76rem;color:var(--p-text);font-weight:800;line-height:1.45}
.tpl-construction .build-specialty{font-size:.7rem;color:var(--muted);margin-top:4px}
.tpl-construction .build-exp{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.7rem;color:var(--muted)}
.tpl-construction .quote-wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:44px;align-items:start}
.tpl-construction .quote-card{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:30px;box-shadow:var(--shadow-sm)}
.tpl-construction .quote-card h3{font-size:1.15rem}
.tpl-construction .build-hours{margin-top:18px}
.tpl-construction .hours-row{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.85rem;margin:6px 0}
.tpl-construction .hours-row strong{color:var(--ink);font-weight:800}
.tpl-construction .build-contact-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.tpl-construction .build-contact-actions .btn{flex:1 1 auto}
.theme-toggle{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;flex:0 0 auto;position:relative;transition:transform .2s,border-color .2s,background .2s}
.theme-toggle:hover{transform:translateY(-2px);border-color:var(--p)}
.theme-toggle .icon{width:18px;height:18px}
.theme-toggle .tt-icon{display:none;place-items:center}
.theme-toggle .tt-auto{display:grid}
html[data-theme-mode="light"] .theme-toggle .tt-auto,
html[data-theme-mode="dark"] .theme-toggle .tt-auto{display:none}
html[data-theme-mode="light"] .theme-toggle .tt-light{display:grid}
html[data-theme-mode="dark"] .theme-toggle .tt-dark{display:grid}
.vcard-lang{gap:10px;align-items:center}
.vcard-lang .theme-toggle{width:34px;height:34px}
.vcard-lang .theme-toggle .icon{width:16px;height:16px}

/* image-led packages/projects */
.showcase-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.showcase-card{border-radius:var(--radius);overflow:hidden;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
.showcase-card:hover{transform:translateY(-6px);box-shadow:0 30px 60px -30px color-mix(in srgb,var(--p) 45%,transparent);border-color:color-mix(in srgb,var(--p) 35%,var(--line))}
.showcase-media{position:relative;aspect-ratio:4/3;overflow:hidden;background:linear-gradient(145deg,var(--tint),var(--tint-2))}
.showcase-media img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.showcase-card:hover .showcase-media img{transform:scale(1.07)}
.showcase-body{padding:18px 20px 22px;display:flex;flex-direction:column;gap:6px;flex:1}
.showcase-body .cat{font-size:.65rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--p-text)}
.showcase-body h3{font-size:1.05rem;line-height:1.4}
.showcase-body p{font-size:.82rem;color:var(--muted);line-height:1.65}
.showcase-body .price{margin-top:auto;padding-top:10px;color:var(--p-text);font-weight:900}
.work-price{display:inline-block;margin-top:8px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.16);font-size:.72rem;font-weight:800}
.vcard-cover img{width:100%;height:100%;object-fit:cover;opacity:.92}
.vcard-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:16px}
.vcard-gallery img{width:100%;aspect-ratio:1.35;object-fit:cover;border-radius:10px;border:1px solid var(--line)}

/* motion layer */
@keyframes aos-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes aos-kenburns{0%{transform:scale(1.02)}100%{transform:scale(1.1)}}
@keyframes aos-shine{0%,58%{transform:translateX(-130%) skewX(-18deg)}78%,100%{transform:translateX(130%) skewX(-18deg)}}
@keyframes aos-gradient{to{background-position:200% 50%}}
@keyframes aos-pulse{0%{box-shadow:0 0 0 0 rgba(37,211,102,.5)}70%{box-shadow:0 0 0 18px rgba(37,211,102,0)}100%{box-shadow:0 0 0 0 rgba(37,211,102,0)}}
@keyframes aos-line{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.hero-media img{animation:aos-kenburns 24s ease-in-out infinite alternate;will-change:transform}
.rest-hero .bg img{animation:aos-kenburns 28s ease-in-out infinite alternate}
.landing-preview img{animation:aos-kenburns 30s ease-in-out infinite alternate}
.float-icon{animation:aos-float 4.8s ease-in-out infinite}
.wa-float{animation:aos-pulse 3.4s ease-out infinite}
.brand-mark{background-size:200% 200%;animation:aos-gradient 7s linear infinite}
.service-card::before{background:linear-gradient(90deg,var(--p),var(--p2),var(--p));background-size:200% 100%;animation:aos-gradient 5s linear infinite}
.stats-band{background-size:200% 200%;animation:aos-gradient 12s ease infinite}
.vcard-cover{background-size:200% 200%;animation:aos-gradient 10s ease infinite;background-image:linear-gradient(120deg,var(--p),var(--p2))}
.btn-primary{position:relative;overflow:hidden;isolation:isolate}
.btn-primary::after{content:"";position:absolute;inset:-2px;z-index:-1;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.42) 50%,transparent 65%);transform:translateX(-130%) skewX(-18deg);animation:aos-shine 6s ease-in-out infinite;pointer-events:none}
.section-head.in .eyebrow::before{animation:aos-line .8s cubic-bezier(.2,.7,.2,1) both;transform-origin:inline-start}
.trust-strip .trust-item{transition:color .2s,transform .2s}
.trust-strip .trust-item:hover{color:var(--ink);transform:translateY(-1px)}
.trust-strip .trust-item .icon{transition:transform .25s}
.trust-strip .trust-item:hover .icon{transform:rotate(-8deg) scale(1.08)}
.work-card{transition:transform .3s,box-shadow .3s}
.work-card:hover{transform:translateY(-4px);box-shadow:0 30px 60px -30px rgba(0,0,0,.5)}
[data-reveal]:nth-child(2){transition-delay:.07s}
[data-reveal]:nth-child(3){transition-delay:.14s}
[data-reveal]:nth-child(4){transition-delay:.21s}
[data-reveal]:nth-child(5){transition-delay:.28s}
[data-reveal]:nth-child(6){transition-delay:.35s}
section[id],main[id]{scroll-margin-top:92px}
body.has-preview section[id],body.has-preview main[id]{scroll-margin-top:128px}

/* dark theme (light templates follow the system on first visit) */
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness){
  --bg:#070b14;--soft:#0d1424;--surface:#111a2b;--ink:#e9eefc;--muted:#9dabc4;--line:#233049;
  --p-text:color-mix(in srgb,var(--p) 62%,#fff);
  --tint:color-mix(in srgb,var(--p) 20%,#0e1729);
  --tint-2:color-mix(in srgb,var(--p) 28%,#0e1729);
  --tint-ink:color-mix(in srgb,var(--p) 65%,#fff);
  --solid:#e9eefc;--solid-ink:#0b1120;
  --glass:rgba(14,23,41,.9);--glass-ink:#e9eefc;
  --shadow:0 28px 70px -28px rgba(0,0,0,.8);
  --shadow-sm:0 8px 30px -18px rgba(0,0,0,.65);
}
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness) .float-card span{color:var(--muted)}
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness) .btn-light{background:var(--surface);color:var(--ink);border-color:var(--line)}
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness) .reserve-card{background:var(--surface);border:1px solid var(--line);color:var(--ink)}
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness) .reserve-card .field label{color:var(--muted)}
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness) .reserve-card .field input,
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness) .reserve-card .field select,
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness) .reserve-card textarea{background:var(--soft);border-color:var(--line);color:var(--ink)}
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness) .brand-logo{background:var(--surface)}
html[data-theme="dark"] body:not(.tpl-card):not(.tpl-photography):not(.tpl-fitness) .company-hero .brand-ink{color:#fff}
html[data-theme-mode="light"] body.tpl-card,
html[data-theme-mode="light"] body.tpl-photography,
html[data-theme-mode="light"] body.tpl-fitness{--bg:#f8fafc;--soft:#f1f5f9;--surface:#fff;--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--solid:#0f172a;--solid-ink:#fff}
html[data-theme-mode="light"] body.tpl-card .site-header{color:#0f172a}
html[data-theme-mode="light"] body.tpl-card .lang-switch{background:rgba(15,23,42,.06);border-color:rgba(15,23,42,.14)}
html[data-theme-mode="light"] body.tpl-card .lang-switch a,
html[data-theme-mode="light"] body.tpl-card .lang-switch span{color:#475569}
html[data-theme-mode="light"] body.tpl-card .lang-switch .active{background:#0f172a;color:#fff}
html[data-theme-mode="light"] body.tpl-card .vcard-cover::after{border-color:rgba(15,23,42,.12)}
html[data-theme="dark"] .company-hero .badge{background:rgba(255,255,255,.1);color:#fff}

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
  .fleet-grid,.rental-steps{grid-template-columns:repeat(2,1fr)}
  .specialty-grid,.med-service-grid,.doctor-grid{grid-template-columns:repeat(2,1fr)}
  .booking-wrap{grid-template-columns:1fr;gap:26px}
  .tpl-pharmacy .pharm-about-grid{grid-template-columns:1fr;gap:34px}
  .tpl-pharmacy .pharm-service-grid{grid-template-columns:repeat(2,1fr)}
  .tpl-lawyer .areas-grid{grid-template-columns:1fr;gap:16px}
  .tpl-lawyer .lawyer-service-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-lawyer .lawyer-team-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-lawyer .consult-wrap{grid-template-columns:1fr;gap:34px}
  .tpl-realestate .types-grid{grid-template-columns:1fr;gap:16px}
  .tpl-realestate .property-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-realestate .estate-service-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-realestate .estate-team-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-realestate .viewing-wrap{grid-template-columns:1fr;gap:34px}
  .tpl-education .programs-grid{grid-template-columns:1fr;gap:16px}
  .tpl-education .course-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-education .edu-service-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-education .edu-team-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-education .register-wrap{grid-template-columns:1fr;gap:34px}
  .tpl-hotel .hotel-rooms-grid{grid-template-columns:1fr;gap:16px}
  .tpl-hotel .room-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-hotel .hotel-service-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-hotel .amenities-grid{grid-template-columns:repeat(2,1fr);gap:14px}
  .tpl-hotel .hotel-team-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-hotel .book-wrap{grid-template-columns:1fr;gap:34px}
  .tpl-showroom .showroom-cats-grid{grid-template-columns:1fr;gap:16px}
  .tpl-showroom .car-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-showroom .showroom-service-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-showroom .showroom-team-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-showroom .quote-wrap{grid-template-columns:1fr;gap:34px}
  .tpl-construction .build-service-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-construction .build-team-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-construction .quote-wrap{grid-template-columns:1fr;gap:34px}
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
  .feature-grid{grid-template-columns:1fr}
  .booking-card{padding:22px}
  .fleet-grid{gap:14px}
  .insurance-inner{align-items:flex-start;gap:18px}
  .doctor-grid,.specialty-grid,.med-service-grid{gap:14px}
  .showcase-grid{grid-template-columns:1fr 1fr;gap:16px}
  .tpl-pharmacy .pharm-product-grid{grid-template-columns:1fr 1fr;gap:12px}
  .tpl-pharmacy .pharm-service-grid{grid-template-columns:1fr 1fr;gap:14px}
  .tpl-pharmacy .stats-band .stats-grid{grid-template-columns:1fr 1fr}
  .tpl-pharmacy .section-head{align-items:flex-start}
  .tpl-lawyer .areas-grid{grid-template-columns:1fr;gap:14px}
  .tpl-lawyer .lawyer-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-lawyer .lawyer-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-lawyer .consult-card{padding:22px}
  .tpl-realestate .types-grid{grid-template-columns:1fr;gap:14px}
  .tpl-realestate .property-grid{grid-template-columns:1fr;gap:14px}
  .tpl-realestate .estate-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-realestate .estate-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-realestate .viewing-card{padding:22px}
  .tpl-hotel .hotel-rooms-grid{grid-template-columns:1fr;gap:14px}
  .tpl-hotel .room-grid{grid-template-columns:1fr;gap:14px}
  .tpl-hotel .hotel-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-hotel .amenities-grid{grid-template-columns:1fr;gap:14px}
  .tpl-hotel .hotel-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-hotel .book-card{padding:22px}
  .tpl-showroom .showroom-cats-grid{grid-template-columns:1fr;gap:14px}
  .tpl-showroom .car-grid{grid-template-columns:1fr;gap:14px}
  .tpl-showroom .showroom-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-showroom .showroom-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-showroom .quote-card{padding:22px}
  .tpl-clinic .clinic-depts-grid{grid-template-columns:1fr;gap:14px}
  .tpl-clinic .treatment-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-clinic .clinic-service-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-clinic .clinic-team-grid{grid-template-columns:repeat(2,1fr);gap:16px}
  .tpl-clinic .book-wrap{grid-template-columns:1fr;gap:34px}
  .tpl-clinic .book-card{padding:22px}
  .tpl-construction .build-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-construction .build-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-construction .quote-card{padding:22px}
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
  .fleet-grid,.rental-steps{grid-template-columns:1fr}
  .fleet-foot{flex-wrap:wrap}
  .fleet-book{width:100%}
  .specialty-grid,.med-service-grid,.doctor-grid{grid-template-columns:1fr}
  .doctor-media{aspect-ratio:4/3.6}
  .med-service-foot{flex-wrap:nowrap}
  .showcase-grid{grid-template-columns:1fr}
  .tpl-pharmacy .pharm-product-grid{grid-template-columns:1fr 1fr}
  .tpl-pharmacy .pharm-service-grid{grid-template-columns:1fr}
  .tpl-pharmacy .stats-band .stats-grid{grid-template-columns:1fr 1fr}
  .tpl-lawyer .lawyer-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-lawyer .lawyer-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-realestate .property-grid{grid-template-columns:1fr 1fr}
  .tpl-realestate .estate-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-realestate .estate-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-education .programs-grid{grid-template-columns:1fr;gap:14px}
  .tpl-education .course-grid{grid-template-columns:1fr;gap:14px}
  .tpl-education .edu-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-education .edu-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-education .register-card{padding:22px}
  .tpl-hotel .room-grid{grid-template-columns:1fr 1fr}
  .tpl-hotel .hotel-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-hotel .hotel-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-showroom .car-grid{grid-template-columns:1fr 1fr}
  .tpl-showroom .showroom-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-showroom .showroom-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-clinic .clinic-depts-grid{grid-template-columns:1fr;gap:14px}
  .tpl-clinic .treatment-grid{grid-template-columns:1fr;gap:14px}
  .tpl-clinic .clinic-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-clinic .clinic-team-grid{grid-template-columns:1fr;gap:14px}
  .tpl-clinic .book-card{padding:22px}
  .tpl-construction .build-service-grid{grid-template-columns:1fr;gap:14px}
  .tpl-construction .build-team-grid{grid-template-columns:1fr;gap:14px}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
  [data-reveal]{opacity:1;transform:none}
}
`;
