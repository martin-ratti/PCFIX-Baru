import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
    test.skip('should allow user to login, add to cart, and checkout', async ({ page }) => {
        // Usuario del seed: martin@gmail.com / 123456

        // 1. Login
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[type="email"]', 'martin@gmail.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button:has-text("Entrar")');

        // Wait for redirect to home
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/', { timeout: 20000 });

        // 2. Add to Cart - go to products and add first available
        await page.goto('/tienda/productos');
        await page.waitForSelector('button:has-text("Agregar")', { timeout: 15000 });
        const addToCartBtn = page.locator('button:has-text("Agregar")').first();
        await addToCartBtn.click();
        await expect(page.locator('text=Agregado')).toBeVisible({ timeout: 5000 });

        // 3. Go to Cart
        await page.goto('/tienda/carrito');
        await expect(page.locator('text=Tu Carrito')).toBeVisible({ timeout: 10000 });

        // 4. Checkout Interaction
        await page.click('button:has-text("Retiro")');
        await page.selectOption('select', 'TRANSFERENCIA');

        // Finalize
        await page.click('button:has-text("Finalizar Compra")');

        // Allow time for redirect and load
        await expect(page).toHaveURL(/\/checkout\/\d+/, { timeout: 15000 });

        // Transferencia view shows payment info
        await expect(page.locator('text=Monto Exacto')).toBeVisible({ timeout: 15000 });
    });
});

test.describe('Navegación Básica', () => {
    test('Página de inicio carga correctamente', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/PCFIX/);
    });

    test('Página de login carga correctamente', async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page.locator('text=Iniciar Sesión')).toBeVisible();
    });

    test('Página de registro carga correctamente', async ({ page }) => {
        await page.goto('/auth/registro');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h2:has-text("Crear Cuenta")')).toBeVisible({ timeout: 10000 });
    });

    test('Página de productos carga correctamente', async ({ page }) => {
        await page.goto('/tienda/productos');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/tienda/productos');
    });
});

test.describe('Autenticación', () => {
    test('Login muestra error con credenciales inválidas', async ({ page }) => {
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'noexiste@test.com');
        await page.fill('input[type="password"]', 'wrongpassword123');
        await page.click('button:has-text("Entrar")');

        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/login/);
    });

    test('Registro muestra formulario completo', async ({ page }) => {
        await page.goto('/auth/registro');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.locator('button:has-text("Crear Cuenta")')).toBeVisible();
    });
});

test.describe('Carrito', () => {
    test('Carrito vacío muestra contenido', async ({ page }) => {
        await page.goto('/tienda/carrito');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/tienda/carrito');
    });
});

test.describe('Productos', () => {
    test('Lista de productos carga', async ({ page }) => {
        await page.goto('/tienda/productos');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/tienda/productos');
    });
});

test.describe('Admin (requiere auth)', () => {
    test('Acceso admin sin login redirige', async ({ page }) => {
        await page.goto('/admin');
        await expect(page).toHaveURL(/login|acceso-denegado/);
    });

    test.skip('Admin puede acceder al panel', async ({ page }) => {
        // Usuario admin del seed: admin@gmail.com / administrador
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'admin@gmail.com');
        await page.fill('input[type="password"]', 'administrador');
        await page.click('button:has-text("Entrar")');

        // Wait for redirect (could be / or /admin)
        await page.waitForLoadState('networkidle');
        // Accept redirect to home OR admin
        await expect(page).toHaveURL(/(\/|\/admin)$/, { timeout: 20000 });

        // Navigate to admin if not already there
        await page.goto('/admin');

        // Should be on admin page now
        await expect(page).toHaveURL('/admin');
    });
});
