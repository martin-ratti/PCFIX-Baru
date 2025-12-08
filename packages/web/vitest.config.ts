/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './vitest.setup.ts',
        exclude: ['e2e/**/*', 'node_modules/**/*'],

        // Reporter verbose para ver cada test
        reporters: ['verbose'],

        // Mostrar console.logs durante tests
        onConsole: (log) => {
            console.log(log.content);
        },
    },
});
