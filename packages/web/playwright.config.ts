import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    // Reporter: 'list' para ver cada paso, 'html' para reporte visual
    reporter: [
        ['list'],
        ['html', { open: 'never' }]
    ],

    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:4321',
        trace: 'on-first-retry',

        // SIEMPRE mostrar navegador (headless: false), excepto en CI o si se fuerza
        headless: true,

        // Sin slowMo para evitar timeouts
        launchOptions: {
            slowMo: 0,
        },

        // Screenshots en cada falla
        screenshot: 'only-on-failure',

        // Video de cada test
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Timeout más largo para tests lentos
    timeout: 30000,
    expect: {
        timeout: 10000,
    },
});
