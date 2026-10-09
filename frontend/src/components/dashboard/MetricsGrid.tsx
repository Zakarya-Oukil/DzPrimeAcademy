'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface MetricCardItem {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  description?: string;
}

interface MetricsGridProps {
  metrics: MetricCardItem[];
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-slate-200 dark:border-gold-500/30 bg-white dark:bg-navy-850 shadow-sm hover:shadow-md dark:hover:shadow-gold-glow hover:border-gold-500 transition-all duration-300 relative overflow-hidden group text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-gray-300 font-arabic">
                {metric.title}
              </span>
              <div className="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-600 dark:text-gold-400 group- transition-transform">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {metric.value}
              </h3>
              {metric.change && (
                <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
                  <span
                    className={
                      metric.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }
                  >
                    {metric.change}
                  </span>
                  <span className="text-slate-400 dark:text-gray-500 text-[10px] font-arabic">
                    vs last month
                  </span>
                </div>
              )}
              {metric.description && (
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 font-arabic">
                  {metric.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
