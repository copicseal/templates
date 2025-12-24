import antfu from '@antfu/eslint-config';

export default antfu({
  formatters: true,
  vue: true,
}, {
  rules: {
    'no-debugger': ['error'],
    'no-console': ['warn'],
    'no-alert': ['warn'],
    'unused-imports/no-unused-vars': ['warn'],
    'vue/block-order': ['error', {
      order: ['template', 'script', 'style'],
    }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    'style/max-statements-per-line': ['warn'],
    'style/semi': ['warn', 'always'],
  },
});
