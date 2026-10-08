import React from 'react';
import {
  Send,
  Instagram,
  Facebook,
  Video,
  Youtube,
  Linkedin,
  Twitter,
  Globe,
  MessageCircle,
  Github,
  Bot,
  Smartphone,
  CreditCard,
  Layers,
  MapPin,
  Phone,
  Mail,
  Shield,
  Award,
} from 'lucide-react';

export type SocialPlatformType =
  | 'whatsapp'
  | 'telegram'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'twitter'
  | 'discord'
  | 'github'
  | 'website';

export interface FooterSocialLink {
  id: string;
  platform: SocialPlatformType;
  title: string;
  url: string;
  enabled: boolean;
}

export interface FooterQuickLink {
  id: string;
  labelAr: string;
  labelFr: string;
  url: string;
  iconName?: 'bot' | 'card' | 'community' | 'ambassadors' | 'staff' | 'courses' | 'link';
  enabled: boolean;
}

export interface FooterEcosystemItem {
  id: string;
  name: string;
  subtextAr?: string;
  subtextFr?: string;
  iconName: 'telegram' | 'bot' | 'globe' | 'mobile' | 'shield' | 'card';
  url?: string;
  enabled: boolean;
}

export interface FooterConfig {
  brandBio: {
    descriptionAr: string;
    descriptionFr: string;
  };
  socialLinks: FooterSocialLink[];
  quickLinks: FooterQuickLink[];
  ecosystemItems: FooterEcosystemItem[];
  contactInfo: {
    phone: string;
    email: string;
    addressAr: string;
    addressFr: string;
  };
  bottomBar: {
    copyrightAr: string;
    copyrightFr: string;
    sloganAr: string;
    sloganFr: string;
  };
}

export interface PlatformMetadata {
  type: SocialPlatformType;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  icon: any;
  colorHex: string;
  bgLight: string;
  hoverClass: string;
  defaultPlaceholder: string;
}

export const SUPPORTED_SOCIAL_PLATFORMS: PlatformMetadata[] = [
  {
    type: 'whatsapp',
    labelAr: 'واتساب (WhatsApp)',
    labelFr: 'WhatsApp',
    labelEn: 'WhatsApp',
    icon: MessageCircle,
    colorHex: '#e8eaec',
    bgLight: 'bg-[#e8eaec]/10 text-[#e8eaec] border-[#e8eaec]/30',
    hoverClass: 'hover:text-[#e8eaec]',
    defaultPlaceholder: 'https://wa.me/qr/5473INCXN3HJI1',
  },
  {
    type: 'telegram',
    labelAr: 'تيليغرام (Telegram)',
    labelFr: 'Telegram',
    labelEn: 'Telegram',
    icon: Send,
    colorHex: '#e8eaec',
    bgLight: 'bg-[#e8eaec]/10 text-[#e8eaec] border-[#e8eaec]/30',
    hoverClass: 'hover:text-[#e8eaec]',
    defaultPlaceholder: 'https://t.me/dzprime_academy',
  },
  {
    type: 'facebook',
    labelAr: 'فيسبوك (Facebook)',
    labelFr: 'Facebook',
    labelEn: 'Facebook',
    icon: Facebook,
    colorHex: '#e8eaec',
    bgLight: 'bg-[#e8eaec]/10 text-[#e8eaec] border-[#e8eaec]/30',
    hoverClass: 'hover:text-[#e8eaec]',
    defaultPlaceholder: 'https://facebook.com/dzprimeacademy',
  },
  {
    type: 'instagram',
    labelAr: 'إنستغرام (Instagram)',
    labelFr: 'Instagram',
    labelEn: 'Instagram',
    icon: Instagram,
    colorHex: '#E4405F',
    bgLight: 'bg-[#E4405F]/10 text-[#E4405F] border-[#E4405F]/30',
    hoverClass: 'hover:text-[#E4405F]',
    defaultPlaceholder: 'https://www.instagram.com/mr.k_dz.prime',
  },
  {
    type: 'tiktok',
    labelAr: 'تيك توك (TikTok)',
    labelFr: 'TikTok',
    labelEn: 'TikTok',
    icon: Video,
    colorHex: '#EE1D52',
    bgLight: 'bg-[#EE1D52]/10 text-[#EE1D52] border-[#EE1D52]/30',
    hoverClass: 'hover:text-[#EE1D52]',
    defaultPlaceholder: 'https://tiktok.com/@dzprimeacademy',
  },
  {
    type: 'youtube',
    labelAr: 'يوتيوب (YouTube)',
    labelFr: 'YouTube',
    labelEn: 'YouTube',
    icon: Youtube,
    colorHex: '#FF0000',
    bgLight: 'bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/30',
    hoverClass: 'hover:text-[#FF0000]',
    defaultPlaceholder: 'https://youtube.com/@dzprimeacademy',
  },
  {
    type: 'linkedin',
    labelAr: 'لينكد إن (LinkedIn)',
    labelFr: 'LinkedIn',
    labelEn: 'LinkedIn',
    icon: Linkedin,
    colorHex: '#e8eaec',
    bgLight: 'bg-[#e8eaec]/10 text-[#e8eaec] border-[#e8eaec]/30',
    hoverClass: 'hover:text-[#e8eaec]',
    defaultPlaceholder: 'https://www.linkedin.com/company/dzprimeacademy',
  },
  {
    type: 'twitter',
    labelAr: 'إكس / تويتر (X / Twitter)',
    labelFr: 'X / Twitter',
    labelEn: 'X / Twitter',
    icon: Twitter,
    colorHex: '#1DA1F2',
    bgLight: 'bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/30',
    hoverClass: 'hover:text-[#1DA1F2]',
    defaultPlaceholder: 'https://x.com/dzprimeacademy',
  },
  {
    type: 'discord',
    labelAr: 'ديسكورد (Discord)',
    labelFr: 'Discord',
    labelEn: 'Discord',
    icon: MessageCircle,
    colorHex: '#e8eaec',
    bgLight: 'bg-[#e8eaec]/10 text-[#e8eaec] border-[#e8eaec]/30',
    hoverClass: 'hover:text-[#e8eaec]',
    defaultPlaceholder: 'https://discord.gg/dzprime',
  },
  {
    type: 'github',
    labelAr: 'غيت هاب (GitHub)',
    labelFr: 'GitHub',
    labelEn: 'GitHub',
    icon: Github,
    colorHex: '#333333',
    bgLight: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    hoverClass: 'hover:text-slate-300',
    defaultPlaceholder: 'https://github.com/dzprimeacademy',
  },
  {
    type: 'website',
    labelAr: 'موقع إلكتروني (Website)',
    labelFr: 'Site Web',
    labelEn: 'Website',
    icon: Globe,
    colorHex: '#6db1d8',
    bgLight: 'bg-[#6db1d8]/10 text-[#6db1d8] border-[#6db1d8]/30',
    hoverClass: 'hover:text-[#6db1d8]',
    defaultPlaceholder: 'https://dzprimeacademy.com',
  },
];

export function getPlatformMeta(type: string): PlatformMetadata {
  const found = SUPPORTED_SOCIAL_PLATFORMS.find((p) => p.type === type.toLowerCase());
  return (
    found || {
      type: 'website',
      labelAr: type,
      labelFr: type,
      labelEn: type,
      icon: Globe,
      colorHex: '#6db1d8',
      bgLight: 'bg-[#6db1d8]/10 text-[#6db1d8] border-[#6db1d8]/30',
      hoverClass: 'hover:text-[#6db1d8]',
      defaultPlaceholder: 'https://',
    }
  );
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  brandBio: {
    descriptionAr:
      'المنصة الوطنية التعليمية الجزائرية. نوفر لطلبة البكالوريا والجامعات وصولاً حصرياً لأكبر بنك امتحانات مصححة ونخبة الأساتذة المعتمدين عبر 58 ولاية.',
    descriptionFr:
      "La plateforme éducative nationale algérienne. Nous offrons aux étudiants du BAC et de l'université un accès exclusif à la plus grande banque d'épreuves corrigées et aux meilleurs enseignants à travers les 58 wilayas.",
  },
  socialLinks: [
    {
      id: 'sl-telegram',
      platform: 'telegram',
      title: 'Telegram Official',
      url: 'https://t.me/dzprime_academy',
      enabled: true,
    },
    {
      id: 'sl-whatsapp',
      platform: 'whatsapp',
      title: 'WhatsApp Official',
      url: 'https://wa.me/qr/5473INCXN3HJI1',
      enabled: true,
    },
    {
      id: 'sl-instagram',
      platform: 'instagram',
      title: 'Instagram',
      url: 'https://www.instagram.com/mr.k_dz.prime?stkn=c2ptNW5hYmRtMWh6',
      enabled: true,
    },
    {
      id: 'sl-facebook',
      platform: 'facebook',
      title: 'Facebook Page',
      url: 'https://facebook.com/dzprimeacademy',
      enabled: true,
    },
    {
      id: 'sl-tiktok',
      platform: 'tiktok',
      title: 'TikTok Official',
      url: 'https://tiktok.com/@dzprimeacademy',
      enabled: true,
    },
    {
      id: 'sl-youtube',
      platform: 'youtube',
      title: 'YouTube Channel',
      url: 'https://youtube.com/@dzprimeacademy',
      enabled: true,
    },
    {
      id: 'sl-linkedin',
      platform: 'linkedin',
      title: 'LinkedIn Company',
      url: 'https://www.linkedin.com/company/dzprimeacademy',
      enabled: false,
    },
  ],
  quickLinks: [
    {
      id: 'ql-bot',
      labelAr: 'مساعد الامتحانات',
      labelFr: 'Assistant examens',
      url: '/bot',
      iconName: 'bot',
      enabled: true,
    },
    {
      id: 'ql-card',
      labelAr: 'بطاقة الطالب الرقمية المعتمدة',
      labelFr: 'Carte Étudiant Numérique',
      url: '/card',
      iconName: 'card',
      enabled: true,
    },
    {
      id: 'ql-community',
      labelAr: 'مجتمع الأكاديمية والفيديوهات',
      labelFr: 'Communauté & Vidéos',
      url: '/community',
      iconName: 'community',
      enabled: true,
    },
    {
      id: 'ql-ambassadors',
      labelAr: 'شبكة السفراء المعتمدين 58 ولاية',
      labelFr: 'Réseau National des Ambassadeurs',
      url: '/ambassadors',
      iconName: 'ambassadors',
      enabled: true,
    },
    {
      id: 'ql-courses',
      labelAr: 'الدورات والورشات التكوينية (Dawarat)',
      labelFr: 'Formations & Dawarat',
      url: '/dawarat',
      iconName: 'courses',
      enabled: true,
    },
  ],
  ecosystemItems: [
    {
      id: 'eco-telegram',
      name: 'Telegram',
      subtextAr: 'قنوات الإعلانات والبث',
      subtextFr: 'Canaux de diffusion',
      iconName: 'telegram',
      url: 'https://t.me/dzprime_academy',
      enabled: true,
    },
    {
      id: 'eco-bots',
      name: 'Assistant',
      subtextAr: 'مساعد ذكي للحلول',
      subtextFr: 'Assistance IA & Sujets',
      iconName: 'bot',
      url: '/bot',
      enabled: true,
    },
    {
      id: 'eco-portal',
      name: 'Web Portal',
      subtextAr: 'البوابة السحابية الموحدة',
      subtextFr: 'Portail Cloud National',
      iconName: 'globe',
      url: '/',
      enabled: true,
    },
    {
      id: 'eco-mobile',
      name: 'Mobile App',
      subtextAr: 'تطبيق الهاتف قريباً',
      subtextFr: 'Application Mobile',
      iconName: 'mobile',
      url: '#',
      enabled: true,
    },
  ],
  contactInfo: {
    phone: '+213 (0) 555 93 54 20',
    email: 'contact@dzprimeacademy.live',
    addressAr: '58 ولاية • الجزائر العاصمة، الجزائر',
    addressFr: '58 Wilayas • Alger, Algérie',
  },
  bottomBar: {
    copyrightAr: 'جميع الحقوق محفوظة.',
    copyrightFr: 'Tous droits réservés.',
    sloganAr: 'فخر المنظومة التعليمية الجزائرية في 58 ولاية',
    sloganFr: "Fierté de l'éducation algérienne dans les 58 wilayas",
  },
};
