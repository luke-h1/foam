module.exports = {
  meta: { name: 'local' },
  rules: {
    'blank-line-between-top-level': require('./blank-line-between-top-level.cjs'),
    'no-hardcoded-hex-color': require('./no-hardcoded-hex-color.cjs'),
    'prefer-alias-imports': require('./prefer-alias-imports.cjs'),
    'require-memoized-component-export': require('./require-memoized-component-export.cjs'),
  },
};
