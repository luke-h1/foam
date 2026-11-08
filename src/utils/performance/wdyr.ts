import { logger } from '../logger';

const shouldEnableWhyDidYouRender =
  __DEV__ && process.env.EXPO_PUBLIC_ENABLE_WDYR === 'true';

if (shouldEnableWhyDidYouRender) {
  const React = require('react');

  const whyDidYouRender = require('@welldone-software/why-did-you-render');

  logger.main.info('[WDYR] initializing');

  whyDidYouRender(React, {
    trackAllPureComponents: true,
    onlyLogs: true,
  });
}
