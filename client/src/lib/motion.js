export const ease = {
  out:   [0.2, 0, 0, 1],
  in:    [0.4, 0, 1, 1],
  inOut: [0.45, 0, 0.25, 1],
  emph:  [0.16, 1, 0.3, 1],     // expo-out feel for hero moves
};

export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 },   // buttons, toggles
  soft:   { type: 'spring', stiffness: 320, damping: 32 },              // sheets, bars, layout
  gentle: { type: 'spring', stiffness: 180, damping: 26 },              // large surfaces
};

export const dur = { fast: 0.12, base: 0.18, slow: 0.26, sig: 0.6 };

export const variants = {
  fadeUp:  { hidden: { opacity: 0, y: 8 },  show: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.out } } },
  fade:    { hidden: { opacity: 0 },        show: { opacity: 1,        transition: { duration: dur.base } } },
  scaleIn: { hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1, transition: spring.snappy } },
  stagger: (gap = 0.04, delay = 0) => ({ show: { transition: { staggerChildren: gap, delayChildren: delay } } }),
};
