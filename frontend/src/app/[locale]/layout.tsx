import type { Metadata, Viewport } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Readex_Pro, Reem_Kufi, Marcellus } from 'next/font/google';
import '../globals.css';

// Foundations type pairing: Readex Pro (UI, Arabic + Latin), Reem Kufi (Arabic display), Marcellus (Latin display)
const readex = Readex_Pro({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-sans' });
const reemKufi = Reem_Kufi({ subsets: ['arabic'], weight: ['600', '700'], display: 'swap', variable: '--font-display-ar' });
const marcellus = Marcellus({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-display-latin' });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dzprimeacademy.live';

  const title = isAr
    ? 'DZ PRIME ACADEMY | المنصة التعليمية والخدماتية الجزائرية'
    : 'DZ PRIME ACADEMY | La plateforme éducative et de services algérienne';

  const description = isAr
    ? 'المنصة التعليمية الجزائرية: مساعد الامتحانات والملخصات الذكي، حصص الدعم المباشرة (Dawarat Live)، بطاقة العضوية الرقمية المشفرة، وشبكة سفراء معتمدين في 58 ولاية.'
    : "La plateforme académique algérienne : assistant examens, cours interactifs en direct, carte numérique certifiée et réseau d'ambassadeurs dans les 58 wilayas.";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: '%s | DZ PRIME ACADEMY',
    },
    description,
    keywords: [
      'DZ Prime Academy',
      'منصة ديزاد برايم',
      'ديزاد برايم أكاديمي',
      'امتحانات الجزائر',
      'مواضيع بكالوريا محلولة 2026',
      'ملخصات LMD الجزائر',
      'سفراء الجامعات الجزائرية 58 ولاية',
      'بطاقة الطالب الرقمية الجزائر',
      'حصص بث مباشر دروس دعم',
      'Annales Corrigées Algérie',
      'BAC 2026 Algérie',
      'Université USTHB Bab Ezzouar',
      'Faculté de Médecine Alger',
      'Plateforme EdTech Algérie',
    ],
    authors: [{ name: 'DZ PRIME ACADEMY', url: baseUrl }],
    creator: 'DZ PRIME ACADEMY',
    publisher: 'DZ PRIME ACADEMY',
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        ar: `${baseUrl}/ar`,
        fr: `${baseUrl}/fr`,
        'x-default': `${baseUrl}/ar`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: 'DZ PRIME ACADEMY',
      locale: isAr ? 'ar_DZ' : 'fr_DZ',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/images/og-banner.jpg`,
          width: 1200,
          height: 630,
          alt: 'DZ PRIME ACADEMY 2026',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/images/og-banner.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/favicon.ico',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default async function LocalizedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === 'ar';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dzprimeacademy.live';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': `${baseUrl}/#organization`,
        name: 'DZ PRIME ACADEMY',
        alternateName: 'منصة ديزاد برايم أكاديمي',
        url: baseUrl,
        logo: `${baseUrl}/images/logo.png`,
        description:
          'المنصة التعليمية والأكاديمية الجزائرية للتحضير للبكالوريا والدراسة الجامعية والطب عبر 58 ولاية.',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'DZ',
          addressLocality: 'Algiers',
        },
        sameAs: [
          'https://t.me/dzprime_academy',
          'https://wa.me/qr/5473INCXN3HJI1',
          'https://www.linkedin.com/company/dzprimeacademy',
          'https://www.instagram.com/mr.k_dz.prime',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+213 555 93 54 20',
          contactType: 'customer service',
          email: 'contact@dzprimeacademy.live',
          availableLanguage: ['Arabic', 'French'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'DZ PRIME ACADEMY',
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
        inLanguage: ['ar', 'fr'],
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/ar/exams?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning className={`${readex.variable} ${reemKufi.variable} ${marcellus.variable}`} style={{ ['--font-display' as string]: isRtl ? 'var(--font-display-ar)' : 'var(--font-display-latin)' }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedLocale = localStorage.getItem('dz_prime_locale');
                  if (savedLocale) {
                    document.cookie = "dz_prime_locale=" + savedLocale + "; path=/; max-age=31536000; SameSite=Lax";
                  }
                  var savedTheme = localStorage.getItem('dz_prime_theme');
                  if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground font-sans selection:bg-gold-500 selection:text-navy-950 transition-colors duration-300"
      >
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
