// Vitest configuration: unit tests live next to the code, as *.test.ts(x) files.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['apps/*/src/**/*.test.{ts,tsx}', 'packages/*/src/**/*.test.{ts,tsx}']
  }
})
