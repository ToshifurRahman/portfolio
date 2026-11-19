import { useEffect } from 'react';

/* The signature motion, in one place.
 *
 * The owner, 2026-11-15: "a ray from this will go down via strips till
 * footer & glow them like, they are taking charge from name, too much animation
 * can break attention to key points". On 2026-11-17 he removed the hero's gap
 * cells and kept the ray. On 2026-11-19 he asked for a continuous 10s cycle:
 *
 *   - the pulse runs down the strips every 10s (one CSS animation whose lit part
 *     is a short slice of it);
 *   - it pauses only when the page is hidden, and a scroll neither pauses nor
 *     restarts it;
 *   - it does not exist under `prefers-reduced-motion: reduce`;
 *   - the pre-render and the first client frame are identical: nothing is
 *     animated until after mount, and only by toggling a data attribute. It moves
 *     transform/opacity, so it stays on the compositor.
 *
 * It is one listener, not a timer per element.
 */
export function useSignatureMotion() {
  useEffect(() => {
    const root = document.documentElement;
    /* Reduced motion: never start. The coloured wordmark and the static strips
       are the whole design in that mode. `matchMedia` is absent in a
       non-browser environment, which is a reason not to animate, not to throw. */
    if (typeof matchMedia !== 'function') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    /* Arm the animation only now, so the pre-rendered HTML and the first client
       frame are the same picture. Scrolling must not touch this state: removing
       the animation to pause it resets its clock, which was the defect. */
    root.dataset.motion = 'on';

    const sync = () => {
      /* Hidden tab: nothing runs. Visible: the cycle continues, always. */
      root.dataset.motion = document.hidden ? 'paused' : 'on';
    };
    document.addEventListener('visibilitychange', sync);

    return () => {
      document.removeEventListener('visibilitychange', sync);
      delete root.dataset.motion;
    };
  }, []);
}
