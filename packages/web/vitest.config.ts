/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
    // @ts-expect-error - Astro's getViteConfig type check doesn't know about Vitest yet
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './vitest.setup.ts',
        exclude: ['e2e/**/*', 'node_modules/**/*'],

        // Reporter por defecto (igual que API)

        // Mostrar console.logs durante tests
        onConsole: (log: any) => {
            console.log(log.content);
        },
    },
});
