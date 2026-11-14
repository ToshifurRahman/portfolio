import { defineConfig } from '@playwright/test';

const port = Number(process.env.LH_PORT ?? 4173);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `bun run build && bunx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
