module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'app',
        'ci',
        'test',
        'docs',
        'infrastructure',
        'chat',
        'twitch',
        'seventv',
        'bttv',
        'ffz',
        'stream',
        'auth',
      ],
    ],
  },
  scopeOverrides: {
    chore: [...scopes, { name: 'release' }],
  },
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix', 'perf', 'refactor', 'hotfix'],
  subjectLimit: 100,
  skipQuestions: ['body'],
};
