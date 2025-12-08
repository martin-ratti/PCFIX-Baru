import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
    test('should allow user to login, add to cart, and checkout', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'test_purchase_123@test.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button:has-text("Entrar")');
        await expect(page).toHaveURL('/');

        // 2. Add to Cart - go to products and add first available
        await page.goto('/productos');
        await page.waitForSelector('button:has-text("Agregar")', { timeout: 15000 });
        const addToCartBtn = page.locator('button:has-text("Agregar")').first();
        await addToCartBtn.click();
        await expect(page.locator('text=Agregado')).toBeVisible();

        // 3. Go to Cart
        await page.goto('/carrito');
        await expect(page.locator('text=Tu Carrito')).toBeVisible();

        // 4. Checkout Interaction
        await page.click('button:has-text("Retiro")');
        await page.selectOption('select', 'TRANSFERENCIA');

        // Finalize
        await page.click('button:has-text("Finalizar Compra")');

        // Allow time for redirect and load
        await expect(page).toHaveURL(/\/checkout\/\d+/);

        // Transferencia view shows "Monto Exacto" and "CBU"
        await expect(page.locator('text=Monto Exacto')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=Comprobante').first()).toBeVisible();
    });
});


test.describe('Navegación Básica', () => {

    test('Página de inicio carga correctamente', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/PCFIX/);
    });

    test('Página de login carga correctamente', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('text=Iniciar Sesión')).toBeVisible();
    });
});
