// ESLint configuration for the whole monorepo.
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  // Generated files are never linted.
  globalIgnores([
    '**/out/',
    '**/dist/',
    '**/release/',
    '**/release-dev/',
    '**/coverage/',
    '**/test-results/'
  ]),

  // Base rules for JavaScript and TypeScript.
  js.configs.recommended,
  tseslint.configs.recommended,

  // Config files, scripts, main process and preload run in Node.js.
  {
    files: [
      '*.{js,ts}',
      'apps/desktop/*.ts',
      'apps/desktop/e2e/**/*.ts',
      'apps/desktop/scripts/**/*.mjs',
      'apps/desktop/src/{main,preload}/**/*.ts'
    ],
    languageOptions: { globals: globals.node }
  },

  // The UI runs in the browser and uses React hooks.
  {
    files: ['apps/desktop/src/renderer/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat.recommended]
  },

  // Turn off style rules that Prettier handles. Must stay last.
  prettier
)
