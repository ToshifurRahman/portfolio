import { useEffect } from 'react';

/* The signature motion, in one place.
 *
 * The owner, 2026-11-15: "a ray from this will go down via strips till
 * footer & glow them like, they are taking charge from name, too much animation
 * can break attention to key points". On 2026-11-17 he removed the hero's gap
 * cells and kept the ray, so one behaviour is left:
 *
 *   - the pulse runs down the strips once on load, then at most once every 26s
 *     (one CSS animation of 26s whose lit part is a short slice of it);
 *   - it pauses when the page is hidden and while the page is being scrolled;
 *   - it does not exist under `prefers-reduced-motion: reduce`;
 *   - the pre-render and the first client frame are identical: nothing is
 *     animated until after mount, and only by toggling a data attribute. It moves
 *     transform/opacity, so it stays on the compositor.
 *
 * The pause is one listener, not a timer per element.
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
       frame are the same picture. */
    root.dataset.motion = 'on';

    let scrolling = 0;
    let settle = 0;

    const sync = () => {
      /* Hidden tab: nothing runs. */
      if (document.hidden) {
        root.dataset.motion = 'paused';
        return;
      }
      /* A fast scroll is not a moment to animate into: the motion is worth
         nothing while the page is flying past, and it is one more thing moving
         under a reader who is looking for where they are. The quiet period is
         short enough that stopping feels like the page settling rather than a
         delay. */
      if (scrolling) {
        root.dataset.motion = 'scrolling';
        return;
      }
      root.dataset.motion = 'on';
    };
    document.addEventListener('visibilitychange', sync);

    const onScroll = () => {
      scrolling = 1;
      sync();
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        scrolling = 0;
        sync();
      }, 220);
    };
    addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', sync);
      removeEventListener('scroll', onScroll);
      window.clearTimeout(settle);
      delete root.dataset.motion;
    };
  }, []);
}
