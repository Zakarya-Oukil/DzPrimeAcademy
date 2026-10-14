'use client';

import React, { useMemo, useState } from 'react';
import { AMBASSADORS } from '@/lib/initial-data';
import type { Region } from '@/types';
import { Avatar, Btn, Empty, Panel, SearchInput, useTx } from '@/components/student-v2/ui';
import { ChipGroup } from './Dialog';

/** Public ambassadors directory in the redesigned shell (Figma page 30). Same data source as the old page (AMBASSADORS); visitors get search and region filters. */
export const AmbassadorsPublicV2: React.FC = () => {
  const { tx, locale } = useTx();
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<'ALL' | Region>('ALL');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return AMBASSADORS.filter((a) => (region === 'ALL' || !a.region || a.region === region) && (!needle || [a.user.name, a.wilayaNameAr, a.wilayaNameFr, a.institutionNameAr, a.institutionNameFr, a.specialtyName].some((v) => (v || '').toLowerCase().includes(needle))));
  }, [q, region]);
  const wilayas = new Set(AMBASSADORS.map((a) => a.wilayaCode)).size;

  return (
    <div className="mx-auto w-full max-w-[1344px] flex-1 px-4 py-8 sm:px-12" data-testid="ambassadors-public-v2">
      <div className="flex flex-col gap-6 rounded-[32px] bg-sheet p-6 text-sheet-text sm:rounded-[40px] sm:p-10">
        <div>
          <h1 className="font-display-h text-[32px] leading-[1.25] sm:text-[44px]">{tx('شبكة السفراء', 'Réseau des ambassadeurs', 'Ambassador network')}</h1>
          <p className="mt-3 max-w-3xl text-[16px] text-sheet-muted">{tx('تعرّف على سفير جامعتك وولايتك، احضر ورشات المراجعة الحضورية والمباشرة، واحصل على نصائح التفوق وقيم تجربة الدعم الأكاديمي.', "Découvrez les ambassadeurs DZ Prime de votre université et wilaya. Participez aux sessions de révision et accédez aux ressources certifiées.", 'Meet the DZ Prime ambassadors of your university and wilaya, join revision sessions and get study tips.')}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Panel className="flex flex-col gap-2"><p className="text-[14px] text-sheet-muted">{tx('سفراء معتمدون', 'Ambassadeurs agréés', 'Verified ambassadors')}</p><p className="text-[36px] font-bold leading-none tabular-nums">{AMBASSADORS.length}</p></Panel>
          <Panel className="flex flex-col gap-2"><p className="text-[14px] text-sheet-muted">{tx('ولاية', 'Wilayas', 'Wilayas')}</p><p className="text-[36px] font-bold leading-none tabular-nums">{wilayas}</p></Panel>
        </div>
        <SearchInput id="ap-q" label={tx('بحث', 'Recherche', 'Search')} value={q} onChange={setQ} placeholder={tx('ابحث بالاسم أو الولاية أو الجامعة أو التخصص', 'Nom, wilaya, université ou spécialité', 'Name, wilaya, university or specialty')} />
        <ChipGroup label={tx('المنطقة', 'Région', 'Region')} value={region} onChange={(id) => setRegion(id as 'ALL' | Region)} items={[
          { id: 'ALL', label: tx('جميع ولايات الوطن (58 ولاية)', 'Toutes les wilayas (58)', 'All wilayas (58)') },
          { id: 'CENTER', label: tx('الوسط', 'Centre', 'Centre') },
          { id: 'EAST', label: tx('الشرق', 'Est', 'East') },
          { id: 'WEST', label: tx('الغرب', 'Ouest', 'West') },
          { id: 'SOUTH', label: tx('الجنوب الكبير', 'Grand Sud', 'Far South') },
        ]} />
        {list.length === 0 ? (
          <Empty title={tx('لم يتم العثور على سفراء مطابقين لبحثك', 'Aucun ambassadeur ne correspond à votre recherche', 'No ambassador matches your search')} body={tx('جرب البحث عن ولاية أو جامعة أخرى.', 'Essayez une autre wilaya ou université.', 'Try another wilaya or university.')} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => {
              const handle = (a.telegramHandle || '').replace('@', '');
              return (
                <li key={a.id}>
                  <Panel as="article" className="flex h-full flex-col gap-3">
                    <div className="flex items-center gap-3"><Avatar name={a.user.name} src={a.user.avatar} size={48} /><div className="min-w-0"><p className="truncate text-[16px] font-semibold">{a.user.name}</p><p className="truncate text-[13px] text-sheet-muted">{`${a.wilayaCode} - ${locale === 'fr' ? a.wilayaNameFr || a.wilayaNameAr : a.wilayaNameAr}`}</p></div></div>
                    <p className="text-[14px] text-sheet-muted">{[locale === 'fr' ? a.institutionNameFr || a.institutionNameAr : a.institutionNameAr, a.specialtyName].filter(Boolean).join('  ·  ')}</p>
                    {handle ? <div className="mt-auto"><Btn variant="secondary" href={`https://t.me/${encodeURIComponent(handle)}`}>{tx('تيليغرام', 'Telegram', 'Telegram')}</Btn></div> : null}
                  </Panel>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
