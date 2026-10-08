'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  Award,
  Sparkles,
  Download,
  ExternalLink,
  QrCode,
  CheckCircle2,
  Building2,
  Lock,
} from 'lucide-react';
import { AdminMembershipCard } from '@/components/card/AdminMembershipCard';
import { MembershipCard } from '@/components/card/MembershipCard';
import { useAuthStore } from '@/lib/store';
import { Locale } from '@/types';

interface AdminCardTabProps {
  locale: Locale | string;
}

export const AdminCardTab: React.FC<AdminCardTabProps> = ({ locale }) => {
  const { currentUser } = useAuthStore();

  const adminCardId = currentUser?.studentCardId || 'DZ-ADM-16-0001';

  return (
    <div className="space-y-6 font-arabic" data-testid="admin-card-tab">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-[#111114] border border-gold-500/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gold-500 text-navy-950 flex items-center justify-center font-black shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black flex items-center gap-2">
              <span>{locale === 'ar' ? 'بطاقة الإدارة الرقمية والاعتماد الرسمي' : 'Carte d\'Administration Officielle'}</span>
              <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[10px] font-bold">
                DZ PRIME OFFICIAL
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === 'ar'
                ? 'بطاقة الهوية الأكاديمية المشفرة مع رمز الاستجابة السريعة للتحقق الفوري عبر كافة الولايات'
                : 'Identifiant numérique crypté avec QR code de vérification nationale'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/card`}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'ar' ? 'استوديو البطاقات الكامل' : 'Studio Cartes'}</span>
          </Link>
        </div>
      </div>

      {/* Main Content Grid: Live Card & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Card Preview */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
          <AdminMembershipCard
            user={currentUser}
            allowExport={true}
          />
          <p className="text-[11px] text-gray-400 font-mono">
            {locale === 'ar' ? 'المعرف الرقمي المعتمد:' : 'ID Certifié:'} {adminCardId}
          </p>
        </div>

        {/* Right: Security & Verification Badges */}
        <div className="lg:col-span-5 space-y-4 text-xs">
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3.5">
            <h4 className="font-black text-white flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'ar' ? 'مواصفات بطاقة الإدارة' : 'Spécifications de la Carte'}</span>
            </h4>

            <div className="space-y-2.5 text-gray-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">{locale === 'ar' ? 'مستوى الصلاحية:' : 'Niveau d\'accès:'}</span>
                <span className="font-bold text-lime-400 uppercase font-mono">{currentUser?.role || 'ADMIN'} (Super Admin)</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">{locale === 'ar' ? 'حالة التوثيق:' : 'Statut:'}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'معتمد رسمياً' : 'Certifié'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">{locale === 'ar' ? 'الختم الأمني:' : 'Sceau de sécurité:'}</span>
                <span className="text-gold-300 font-mono font-bold">DZ-GOV-2026-SEAL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{locale === 'ar' ? 'التحقق المباشر:' : 'Vérification en direct:'}</span>
                <Link
                  href={`/${locale}/verify/${adminCardId}`}
                  target="_blank"
                  className="text-lime-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>{locale === 'ar' ? 'رابط الفحص QR' : 'Tester le QR'}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gold-300">
                {locale === 'ar' ? 'بطاقة الهوية الشاملة للفعاليات' : 'Carte d\'Accès VIP Événements'}
              </p>
              <p className="text-[11px] text-gray-300 mt-0.5">
                {locale === 'ar'
                  ? 'تتيح هذه البطاقة الدخول لكافة مقرات الجامعات، المدرجات المحجوزة للحصص الحضورية، واللقاءات الوطنية للسفراء والأساتذة.'
                  : 'Accès prioritaire à toutes les masterclasses et événements nationaux.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
