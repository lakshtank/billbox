/**
 * First receipt moment confetti animation (T4)
 * Only fires once per account / browser session.
 */
export async function firstReceiptMoment(el) {
  try {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('billbox.firstReceipt')) return;
    localStorage.setItem('billbox.firstReceipt', '1');

    const { default: confetti } = await import('canvas-confetti');
    
    let originX = 0.5;
    let originY = 0.5;

    if (el && typeof el.getBoundingClientRect === 'function') {
      const r = el.getBoundingClientRect();
      originX = (r.left + r.width / 2) / window.innerWidth;
      originY = (r.top + r.height / 2) / window.innerHeight;
    }

    confetti({
      particleCount: 70,
      spread: 60,
      startVelocity: 28,
      ticks: 140,
      scalar: 0.8,
      gravity: 1.1,
      origin: { x: originX, y: originY },
      colors: ['#124E66', '#3E97B0', '#0F9D6B', '#D3D9D4'],
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn('Confetti animation skipped or failed to load:', err);
  }
}
