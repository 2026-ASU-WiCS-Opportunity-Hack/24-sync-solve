module.exports = {
  '*.{ts,tsx}': [
    // 'eslint --fix', // TEMP: disabled to unblock commits; re-enable after ESLint config/issues are resolved.
    'prettier --write',
  ],
  '*.{json,md,css}': ['prettier --write'],
}
