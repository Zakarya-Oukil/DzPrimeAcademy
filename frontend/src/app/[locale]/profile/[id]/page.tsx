'use client';

import React, { useEffect, useState, use } from 'react';
import { useAuthStore } from '@/lib/store';
import { User, } from '@/types';

interface ProfileResponse {
  user: User;
  teacherProfile?: {
    university: string;
    specialty?: string;
    hourlyRateDzd: number;
    hoursTaught: number;
    studentsCount: number;
  } | null;
  courses?: Array<{
    id: string;
    titleAr: string;
    titleFr?: string;
    lessonsCount: number;
    priceDzd: number;
    rating: number;
    category: string;
  }>;
  sessions?: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    durationMinutes: number;
    platform: string;
    meetUrl?: string;
    status: string;
  }>;
  bundles?: Array<{
    id: string;
    titleAr: string;
    descriptionAr: string;
    currentPriceDzd: number;
    hours: number;
    lecturesCount: number;
  }>;
  ambassadorProfile?: {
    wilayaNameAr: string;
    institutionNameAr: string;
    specialtyName?: string;
    promoCode?: string;
    ratingAverage: number;
    ratingsCount: number;
  } | null;
  enrollments?: Array<{
    id: string;
    courseTitle: string;
    progressPercent: number;
  }>;
}

import { ProfileStateV2, PublicProfileV2 } from '@/components/shared-v2/PublicProfile';

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const resolvedParams = use(params);
  const { locale, id } = resolvedParams;

  const { currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadProfile = () => {
    fetch(`/api/profile/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error('الملف الشخصي غير موجود');
        return r.json();
      })
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err.message || 'حدث خطأ أثناء تحميل الملف الشخصي');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const copyProfileLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) return <ProfileStateV2 kind="loading" id={id} />;
  if (error || !data || !data.user) return <ProfileStateV2 kind="error" id={id} />;

  const { user } = data;
  const isTeacher = user.role === 'TEACHER';
  const isAmbassador = user.role === 'AMBASSADOR';
  const isStudent = user.role === 'STUDENT_FREE' || user.role === 'STUDENT_PAID';
  const isAdminOrStaff = user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'MODERATOR' || Boolean(user.adminRole);

  const isCardOwner = Boolean(
    currentUser && (currentUser.id === user.id || currentUser.studentCardId === user.studentCardId)
  );
  const isAdmin = Boolean(
    currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER')
  );
  const canExportCard = isCardOwner || isAdmin;

  const isOwner = user.role === 'OWNER';

  const roleTitle =
    user.jobTitle ||
    (isOwner
      ? (locale === 'ar' ? 'المسؤول التقني الأول والشريك المؤسس (CTO & Co-Founder)' : 'Chief Technology Officer (CTO) & Co-Founder')
      : user.adminRole === 'GENERAL_ADMIN'
      ? (locale === 'ar' ? 'Admin Général (المدير العام التنفيذي)' : 'Directeur Général (Admin Général)')
      : user.adminRole === 'COMMERCIAL'
      ? (locale === 'ar' ? 'Chargée Commerciale (المسؤولة التجارية)' : 'Chargée Commerciale & Offres')
      : isTeacher
      ? (locale === 'ar' ? 'أستاذ معتمد بالمنصة' : 'Enseignant Agréé')
      : isAmbassador
      ? (locale === 'ar' ? 'سفير معتمد' : 'Ambassadeur Officiel')
      : user.role === 'STUDENT_PAID'
      ? (locale === 'ar' ? 'طالب (عضوية ذهبية)' : 'Étudiant (Membre Gold)')
      : user.role === 'OWNER'
      ? (locale === 'ar' ? 'المسؤول التقني الأول والشريك المؤسس (CTO)' : 'Chief Technology Officer (CTO)')
      : (locale === 'ar' ? 'طالب مسجل' : 'Étudiant'));

  const cleanPhone = (user.phone || '').replace(/[^0-9+]/g, '');
  const whatsappUrl = user.whatsapp
    ? `https://wa.me/${user.whatsapp.replace(/[^0-9]/g, '')}`
    : cleanPhone
    ? `https://wa.me/${cleanPhone.replace('+', '').replace(/^0/, '213')}`
    : null;

  return <PublicProfileV2 data={data} isOwner={isCardOwner} canExportCard={canExportCard} whatsappUrl={whatsappUrl} roleTitle={roleTitle} copied={copied} onCopy={copyProfileLink} />;
}

