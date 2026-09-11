import { useState } from 'react';

import { markStartup, type StartupMark } from '@app/lib/startupMarks';

/**
 * A state initialiser runs during the first render, before any effect.
 */
export function useStartupMark(name: StartupMark): void {
  useState(() => {
    markStartup(name);
    return null;
  });
}
