import { prisma } from '../utils/prisma';
import { sendTransactionalEmail } from './emailAlerts';

/**
 * Branded welcome mail sent the moment a customer opens an account.
 *
 * `verify`  - password sign-up: the account exists but needs its email
 *             confirmed, so the main button is the verification link.
 * `ready`   - social sign-up: the provider already verified the address, so
 *             the main button opens the store.
 *
 * The layout is table-based and every style is inline because Gmail, Outlook
 * and Apple Mail strip <style> blocks and flex/grid layouts.
 */

export interface WelcomeContact {
  phoneDisplay: string;
  phoneDigits: string;
  whatsappDigits: string;
  email: string;
}

export type WelcomeMode = 'verify' | 'ready';

export interface BuildWelcomeEmailInput {
  name: string;
  mode: WelcomeMode;
  actionUrl: string;
  storeUrl: string;
  expiresHours?: number;
  contact: WelcomeContact;
}

export const DEFAULT_WELCOME_CONTACT: WelcomeContact = {
  phoneDisplay: '0674 11 32 90',
  phoneDigits: '0674113290',
  whatsappDigits: '213674113290',
  email: 'ayoub.office.services@gmail.com',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function digitsOnly(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

/** 0674113290 -> 0674 11 32 90; other formats are kept readable. */
function formatPhone(value: string): string {
  const digits = digitsOnly(value);
  const local = digits.length === 9 && !digits.startsWith('0') ? `0${digits}` : digits;
  if (/^0\d{9}$/.test(local)) {
    return `${local.slice(0, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
  }
  return value.trim() || DEFAULT_WELCOME_CONTACT.phoneDisplay;
}

function whatsappDigits(value: string, phoneDigits: string): string {
  let digits = digitsOnly(value) || digitsOnly(phoneDigits);
  if (!digits) return DEFAULT_WELCOME_CONTACT.whatsappDigits;
  if (digits.startsWith('0')) digits = `213${digits.slice(1)}`;
  else if (digits.length === 9) digits = `213${digits}`;
  return digits;
}

/** 213674113290 -> +213 674 11 32 90 for display only. */
function formatWhatsapp(value: string): string {
  const digits = digitsOnly(value);
  if (/^213\d{9}$/.test(digits)) {
    return `+213 ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return `+${digits}`;
}

/** Reads the owner's contact details saved in the dashboard, with defaults. */
export async function loadWelcomeContact(): Promise<WelcomeContact> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'site_factory_settings' } });
    if (!row) return DEFAULT_WELCOME_CONTACT;

    const settings = JSON.parse(row.value) as {
      ownerPhone?: string;
      ownerWhatsapp?: string;
      ownerEmail?: string;
    };

    const rawPhone = String(settings.ownerPhone || '').trim();
    const phoneDigits =
      digitsOnly(rawPhone).length === 9 && !digitsOnly(rawPhone).startsWith('0')
        ? `0${digitsOnly(rawPhone)}`
        : digitsOnly(rawPhone) || DEFAULT_WELCOME_CONTACT.phoneDigits;

    const rawEmail = String(settings.ownerEmail || '').trim();
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail)
      ? rawEmail
      : DEFAULT_WELCOME_CONTACT.email;

    return {
      phoneDisplay: rawPhone ? formatPhone(rawPhone) : DEFAULT_WELCOME_CONTACT.phoneDisplay,
      phoneDigits,
      whatsappDigits: whatsappDigits(String(settings.ownerWhatsapp || ''), phoneDigits),
      email,
    };
  } catch (err) {
    console.warn('[WelcomeEmail] Could not read contact settings, using defaults:', err);
    return DEFAULT_WELCOME_CONTACT;
  }
}

function firstNameOf(name: string): string {
  const first = String(name || '').trim().split(/\s+/)[0] || 'عميلنا العزيز';
  return first.slice(0, 40);
}

function storeHost(storeUrl: string): string {
  try {
    return new URL(storeUrl).host.replace(/^www\./, '');
  } catch {
    return 'aos-tech.store';
  }
}

export function buildWelcomeEmail(input: BuildWelcomeEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const { mode, actionUrl, storeUrl, expiresHours, contact } = input;
  const firstName = firstNameOf(input.name);
  const safeName = escapeHtml(firstName);
  const safeAction = escapeHtml(actionUrl);
  const safeStore = escapeHtml(storeUrl);
  const host = escapeHtml(storeHost(storeUrl));
  const safePhone = escapeHtml(contact.phoneDisplay);
  const safeEmail = escapeHtml(contact.email);
  const isVerify = mode === 'verify';

  const subject = isVerify
    ? `أهلاً ${firstName} — أكّد بريدك لتفعيل حسابك في AOS Tech Store`
    : `أهلاً ${firstName} — حسابك في AOS Tech Store جاهز`;

  const preheader = isVerify
    ? 'خطوة واحدة تفصلك عن تتبّع طلباتك، حفظ مفضّلاتك، وإتمام طلباتك بسرعة.'
    : 'حسابك جاهز: تتبّع طلباتك، احفظ مفضّلاتك، وأتمم طلباتك بسرعة.';

  const lead = isVerify
    ? 'سعداء بانضمامك إلى AOS Tech Store. حسابك جاهز تقريباً — أكّد بريدك الإلكتروني بنقرة واحدة، وسيصبح بإمكانك تتبّع طلباتك وحفظ مفضّلاتك وإتمام طلباتك بسرعة.'
    : 'سعداء بانضمامك إلى AOS Tech Store. حسابك مفعّل الآن، ويمكنك تتبّع طلباتك وحفظ مفضّلاتك وإتمام طلباتك بسرعة.';

  const cta = isVerify ? 'تأكيد بريدي وبدء الاستخدام' : 'ابدأ التسوّق الآن';
  const ctaNote = isVerify
    ? `رابط التأكيد صالح لمدة ${expiresHours || 24} ساعة.`
    : 'يمكنك تسجيل الدخول في أي وقت من الموقع.';

  const text = [
    `أهلاً ${firstName}،`,
    '',
    lead,
    '',
    isVerify
      ? `أكّد بريدك من الرابط التالي (صالح لمدة ${expiresHours || 24} ساعة):\n${actionUrl}`
      : `حسابك جاهز. ابدأ من:\n${storeUrl}`,
    '',
    'ماذا يمنحك حسابك؟',
    '- تتبّع طلباتك من التأكيد حتى التسليم.',
    '- حفظ المنتجات المفضلة والرجوع إليها في أي وقت.',
    '- إتمام الطلبات بسرعة مع حفظ بياناتك.',
    '',
    'للتواصل معنا:',
    `هاتف: ${contact.phoneDisplay}`,
    `واتساب: https://wa.me/${contact.whatsappDigits}`,
    `البريد: ${contact.email}`,
    '',
    'إلى اللقاء،',
    'فريق AOS Tech Store',
    storeUrl,
    ...(isVerify
      ? ['', 'إذا لم تكن أنت من أنشأ هذا الحساب، تجاهل هذه الرسالة ولن يتم تفعيله.']
      : []),
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;color:#eef2f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:28px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">

          <tr>
            <td style="background-color:#0b5ed7;height:4px;line-height:4px;font-size:0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="background-color:#0f172a;padding:26px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="right" valign="middle">
                    <div style="font-size:21px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">
                      AOS <span style="color:#60a5fa;">TECH STORE</span>
                    </div>
                    <div style="font-size:12px;color:#94a3b8;padding-top:6px;">
                      خدمات المكتب ومستلزمات الإعلام الآلي &middot; الميلية، جيجل
                    </div>
                  </td>
                  <td align="left" valign="middle" width="60" style="padding-right:14px;">
                    <div style="width:48px;height:48px;line-height:48px;border-radius:12px;background-color:#0b5ed7;color:#ffffff;text-align:center;font-size:14px;font-weight:800;letter-spacing:0.5px;">AOS</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:34px 32px 0;">
              <div style="display:inline-block;background-color:#eff6ff;border:1px solid #dbeafe;border-radius:999px;padding:7px 14px;font-size:11px;font-weight:800;color:#0b5ed7;letter-spacing:0.3px;">
                ${isVerify ? 'تفعيل الحساب' : 'حساب جديد'}
              </div>
              <h1 style="margin:18px 0 12px;font-size:27px;line-height:1.45;font-weight:800;color:#0f172a;">
                أهلاً ${safeName}،
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.95;color:#475569;">
                ${escapeHtml(lead)}
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="#0b5ed7" style="border-radius:14px;">
                    <a href="${safeAction}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;font-size:16px;font-weight:800;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:14px;">
                      ${escapeHtml(cta)}
                    </a>
                  </td>
                </tr>
              </table>
              <div style="padding-top:12px;font-size:12px;line-height:1.7;color:#94a3b8;">
                ${escapeHtml(ctaNote)}
              </div>
            </td>
          </tr>

          ${
            isVerify
              ? `<tr>
            <td style="padding:18px 32px 0;">
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;font-size:11px;line-height:1.8;color:#64748b;text-align:center;">
                إذا لم يعمل الزر، انسخ هذا الرابط إلى المتصفح:<br>
                <a href="${safeAction}" target="_blank" dir="ltr" style="color:#0b5ed7;text-decoration:none;word-break:break-all;">${safeAction}</a>
              </div>
            </td>
          </tr>`
              : ''
          }

          <tr>
            <td style="padding:30px 32px 0;">
              <div style="height:1px;line-height:1px;font-size:0;background-color:#e2e8f0;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 0;">
              <div style="font-size:14px;font-weight:800;color:#0f172a;padding-bottom:14px;">
                ماذا يمنحك حسابك؟
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="30" valign="top" style="padding:0 0 15px 0;">
                    <div style="width:22px;height:22px;line-height:22px;border-radius:50%;background-color:#eff6ff;color:#0b5ed7;text-align:center;font-size:12px;font-weight:800;">&#10003;</div>
                  </td>
                  <td valign="top" style="padding:0 0 15px 0;font-size:14px;line-height:1.85;color:#475569;">
                    <strong style="color:#0f172a;">تتبّع طلباتك:</strong> من التأكيد حتى التسليم، كل شيء واضح داخل حسابك.
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="padding:0 0 15px 0;">
                    <div style="width:22px;height:22px;line-height:22px;border-radius:50%;background-color:#eff6ff;color:#0b5ed7;text-align:center;font-size:12px;font-weight:800;">&#10003;</div>
                  </td>
                  <td valign="top" style="padding:0 0 15px 0;font-size:14px;line-height:1.85;color:#475569;">
                    <strong style="color:#0f172a;">مفضّلاتك محفوظة:</strong> احفظ المنتجات التي تعجبك وارجع إليها في أي وقت.
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="padding:0 0 15px 0;">
                    <div style="width:22px;height:22px;line-height:22px;border-radius:50%;background-color:#eff6ff;color:#0b5ed7;text-align:center;font-size:12px;font-weight:800;">&#10003;</div>
                  </td>
                  <td valign="top" style="padding:0 0 15px 0;font-size:14px;line-height:1.85;color:#475569;">
                    <strong style="color:#0f172a;">طلبات أسرع:</strong> بياناتك محفوظة، والطلب القادم يستغرق دقائق فقط.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:14px 32px 0;">
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px 22px;">
                <div style="font-size:14px;font-weight:800;color:#0f172a;">نحن هنا إن احتجت أي شيء</div>
                <p style="margin:7px 0 14px;font-size:13px;line-height:1.8;color:#64748b;">
                  فريق AOS Tech Store يرافقك من أول سؤال إلى ما بعد التسليم.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="72" valign="top" style="padding:3px 0;font-size:13px;color:#64748b;">هاتف</td>
                    <td valign="top" style="padding:3px 0;font-size:13px;">
                      <a href="tel:${escapeHtml(contact.phoneDigits)}" dir="ltr" style="color:#0b5ed7;text-decoration:none;font-weight:700;">${safePhone}</a>
                    </td>
                  </tr>
                  <tr>
                    <td width="72" valign="top" style="padding:3px 0;font-size:13px;color:#64748b;">واتساب</td>
                    <td valign="top" style="padding:3px 0;font-size:13px;">
                      <a href="https://wa.me/${escapeHtml(contact.whatsappDigits)}" target="_blank" dir="ltr" style="color:#0b5ed7;text-decoration:none;font-weight:700;">${escapeHtml(formatWhatsapp(contact.whatsappDigits))}</a>
                    </td>
                  </tr>
                  <tr>
                    <td width="72" valign="top" style="padding:3px 0;font-size:13px;color:#64748b;">البريد</td>
                    <td valign="top" style="padding:3px 0;font-size:13px;">
                      <a href="mailto:${safeEmail}" dir="ltr" style="color:#0b5ed7;text-decoration:none;font-weight:700;word-break:break-all;">${safeEmail}</a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 32px 34px;">
              <p style="margin:0;font-size:14px;line-height:1.9;color:#475569;">
                إلى اللقاء،<br>
                <strong style="color:#0f172a;">فريق AOS Tech Store</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#0f172a;padding:24px 30px;text-align:center;">
              <div style="font-size:12px;font-weight:800;color:#e2e8f0;">AOS Tech Store</div>
              <div style="padding-top:6px;font-size:11px;line-height:1.9;color:#94a3b8;">
                الشارع الكبير، الميلية، جيجل 18300<br>
                السبت - الخميس: 08:00 - 19:00
              </div>
              <div style="padding-top:10px;font-size:11px;">
                <a href="${safeStore}" target="_blank" style="color:#93c5fd;text-decoration:none;">${host}</a>
              </div>
              <div style="padding-top:10px;font-size:10px;line-height:1.7;color:#64748b;">
                وصلتك هذه الرسالة لأنك أنشأت حساباً في AOS Tech Store.${
                  isVerify ? ' إذا لم تكن أنت من أنشأ الحساب، تجاهل هذه الرسالة ولن يتم تفعيله.' : ''
                }
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

export interface SendWelcomeEmailInput {
  email: string;
  name: string;
  mode: WelcomeMode;
  actionUrl: string;
  storeUrl: string;
  expiresHours?: number;
}

/** Sends the welcome mail through the configured transactional provider. */
export async function sendCustomerWelcomeEmail(
  input: SendWelcomeEmailInput
): Promise<boolean> {
  const contact = await loadWelcomeContact();
  const { subject, text, html } = buildWelcomeEmail({ ...input, contact });
  return sendTransactionalEmail(input.email, subject, text, html);
}
