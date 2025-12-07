import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
    test('should allow user to login, add to cart, and checkout', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'test_purchase_123@test.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button:has-text("Entrar")');
        await expect(page).toHaveURL('/');

        // 2. Add to Cart
        await page.goto('/productos?search=Ryzen');
        await page.waitForSelector('text=Ryzen 9');
        const addToCartBtn = page.locator('button:has-text("Agregar")').first();
        await addToCartBtn.click();
        await expect(page.locator('text=Agregado')).toBeVisible();

        // 3. Go to Cart
        await page.goto('/carrito');
        await expect(page.locator('text=Tu Carrito')).toBeVisible();
        await expect(page.locator('text=Ryzen 9')).toBeVisible();

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


