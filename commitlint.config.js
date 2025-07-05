export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-empty': [2, 'never'],
    'subject-full-stop': [0, 'never'],
    'header-max-length': [2, 'always', 100],
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'wip'],
    ],
  },
};
