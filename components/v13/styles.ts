/**
 * Type scale for version 13. Cormorant Garamond has a small x-height, so
 * everything set in it runs a step larger (and a weight heavier) than usual
 * to stay readable on phones.
 */
export const eyebrow =
  "text-xs font-medium tracking-[0.3em] text-(--jm-accent) uppercase sm:text-[0.8rem] sm:tracking-[0.35em]";
export const label =
  "text-xs font-medium tracking-[0.3em] text-(--jm-muted) uppercase sm:text-[0.8rem]";
export const heading =
  "mt-2 font-serif text-[1.7rem] leading-tight text-(--jm-ink) sm:mt-3 sm:text-4xl";
export const body =
  "mt-2 font-sans text-lg leading-relaxed font-medium text-(--jm-muted) sm:mt-3 sm:text-xl";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.8rem] font-semibold tracking-[0.25em] uppercase transition-colors duration-300 sm:px-7 sm:text-sm";
export const buttonPrimary = `${buttonBase} bg-(--jm-accent) text-(--jm-bg) hover:bg-(--jm-ink)`;
export const buttonOutline = `${buttonBase} border border-(--jm-ink)/35 text-(--jm-ink) hover:border-(--jm-ink) hover:bg-(--jm-ink)/5`;
