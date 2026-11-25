import { defineConfig, devices } from "@playwright/test";

// Connected end-to-end tests: starts its own fake Supabase server (scripts/fake-supabase.mjs, in-memory,
// with the test clock enabled) and builds the app against it. Nothing to launch by hand:
//   npm run test:e2e:connected
// Ports differ from the default config (3100) so a running dev setup is never reused by mistake:
// NEXT_PUBLIC_* values are inlined at build time, so a server built without them would not work.
process.env.E2E_CONNECTED = "1";

const APP_PORT = 3101;
const FAKE_PORT = 54399;
process.env.E2E_FAKE_SUPABASE_URL = `http://127.0.0.1:${FAKE_PORT}`;

const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:${APP_PORT}`, trace: "off" },
  // One browser is enough here: the journey is the same on a phone, and the responsive layout is
  // covered by the anonymous specs and the audit.
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], channel } }],
  webServer: [
    {
      command: `node scripts/fake-supabase.mjs --port ${FAKE_PORT} --test-clock`,
      url: `http://127.0.0.1:${FAKE_PORT}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npm run build && npm run start -- -p ${APP_PORT}`,
      url: `http://127.0.0.1:${APP_PORT}`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${FAKE_PORT}`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-fake-key",
      },
    },
  ],
});
