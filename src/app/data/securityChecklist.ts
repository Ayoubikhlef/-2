export type ChecklistLanguage = 'ar' | 'fr' | 'en';

export type LocalizedText = Record<ChecklistLanguage, string>;

export interface SecurityChecklistItem {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  command: LocalizedText;
}

/**
 * Twenty practical protections for a storefront built with React, Express,
 * Prisma and a hosted Postgres database. The wording and the prompts are
 * original to AOS; they are prompts to run with an AI coding agent inside the
 * project, not automated scripts.
 */
export const SECURITY_CHECKLIST: SecurityChecklistItem[] = [
  {
    id: 'admin-2fa',
    title: {
      ar: 'الدخول الآمن والتحقق بخطوتين',
      fr: 'Connexion sécurisée et double authentification',
      en: 'Secure sign-in and two-factor authentication',
    },
    summary: {
      ar: 'كلمة المرور وحدها لا تكفي لحماية لوحة التحكم. أضف رمزًا من تطبيق الهاتف، وأغلق الجلسات الخاملة، وأبطلها عند تغيير كلمة المرور.',
      fr: "Le mot de passe seul ne protège pas l'administration. Ajoutez un code TOTP, fermez les sessions inactives et révoquez-les après un changement de mot de passe.",
      en: 'A password alone does not protect the admin panel. Add a TOTP code, close idle sessions, and revoke them when the password changes.',
    },
    command: {
      ar: 'افحص مسار الدخول ولوحة التحكم في هذا المشروع (React + Express + Prisma). تأكد أن التحقق بخطوتين إلزامي لكل مدير، وأن الجلسة تُغلق بعد مدة خمول، وأن تغيير كلمة المرور يُبطل الجلسات القديمة. اشرح التعديلات قبل تنفيذها، ثم اختبر الدخول.',
      fr: "Auditez la connexion et l'administration de ce projet (React + Express + Prisma). Rendez la double authentification obligatoire pour chaque administrateur, fermez la session après une période d'inactivité et révoquez les anciennes sessions lors d'un changement de mot de passe. Expliquez les changements avant de les appliquer, puis testez la connexion.",
      en: 'Audit sign-in and the admin panel in this project (React + Express + Prisma). Make two-factor authentication mandatory for every admin, close idle sessions, and revoke old sessions when the password changes. Explain the changes before applying them, then test sign-in.',
    },
  },
  {
    id: 'api-keys',
    title: {
      ar: 'إخفاء مفاتيح API',
      fr: 'Protéger les clés API',
      en: 'Keep API keys out of the browser',
    },
    summary: {
      ar: 'أي مفتاح يظهر في كود الواجهة يستطيع الزائر نسخه واستعماله. اجعل كل المفاتيح في متغيرات بيئة على الخادم فقط.',
      fr: "Une clé visible dans le code front-end peut être copiée par n'importe quel visiteur. Gardez tous les secrets dans des variables d'environnement côté serveur.",
      en: 'Any key visible in front-end code can be copied by a visitor. Keep every secret in server-side environment variables.',
    },
    command: {
      ar: 'ابحث في المشروع عن مفاتيح API أو كلمات مرور مكتوبة داخل الكود. لا تعرض قيمها؛ اذكر الملف والسطر فقط. انقلها إلى متغيرات بيئة على الخادم، وتأكد أن ملف .env مستثنى من Git، وأن الواجهة لا تستقبل إلا ما هو عام.',
      fr: "Cherchez dans le projet des clés API ou des mots de passe écrits dans le code. N'affichez pas leurs valeurs ; indiquez seulement le fichier et la ligne. Déplacez-les vers des variables d'environnement serveur, vérifiez que .env est ignoré par Git et que le front-end ne reçoit que des données publiques.",
      en: 'Search the project for API keys or passwords written in code. Do not print their values; name the file and line only. Move them to server-side environment variables, confirm .env is ignored by Git, and make sure the front end receives only public data.',
    },
  },
  {
    id: 'database',
    title: {
      ar: 'تأمين قاعدة البيانات',
      fr: 'Sécuriser la base de données',
      en: 'Secure the database',
    },
    summary: {
      ar: 'قاعدة البيانات تحمل الطلبات والعملاء. لا تفتحها للإنترنت، ولا تستعمل حساب المالك داخل التطبيق.',
      fr: "La base contient les commandes et les clients. Ne l'exposez pas à Internet et n'utilisez pas le compte propriétaire dans l'application.",
      en: 'The database holds orders and customers. Do not expose it to the internet, and do not use the owner account inside the app.',
    },
    command: {
      ar: 'راجع اتصال قاعدة البيانات (Neon Postgres) في هذا المشروع. تأكد أن الاتصال مشفّر، وأن مستخدم التطبيق لا يملك صلاحيات المالك، وأن كل وصول يمر عبر الخادم. اقترح خطوات إنشاء مستخدم محدود الصلاحيات، ثم اختبر الاتصال.',
      fr: "Vérifiez la connexion à la base (Neon Postgres). Assurez-vous que la connexion est chiffrée, que l'utilisateur de l'application n'a pas les droits du propriétaire et que tout accès passe par le serveur. Proposez les étapes pour créer un utilisateur limité, puis testez la connexion.",
      en: 'Review the database connection (Neon Postgres). Confirm the connection is encrypted, the app user does not have owner rights, and every query goes through the server. Propose steps to create a least-privilege user, then test the connection.',
    },
  },
  {
    id: 'https',
    title: {
      ar: 'HTTPS إجباري',
      fr: 'HTTPS obligatoire',
      en: 'Force HTTPS',
    },
    summary: {
      ar: 'بدون HTTPS تمر كلمات المرور مكشوفة. أجبر الاتصال المشفّر، وأضف HSTS، وأصلح أي رابط قديم يعمل بـhttp.',
      fr: 'Sans HTTPS, les mots de passe circulent en clair. Forcez le chiffrement, ajoutez HSTS et corrigez les anciens liens http.',
      en: 'Without HTTPS, passwords travel in the clear. Force encryption, add HSTS, and fix any old http link.',
    },
    command: {
      ar: 'افحص إعدادات HTTPS في المشروع (Vercel للواجهة وRender للـAPI). تأكد من تحويل HTTP إلى HTTPS ومن وجود HSTS، وابحث عن أي صورة أو سكربت يُحمّل عبر http. أصلح ما تجده واذكر أين تم الضبط.',
      fr: "Vérifiez HTTPS dans ce projet (Vercel pour le front, Render pour l'API). Assurez la redirection HTTP vers HTTPS, la présence de HSTS et l'absence de ressources chargées en http. Corrigez ce que vous trouvez et indiquez où le réglage est appliqué.",
      en: 'Check HTTPS in this project (Vercel for the front end, Render for the API). Confirm HTTP redirects to HTTPS, HSTS is present, and no image or script still loads over http. Fix what you find and say where the setting lives.',
    },
  },
  {
    id: 'password-hashing',
    title: {
      ar: 'تشفير كلمات المرور',
      fr: 'Hachage des mots de passe',
      en: 'Hash passwords properly',
    },
    summary: {
      ar: 'لا تُحفظ كلمة المرور كما هي أبدًا. استعمل bcrypt أو Argon2id، ورقّي أي حساب قديم عند أول دخول.',
      fr: "Un mot de passe ne doit jamais être stocké en clair. Utilisez bcrypt ou Argon2id et migrez les anciens comptes à la prochaine connexion.",
      en: 'Never store a password as plain text. Use bcrypt or Argon2id, and upgrade any old account on its next sign-in.',
    },
    command: {
      ar: 'افحص طريقة حفظ كلمات المرور في الخادم. يجب أن تكون bcrypt أو Argon2id مع ملح، وألا تظهر كلمة المرور في السجلات. إن وجدت حسابًا بطريقة ضعيفة، اقترح ترقية تلقائية عند الدخول التالي دون أن يفقد صاحبه حسابه.',
      fr: "Auditez le stockage des mots de passe côté serveur. Il doit utiliser bcrypt ou Argon2id avec sel, sans jamais les écrire dans les logs. Si un ancien format faible existe, proposez une migration automatique à la prochaine connexion sans bloquer le compte.",
      en: 'Audit how passwords are stored on the server. They must use bcrypt or Argon2id with a salt and never appear in logs. If a weak legacy format exists, propose an automatic upgrade at the next sign-in without locking the account.',
    },
  },
  {
    id: 'server-validation',
    title: {
      ar: 'التحقق من النماذج في الخادم',
      fr: 'Valider les formulaires côté serveur',
      en: 'Validate every form on the server',
    },
    summary: {
      ar: 'تحقق المتصفح ليس حماية. الخادم يجب أن يرفض كل حقل ناقص أو زائد أو بصيغة غير مسموحة.',
      fr: "La validation du navigateur n'est pas une protection. Le serveur doit refuser tout champ manquant, en trop ou mal formé.",
      en: 'Browser validation is not protection. The server must reject every missing, extra or malformed field.',
    },
    command: {
      ar: 'اعرض كل نماذج الإدخال في المشروع (تسجيل، دخول، طلب، تواصل، بحث). تأكد أن الخادم يتحقق من النوع والطول والصيغة والقيم المسموحة، ويرفض الحقول غير المتوقعة. أضف ما ينقص برسائل خطأ واضحة لا تكشف تفاصيل تقنية.',
      fr: "Listez tous les formulaires du projet (inscription, connexion, commande, contact, recherche). Vérifiez que le serveur valide le type, la longueur, le format et les valeurs autorisées, et refuse les champs inattendus. Ajoutez ce qui manque avec des messages clairs, sans détails techniques.",
      en: 'List every input form in the project (sign-up, sign-in, order, contact, search). Confirm the server validates type, length, format and allowed values, and rejects unexpected fields. Add what is missing with clear error messages that reveal no technical details.',
    },
  },
  {
    id: 'xss-sqli-csrf',
    title: {
      ar: 'الحماية من XSS وSQL Injection وCSRF',
      fr: 'Protection XSS, SQL Injection et CSRF',
      en: 'Protect against XSS, SQL injection and CSRF',
    },
    summary: {
      ar: 'نظّف كل نص يُعرض، واستعمل استعلامات مُعدّة، واحمِ العمليات الحساسة من الطلبات المزيفة.',
      fr: 'Nettoyez chaque texte affiché, utilisez des requêtes préparées et protégez les actions sensibles contre les requêtes forgées.',
      en: 'Sanitize every displayed string, use prepared queries, and protect sensitive actions from forged requests.',
    },
    command: {
      ar: 'افحص المشروع من XSS وSQL Injection وCSRF. تأكد أن كل نص مستخدم يُعقّم قبل العرض، وأن Prisma يستعمل استعلامات مُعدّة، وأن العمليات التي تكتب أو تدفع لا تقبل طلبًا من موقع آخر. أصلح ما تجده واختبره بمثال غير ضار.',
      fr: "Auditez le projet contre XSS, SQL Injection et CSRF. Vérifiez que chaque texte utilisateur est échappé avant affichage, que Prisma utilise des requêtes préparées et que les actions d'écriture ou de paiement refusent les requêtes d'un autre site. Corrigez et testez avec des exemples inoffensifs.",
      en: 'Audit the project for XSS, SQL injection and CSRF. Confirm every user string is escaped before display, Prisma uses prepared queries, and write or payment actions reject requests from another site. Fix what you find and test with harmless examples.',
    },
  },
  {
    id: 'login-limits',
    title: {
      ar: 'حدّ محاولات الدخول',
      fr: 'Limiter les tentatives de connexion',
      en: 'Limit sign-in attempts',
    },
    summary: {
      ar: 'بدون حد، يجرّب الروبوت آلاف كلمات المرور. أوقف المحاولات مؤقتًا بعد عدد قليل من الأخطاء.',
      fr: 'Sans limite, un robot essaie des milliers de mots de passe. Bloquez temporairement après quelques échecs.',
      en: 'Without a limit, a bot tries thousands of passwords. Temporarily block after a few failures.',
    },
    command: {
      ar: 'راجع حدود محاولات الدخول والتسجيل واسترجاع كلمة المرور في الخادم. طبّق حدًا حسب IP وحسب الحساب، برسالة واحدة لا تكشف إن كان البريد مسجلًا. اختبر أن المستخدم الحقيقي يستطيع الدخول بعد انتهاء المدة.',
      fr: "Vérifiez les limites de connexion, d'inscription et de réinitialisation. Appliquez une limite par IP et par compte, avec un message unique qui ne révèle pas si l'e-mail existe. Testez qu'un utilisateur légitime peut se reconnecter après la fin du blocage.",
      en: 'Review the sign-in, registration and password-reset limits. Apply a limit per IP and per account, with one message that does not reveal whether the email exists. Test that a real user can sign in again after the block ends.',
    },
  },
  {
    id: 'cors-headers',
    title: {
      ar: 'CORS وترويسات الأمان',
      fr: 'CORS et en-têtes de sécurité',
      en: 'CORS and security headers',
    },
    summary: {
      ar: 'اسمح فقط للنطاقات التي تملكها، وأضف ترويسات تمنع الحقن والتأطير والتجسس.',
      fr: "N'autorisez que vos propres domaines et ajoutez les en-têtes qui bloquent l'injection, l'encadrement et l'espionnage.",
      en: 'Allow only the domains you own, and add headers that block injection, framing and snooping.',
    },
    command: {
      ar: 'افحص CORS في المشروع: لا تسمح إلا بنطاقات المتجر، ولا تستعمل * مع الكوكيز. أضف CSP وX-Content-Type-Options وReferrer-Policy وPermissions-Policy وframe-ancestors، وتأكد أن الموقع ما زال يعمل بعدها.',
      fr: "Vérifiez CORS : n'autorisez que les domaines de la boutique et jamais * avec les cookies. Ajoutez CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy et frame-ancestors, puis vérifiez que le site fonctionne toujours.",
      en: 'Check CORS: allow only the store domains and never * with cookies. Add CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and frame-ancestors, then confirm the site still works.',
    },
  },
  {
    id: 'cookies',
    title: {
      ar: 'كوكيز آمنة',
      fr: 'Cookies sécurisés',
      en: 'Secure cookies',
    },
    summary: {
      ar: 'كوكي الجلسة بطاقة دخول. اجعله HttpOnly وSecure وSameSite، وجدّده وأبطله عند الخروج.',
      fr: "Le cookie de session est une carte d'accès. Rendez-le HttpOnly, Secure et SameSite, renouvelez-le et révoquez-le à la déconnexion.",
      en: 'The session cookie is an access card. Make it HttpOnly, Secure and SameSite; rotate it and revoke it on sign-out.',
    },
    command: {
      ar: 'افحص كل الكوكيز التي يضعها المشروع. اجعل كوكي الجلسة HttpOnly وSecure وSameSite=Lax أو Strict، بمدة معقولة. تأكد من تدوير الرمز بعد الدخول وإبطاله عند الخروج، وألا تُحفظ بيانات حساسة داخل الكوكي.',
      fr: "Auditez tous les cookies du projet. Le cookie de session doit être HttpOnly, Secure et SameSite=Lax ou Strict, avec une durée raisonnable. Vérifiez le renouvellement après connexion, la révocation à la déconnexion et l'absence de données sensibles dans le cookie.",
      en: 'Audit every cookie the project sets. The session cookie must be HttpOnly, Secure and SameSite=Lax or Strict, with a reasonable lifetime. Confirm it rotates after sign-in, is revoked on sign-out, and holds no sensitive data.',
    },
  },
  {
    id: 'password-reset',
    title: {
      ar: 'روابط استرجاع كلمة المرور',
      fr: 'Liens de réinitialisation du mot de passe',
      en: 'Password reset links',
    },
    summary: {
      ar: 'الرابط الذي لا ينتهي باب خلفي. اجعله عشوائيًا، يُستعمل مرة واحدة، وينتهي بعد دقائق.',
      fr: "Un lien qui n'expire jamais est une porte dérobée. Rendez-le aléatoire, à usage unique et valable quelques minutes.",
      en: 'A link that never expires is a back door. Make it random, single-use, and valid for minutes only.',
    },
    command: {
      ar: 'افحص استرجاع كلمة المرور. يجب أن يكون الرمز عشوائيًا وطويلًا، ويُحفظ مجزّأً في القاعدة، وينتهي بعد 30 دقيقة، ويُلغى عند طلب رابط جديد أو تغيير كلمة المرور. اجعل الرد واحدًا سواء كان البريد مسجلًا أم لا.',
      fr: "Auditez la réinitialisation du mot de passe. Le jeton doit être aléatoire et long, stocké haché en base, expirer après 30 minutes et être invalidé lors d'une nouvelle demande ou d'un changement de mot de passe. Gardez la même réponse que l'e-mail existe ou non.",
      en: 'Audit password reset. The token must be long and random, stored hashed, expire after 30 minutes, and be invalidated on a new request or a password change. Return the same response whether the email exists or not.',
    },
  },
  {
    id: 'uploads',
    title: {
      ar: 'تقييد الملفات المرفوعة',
      fr: 'Restreindre les fichiers envoyés',
      en: 'Restrict uploaded files',
    },
    summary: {
      ar: 'رفع ملف بلا قيود قد ينفّذ كودًا على خادمك. اسمح بالصور والمستندات فقط، وتحقق من النوع الحقيقي والحجم.',
      fr: "Un upload sans contrôle peut exécuter du code sur votre serveur. Autorisez seulement les images et documents, vérifiez le vrai type et la taille.",
      en: 'An unrestricted upload can execute code on your server. Allow only images and documents, and verify the real type and size.',
    },
    command: {
      ar: 'افحص كل أماكن رفع الملفات. اسمح فقط بالأنواع التي تحتاجها (JPG/PNG/WebP/PDF)، وتأكد من النوع الحقيقي لا الامتداد، وضع حدًا للحجم. احفظ الملفات بأسماء عشوائية في مكان لا يُنفّذ فيه كود، وامنع SVG التي تحمل سكربتًا.',
      fr: "Auditez tous les points d'upload. Autorisez uniquement les formats nécessaires (JPG/PNG/WebP/PDF), vérifiez le contenu réel et pas seulement l'extension, et fixez une taille maximale. Stockez sous un nom aléatoire, hors zone d'exécution, et refusez les SVG contenant du script.",
      en: 'Audit every upload point. Allow only the formats you need (JPG/PNG/WebP/PDF), verify the real content and not just the extension, and set a size limit. Store files under random names outside any execution path, and reject SVGs that contain scripts.',
    },
  },
  {
    id: 'pricing-payment',
    title: {
      ar: 'الأسعار والدفع في الخادم',
      fr: 'Prix et paiement côté serveur',
      en: 'Prices and payment on the server',
    },
    summary: {
      ar: 'لا تثق بسعر قادم من المتصفح. احسب المجموع والتوصيل والخصم في الخادم، وتحقق من توقيع الدفع.',
      fr: 'Ne faites jamais confiance à un prix venant du navigateur. Calculez le total, la livraison et la remise côté serveur, et vérifiez la signature du paiement.',
      en: 'Never trust a price sent by the browser. Calculate the total, delivery and discount on the server, and verify the payment signature.',
    },
    command: {
      ar: 'افحص مسار الطلب من السلة إلى التأكيد. يجب أن يحسب الخادم السعر والخصم والتوصيل من قاعدة البيانات، وألا يقبل أي رقم من المتصفح. إن أضفت بوابة دفع، تأكد أن التأكيد يأتي من webhook موقّع، وأن الدفع لا يُحسب مرتين.',
      fr: "Auditez le parcours de la commande, du panier à la confirmation. Le serveur doit calculer le prix, la remise et la livraison depuis la base, sans accepter de montant du navigateur. Si un paiement en ligne est ajouté, exigez un webhook signé et évitez tout double débit.",
      en: 'Audit the order flow from cart to confirmation. The server must calculate price, discount and delivery from the database and accept no amount from the browser. If online payment is added, require a signed webhook and prevent double charging.',
    },
  },
  {
    id: 'debug',
    title: {
      ar: 'إيقاف وضع Debug',
      fr: 'Désactiver le mode debug',
      en: 'Turn off debug mode',
    },
    summary: {
      ar: 'رسائل الأخطاء المفصّلة تعطي المهاجم خريطة المشروع. أظهر للمستخدم رسالة بسيطة، واحفظ التفاصيل في سجل الخادم.',
      fr: "Les messages d'erreur détaillés donnent une carte du projet à l'attaquant. Montrez un message simple et gardez les détails dans les logs serveur.",
      en: 'Detailed error messages hand the attacker a map of the project. Show a simple message and keep the details in server logs.',
    },
    command: {
      ar: 'تأكد أن وضع التطوير والأخطاء المفصّلة متوقف في الإنتاج. يجب ألا يرى الزائر مسارات ملفات أو أسماء جداول أو مفاتيح، وأن تُكتب الأخطاء في سجل الخادم فقط. افحص أيضًا عدم وجود ملفات مثل phpinfo وصفحات التجربة.',
      fr: "Vérifiez que le mode développement et les erreurs détaillées sont désactivés en production. Le visiteur ne doit voir ni chemins de fichiers, ni noms de tables, ni clés. Écrivez les erreurs uniquement dans les logs serveur et vérifiez l'absence de pages de test comme phpinfo.",
      en: 'Confirm development mode and detailed errors are off in production. Visitors must not see file paths, table names or keys, and errors must go only to server logs. Also check that no test pages such as phpinfo exist.',
    },
  },
  {
    id: 'dependencies',
    title: {
      ar: 'تحديث المكتبات',
      fr: 'Mettre à jour les dépendances',
      en: 'Update dependencies',
    },
    summary: {
      ar: 'كل مكتبة قديمة قد تحمل ثغرة منشورة. حدّث بانتظام واحذف ما لا تستعمله.',
      fr: "Une bibliothèque ancienne peut contenir une faille publiée. Mettez à jour régulièrement et supprimez ce qui n'est plus utilisé.",
      en: 'An old library may carry a published vulnerability. Update regularly and remove what you no longer use.',
    },
    command: {
      ar: 'اعرض مكتبات المشروع وإصداراتها، وشغّل npm audit. رتّب الثغرات من الأخطر، واقترح التحديث الآمن لكل واحدة، واحذف المكتبات غير المستعملة. لا تحدّث شيئًا قبل موافقتي، واختبر الموقع بعد كل تحديث.',
      fr: "Listez les dépendances et leurs versions, puis lancez npm audit. Classez les failles par gravité, proposez une mise à jour sûre pour chacune et supprimez les bibliothèques inutilisées. Ne mettez rien à jour avant mon accord et testez le site après chaque changement.",
      en: 'List the project dependencies and versions, then run npm audit. Rank issues by severity, propose a safe update for each, and remove unused packages. Do not update anything before my approval, and test the site after each change.',
    },
  },
  {
    id: 'exposed-files',
    title: {
      ar: 'منع الملفات المكشوفة',
      fr: 'Bloquer les fichiers exposés',
      en: 'Block exposed files',
    },
    summary: {
      ar: 'ملف .env أو نسخة احتياطية منسية قد تكشف كل أسرارك. تأكد أن الخادم يمنع الوصول إليها.',
      fr: 'Un fichier .env ou une sauvegarde oubliée peut révéler tous vos secrets. Vérifiez que le serveur les bloque.',
      en: 'A forgotten .env file or backup can reveal all your secrets. Make sure the server blocks them.',
    },
    command: {
      ar: 'افحص الملفات التي يستطيع الزائر الوصول إليها. جرّب .env و.git والنسخ الاحتياطية والسجلات وملفات الإعداد، وتأكد أنها كلها ترجع 403 أو 404. أوقف عرض محتوى المجلدات، وانقل أي ملف حساس خارج مجلد النشر.',
      fr: "Vérifiez les fichiers accessibles depuis le navigateur. Testez .env, .git, les sauvegardes, les logs et les fichiers de configuration : ils doivent tous renvoyer 403 ou 404. Désactivez le listing des dossiers et déplacez tout fichier sensible hors du dossier publié.",
      en: 'Check which files a visitor can reach. Test .env, .git, backups, logs and config files; all must return 403 or 404. Turn off directory listing and move any sensitive file outside the published folder.',
    },
  },
  {
    id: 'git-secrets',
    title: {
      ar: 'فحص Git والمفاتيح المسرّبة',
      fr: 'Auditer Git et les secrets exposés',
      en: 'Audit Git for leaked secrets',
    },
    summary: {
      ar: 'حذف المفتاح من الكود لا يمحوه من تاريخ Git. افحص التاريخ، واستبدل أي مفتاح ظهر فعلًا.',
      fr: "Supprimer une clé du code ne l'efface pas de l'historique Git. Auditez l'historique et remplacez toute clé réellement exposée.",
      en: 'Deleting a key from the code does not erase it from Git history. Audit the history and replace any key that was truly exposed.',
    },
    command: {
      ar: 'افحص تاريخ Git كاملًا بحثًا عن مفاتيح أو كلمات مرور أو رموز دخلت في commit سابق. لا تعرض القيم؛ اذكر النوع والملف والـcommit. لكل مفتاح ظهر، اكتب خطوات استبداله من لوحة المزوّد، ثم أضف فحصًا يمنع دخول أي سر في commit جديد.',
      fr: "Auditez tout l'historique Git à la recherche de clés, mots de passe ou jetons dans d'anciens commits. N'affichez pas les valeurs ; indiquez le type, le fichier et le commit. Pour chaque clé exposée, expliquez comment la remplacer chez le fournisseur, puis ajoutez un contrôle qui bloque tout nouveau secret.",
      en: 'Audit the entire Git history for keys, passwords or tokens in earlier commits. Do not print values; name the type, file and commit. For each exposed key, explain how to replace it at the provider, then add a check that blocks any new secret.',
    },
  },
  {
    id: 'backup-waf',
    title: {
      ar: 'النسخ الاحتياطي والجدار الناري',
      fr: 'Sauvegardes et pare-feu',
      en: 'Backups and a firewall',
    },
    summary: {
      ar: 'نسخة واحدة على نفس الخادم ليست حماية. احفظ نسخة مشفّرة خارج الخادم، وضع جدارًا أمام الطلبات.',
      fr: "Une sauvegarde sur le même serveur ne protège pas. Gardez une copie chiffrée ailleurs et placez un pare-feu devant les requêtes.",
      en: 'A single backup on the same server is not protection. Keep an encrypted copy elsewhere and put a firewall in front of requests.',
    },
    command: {
      ar: 'راجع النسخ الاحتياطي: يجب أن يكون يوميًا، مشفّرًا، محفوظًا خارج خادم الموقع، ومعه خطوات استرجاع مجرّبة. بعدها اقترح جدارًا ناريًا (Cloudflare) مع قواعد للروبوتات وحد للطلبات على الدخول والـAPI.',
      fr: "Vérifiez les sauvegardes : quotidiennes, chiffrées, stockées hors du serveur du site, avec une procédure de restauration testée. Proposez ensuite un pare-feu (Cloudflare) avec des règles anti-robots et une limite sur la connexion et l'API.",
      en: 'Review backups: daily, encrypted, stored outside the site server, with a tested restore procedure. Then propose a firewall (Cloudflare) with bot rules and request limits on sign-in and the API.',
    },
  },
  {
    id: 'alerts',
    title: {
      ar: 'التنبيهات الفورية',
      fr: 'Alertes en temps réel',
      en: 'Real-time alerts',
    },
    summary: {
      ar: 'اعرف بالهجوم في لحظته. أرسل تنبيهًا عند دخول مدير جديد أو محاولات فاشلة كثيرة أو تغيّر غير متوقع.',
      fr: "Apprenez l'attaque au moment où elle arrive. Alertez sur une connexion admin inhabituelle, des échecs répétés ou un changement inattendu.",
      en: 'Learn about an attack as it happens. Alert on an unusual admin sign-in, repeated failures or an unexpected change.',
    },
    command: {
      ar: 'أضف تنبيهات فورية (بريد أو Telegram) عند دخول مدير من جهاز جديد، أو محاولات فاشلة كثيرة، أو إنشاء حساب مدير، أو أخطاء مفاجئة. لا تضع أسرارًا داخل التنبيه، وضع سقفًا لعدد الرسائل. أرسل تنبيهًا تجريبيًا للتأكد.',
      fr: "Ajoutez des alertes immédiates (e-mail ou Telegram) pour une connexion admin depuis un nouvel appareil, de nombreux échecs, la création d'un compte admin ou une vague d'erreurs. N'incluez aucun secret dans l'alerte, limitez le nombre de messages et envoyez une alerte de test.",
      en: 'Add immediate alerts (email or Telegram) for an admin sign-in from a new device, many failures, a new admin account or a burst of errors. Include no secrets in the alert, cap the number of messages, and send a test alert.',
    },
  },
  {
    id: 'pentest',
    title: {
      ar: 'اختبار اختراق على نسخة تجريبية',
      fr: 'Test d’intrusion sur une copie de test',
      en: 'Penetration test on a staging copy',
    },
    summary: {
      ar: 'اختبر موقعك كما يفعل المهاجم، لكن على نسخة تجريبية فقط، وأصلح ما تجده ثم أعد الاختبار.',
      fr: 'Testez comme un attaquant, mais sur une copie de test uniquement, corrigez, puis recommencez.',
      en: 'Test like an attacker, but on a staging copy only, fix what you find, then test again.',
    },
    command: {
      ar: 'تصرّف كمختبر اختراق أخلاقي لموقعي فقط. هاجم نسخة تجريبية لا الموقع الحي: جرّب تجاوز الدخول، وتغيير المعرّفات، والحقن، ورفع ملف خبيث، وتغيير السعر. لا تحذف بيانات ولا ترسل رسائل لمستخدمين. أعطني كل ثغرة بدرجتها وإصلاحها، ثم أعد الاختبار.',
      fr: "Agissez comme un pentester éthique pour mon site uniquement. Attaquez une copie de test, jamais la production : contournement de connexion, changement d'identifiants, injection, upload malveillant, modification de prix. Ne supprimez aucune donnée et n'envoyez aucun message aux utilisateurs. Donnez chaque faille avec sa gravité et son correctif, puis retestez.",
      en: 'Act as an ethical pentester for my site only. Attack a staging copy, never production: sign-in bypass, ID changes, injection, malicious upload, price tampering. Do not delete data or message real users. Report each issue with severity and a fix, then retest.',
    },
  },
];
