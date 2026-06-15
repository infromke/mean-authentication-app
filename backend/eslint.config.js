import pluginJs from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { files: ['src/**/*.ts'] }, // aplica as configurações em todos os arquivos TypeScript

  { ignores: ['dist/**', 'node_modules/**'] },

  // usa as regras recomendadas de JavaScript e TypeScript
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error', // força a remoção de qualquer "any" explícito
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // desativa regras que brigam com o Prettier
  eslintConfigPrettier,
)
