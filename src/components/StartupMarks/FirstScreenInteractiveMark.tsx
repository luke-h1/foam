import { useEffect } from 'react';

import { markStartup } from '@app/lib/startupMarks';

/**
 * Render inside the first screen's loaded list, not its skeleton.
 */
export function FirstScreenInteractiveMark() {
  useEffect(() => {
    markStartup('first_screen_interactive');
  }, []);

  return null;
}
