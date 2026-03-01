module.exports = {
  types: [
    {
      value: 'feat',
      name: 'feat:     A new feature',
      emoji: '✨',
    },
    {
      value: 'fix',
      name: 'fix:      A bug fix',
      emoji: '🐛',
    },
    {
      value: 'docs',
      name: 'docs:     Documentation only changes',
      emoji: '📚',
    },
    {
      value: 'style',
      name: 'style:    Changes that do not affect the meaning of the code',
      emoji: '💎',
    },
    {
      value: 'refactor',
      name: 'refactor: A code change that neither fixes a bug nor adds a feature',
      emoji: '♻️',
    },
    {
      value: 'perf',
      name: 'perf:     A code change that improves performance',
      emoji: '⚡️',
    },
    {
      value: 'test',
      name: 'test:     Adding missing tests or correcting existing tests',
      emoji: '🧪',
    },
    {
      value: 'build',
      name: 'build:    Changes that affect the build system or dependencies',
      emoji: '📦',
    },
    {
      value: 'ci',
      name: 'ci:       Changes to CI configuration files and scripts',
      emoji: '👷',
    },
    {
      value: 'chore',
      name: 'chore:    Other changes that do not modify src or test files',
      emoji: '🔧',
    },
    {
      value: 'revert',
      name: 'revert:   Reverts a previous commit',
      emoji: '⏪',
    },
    {
      value: 'wip',
      name: 'wip:      Work in progress',
      emoji: '🚧',
    },
  ],

  scopes: [
    { name: 'app' },
    { name: 'components' },
    { name: 'mesh' },
    { name: 'shaders' },
    { name: 'utils' },
    { name: 'lib' },
    { name: 'styles' },
    { name: 'config' },
    { name: 'deps' },
    { name: 'hooks' },
    { name: 'api' },
    { name: 'ui' },
  ],

  allowTicketNumber: false,
  isTicketNumberRequired: false,

  messages: {
    type: "Select the type of change that you're committing:",
    scope: '\nDenote the SCOPE of this change (optional):',
    customScope: 'Denote the SCOPE of this change:',
    subject: 'Write a SHORT, IMPERATIVE tense description of the change:\n',
    body: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
    breaking: 'List any BREAKING CHANGES (optional):\n',
    footer:
      'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n',
    confirmCommit: 'Are you sure you want to proceed with the commit above?',
  },

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  skipQuestions: ['body'],
  subjectLimit: 100,
};
