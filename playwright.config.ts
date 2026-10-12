import { defineConfig, devices } from '@playwright/test'

const variants = [
  { mode: 'whatsapp', port: 4173,
    directory: '.preview-builds/whatsapp', spec: 'chat.spec.ts' },
  { mode: 'telegram', port: 4175,
    directory: '.preview-builds/telegram', spec: 'telegram.spec.ts' },
  { mode: 'both', port: 4174,
    directory: '.preview-builds/both', spec: 'both.spec.ts' },
]

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure' },
  projects: variants.flatMap(({ mode, port, spec }) =>
    ['desktop', 'mobile'].map((viewport) => ({
      name: `${mode}-${viewport}`,
      testMatch: spec,
      use: {
        ...devices[viewport === 'mobile' ? 'Pixel 7' : 'Desktop Chrome'],
        baseURL: `http://127.0.0.1:${port}/green-api-test/`,
      },
    }))),
  webServer: variants.map(({ port, directory }) => ({
    command: `npm run preview -- --port ${port} --strictPort `
      + `--outDir ${directory}`,
    url: `http://127.0.0.1:${port}/green-api-test/`,
    reuseExistingServer: false,
  })),
})
