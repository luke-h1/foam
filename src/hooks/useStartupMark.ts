import { useState } from 'react';

import { markStartup, type StartupMark } from '@app/lib/startupMarks';

/**
 * Records the mark during the first render, before any effect, so it sits
 * between `runApplication` and the first frame.
 */
export function useStartupMark(name: StartupMark): void {
  useState(() => {
    markStartup(name);
    return null;
  });
}
