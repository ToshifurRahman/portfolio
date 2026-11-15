import { useEffect, useRef } from 'react';

/* The signature motion, in one place.
 *
 * The owner, 2026-11-15 23:03: "a ray from this will go down via strips till
 * footer & glow them like, they are taking charge from name, too much animation
 * can break attention to key points", and "In hero, boxes between strips glow up
 * to down, low freq, add hover effect, 3 glow at a time on mouse hover".
 *
 * Two behaviours, one restraint contract:
 *
 *   - the pulse runs down the strips once on load, then at most once every 26s
 *     (one CSS animation of 26s whose lit part is a short slice of it);
 *   - the hero cells glow in a slow wave of at least 8s per cycle;
 *   - both pause when the page is hidden, and the pulse pauses off-screen;
 *   - neither exists under `prefers-reduced-motion: reduce`;
 *   - the pre-render and the first client frame are identical: nothing is
 *     animated until after mount, and only by toggling a data attribute. All
 *     motion is transform/opacity, so it stays on the compositor.
 *
 * The pause is one shared observer and one listener, not a timer per element.
 */
export function useSignatureMotion() {
  const hero = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    /* Reduced motion: never start. The coloured wordmark and the static strips
       are the whole design in that mode. */
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    /* Arm the animation only now, so the pre-rendered HTML and the first client
       frame are the same picture. */
    root.dataset.motion = 'on';

    const sync = () => {
      /* Hidden tab: nothing runs. */
      if (document.hidden) {
        root.dataset.motion = 'paused';
        return;
      }
      root.dataset.motion = 'on';
    };
    document.addEventListener('visibilitychange', sync);

    const element = hero.current;

    /* The pointer's three cells. `pointermove` is throttled to one frame, so
       dragging across the hero costs one layout read per frame, and the class is
       only written when the nearest cell actually changes. */
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      /* `currentTarget` is null by the time the frame runs, so the element and
         the pointer position are read now and carried into the callback. */
      const target = element;
      const x = event.clientX;
      if (!target) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const cells = [...target.querySelectorAll<HTMLElement>('.hero-cell')];
        if (!cells.length) return;
        /* The nearest cell to the pointer's x, then it and its two neighbours. */
        let nearest = 0;
        let best = Infinity;
        cells.forEach((cell, i) => {
          const rect = cell.getBoundingClientRect();
          const distance = Math.abs(rect.left + rect.width / 2 - x);
          if (distance < best) {
            best = distance;
            nearest = i;
          }
        });
        const hot = new Set([nearest - 1, nearest, nearest + 1]);
        cells.forEach((cell, i) => cell.classList.toggle('is-hot', hot.has(i)));
      });
    };
    const onLeave = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      element?.querySelectorAll('.hero-cell').forEach((cell) => cell.classList.remove('is-hot'));
    };

    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    if (element && finePointer.matches) {
      element.addEventListener('pointermove', onMove, { passive: true });
      element.addEventListener('pointerleave', onLeave);
    }

    /* Off-screen: the hero's own glow stops when the hero is scrolled away. */
    let observer: IntersectionObserver | undefined;
    if (element && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          element.dataset.inview = entry.isIntersecting ? 'true' : 'false';
        },
        { rootMargin: '10% 0px' },
      );
      observer.observe(element);
    }

    return () => {
      document.removeEventListener('visibilitychange', sync);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      element?.removeEventListener('pointermove', onMove);
      element?.removeEventListener('pointerleave', onLeave);
      element?.querySelectorAll('.hero-cell').forEach((cell) => cell.classList.remove('is-hot'));
      delete root.dataset.motion;
      if (element) delete element.dataset.inview;
    };
  }, []);

  return hero;
}
