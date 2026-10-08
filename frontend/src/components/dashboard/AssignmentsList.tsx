'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, X, Calendar } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface AssignmentItem {
  id: string;
  title: string;
  date: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'UPCOMING';
}

interface AssignmentsListProps {
  locale: string;
}

const STATUS_STYLE: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  UPCOMING: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
};

const STATUS_LABEL_AR: Record<string, string> = { IN_PROGRESS: 'قيد التقدم', COMPLETED: 'مكتمل ✓', UPCOMING: 'قادم' };
const STATUS_LABEL_FR: Record<string, string> = { IN_PROGRESS: 'En cours', COMPLETED: 'Terminé ✓', UPCOMING: 'À venir' };

export const AssignmentsList: React.FC<AssignmentsListProps> = ({ locale }) => {
  const { currentUser } = useAuthStore();
  // Personal checklist kept on this device only, one list per account so a shared browser never shows another student's tasks.
  const storageKey = `dz_student_assignments:${currentUser?.id ?? 'anon'}`;
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setItems(saved ? JSON.parse(saved) : []);
    } catch {}
  }, [storageKey]);

  const saveItems = (updated: AssignmentItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const nowStr = newDate || new Date().toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { day: '2-digit', month: 'short' });
    const newItem: AssignmentItem = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      date: nowStr,
      status: 'IN_PROGRESS',
    };
    saveItems([newItem, ...items]);
    setNewTitle('');
    setNewDate('');
    setIsAdding(false);
  };

  const toggleStatus = (id: string) => {
    const updated = items.map((it) => {
      if (it.id !== id) return it;
      const nextStatus: AssignmentItem['status'] = it.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
      return { ...it, status: nextStatus };
    });
    saveItems(updated);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveItems(items.filter((it) => it.id !== id));
  };

  return (
    <div data-testid="assignments-list" className="p-5 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 font-arabic">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">
          {locale === 'ar' ? 'الواجبات والمهام الدراسية' : 'Assignments & Tâches'}
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          data-testid="add-assignment-btn"
          className="w-7 h-7 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 flex items-center justify-center shadow-sm active:scale-95 transition-all"
          title={locale === 'ar' ? 'إضافة مهمة جديدة' : 'Ajouter une tâche'}
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-lime-400/40 space-y-2.5">
          <input
            type="text"
            required
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={locale === 'ar' ? 'عنوان الواجب أو التمرين...' : 'Titre du devoir ou TD...'}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-lime-400"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              placeholder={locale === 'ar' ? 'الموعد (مثال: غداً 10:00)' : 'Échéance (ex: Demain 10h)'}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center gap-1 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'حفظ' : 'Ajouter'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-slate-400 py-4 text-center">
            {locale === 'ar' ? 'لا توجد مهام حالياً. اضغط + لإضافة واحدة.' : 'Aucune tâche. Cliquez sur + pour en ajouter.'}
          </p>
        )}
        {items.map((a) => (
          <div
            key={a.id}
            data-testid={`assignment-item-${a.id}`}
            onClick={() => toggleStatus(a.id)}
            className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                  a.status === 'COMPLETED'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 dark:border-gray-600 hover:border-lime-500'
                }`}
              >
                {a.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="min-w-0">
                <h4 className={`text-xs font-bold truncate transition-colors ${a.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                  {a.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">{a.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${STATUS_STYLE[a.status]}`}>
                {locale === 'ar' ? STATUS_LABEL_AR[a.status] : STATUS_LABEL_FR[a.status]}
              </span>
              <button
                onClick={(e) => handleDelete(a.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

