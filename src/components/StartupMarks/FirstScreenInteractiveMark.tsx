import { useEffect } from 'react';

import { markStartup } from '@app/lib/startupMarks';

/**
 * Render inside the first screen's loaded list so the mark (and Android
 * `reportFullyDrawn`) lands when real content is on screen.
 */
export function FirstScreenInteractiveMark() {
  useEffect(() => {
    markStartup('first_screen_interactive');
  }, []);

  return null;
}
