'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/lib/theme';

export type LogoVariant = 'auto' | 'dark' | 'light' | 'amber' | 'blue';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  withGlow?: boolean;
  variant?: LogoVariant;
}

export const DzPrimeLogo: React.FC<LogoProps> = ({
  size = 48,
  className = '',
  showText = true,
  withGlow = true,
  variant = 'auto',
}) => {
  const { theme, mounted } = useTheme();

  // Determine active variant:
  // First logo (amber/gold) for dark mode or explicit amber/dark
  // Second logo (blue) for light mode or explicit blue/light
  const isDarkEffective =
    variant === 'amber' ||
    variant === 'dark' ||
    (variant === 'auto' && (!mounted || theme === 'dark'));

  const logoSrc = isDarkEffective
    ? '/images/dzprime-logo-amber.png'
    : '/images/dzprime-logo-blue.png';

  const glowColor = isDarkEffective ? 'bg-amber-500/30' : 'bg-blue-500/30';
  const shadowFilter = isDarkEffective
    ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]'
    : 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <div className={`relative z-10 w-full h-full flex items-center justify-center ${shadowFilter}`}>
          <Image
            src={logoSrc}
            alt="DZ PRIME ACADEMY"
            width={size * 2}
            height={size * 2}
            className="w-full h-full object-contain select-none"
            priority
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col select-none">
          <span
            className={`font-black tracking-wider text-base sm:text-lg font-sans leading-tight ${
              isDarkEffective
                ? 'text-gold-300'
                : 'text-navy-950 dark:text-gold-300'
            }`}
          >
            DZ PRIME
          </span>
          <span
            className={`text-[9px] sm:text-[10px] tracking-[0.25em] font-bold uppercase ${
              isDarkEffective
                ? 'text-[#f4d58a]/90'
                : 'text-gold-700 dark:text-gold-300/90'
            }`}
          >
            ACADEMY
          </span>
        </div>
      )}
    </div>
  );
};
