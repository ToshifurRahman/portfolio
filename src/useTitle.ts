import { useEffect } from 'react';
import { owner } from './content';

/*
 * Set the tab title. `null` means "this component has no title to set" and
 * leaves the document alone: a parent that renders <NotFound /> must not
 * overwrite the title the child just set. `undefined` (or no argument) means
 * the home page's title.
 */
export function useTitle(title?: string | null) {
  useEffect(() => {
    if (title === null) return;
    document.title = title ? `${title} · ${owner.name}` : `${owner.name}, ${owner.role}`;
  }, [title]);
}
