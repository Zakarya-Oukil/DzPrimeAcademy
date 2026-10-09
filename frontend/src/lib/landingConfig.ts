export interface FeaturedCourseItem {
  id: string;
  badge?: string;
  badgeColor?: string;
  thumbnailUrl: string;
  titleAr: string;
  titleFr: string;
  category: string;
  instructorNameAr: string;
  instructorNameFr: string;
  instructorAvatar?: string;
  rating: number;
  reviewsCount: number;
  durationHours: number;
  levelAr: string;
  levelFr: string;
  priceDzd: number;
  isPopular?: boolean;
}

export interface LandingPageConfig {
  hero: {
    badgeAr: string;
    badgeFr: string;
    titleLeadAr: string;
    titleLeadFr: string;
    titleHighlightAr: string;
    titleHighlightFr: string;
    titleEndAr: string;
    titleEndFr: string;
    subAr: string;
    subFr: string;
    ctaPrimaryAr: string;
    ctaPrimaryFr: string;
    ctaSecondaryAr: string;
    ctaSecondaryFr: string;
  };
  stats: {
    mode: 'MANUAL' | 'AUTO';
    examsValue: string;
    examsLabelAr: string;
    examsLabelFr: string;
    studentsValue: string;
    studentsLabelAr: string;
    studentsLabelFr: string;
    wilayasValue: string;
    wilayasLabelAr: string;
    wilayasLabelFr: string;
    satisfactionValue: string;
    satisfactionLabelAr: string;
    satisfactionLabelFr: string;
  };
  featuredCoursesSection: {
    titleAr: string;
    titleFr: string;
    subtitleAr: string;
    subtitleFr: string;
    courses: FeaturedCourseItem[];
  };
  ambassadorBanner: {
    titleAr: string;
    titleFr: string;
    bodyAr: string;
    bodyFr: string;
    ctaPrimaryAr: string;
    ctaPrimaryFr: string;
    ctaSecondaryAr: string;
    ctaSecondaryFr: string;
  };
  finalCta: {
    titleAr: string;
    titleFr: string;
    bodyAr: string;
    bodyFr: string;
    buttonTextAr: string;
    buttonTextFr: string;
  };
}

export const DEFAULT_FEATURED_COURSES: FeaturedCourseItem[] = [];

export const DEFAULT_LANDING_CONFIG: LandingPageConfig = {
  hero: {
    badgeAr: 'المنصة التعليمية والخدماتية الجزائرية 2027',
    badgeFr: 'La plateforme éducative et de services algérienne 2027',
    titleLeadAr: 'تحضيرك للبكالوريا والجامعة،',
    titleLeadFr: "Votre préparation au BAC et à l'université,",
    titleHighlightAr: 'خطوة بخطوة.',
    titleHighlightFr: 'pas à pas.',
    titleEndAr: '',
    titleEndFr: '',
    subAr: 'مقاييس جامعية معتمدة، تحضير متكامل للبكالوريا، ملخصات ذكية وبنك امتحانات نموذجية محلولة تضمن تفوقك في 58 ولاية.',
    subFr: 'Des modules universitaires, préparation complète au BAC, résumés intelligents et annales corrigées pour exceller dans les 58 wilayas.',
    ctaPrimaryAr: 'استكشف الدورات',
    ctaPrimaryFr: 'Explorer les Cours',
    ctaSecondaryAr: 'مشاهدة العرض التوضيحي',
    ctaSecondaryFr: 'Voir la Démo',
  },
  stats: {
    mode: 'AUTO',
    examsValue: '',
    examsLabelAr: 'موضوع امتحان محلول',
    examsLabelFr: 'Annales Corrigées',
    studentsValue: '',
    studentsLabelAr: 'مستخدم',
    studentsLabelFr: 'utilisateurs',
    wilayasValue: '',
    wilayasLabelAr: 'ولاية مغطاة بالسفراء',
    wilayasLabelFr: 'Wilayas Couvertes',
    satisfactionValue: '',
    satisfactionLabelAr: 'نسبة رضا الطلبة',
    satisfactionLabelFr: 'Taux de Satisfaction',
  },
  featuredCoursesSection: {
    titleAr: 'استكشف أشهر الدورات والمقاييس',
    titleFr: 'Explorez nos modules populaires',
    subtitleAr: 'المسارات والمقاييس المعتمدة',
    subtitleFr: 'Modules & Filières',
    courses: DEFAULT_FEATURED_COURSES,
  },
  ambassadorBanner: {
    titleAr: 'شبكة سفراء وأساتذة معتمدين في 58 ولاية',
    titleFr: "Réseau d'ambassadeurs et professeurs certifiés dans 58 wilayas",
    bodyAr: 'تصلك بسفراء، أساتذة، ومكوّنين معتمدين من أجل أفضل مساندة، تحضير، ومتابعة أينما كنت.',
    bodyFr: 'Connectez-vous avec des ambassadeurs, professeurs et formateurs certifiés pour vous accompagner.',
    ctaPrimaryAr: 'تصفح دليل السفراء في ولايتك',
    ctaPrimaryFr: 'Voir les ambassadeurs de ma wilaya',
    ctaSecondaryAr: 'كن سفيراً معتمداً',
    ctaSecondaryFr: 'Devenir Ambassadeur',
  },
  finalCta: {
    titleAr: 'جاهز للانطلاق مع DZ Prime؟',
    titleFr: 'Prêt à décoller avec DZ Prime ?',
    bodyAr: 'ابدأ مجاناً، وتابع تحضيرك للبكالوريا أو الجامعة خطوة بخطوة.',
    bodyFr: "Commencez gratuitement et préparez votre BAC ou votre année universitaire étape par étape.",
    buttonTextAr: 'أنشئ حسابك المجاني',
    buttonTextFr: 'Créer mon compte gratuit',
  },
};
