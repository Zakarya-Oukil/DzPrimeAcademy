'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Instagram,
  Facebook,
  Video,
  Youtube,
  Globe,
  Bot,
  Smartphone,
  Phone,
  Mail,
  MapPin,
  Shield,
  CreditCard,
  Layers,
  Award,
  MessageCircle,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { DzPrimeLogo } from '../shared/DzPrimeLogo';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import {
  DEFAULT_FOOTER_CONFIG,
  FooterConfig,
  getPlatformMeta,
} from '@/lib/footerConfig';

export const Footer: React.FC = () => {
  const { t, locale } = useTranslation();
  const { currentUser } = useAuthStore();
  const pathname = usePathname() || '';

  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);

  useEffect(() => {
    // Fetch live footer configuration
    const loadFooterConfig = () => {
      fetch('/api/settings/footer')
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data === 'object' && data.brandBio) {
            setConfig(data);
          }
        })
        .catch(() => {});
    };

    loadFooterConfig();

    // Listen for live update broadcast from admin panel
    const handleFooterUpdated = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        loadFooterConfig();
      }
    };

    window.addEventListener('dzprime-footer-updated', handleFooterUpdated);
    return () => window.removeEventListener('dzprime-footer-updated', handleFooterUpdated);
  }, []);

  const isAdmin = pathname.includes('/admin');
  const isAmbassador = pathname.includes('/ambassador');
  const isTeacher = pathname.includes('/teacher');

  const footerBgClass = isAdmin
    ? 'bg-[#050505] border-white/10 text-white'
    : isAmbassador
    ? 'bg-[#0b0b0d] border-white/10 text-white'
    : isTeacher
    ? 'bg-[#f4f5f6] dark:bg-[#0b0b0d] border-amber-200/60 dark:border-gold-500/20 text-slate-800 dark:text-white'
    : 'bg-slate-100 dark:bg-[#0b0b0d] border-slate-200 dark:border-gold-500/30 text-slate-800 dark:text-white';

  const isAr = locale === 'ar';
  const isFr = locale === 'fr';

  // Bio description
  const bioDesc = isAr
    ? config.brandBio?.descriptionAr || t('hero.description')
    : config.brandBio?.descriptionFr || t('hero.description');

  // Contact Info
  const contactPhone = config.contactInfo?.phone || '+213 (0) 555 93 54 20';
  const contactEmail = config.contactInfo?.email || 'contact@dzprimeacademy.live';
  const contactAddress = isAr
    ? config.contactInfo?.addressAr || '58 ولاية • الجزائر العاصمة، الجزائر'
    : config.contactInfo?.addressFr || '58 Wilayas • Alger, Algérie';

  // Bottom Bar
  const copyrightText = isAr
    ? config.bottomBar?.copyrightAr || 'جميع الحقوق محفوظة.'
    : config.bottomBar?.copyrightFr || 'Tous droits réservés.';
  const sloganText = isAr
    ? config.bottomBar?.sloganAr || t('hierarchy.slogan')
    : config.bottomBar?.sloganFr || t('hierarchy.slogan');

  // Icon resolver for quick links
  const renderQuickLinkIcon = (iconName?: string) => {
    switch (iconName) {
      case 'bot':
        return <Bot className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />;
      case 'card':
        return <CreditCard className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />;
      case 'community':
        return <Video className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />;
      case 'ambassadors':
        return <MapPin className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />;
      case 'courses':
        return <Layers className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />;
      case 'staff':
        return <Shield className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />;
    }
  };

  // Icon resolver for ecosystem items
  const renderEcosystemIcon = (iconName: string) => {
    switch (iconName) {
      case 'telegram':
        return <Send className="w-3.5 h-3.5 text-sky-500" />;
      case 'bot':
        return <Bot className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />;
      case 'globe':
        return <Globe className="w-3.5 h-3.5 text-emerald-500" />;
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-purple-500" />;
      case 'card':
        return <CreditCard className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const activeSocialLinks = (config.socialLinks || []).filter((s) => s.enabled);
  const activeQuickLinks = (config.quickLinks || []).filter((q) => q.enabled);
  const activeEcosystemItems = (config.ecosystemItems || []).filter((e) => e.enabled);

  return (
    <footer
      data-testid="platform-footer"
      className={`w-full border-t ${footerBgClass} pt-12 pb-8 relative overflow-hidden transition-colors duration-300`}
    >
      {/* Top Gold Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-200 dark:border-gray-800">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <DzPrimeLogo size={40} showText={true} />
            <p className="text-xs text-slate-600 dark:text-gray-300 font-arabic leading-relaxed">
              {bioDesc}
            </p>

            {/* Dynamic Social Media Links with dropdown-based platform icons */}
            <div className="flex items-center gap-2 flex-wrap pt-2" data-testid="footer-social-links-container">
              {activeSocialLinks.map((item) => {
                const meta = getPlatformMeta(item.platform);
                const IconComponent = meta.icon;
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`footer-social-${item.platform}`}
                    className={`w-8 h-8 rounded-xl bg-white dark:bg-navy-850 border border-slate-300 dark:border-gold-500/30 flex items-center justify-center text-slate-700 dark:text-gray-300 ${meta.hoverClass} transition-all hover:scale-110 shadow-sm`}
                    title={item.title || meta.labelAr}
                  >
                    <IconComponent className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 2: Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gold-700 dark:text-gold-300 font-arabic">
              {t('nav.home')} & {t('nav.dashboard')}
            </h4>
            <ul className="space-y-2 text-xs font-arabic text-slate-600 dark:text-gray-300">
              {activeQuickLinks.map((link) => {
                const href = link.url.startsWith('/') ? `/${locale}${link.url}` : link.url;
                const label = isAr ? link.labelAr : link.labelFr || link.labelAr;
                return (
                  <li key={link.id}>
                    <Link
                      href={href}
                      className="hover:text-gold-600 dark:hover:text-gold-300 transition-colors flex items-center gap-1.5"
                    >
                      {renderQuickLinkIcon(link.iconName)}
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
              {currentUser &&
                (currentUser.role === 'AMBASSADOR' ||
                  ['OWNER', 'SUPER_ADMIN', 'GENERAL_ADMIN', 'ADMIN', 'COMMERCIAL_DIRECTOR', 'COORDINATOR'].includes(
                    currentUser.role
                  )) && (
                  <li>
                    <Link
                      href={`/${locale}/admin#staff`}
                      className="hover:text-gold-600 dark:hover:text-gold-300 transition-colors flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                      <span>{t('hierarchy.title')}</span>
                    </Link>
                  </li>
                )}
            </ul>
          </div>

          {/* Col 3: Digital Ecosystem */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gold-700 dark:text-gold-300 font-arabic">
              {isAr ? 'منظومتنا الرقمية' : isFr ? 'Écosystème Numérique' : 'Digital Ecosystem'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-arabic">
              {activeEcosystemItems.map((eco) => {
                const content = (
                  <div className="p-2 rounded-xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-gray-800 flex items-center gap-2 text-slate-700 dark:text-gray-300 shadow-sm hover:border-gold-500/40 transition-colors">
                    {renderEcosystemIcon(eco.iconName)}
                    <div className="overflow-hidden">
                      <div className="font-bold truncate">{eco.name}</div>
                      {(eco.subtextAr || eco.subtextFr) && (
                        <div className="text-[10px] text-gray-400 truncate">
                          {isAr ? eco.subtextAr : eco.subtextFr || eco.subtextAr}
                        </div>
                      )}
                    </div>
                  </div>
                );

                if (eco.url && eco.url !== '#') {
                  const href = eco.url.startsWith('/') ? `/${locale}${eco.url}` : eco.url;
                  const isExternal = eco.url.startsWith('http');
                  return (
                    <a
                      key={eco.id}
                      href={href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noreferrer' : undefined}
                      className="block"
                    >
                      {content}
                    </a>
                  );
                }

                return <div key={eco.id}>{content}</div>;
              })}
            </div>
          </div>

          {/* Col 4: Official Contact Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gold-700 dark:text-gold-300 font-arabic">
              {t('card.contactInfo')}
            </h4>
            <div className="space-y-2 text-xs text-slate-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                <a
                  href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                  dir="ltr"
                  className="font-mono font-medium hover:text-gold-500 transition-colors"
                >
                  {contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-mono hover:text-gold-500 transition-colors"
                >
                  {contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                <span className="font-arabic">{contactAddress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-gray-400 font-arabic">
          <p>
            © {new Date().getFullYear()} DZ PRIME ACADEMY. {copyrightText}
          </p>
          <p className="font-bold text-gold-700 dark:text-gold-300">
            🇩🇿 {sloganText}
          </p>
        </div>
      </div>
    </footer>
  );
};
