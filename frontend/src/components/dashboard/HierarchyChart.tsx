'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Crown,
  Users,
  Settings,
  Landmark,
  GraduationCap,
  Megaphone,
  Code,
  Handshake,
  MapPin,
  Compass,
  Building,
  School,
  TrendingUp,
  Award,
  Lightbulb,
  Globe2,
  Target,
  ArrowDown,
  ShieldAlert,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';

export const HierarchyChart: React.FC = () => {
  const { t, locale } = useTranslation();
  const { currentUser } = useAuthStore();

  // Strict User Restriction: Completely remove from all users except admin, administrative staff, and ambassadors
  const canViewHierarchy =
    currentUser &&
    (currentUser.role === 'AMBASSADOR' ||
      [
        'OWNER',
        'SUPER_ADMIN',
        'GENERAL_ADMIN',
        'ADMIN',
        'COMMERCIAL_DIRECTOR',
        'COORDINATOR',
        'FINANCIAL_DIRECTOR',
        'ACADEMIC_DIRECTOR',
        'COMMUNITY_MANAGER',
        'TECH_SUPPORT'
      ].includes(currentUser.role));

  if (!canViewHierarchy) {
    return (
      <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-12 text-center text-slate-400 space-y-4 shadow-2xl font-arabic">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg sm:text-xl font-black text-white">
          منطقة محصورة: الهيكل القيادي والتنظيمي
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          هذا القسم مخصص حصراً للإدارة العليا، المدير العام، الطاقم الإداري المركزي، وسفراء الولايات المعتمدين لـ DZ Prime Academy.
        </p>
      </div>
    );
  }

  return (
    <div className="dark w-full rounded-3xl border border-gold-500/30 dark:border-gold-500/40 bg-[#0b0b0d] p-4 sm:p-8 md:p-10 shadow-2xl text-white relative overflow-hidden transition-all duration-300 font-arabic select-none">
      {/* Background Decorative Lighting */}

      {/* ================= TOP HEADER BRANDING & EXECUTIVE LEADERSHIP ================= */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pb-8 border-b border-gold-500/25">
        {/* Left Col: Brand Emblem & Title */}
        <div className="lg:col-span-4 text-center lg:text-start flex flex-col items-center lg:items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="dark relative w-16 h-16 rounded-2xl overflow-hidden shadow-gold-glow border border-gold-400/60 flex items-center justify-center shrink-0 bg-[#0b0b0d]">
              <Image
                src="/images/dzprime-gold-emblem.png"
                alt="DZ Prime Gold Emblem"
                fill
                className="object-contain p-1 drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]"
              />
            </div>
            <div>
              <h2 className="text-gold-700 dark:text-gold-400 text-xl sm:text-2xl font-black  ">
                الهيكل القيادي والتنظيمي
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md">
            الحوكمة الإدارية العليا وشبكة التنسيق الوطني والسفراء المعتمدين عبر 58 ولاية.
          </p>
        </div>

        {/* Right Col: Level 1 (Founder/CEO), CTO & Co-Founder, Admin Général */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Box 1: Founder & CEO */}
          <motion.div
            className="dark p-3.5 rounded-2xl border border-gold-500/70 bg-[#111114] shadow-lg flex flex-col items-center text-center"
          >
            <div className="flex items-center justify-center text-gold-400 mb-1.5">
              <Crown className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-gold-400 font-bold">LEVEL 100</span>
            <h3 className="text-xs sm:text-sm font-black text-gold-200">
              President & CEO (المؤسس)
            </h3>
            <p className="text-[10px] text-slate-300 mt-1 leading-snug">
              الرئاسة والتوجيه الاستراتيجي والقرارات المصيرية للأكاديمية.
            </p>
          </motion.div>

          {/* Box 2: Chief Technology Officer (Zakarya Oukil) */}
          <motion.div
            className="p-3.5 rounded-2xl border-2 border-amber-400 bg-[#14234b] shadow-xl shadow-amber-500/20 flex flex-col items-center text-center relative"
          >
            <div className="absolute -top-2 px-2 py-0.5 rounded-full bg-amber-500 text-navy-950 font-black text-[9px] shadow">
              Zakarya Oukil
            </div>
            <div className="flex items-center justify-center text-amber-300 mb-1.5 mt-1">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-amber-300 font-bold">LEVEL 100</span>
            <h4 className="text-xs sm:text-sm font-black text-white">
              CTO & Co-Founder
            </h4>
            <p className="text-[10px] text-amber-200/90 mt-1 leading-snug">
              رئاسة قطاع التكنولوجيا وتطوير المنصة والبنية الرقمية.
            </p>
          </motion.div>

          {/* Box 3: Admin Général (Level 95) */}
          <motion.div
            className="dark p-3.5 rounded-2xl border border-purple-500/60 bg-[#111114] shadow-lg flex flex-col items-center text-center"
          >
            <div className="flex items-center justify-center text-purple-300 mb-1.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-purple-300 font-bold">LEVEL 95</span>
            <h4 className="text-xs sm:text-sm font-black text-purple-200">
              Admin Général (المدير العام)
            </h4>
            <p className="text-[10px] text-slate-300 mt-1 leading-snug">
              الإشراف التنفيذي الشامل وإدارة كافة فروع وعمليات المنظومة.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ================= LEVEL 3: EXECUTIVE DIRECTORS (5 Pillars) ================= */}
      <div className="my-8">
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="h-px w-12 sm:w-20 bg-gold-500/60" />
          <div className="px-4 py-1 rounded-full bg-gold-500/20 border border-gold-500/50 text-gold-300 text-xs sm:text-sm font-black flex items-center gap-2 shadow-sm">
            <Users className="w-4 h-4 text-gold-400" />
            <span>{t('hierarchy.executives')}</span>
          </div>
          <div className="h-px w-12 sm:w-20 bg-gold-500/60" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. COO */}
          <motion.div
            className="p-4 rounded-2xl border border-gold-500/40 bg-[#111114]/90 hover:bg-[#111114] hover:border-gold-400 transition-all flex flex-col items-center text-center shadow-sm"
          >
            <div className="flex items-center justify-center text-gold-400 mb-2.5">
              <Settings className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gold-200">
              {t('hierarchy.coo')}
            </h4>
            <p className="text-[10px] text-slate-300 mt-1.5 leading-relaxed">
              {t('hierarchy.cooDesc')}
            </p>
          </motion.div>

          {/* 2. Financial Affairs Manager */}
          <motion.div
            className="p-4 rounded-2xl border border-gold-500/40 bg-[#111114]/90 hover:bg-[#111114] hover:border-gold-400 transition-all flex flex-col items-center text-center shadow-sm"
          >
            <div className="flex items-center justify-center text-gold-400 mb-2.5">
              <Landmark className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gold-200">
              {t('hierarchy.finance')}
            </h4>
            <p className="text-[10px] text-slate-300 mt-1.5 leading-relaxed">
              {t('hierarchy.financeDesc')}
            </p>
          </motion.div>

          {/* 3. Student Affairs & Services Manager */}
          <motion.div
            className="p-4 rounded-2xl border border-gold-500/40 bg-[#111114]/90 hover:bg-[#111114] hover:border-gold-400 transition-all flex flex-col items-center text-center shadow-sm"
          >
            <div className="flex items-center justify-center text-gold-400 mb-2.5">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gold-200">
              {t('hierarchy.studentServices')}
            </h4>
            <p className="text-[10px] text-slate-300 mt-1.5 leading-relaxed">
              {t('hierarchy.studentServicesDesc')}
            </p>
          </motion.div>

          {/* 4. Marketing & Media Manager */}
          <motion.div
            className="p-4 rounded-2xl border border-gold-500/40 bg-[#111114]/90 hover:bg-[#111114] hover:border-gold-400 transition-all flex flex-col items-center text-center shadow-sm"
          >
            <div className="flex items-center justify-center text-gold-400 mb-2.5">
              <Megaphone className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gold-200">
              {t('hierarchy.marketing')}
            </h4>
            <p className="text-[10px] text-slate-300 mt-1.5 leading-relaxed">
              {t('hierarchy.marketingDesc')}
            </p>
          </motion.div>

          {/* 5. Technology & Platform Manager */}
          <motion.div
            className="p-4 rounded-2xl border border-gold-500/40 bg-[#111114]/90 hover:bg-[#111114] hover:border-gold-400 transition-all flex flex-col items-center text-center shadow-sm"
          >
            <div className="flex items-center justify-center text-gold-400 mb-2.5">
              <Code className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gold-200">
              {t('hierarchy.tech')}
            </h4>
            <p className="text-[10px] text-slate-300 mt-1.5 leading-relaxed">
              {t('hierarchy.techDesc')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* ================= LEVEL 4: REGIONAL COORDINATORS (منسقو الجهات) ================= */}
      <div className="my-8 pt-6 border-t border-gold-500/20">
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="px-4 py-1 rounded-full bg-gold-500/20 border border-gold-500/50 text-gold-300 text-xs sm:text-sm font-black flex items-center gap-2 shadow-sm">
            <Compass className="w-4 h-4 text-gold-400" />
            <span>{t('hierarchy.coordinators')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            { title: t('hierarchy.westCoord'), desc: t('hierarchy.westDesc'), wilayas: 'Oran, Tlemcen, Mostaganem, Chlef, SBA...', icon: '' },
            { title: t('hierarchy.eastCoord'), desc: t('hierarchy.eastDesc'), wilayas: 'Constantine, Sétif, Annaba, Batna, Guelma...', icon: '' },
            { title: t('hierarchy.centerCoord'), desc: t('hierarchy.centerDesc'), wilayas: 'Alger, Blida, Tizi Ouzou, Boumerdès, Béjaïa...', icon: '' },
            { title: t('hierarchy.southCoord'), desc: t('hierarchy.southDesc'), wilayas: 'Ouargla, Biskra, Adrar, Ghardaïa, El Oued...', icon: '' },
          ].map((reg, idx) => (
            <motion.div
              key={idx}
              className="dark p-4 rounded-2xl border border-gold-500/35 bg-[#111114] hover:bg-[#111114] transition-all flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-6 h-6 text-gold-600 dark:text-gold-400" aria-hidden="true" />
                <h4 className="text-xs sm:text-sm font-bold text-gold-200">{reg.title}</h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{reg.desc}</p>
              <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-gold-400 font-mono">
                {reg.wilayas}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ================= LEVEL 5: AMBASSADOR NETWORK (شبكة السفراء) ================= */}
      <div className="dark my-8 p-5 sm:p-6 rounded-3xl border border-gold-500/40 bg-[#111114] shadow-md">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gold-500/20 border border-gold-500/50 text-gold-300 text-xs sm:text-sm font-black mb-1">
            <Users className="w-4 h-4 text-gold-400" />
            <span>{t('hierarchy.ambassadorsNetwork')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            className="dark p-4 sm:p-5 rounded-2xl bg-[#0b0b0d] border border-gold-500/30 flex items-center gap-4 shadow-sm"
          >
            <div className="flex items-center justify-center text-gold-400 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{t('hierarchy.univAmbassadors')}</h4>
              <p className="text-xs text-slate-300 mt-1">{t('hierarchy.univDesc')}</p>
            </div>
          </motion.div>

          <motion.div
            className="dark p-4 sm:p-5 rounded-2xl bg-[#0b0b0d] border border-gold-500/30 flex items-center gap-4 shadow-sm"
          >
            <div className="flex items-center justify-center text-gold-400 shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{t('hierarchy.wilayaAmbassadors')}</h4>
              <p className="text-xs text-slate-300 mt-1">{t('hierarchy.wilayaDesc')}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ================= LEVEL 6: RESULTS & GOALS (النتائج والأهداف) ================= */}
      <div className="pt-6 border-t border-gold-500/25 text-center">
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="px-4 py-1 rounded-full bg-gold-500/20 border border-gold-500/50 text-gold-300 text-xs sm:text-sm font-black flex items-center gap-2 shadow-sm">
            <Target className="w-4 h-4 text-gold-400" />
            <span>{t('hierarchy.goalsTitle')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { title: t('hierarchy.goal1'), desc: t('hierarchy.goal1Desc'), icon: Handshake },
            { title: t('hierarchy.goal2'), desc: t('hierarchy.goal2Desc'), icon: Lightbulb },
            { title: t('hierarchy.goal3'), desc: t('hierarchy.goal3Desc'), icon: Award },
            { title: t('hierarchy.goal4'), desc: t('hierarchy.goal4Desc'), icon: TrendingUp },
            { title: t('hierarchy.goal5'), desc: t('hierarchy.goal5Desc'), icon: Globe2 },
          ].map((goal, idx) => {
            const Icon = goal.icon;
            return (
              <motion.div
                key={idx}
                className="dark p-3.5 sm:p-4 rounded-2xl bg-[#111114] border border-gold-500/30 flex flex-col items-center text-center shadow-sm"
              >
                <div className="flex items-center justify-center text-gold-400 mb-2">
                  <Icon className="w-4 h-4" />
                </div>
                <h5 className="text-xs sm:text-[13px] font-black text-gold-200">
                  {goal.title}
                </h5>
                <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                  {goal.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ================= BOTTOM SLOGAN RIBBON ================= */}
        <div className="mt-8 py-3 px-6 rounded-2xl bg-amber-500/20 border border-gold-500/60 inline-flex items-center gap-2 font-black text-gold-200 text-xs sm:text-sm md:text-base tracking-wide shadow-gold-glow">
          
          <span>{t('hierarchy.slogan')}</span>
        </div>
      </div>
    </div>
  );
};
