export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ActivationEmailParams {
  to: string;
  name: string;
  token: string;
  locale?: string;
}

// Anything a person typed (names) must be escaped before it goes into an HTML email.
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ success: boolean; error?: string; mode: 'resend' | 'smtp' | 'preview' }> {
  // 1. Resend API (Recommended for Vercel - Free 3,000/mo)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'DZ Prime Academy <noreply@dzprimeacademy.live>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`[Email / Resend] Sent to ${to} (ID: ${data.id})`);
        return { success: true, mode: 'resend' };
      } else {
        console.error('[Email / Resend Error]', data);
        return { success: false, error: data.message || 'Resend API error', mode: 'resend' };
      }
    } catch (err: any) {
      console.error('[Email / Resend Exception]', err);
    }
  }

  // 2. Gmail / Custom SMTP (Free 500/day with Gmail App Password or Zoho/Hostinger SMTP)
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST;

  if ((gmailUser && gmailPass) || smtpHost) {
    try {
      // Dynamic require to prevent breaking if nodemailer isn't installed
      const nodemailer = require('nodemailer');
      const transporter = gmailUser
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: gmailUser,
              pass: gmailPass,
            },
          })
        : nodemailer.createTransport({
            host: smtpHost,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

      const rawFrom = process.env.EMAIL_FROM || (gmailUser ? `"DZ Prime Academy" <${gmailUser}>` : '"DZ Prime Academy" <noreply@dzprimeacademy.live>');
      const fromEmail = rawFrom.includes('<') ? rawFrom : `"DZ Prime Academy" <${rawFrom}>`;
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
        text,
      });

      console.log(`[Email / SMTP] Sent successfully to ${to}`);
      return { success: true, mode: 'smtp' };
    } catch (err: any) {
      console.error('[Email / SMTP Error]', err);
    }
  }

  // 3. Dev / Staging Preview Fallback (Never crashes registration)
  console.log('================================================================');
  console.log(`[EMAIL DISPATCH PREVIEW - NO API KEY CONFIGURED]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text summary: ${text || 'View HTML activation email'}`);
  console.log('================================================================');

  return { success: true, mode: 'preview' };
}

export function buildActivationEmailTemplate({ name, activationUrl, locale = 'ar' }: { name: string; activationUrl: string; locale?: string }) {
  const isAr = locale === 'ar';
  const logoUrl = 'https://www.dzprimeacademy.live/images/dzprime-gold-emblem.png';

  return `
<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'fr'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${isAr ? 'تأكيد تفعيل حسابك في DZ Prime Academy' : 'Activez votre compte DZ Prime Academy'}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    .light-text {
      color: #F8FAFC !important;
    }
    .muted-light {
      color: #E2E8F0 !important;
    }
    .gold-text {
      color: #F5D061 !important;
    }
    .gold-btn:hover {
      background: #FFE082 !important;
      box-shadow: 0 10px 35px rgba(245, 208, 97, 0.6) !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050814; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050814; padding: 40px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0C1226; border: 1.5px solid #D4AF37; border-radius: 28px; overflow: hidden; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75);">
          
          <!-- Top Royal Gold Bar -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #B8860B 0%, #F5D061 50%, #B8860B 100%);"></td>
          </tr>

          <!-- Header Logo & Branding Section -->
          <tr>
            <td align="center" style="padding: 40px 30px 20px 30px; background: linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(12, 18, 38, 0) 100%);">
              <!-- Official Emblem Logo -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px auto;">
                <tr>
                  <td align="center" style="width: 84px; height: 84px; border-radius: 50%; border: 2.5px solid #F5D061; background-color: #050814; padding: 4px; box-shadow: 0 8px 24px rgba(212, 175, 55, 0.35);">
                    <img src="${logoUrl}" width="76" height="76" alt="DZ PRIME ACADEMY" style="display: block; border: 0; border-radius: 50%; outline: none;" />
                  </td>
                </tr>
              </table>

              <!-- Brand Name -->
              <div style="font-size: 24px; font-weight: 900; color: #FFFFFF !important; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                DZ <span style="color: #F5D061 !important;">PRIME</span> ACADEMY
              </div>
              <div style="font-size: 11px; font-weight: 800; color: #F5D061 !important; letter-spacing: 2px; text-transform: uppercase;">
                ${isAr ? 'المنصة الأكاديمية الجزائرية • 58 ولاية' : 'Plateforme Nationale d\'Excellence • 58 Wilayas'}
              </div>
            </td>
          </tr>

          <!-- Welcome & Message Body -->
          <tr>
            <td style="padding: 10px 40px 30px 40px; text-align: ${isAr ? 'right' : 'left'};">
              <!-- Greeting -->
              <h1 style="font-size: 24px; font-weight: 900; color: #FFFFFF !important; margin: 0 0 16px 0; line-height: 1.4;">
                ${isAr ? `مرحباً بك يا ${escapeHtml(name)} 👋` : `Bienvenue ${escapeHtml(name)} 👋`}
              </h1>
              
              <!-- Lead Paragraph -->
              <p style="font-size: 15px; line-height: 1.8; color: #F1F5F9 !important; margin: 0 0 24px 0; font-weight: 500;">
                ${
                  isAr
                    ? 'شكراً لانضمامك إلى مجتمع <strong>DZ Prime Academy</strong>. يرجى تأكيد بريدك الإلكتروني وتفعيل حسابك عبر الضغط على الزر الذهبي أدناه للولوج الفوري إلى جميع الميزات الأكاديمية.'
                    : 'Merci d\'avoir rejoint <strong>DZ Prime Academy</strong>. Veuillez confirmer votre adresse email et activer votre compte en cliquant sur le bouton ci-dessous pour accéder immédiatement à l\'ensemble de nos services.'
                }
              </p>

              <!-- Features Highlight Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #121A36; border: 1px solid rgba(245, 208, 97, 0.25); border-radius: 18px; margin: 0 0 28px 0; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 800; color: #F5D061 !important; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      ${isAr ? '✨ ما ينتظرك داخل المنصة فور التفعيل:' : '✨ Ce qui vous attend dès l\'activation :'}
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #FFFFFF !important; font-weight: 600;">
                          📚 <span style="color: #FFFFFF !important;">${isAr ? 'أكثر من 12,000 موضوع امتحان رسمي مع الحلول النموذجية' : '+12 000 annales officielles avec corrigés types'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #FFFFFF !important; font-weight: 600;">
                          🎥 <span style="color: #FFFFFF !important;">${isAr ? 'حصص بث مباشر أسبوعية وتفاعلية مع نخبة الأساتذة (Dawarat)' : 'Sessions interactives en direct chaque semaine (Dawarat Live)'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #FFFFFF !important; font-weight: 600;">
                          🤖 <span style="color: #FFFFFF !important;">${isAr ? 'مساعد الامتحانات والملخصات المخصص لجامعتك وتخصصك' : 'Assistant guidant vers vos cours et examens'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #FFFFFF !important; font-weight: 600;">
                          💳 <span style="color: #FFFFFF !important;">${isAr ? 'بطاقة العضوية الرقمية المشفرة مع رمز التحقق الوطني QR' : 'Carte de membre digitale sécurisée avec QR national'}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <!-- High-contrast Solid Luxury Button -->
                    <a href="${activationUrl}" target="_blank" class="gold-btn" style="display: inline-block; padding: 18px 48px; background-color: #F5D061; background: linear-gradient(135deg, #F5D061 0%, #E6C86E 50%, #D4AF37 100%); color: #05070D !important; font-size: 16px; font-weight: 900; text-decoration: none; border-radius: 16px; box-shadow: 0 8px 30px rgba(245, 208, 97, 0.45); text-align: center; letter-spacing: 0.5px;">
                      ${isAr ? '✓ تفعيل حسابي الآن والبدء' : '✓ Activer mon compte maintenant'}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link Card -->
              <div style="background-color: #080D1D; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 16px; margin-top: 24px;">
                <p style="font-size: 12px; color: #E2E8F0 !important; margin: 0 0 8px 0; font-weight: 600;">
                  ${isAr ? 'إذا لم يعمل الزر، يرجى نسخ هذا الرابط ولصقه في متصفحك:' : 'Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :'}
                </p>
                <p style="font-size: 12px; color: #F5D061 !important; word-break: break-all; margin: 0; font-family: monospace;">
                  <a href="${activationUrl}" style="color: #F5D061 !important; text-decoration: underline;">${activationUrl}</a>
                </p>
              </div>

              <!-- Security Notice & Expiry -->
              <div style="margin-top: 24px; padding: 12px 16px; border-radius: 12px; background-color: rgba(245, 208, 97, 0.08); border-left: ${isAr ? 'none' : '4px solid #F5D061'}; border-right: ${isAr ? '4px solid #F5D061' : 'none'};">
                <p style="font-size: 13px; color: #FDE68A !important; margin: 0; font-weight: 600;">
                  ⏳ ${isAr ? 'ملاحظة أمنية: هذا الرابط صالح لمدة 24 ساعة فقط.' : 'Notice de sécurité : Ce lien est valable pendant 24 heures seulement.'}
                </p>
                <p style="font-size: 12px; color: #CBD5E1 !important; margin: 6px 0 0 0;">
                  ${isAr ? 'إذا لم تكن أنت من أنشأ هذا الحساب، يمكنك تجاهل هذه الرسالة دون أي قلق.' : 'Si vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer cet email.'}
                </p>
              </div>
            </td>
          </tr>

          <!-- Subtle Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.12); margin: 0;">
            </td>
          </tr>

          <!-- Footer & Support Channels -->
          <tr>
            <td style="padding: 28px 40px; text-align: center; background: linear-gradient(180deg, rgba(12, 18, 38, 0) 0%, rgba(5, 8, 20, 0.8) 100%);">
              <p style="font-size: 13px; color: #FFFFFF !important; font-weight: 700; margin: 0 0 12px 0;">
                ${isAr ? 'تحتاج إلى مساعدة أو استفسار؟ تواصل معنا مباشرة:' : 'Besoin d\'aide ? Contactez notre support officiel :'}
              </p>

              <!-- Social Links Pills -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px auto;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="https://wa.me/qr/5473INCXN3HJI1" target="_blank" style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ADE80 !important; font-size: 12px; font-weight: 700; text-decoration: none;">
                      💬 WhatsApp
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://t.me/dzprime_academy" target="_blank" style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.4); color: #38BDF8 !important; font-size: 12px; font-weight: 700; text-decoration: none;">
                      ✈️ Telegram
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://www.instagram.com/mr.k_dz.prime?stkn=c2ptNW5hYmRtMWh6" target="_blank" style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.4); color: #F472B6 !important; font-size: 12px; font-weight: 700; text-decoration: none;">
                      📸 Instagram
                    </a>
                  </td>
                </tr>
              </table>

              <div style="font-size: 11px; color: #CBD5E1 !important; line-height: 1.6;">
                DZ Prime Academy © 2026 • 58 Wilayas Coverage • dzprimeacademy.live
                <br>
                <span style="color: #F5D061 !important;">contact@dzprimeacademy.live</span> • +213 555 93 54 20
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendActivationEmail({ to, name, token, locale = 'ar' }: ActivationEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dzprimeacademy.live';
  const activationUrl = `${baseUrl}/${locale}/activate?token=${token}`;

  const isAr = locale === 'ar';
  const subject = isAr
    ? 'تفعيل حسابك في DZ Prime Academy 🎓'
    : 'Activez votre compte DZ Prime Academy 🎓';

  const html = buildActivationEmailTemplate({ name, activationUrl, locale });
  const text = isAr
    ? `مرحباً بك ${name} في DZ Prime Academy.\nلتفعيل حسابك، يرجى فتح الرابط التالي:\n${activationUrl}\n(صالح لمدة 24 ساعة)`
    : `Bienvenue ${name} sur DZ Prime Academy.\nPour activer votre compte, cliquez sur le lien suivant :\n${activationUrl}\n(Valable 24 heures)`;

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

// Password reset link. Valid 30 minutes and for one use (enforced by /api/auth/reset-password).
export async function sendPasswordResetEmail({ to, name, token, locale = 'ar' }: ActivationEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dzprimeacademy.live';
  const lang = ['ar', 'fr', 'en'].includes(locale) ? locale : 'ar';
  const resetUrl = `${baseUrl}/${lang}/reset-password?token=${token}`;
  const isAr = lang === 'ar';
  const subject = isAr ? 'إعادة تعيين كلمة المرور - DZ Prime Academy' : 'Réinitialisation du mot de passe - DZ Prime Academy';
  const safeName = escapeHtml(name);

  const html = `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'fr'}" dir="${isAr ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px;background:#0B1021;font-family:Arial,Helvetica,sans-serif;color:#F8FAFC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#111936;border:1px solid #2A3355;border-radius:16px;">
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#F5D061;">${isAr ? 'إعادة تعيين كلمة المرور' : 'Réinitialisation du mot de passe'}</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#E2E8F0;">${isAr ? `مرحباً ${safeName}، طلبتَ إعادة تعيين كلمة المرور. الرابط صالح لمدة 30 دقيقة ويُستعمل مرة واحدة.` : `Bonjour ${safeName}, vous avez demandé la réinitialisation de votre mot de passe. Le lien est valable 30 minutes et ne s'utilise qu'une fois.`}</p>
        <p style="margin:24px 0;"><a href="${resetUrl}" style="display:inline-block;padding:14px 24px;background:#F5D061;color:#0B1021;font-weight:bold;text-decoration:none;border-radius:12px;">${isAr ? 'اختيار كلمة مرور جديدة' : 'Choisir un nouveau mot de passe'}</a></p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#94A3B8;">${isAr ? 'إن لم تطلب ذلك، تجاهل هذه الرسالة وستبقى كلمة مرورك كما هي.' : "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe ne changera pas."}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const text = isAr
    ? `مرحباً ${name}،\nلإعادة تعيين كلمة المرور افتح الرابط التالي (صالح 30 دقيقة، لمرة واحدة):\n${resetUrl}\nإن لم تطلب ذلك، تجاهل الرسالة.`
    : `Bonjour ${name},\nPour réinitialiser votre mot de passe, ouvrez ce lien (valable 30 minutes, usage unique) :\n${resetUrl}\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`;

  return sendEmail({ to, subject, html, text });
}
