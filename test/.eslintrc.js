module.exports = {
    parserOptions: {
        project: 'tsconfig.test.json',
        sourceType: 'module',
    },
    rules: {
        'newline-per-chained-call': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        'no-magic-numbers': 'off',
        'no-null/no-null': 'off',
        'max-classes-per-file': 'off',
        'unicorn/filename-case': 'off',
    },
};
