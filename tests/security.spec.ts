import { test, expect } from '@playwright/test';

test.describe('Security Assertions', () => {

    test('Admin Login: should require credentials', async ({ page }) => {
        await page.goto('/admin/login');
        await expect(page).toHaveTitle(/Login/);

        // Attempt login without credentials
        await page.click('button[type="submit"]');

        // Check for validation errors if they exist, or ensure we didn't redirect
        await expect(page).toHaveURL(/\/admin\/login/);
    });

    test('Protected Route: /api/admin/prompts should be unauthorized without token', async ({ request }) => {
        const response = await request.get('/api/admin/prompts');
        expect(response.status()).toBe(401);
    });

    test('Protected Route: /api/admin/submissions should be unauthorized without token', async ({ request }) => {
        const response = await request.get('/api/admin/submissions');
        expect(response.status()).toBe(401);
    });

    test('Protected Route: /api/admin/auth/check should be unauthorized without token', async ({ request }) => {
        const response = await request.get('/api/admin/auth/check');
        expect(response.status()).toBe(401);
    });

    test('Security Headers: ensure X-Content-Type-Options is present', async ({ request }) => {
        const response = await request.get('/');
        const headers = response.headers();
        expect(headers['x-content-type-options']).toBe('nosniff');
    });

    test('Security Headers: ensure X-Frame-Options is present', async ({ request }) => {
        const response = await request.get('/');
        const headers = response.headers();
        expect(headers['x-frame-options']).toBeDefined();
    });
});
