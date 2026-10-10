'use client';

import React, { useSyncExternalStore } from 'react';

/**
 * Switch between the current landing and the redesigned one.
 * - NEXT_PUBLIC_NEW_DESIGN=1 turns the new design on for everyone (the go-live flag).
 * - Otherwise, in `next dev` only, a small toggle (or ?design=new / ?design=old) flips it for this browser.
 * Production builds never show the toggle and ignore the stored choice.
 */
const KEY = 'dz_new_design';
const EVENT = 'dz-new-design-change';
const ENV_ON = process.env.NEXT_PUBLIC_NEW_DESIGN === '1';
const IS_DEV = process.env.NODE_ENV === 'development';

function readStored(): boolean {
  if (ENV_ON) return true;
  if (!IS_DEV || typeof window === 'undefined') return false;
  try {
    const q = new URLSearchParams(window.location.search).get('design');
    if (q === 'new' || q === 'old') localStorage.setItem(KEY, q === 'new' ? '1' : '0');
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useNewDesign(): boolean {
  return useSyncExternalStore(subscribe, readStored, () => ENV_ON);
}

function setNewDesign(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* storage unavailable: the toggle simply does nothing */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Local-development switch. Renders nothing in production builds or when the go-live flag is on. */
export const DevDesignToggle: React.FC = () => {
  const on = useNewDesign();
  if (!IS_DEV || ENV_ON) return null;
  return (
    <button
      type="button"
      onClick={() => setNewDesign(!on)}
      className="fixed bottom-4 start-4 z-[90] rounded-full border border-white/20 bg-black/85 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      aria-pressed={on}
      data-testid="dev-design-toggle"
    >
      {on ? 'Design: NEW (click for old)' : 'Design: OLD (click for new)'}
    </button>
  );
};
