import { useEffect, useRef, useState } from 'react';

/* "Copy email": a real button beside the address.
 *
 * The clipboard is not always available — it is absent on an insecure origin and
 * can be refused by permissions — so the fallback selects the address text
 * instead, which is what a visitor would have done by hand. The confirmation is
 * announced through a polite live region rather than being colour alone, and it
 * clears after about two seconds so the button does not stay changed.
 *
 * The address itself is passed in, never held in state: nothing here decides
 * what the address is.
 */
export function CopyEmail({ email, targetId }: { email: string; targetId: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'selected'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const announce = (next: 'copied' | 'selected' | 'idle') => {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2000);
  };

  /* Select the address on the page, so the visitor can copy it themselves. */
  const selectAddress = () => {
    const element = document.getElementById(targetId);
    const selection = window.getSelection();
    if (!element || !selection) return false;
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  };

  const onClick = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(email);
      announce('copied');
    } catch {
      /* Unavailable or refused: fall back to selecting the text. */
      announce(selectAddress() ? 'selected' : 'idle');
    }
  };

  const label = state === 'copied' ? 'Copied' : state === 'selected' ? 'Selected' : 'Copy email';

  return (
    <>
      <button type="button" className="copy-button" onClick={onClick}>
        {label}
      </button>
      {/* Polite, not assertive: a copy is a confirmation, never an interruption. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {state === 'copied' ? 'Address copied to the clipboard' : ''}
        {state === 'selected' ? 'Address selected: press your copy shortcut' : ''}
      </span>
    </>
  );
}
