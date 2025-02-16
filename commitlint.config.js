// commitlint.config.js

const scopes = [
  'app',
  'infrastructure',
  'ui',
  'ci',
  'docs',
  'test',
  'documentation',
].map(name => ({
  name,
}));

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'release',
      ],
    ],
    'subject-case': [0], // Allow any case for the subject
  },
  types: [
    { value: 'feat', name: 'feat:\tAdding a new feature' },
    { value: 'fix', name: 'fix:\tFixing a bug' },
    { value: 'style', name: 'style: Add or update styles' },
    {
      value: 'refactor',
      name: 'refactor:\tCode change that neither fixes a bug nor adds a feature',
    },
    { value: 'perf', name: 'perf:\tCode change that improves performance' },
    { value: 'test', name: 'test:\tAdding test cases / adds missing tests' },
    {
      value: 'chore',
      name: 'chore:\tChanges to the build process or auxiliary tools and libraries such as documentation generation',
    },
    { value: 'revert', name: 'revert:\tRevert to a commit' },
    { value: 'release', name: 'release:\tRelease a new version (e.g., 0.0.2)' },
  ],
  scopes,
  scopeOverrides: {
    chore: [...scopes, { name: 'release' }],
  },
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix', 'perf', 'refactor'],
  subjectLimit: 100,
  skipQuestions: ['body'],
};
