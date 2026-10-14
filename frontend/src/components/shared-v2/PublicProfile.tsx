'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MembershipCard } from '@/components/card/MembershipCard';
import { trackLabel } from '@/lib/courseDisplay';
import type { Post } from '@/types';
import { Avatar, Btn, Empty, Panel, SkeletonRows, Tag, dateFmt, useTx } from '@/components/student-v2/ui';

/** Public profile in the redesigned shell (Figma page 30). Data comes from GET /api/profile/:id exactly as before; this is only the view. */

export interface ProfileData { user: any; teacherProfile?: any; courses?: any[]; sessions?: any[]; bundles?: any[]; ambassadorProfile?: any }

export const ProfileStateV2: React.FC<{ kind: 'loading' | 'error'; id: string }> = ({ kind, id }) => {
  const { tx, locale } = useTx();
  return (
    <div className="mx-auto w-full max-w-[1344px] flex-1 px-4 py-8 sm:px-12">
      <div className="rounded-[32px] bg-sheet p-6 text-sheet-text sm:rounded-[40px] sm:p-10">
        {kind === 'loading' ? <SkeletonRows n={3} /> : (
          <Empty title={tx('الملف الشخصي غير موجود', 'Profil introuvable', 'Profile not found')} body={tx('لم يتم العثور على أي مستخدم مطابق لهذا المعرف أو رمز البطاقة.', 'Aucun utilisateur ne correspond à cet identifiant.', 'No user matches this id or card number.')} action={<Btn href={`/${locale}`}>{tx('العودة للرئيسية', 'Accueil', 'Home')}</Btn>} />
        )}
      </div>
      <span className="sr-only">{id}</span>
    </div>
  );
};

export const PublicProfileV2: React.FC<{ data: ProfileData; isOwner: boolean; canExportCard: boolean; whatsappUrl: string | null; roleTitle: string; copied: boolean; onCopy: () => void }> = ({ data, isOwner, canExportCard, whatsappUrl, roleTitle, copied, onCopy }) => {
  const { tx, locale } = useTx();
  const { user, teacherProfile, courses = [], sessions = [], ambassadorProfile } = data;
  const isTeacher = user.role === 'TEACHER';
  const isAmbassador = user.role === 'AMBASSADOR';
  const isStudent = user.role === 'STUDENT_FREE' || user.role === 'STUDENT_PAID';
  const showsPosts = isTeacher || isAmbassador || user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'MODERATOR' || Boolean(user.adminRole);
  const settingsHref = `/${locale}/${isTeacher ? 'teacher' : isAmbassador ? 'ambassador' : 'student'}/settings`;

  const [posts, setPosts] = useState<Post[] | null>(null);
  useEffect(() => {
    if (!showsPosts) return;
    let live = true;
    fetch(`/api/posts?authorId=${encodeURIComponent(user.id)}`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : { posts: [] })).then((d) => live && setPosts(d.posts || [])).catch(() => live && setPosts([]));
    return () => { live = false; };
  }, [user.id, showsPosts]);

  const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
    <div className="flex justify-between gap-4 text-[14px]"><dt className="text-sheet-muted">{k}</dt><dd className="min-w-0 text-end font-semibold">{v}</dd></div>
  );

  return (
    <div className="mx-auto w-full max-w-[1344px] flex-1 px-4 py-8 sm:px-12" data-testid="public-profile-v2">
      <div className="flex flex-col gap-6 rounded-[32px] bg-sheet p-6 text-sheet-text sm:rounded-[40px] sm:p-10">
        <header className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <h1 className="font-display-h text-[30px] leading-[1.3] sm:text-[40px]">{user.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Tag>{roleTitle}</Tag>
              {user.studentCardId ? <Tag><span dir="ltr">{user.studentCardId}</span></Tag> : null}
              {user.wilayaName ? <Tag>{`${user.wilayaCode ? `${user.wilayaCode} - ` : ''}${user.wilayaName}`}</Tag> : null}
              {user.institutionName ? <Tag>{user.institutionName}</Tag> : null}
            </div>
            {user.bio ? <p className="max-w-2xl text-[15px] text-sheet-muted">{user.bio}</p> : null}
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <Btn onClick={onCopy} data-testid="profile-share">{copied ? tx('تم نسخ الرابط', 'Lien copié', 'Link copied') : tx('مشاركة الملف', 'Partager le profil', 'Share profile')}</Btn>
              {user.studentCardId ? <Btn variant="secondary" href={`/${locale}/verify/${user.studentCardId}`}>{tx('التحقق من البطاقة', 'Vérifier la carte', 'Verify the card')}</Btn> : null}
              {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center px-2 text-[15px] font-semibold underline underline-offset-4">{tx('واتساب', 'WhatsApp', 'WhatsApp')}</a> : null}
              {isOwner ? <Btn variant="text" href={settingsHref}>{tx('تعديل الملف الشخصي', 'Modifier le profil', 'Edit profile')}</Btn> : null}
            </div>
          </div>
          <Avatar name={user.name} src={user.avatar || undefined} size={112} />
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col gap-4">
            <h2 className="text-[18px] font-semibold">{tx('بطاقة الاعتماد الرقمية', 'Carte numérique', 'Digital card')}</h2>
            <MembershipCard user={user} allowExport={canExportCard} />
          </Panel>

          <div className="flex flex-col gap-4">
            {isAmbassador ? (
              <Panel className="flex flex-col gap-3.5">
                <h2 className="text-[18px] font-semibold">{tx('بيانات السفير المعتمد للولاية', "Ambassadeur de wilaya", 'Wilaya ambassador')}</h2>
                <dl className="flex flex-col gap-3">
                  <Row k={tx('الولاية الممثلة', 'Wilaya représentée', 'Represented wilaya')} v={ambassadorProfile?.wilayaNameAr || user.wilayaName || '–'} />
                  <Row k={tx('رمز التخفيض المعتمد', 'Code promo', 'Promo code')} v={<span dir="ltr">{ambassadorProfile?.promoCode || '–'}</span>} />
                  <Row k={tx('تقييم الطلبة', 'Évaluation', 'Student rating')} v={ambassadorProfile?.ratingsCount ? `${ambassadorProfile.ratingAverage} ★ (${ambassadorProfile.ratingsCount})` : '–'} />
                </dl>
              </Panel>
            ) : null}

            {isStudent ? (
              <Panel className="flex flex-col gap-3.5">
                <h2 className="text-[18px] font-semibold">{tx('الملف الأكاديمي للطالب', 'Profil académique', 'Student academic profile')}</h2>
                <dl className="flex flex-col gap-3">
                  <Row k={tx('المسار التعليمي', 'Filière', 'Track')} v={user.track ? trackLabel(user.track, locale) : '–'} />
                  <Row k={tx('التخصص الدراسي', 'Spécialité', 'Specialty')} v={user.specialty || '–'} />
                  <Row k={tx('السنة الأكاديمية', 'Année académique', 'Academic year')} v={user.academicYear || '–'} />
                  <Row k={tx('نوع العضوية', 'Statut', 'Membership')} v={user.role === 'STUDENT_PAID' ? 'GOLD VIP' : 'FREE PASS'} />
                </dl>
              </Panel>
            ) : null}

            {isTeacher ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Panel className="!p-4"><p className="text-[13px] text-sheet-muted">{tx('ساعات التدريس', 'Heures enseignées', 'Teaching hours')}</p><p className="text-[28px] font-bold tabular-nums">{teacherProfile?.hoursTaught ?? 0}</p></Panel>
                  <Panel className="!p-4"><p className="text-[13px] text-sheet-muted">{tx('طالب مستفيد', 'Étudiants formés', 'Students taught')}</p><p className="text-[28px] font-bold tabular-nums">{teacherProfile?.studentsCount ?? 0}</p></Panel>
                </div>
                <Panel className="flex flex-col gap-3">
                  <h2 className="text-[18px] font-semibold">{tx('المقررات', 'Cours', 'Modules')}</h2>
                  {courses.length === 0 ? <p className="text-[14px] text-sheet-muted">{tx('لا توجد مقررات منشورة.', 'Aucun cours publié.', 'No published modules.')}</p> : (
                    <ul className="flex flex-col gap-2">
                      {courses.map((c: any) => (
                        <li key={c.id} className="flex items-center justify-between gap-3 text-[14px]"><span className="min-w-0 truncate font-medium">{c.titleAr}</span><span className="shrink-0 text-sheet-muted">{c.lessonsCount} {tx('درس', 'leçons', 'lessons')}</span></li>
                      ))}
                    </ul>
                  )}
                </Panel>
                {sessions.length > 0 ? (
                  <Panel className="flex flex-col gap-3">
                    <h2 className="text-[18px] font-semibold">{tx('الحصص المباشرة', 'Sessions en direct', 'Live sessions')}</h2>
                    <ul className="flex flex-col gap-2">
                      {sessions.slice(0, 5).map((s: any) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 text-[14px]"><span className="min-w-0 truncate font-medium">{s.title}</span><span className="shrink-0 text-sheet-muted">{dateFmt(s.scheduledAt, locale, { day: 'numeric', month: 'short' })}</span></li>
                      ))}
                    </ul>
                  </Panel>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {showsPosts ? (
          <section aria-labelledby="pp-posts" className="flex flex-col gap-3">
            <h2 id="pp-posts" className="text-[20px] font-semibold">{tx(`فيديوهات ومنشورات: ${user.name || ''}`, `Publications et vidéos de ${user.name || ''}`, `Posts and videos by ${user.name || ''}`)}</h2>
            {posts === null ? <SkeletonRows n={2} /> : posts.length === 0 ? (
              <Empty title={tx('لا توجد منشورات أو فيديوهات منشورة حالياً من هذا العضو.', 'Aucune publication pour le moment.', 'No posts yet from this member.')} />
            ) : (
              <ul className="flex flex-col gap-3">
                {posts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 rounded-[18px] bg-sheet-card p-4">
                    <div className="min-w-0"><p className="truncate text-[16px] font-medium">{p.title}</p><p className="text-[13px] text-sheet-muted">{[p.videoUrl ? tx('فيديو', 'Vidéo', 'Video') : tx('مقال', 'Article', 'Article'), dateFmt(p.createdAt, locale, { day: 'numeric', month: 'short', year: 'numeric' })].join('  ·  ')}</p></div>
                    <Link href={`/${locale}/community`} className="shrink-0 text-[14px] font-semibold underline underline-offset-4">{tx('فتح المجتمع', 'Ouvrir la communauté', 'Open community')}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
};
