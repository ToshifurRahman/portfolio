import { useEffect } from 'react';
import { owner } from './content';

export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${owner.name}` : `${owner.name}, ${owner.role}`;
  }, [title]);
}
