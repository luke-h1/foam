const scopes = [
  'app',
  'ci',
  'test',
  'docs',
  'infrastructure',
  'chat',
  'twitch',
  'seventv',
  'bttv',
  'chat',
  'ffz',
  'stream',
  'auth',
];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', scopes],
  },
  scopeOverrides: {
    chore: [...scopes, { name: 'release' }],
  },
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix', 'perf', 'refactor', 'hotfix'],
  subjectLimit: 100,
  skipQuestions: ['body'],
};
