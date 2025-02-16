/**
 * @see https://jestjs.io/docs/configuration#globalsetup-string
 */
export default function globalSetup() {
  /**
   * @see https://stackoverflow.com/a/56482581
   */
  process.env.TZ = 'UTC';
}
