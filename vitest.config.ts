// Vitest configuration: unit tests live next to the code, as *.test.* files.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'apps/*/src/**/*.test.{ts,tsx}',
      'apps/*/scripts/**/*.test.mjs',
      'packages/*/src/**/*.test.{ts,tsx}'
    ]
  }
})
