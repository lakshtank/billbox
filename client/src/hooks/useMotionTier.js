import { useReducedMotion } from 'motion/react';

export function useMotionTier() {
  const reduced = useReducedMotion();
  if (reduced) return 'none';
  const lowCpu  = (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 8 : 8) <= 4;
  const lowMem  = (typeof navigator !== 'undefined' ? navigator.deviceMemory ?? 8 : 8) <= 2;
  const saveData = typeof navigator !== 'undefined' ? navigator.connection?.saveData : false;
  return lowCpu || lowMem || saveData ? 'lite' : 'full';
}
// none → T1 only, instant. lite → T1 + T2. full → everything.
