import { logger } from '../logger';

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export const shouldEnableWhyDidYouRender = __DEV__ && process.env.ENABLE_WDYR;

if (shouldEnableWhyDidYouRender) {
  const React = require('react');

  const whyDidYouRender = require('@welldone-software/why-did-you-render');

  logger.main.info('[WDYR] initializing');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    onlyLogs: true,
  });
}
