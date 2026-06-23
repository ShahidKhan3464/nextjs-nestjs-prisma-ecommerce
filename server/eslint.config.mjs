// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  // Joi ships `export =`; some ESLint TypeScript programs (e.g. IDE) resolve `joi` as an intrinsic error type while `tsc`/CLI do not.
  {
    files: ['src/config/environment.validation.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  // `bcrypt` is native CJS without package exports; some IDE TypeScript-ESLint projectService runs resolve it as an error type while `tsc`/CLI do not.
  {
    files: ['src/auth/providers/bcrypt.provider.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  // `class-validator` / `@nestjs/swagger` / `class-transformer` decorators: projectService can treat imports as unresolved error types under NodeNext (decorator calls then trip no-unsafe-call).
  {
    files: ['src/**/*.dto.ts', 'src/**/*.entity.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    files: ['src/app.module.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  // Bootstrap uses `@nestjs/swagger`; projectService can treat it as an unresolved error type under NodeNext (same pattern as app.module).
  {
    files: ['src/main.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
);
