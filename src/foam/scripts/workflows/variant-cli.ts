import { getRequiredArg } from './github-actions';
import {
  getVariantMeta,
  ignoreTagsPattern,
  sentryDistFor,
  variantLabel,
} from './variant';

function main(): void {
  const [field, ...args] = process.argv.slice(2);
  const variant = getRequiredArg(args, 'variant');

  switch (field) {
    case 'sentry-dist':
      process.stdout.write(sentryDistFor(variant));
      return;
    case 'channel':
      process.stdout.write(getVariantMeta(variant).channel);
      return;
    case 'label':
      process.stdout.write(variantLabel(variant));
      return;
    case 'tag-suffix':
      process.stdout.write(getVariantMeta(variant).tagSuffix);
      return;
    case 'ignore-tags':
      process.stdout.write(
        ignoreTagsPattern(getRequiredArg(args, 'version'), variant),
      );
      return;
    default:
      throw new Error(`Unknown field: ${field ?? '<missing>'}`);
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`::error::${message}`);
  process.exit(1);
}
