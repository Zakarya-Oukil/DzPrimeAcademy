'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import type { Locale } from '@/types';
import { Avatar, Empty, PageHead, Panel, SearchInput, SelectInput, SkeletonRows, Tag, useTx } from '@/components/student-v2/ui';

/** Network of the 58 wilayas (Figma page 29): search, then ambassadors grouped by wilaya. Data: GET /api/ambassadors/directory (public fields only). */

interface DirEntry {
  id: string;
  wilayaCode: number;
  wilayaNameAr: string;
  wilayaNameFr?: string | null;
  institutionNameAr: string;
  institutionNameFr?: string | null;
  specialtyName?: string | null;
  telegramHandle?: string | null;
  bioAr?: string | null;
  isVerified: boolean;
  user: { id: string; name: string; avatar?: string | null } | null;
}

export const AmbassadorNetworkV2: React.FC = () => {
  const { tx, locale } = useTx();
  const [rows, setRows] = useState<DirEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState('');
  const [wilaya, setWilaya] = useState('ALL');

  useEffect(() => {
    let live = true;
    fetch('/api/ambassadors/directory', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => live && setRows(Array.isArray(d) ? d : []))
      .catch(() => { if (live) { setRows([]); setFailed(true); } });
    return () => { live = false; };
  }, []);

  const wname = (code: number, ar: string, fr?: string | null) => {
    const w = WILAYAS.find((x) => x.code === code);
    return w ? getLocalizedWilayaName(w, locale as Locale) : locale === 'fr' ? fr || ar : ar;
  };

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const hit = (e: DirEntry) =>
      (wilaya === 'ALL' || String(e.wilayaCode) === wilaya) &&
      (!needle || [e.user?.name, e.wilayaNameAr, e.wilayaNameFr, e.institutionNameAr, e.institutionNameFr, e.specialtyName].some((v) => (v || '').toLowerCase().includes(needle)));
    const m = new Map<number, DirEntry[]>();
    for (const e of (rows || []).filter(hit)) m.set(e.wilayaCode, [...(m.get(e.wilayaCode) || []), e]);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [rows, q, wilaya]);

  return (
    <div className="flex flex-col gap-7" data-testid="ambassador-network-v2">
      <PageHead title={tx('شبكة 58 ولاية', 'Réseau des 58 wilayas', '58-wilaya network')} sub={tx('تعرّف على سفراء كل ولاية وجامعة وتواصل معهم.', 'Découvrez les ambassadeurs de chaque wilaya et université et contactez-les.', 'Meet the ambassadors of each wilaya and university and get in touch.')} />

      <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
        <SearchInput id="an-search" label={tx('بحث', 'Recherche', 'Search')} value={q} onChange={setQ} placeholder={tx('ابحث بالاسم أو الولاية أو الجامعة أو التخصص', 'Nom, wilaya, université ou spécialité', 'Name, wilaya, university or specialty')} />
        <SelectInput id="an-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={wilaya} onChange={setWilaya} options={[{ value: 'ALL', label: tx('كل الولايات', 'Toutes les wilayas', 'All wilayas') }, ...WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }))]} />
      </div>

      {rows === null ? <SkeletonRows n={3} /> : failed ? (
        <Empty title={tx('تعذر تحميل الدليل', "Impossible de charger l'annuaire", 'Could not load the directory')} body={tx('أعد المحاولة بعد قليل.', 'Réessayez dans un instant.', 'Try again in a moment.')} />
      ) : groups.length === 0 ? (
        <Empty title={rows.length === 0 ? tx('لا يوجد سفراء في الدليل بعد', "Aucun ambassadeur dans l'annuaire pour le moment", 'No ambassadors in the directory yet') : tx('لا توجد نتائج', 'Aucun résultat', 'No results')} body={rows.length === 0 ? undefined : tx('جرّب كلمات أخرى أو كل الولايات.', 'Essayez d’autres mots ou toutes les wilayas.', 'Try other words or all wilayas.')} />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([code, list]) => (
            <Panel as="section" key={code} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[20px] font-semibold">{code} - {wname(code, list[0].wilayaNameAr, list[0].wilayaNameFr)}</h2>
                <Tag>{list.length === 1 ? tx('سفير واحد', '1 ambassadeur', '1 ambassador') : `${list.length} ${tx('سفراء', 'ambassadeurs', 'ambassadors')}`}</Tag>
              </div>
              <ul className="flex flex-col gap-2.5">
                {list.map((e) => {
                  const name = e.user?.name || tx('سفير', 'Ambassadeur', 'Ambassador');
                  const handle = (e.telegramHandle || '').replace('@', '');
                  return (
                    <li key={e.id} className="flex items-center gap-4 rounded-[16px] bg-sheet-line/60 p-3.5" data-testid={`ambassador-entry-${e.id}`}>
                      <Avatar name={name} src={e.user?.avatar || undefined} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-medium">{name}</p>
                        <p className="truncate text-[13px] text-sheet-muted">{[locale === 'fr' ? e.institutionNameFr || e.institutionNameAr : e.institutionNameAr, e.specialtyName].filter(Boolean).join('  ·  ')}</p>
                      </div>
                      {handle ? <a href={`https://t.me/${encodeURIComponent(handle)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center rounded-full border border-sheet-text px-4 text-[14px] font-semibold hover:bg-sheet-text/10" dir="ltr">@{handle}</a> : null}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};
