'use client';

import React from 'react';
import { Btn, Field, Panel, fieldClass, focus, useTx } from '@/components/student-v2/ui';
import { Dialog } from '@/components/shared-v2/Dialog';

/** Building blocks of the redesigned Admin area (Figma page 31). Colours come from the sheet/strip CSS variables. */

export const money = (n: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-GB', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const num = (n: number | null | undefined, locale: string) => new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-GB').format(Number(n) || 0);

export const shortDate = (iso: string | Date | null | undefined, locale: string) =>
  iso ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—';

/** Stat tile. Real values only: pass a dash when the number is not loaded yet. */
export const Tile: React.FC<{ label: string; value: React.ReactNode; caption?: string; testId?: string }> = ({ label, value, caption, testId }) => (
  <Panel className="flex flex-col gap-2" as="section">
    <p className="text-[15px] text-sheet-muted">{label}</p>
    <p className="whitespace-nowrap text-[20px] font-bold leading-none tabular-nums sm:text-[30px]" data-testid={testId}>{value}</p>
    {caption ? <p className="text-[13px] text-sheet-muted">{caption}</p> : null}
  </Panel>
);

export const Tiles: React.FC<{ children: React.ReactNode; cols?: 2 | 3 | 4 }> = ({ children, cols = 4 }) => (
  <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${cols === 4 ? 'lg:grid-cols-4' : cols === 3 ? 'lg:grid-cols-3' : ''}`}>{children}</div>
);

/** Outline pill used for row actions. */
export const RowAction: React.FC<{ children: React.ReactNode; onClick?: () => void; href?: string; danger?: boolean; disabled?: boolean; label?: string; testId?: string }> = ({ children, onClick, href, danger, disabled, label, testId }) => {
  const cls = `inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 text-[13px] font-semibold transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 md:min-h-[36px] ${danger ? 'border-sheet-danger text-sheet-danger hover:bg-sheet-danger/10' : 'border-sheet-text text-sheet-text hover:bg-sheet-text/10'} ${focus}`;
  if (href) return <a href={href} aria-label={label} className={cls} data-testid={testId}>{children}</a>;
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={cls} data-testid={testId}>{children}</button>;
};

/** Danger button: red outline, never a filled red button. */
export const DangerBtn: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; testId?: string }> = ({ children, onClick, disabled, testId }) => (
  <button type="button" onClick={onClick} disabled={disabled} data-testid={testId} className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-sheet-danger px-6 text-[15px] font-semibold text-sheet-danger hover:bg-sheet-danger/10 disabled:cursor-not-allowed disabled:opacity-60 ${focus}`}>
    {children}
  </button>
);

export type Col<T> = {
  id: string;
  header: string;
  /** CSS grid width on desktop, e.g. '1.4fr' or '120px'. */
  w?: string;
  cell: (row: T) => React.ReactNode;
  /** Mobile card role: title (first line), meta (label and value), status or actions (bottom row), hide. Default: first column is the title, the rest are meta. */
  m?: 'title' | 'meta' | 'status' | 'actions' | 'hide';
};

/** Rows on tonal fills on desktop, stacked cards on mobile. No horizontal scroll at any width. */
export function DataTable<T>({ cols, rows, rowKey, label, testId }: { cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string; label: string; testId?: string }) {
  const grid = { gridTemplateColumns: cols.map((c) => c.w || '1fr').join(' ') } as React.CSSProperties;
  const role = (c: Col<T>, i: number) => c.m || (i === 0 ? 'title' : 'meta');
  return (
    <div data-testid={testId}>
      <div role="table" aria-label={label} className="hidden md:block">
        <div role="row" style={grid} className="grid gap-4 px-6 pb-2 text-[13px] text-sheet-muted">
          {cols.map((c) => <div key={c.id} role="columnheader">{c.header}</div>)}
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <div key={rowKey(r)} role="row" style={grid} className="grid items-center gap-4 rounded-[24px] bg-sheet-card px-6 py-4 text-[15px]">
              {cols.map((c) => <div key={c.id} role="cell" className="min-w-0 break-words">{c.cell(r)}</div>)}
            </div>
          ))}
        </div>
      </div>
      <ul aria-label={label} className="flex flex-col gap-2.5 md:hidden">
        {rows.map((r) => (
          <li key={rowKey(r)} className="flex flex-col gap-2.5 rounded-[20px] bg-sheet-card p-4 text-[15px]">
            {cols.map((c, i) => (role(c, i) === 'title' ? <div key={c.id} className="min-w-0 break-words">{c.cell(r)}</div> : null))}
            {cols.map((c, i) => (role(c, i) === 'meta' ? (
              <div key={c.id} className="flex items-baseline justify-between gap-4 text-[14px]">
                <span className="shrink-0 text-[13px] text-sheet-muted">{c.header}</span>
                <span className="min-w-0 break-words text-end font-medium">{c.cell(r)}</span>
              </div>
            ) : null))}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">{cols.map((c, i) => (role(c, i) === 'actions' ? <React.Fragment key={c.id}>{c.cell(r)}</React.Fragment> : null))}</div>
              <div>{cols.map((c, i) => (role(c, i) === 'status' ? <React.Fragment key={c.id}>{c.cell(r)}</React.Fragment> : null))}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Name with a quiet second line (email, university). */
export const Cell2: React.FC<{ title: React.ReactNode; sub?: React.ReactNode }> = ({ title, sub }) => (
  <div className="min-w-0">
    <p className="break-words font-semibold">{title}</p>
    {sub ? <p className="truncate text-[13px] text-sheet-muted">{sub}</p> : null}
  </div>
);

export const Actions: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="flex flex-wrap gap-1.5">{children}</div>;

/** Confirm dialog for destructive actions (Figma "Dialog: Hard delete"). */
export const ConfirmDialog: React.FC<{ open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string; confirm: string; busy?: boolean; error?: string | null }> = ({ open, onClose, onConfirm, title, body, confirm, busy, error }) => {
  const { tx } = useTx();
  return (
    <Dialog open={open} onClose={onClose} title={title} sub={body} testId="admin-confirm-dialog">
      {error ? <p role="alert" className="rounded-[14px] bg-[#c0392b]/15 px-4 py-3 text-[14px] font-medium">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2.5">
        <button type="button" onClick={onClose} className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-sheet-text px-6 text-[15px] font-semibold ${focus}`}>{tx('إلغاء', 'Annuler', 'Cancel')}</button>
        <DangerBtn onClick={onConfirm} disabled={busy} testId="admin-confirm-ok">{busy ? '…' : confirm}</DangerBtn>
      </div>
    </Dialog>
  );
};

/** Section heading used inside a page. */
export const H2: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-[20px] font-semibold">{children}</h2>
    {action}
  </div>
);

/** Two-column grid for forms. */
export const FormGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

/** Password input with show/hide and a generator, for accounts the admin creates. */
export const PasswordField: React.FC<{ id: string; label: string; hint?: string; value: string; onChange: (v: string) => void; onGenerate: () => void }> = ({ id, label, hint, value, onChange, onGenerate }) => {
  const { tx } = useTx();
  const [show, setShow] = React.useState(false);
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="flex flex-wrap gap-2">
        <input id={id} type={show ? 'text' : 'password'} dir="ltr" autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} min-w-0 flex-1`} />
        <Btn variant="secondary" onClick={() => setShow((v) => !v)} aria-pressed={show}>{show ? tx('إخفاء', 'Masquer', 'Hide') : tx('إظهار', 'Afficher', 'Show')}</Btn>
        <Btn variant="secondary" onClick={onGenerate}>{tx('توليد', 'Générer', 'Generate')}</Btn>
      </div>
    </Field>
  );
};

/** Shown once after the admin creates an account: the temporary password is not shown again. */
export const CredentialsDialog: React.FC<{ open: boolean; onClose: () => void; title: string; rows: [string, string][]; copyText: string; testId?: string }> = ({ open, onClose, title, rows, copyText, testId }) => {
  const { tx } = useTx();
  const [copied, setCopied] = React.useState(false);
  const copy = () => { navigator.clipboard.writeText(copyText); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  return (
    <Dialog open={open} onClose={onClose} title={title} sub={tx('انسخ بيانات الدخول وأرسلها الآن. لن تظهر كلمة المرور مرة أخرى.', 'Copiez les identifiants et envoyez-les maintenant. Le mot de passe ne sera plus affiché.', 'Copy the login details and send them now. The password will not be shown again.')} testId={testId}>
      <dl className="flex flex-col gap-2 rounded-[18px] bg-sheet-card p-4 text-[15px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4"><dt className="text-sheet-muted">{k}</dt><dd className="select-all break-all text-end font-semibold">{v}</dd></div>
        ))}
      </dl>
      <div className="flex flex-wrap justify-end gap-2.5">
        <Btn variant="secondary" onClick={copy}>{copied ? tx('تم النسخ', 'Copié', 'Copied') : tx('نسخ بيانات الدخول', 'Copier les identifiants', 'Copy login details')}</Btn>
        <Btn onClick={onClose}>{tx('إغلاق', 'Fermer', 'Close')}</Btn>
      </div>
    </Dialog>
  );
};

/** Card for catalog items (sessions, courses, bundles): title and status on top, key facts, actions. */
export const InfoCard: React.FC<{ title: React.ReactNode; sub?: React.ReactNode; status?: React.ReactNode; lines: [string, React.ReactNode][]; actions?: React.ReactNode; image?: string | null; testId?: string }> = ({ title, sub, status, lines, actions, image, testId }) => (
  <Panel as="article" className="flex flex-col gap-3" >
    <div data-testid={testId} className="flex flex-col gap-3">
      {image ? <img src={image} alt="" className="aspect-video w-full rounded-[16px] object-cover" /> : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-[18px] font-semibold leading-snug">{title}</h3>
          {sub ? <p className="text-[13px] text-sheet-muted">{sub}</p> : null}
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </div>
      <dl className="flex flex-col gap-1.5 text-[14px]">
        {lines.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4"><dt className="text-sheet-muted">{k}</dt><dd className="min-w-0 break-words text-end font-medium">{v}</dd></div>
        ))}
      </dl>
      {actions ? <div className="flex flex-wrap gap-1.5">{actions}</div> : null}
    </div>
  </Panel>
);

export const CardGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="grid gap-4 md:grid-cols-2">{children}</div>;
