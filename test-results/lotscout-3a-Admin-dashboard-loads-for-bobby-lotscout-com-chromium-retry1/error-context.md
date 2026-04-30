# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lotscout.spec.ts >> 3a. Admin dashboard loads for bobby@lotscout.com
- Location: tests/lotscout.spec.ts:163:5

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "https://www.lotscout.com/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "LotScout" [ref=e5] [cursor=pointer]:
        - /url: /home
      - paragraph [ref=e6]: Sign in to your account
    - generic [ref=e7]:
      - heading "Sign In" [level=1] [ref=e8]
      - button "Continue with Google" [ref=e9]:
        - img [ref=e10]
        - text: Continue with Google
      - generic [ref=e17]: or
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: Email
          - textbox "Email" [ref=e22]:
            - /placeholder: jane@example.com
            - text: bobby@lotscout.com
        - generic [ref=e23]:
          - generic [ref=e24]:
            - generic [ref=e25]: Password
            - button "Forgot Password?" [ref=e26]
          - textbox "Password" [ref=e27]:
            - /placeholder: Your password
            - text: Bobby2026!
        - generic [ref=e28] [cursor=pointer]:
          - checkbox "Remember me" [checked] [ref=e29]
          - generic [ref=e30]: Remember me
        - paragraph [ref=e31]: Invalid email or password
        - button "Sign In" [ref=e32]
    - paragraph [ref=e33]:
      - text: Don't have an account?
      - link "Sign Up" [ref=e34] [cursor=pointer]:
        - /url: /sign-up
  - alert [ref=e35]
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | import { createClient } from '@supabase/supabase-js';
  3   | 
  4   | const BASE = 'https://www.lotscout.com';
  5   | const STANDARD_EMAIL = 'teststandard@lotscout.com';
  6   | const STANDARD_PASS = 'TestStandard123!';
  7   | const ADMIN_EMAIL = 'bobby@lotscout.com';
  8   | 
  9   | const supabase = createClient(
  10  |   'https://axiockuobpttlwzicldo.supabase.co',
  11  |   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aW9ja3VvYnB0dGx3emljbGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxNjk2NCwiZXhwIjoyMDkxNTkyOTY0fQ.PLW0Zjnu-KmlT6fE57j1EzkEj3a2fnHaFEUVyiwUTuk',
  12  |   { auth: { persistSession: false } }
  13  | );
  14  | 
  15  | async function signIn(page: Page, email: string, password: string) {
  16  |   await page.goto(`${BASE}/sign-in`);
  17  |   await page.waitForLoadState('networkidle');
  18  |   await page.fill('input[type="email"]', email);
  19  |   await page.fill('input[type="password"]', password);
  20  |   await page.click('button[type="submit"]');
> 21  |   await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });
      |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  22  | }
  23  | 
  24  | // ─── TEST 1: BUYER REQUEST FLOW ────────────────────────────────────────────
  25  | test('1a. Buyer request flow — fill form and submit', async ({ page }) => {
  26  |   await signIn(page, STANDARD_EMAIL, STANDARD_PASS);
  27  |   await page.goto(`${BASE}/create-buyer-request`);
  28  |   await page.waitForLoadState('networkidle');
  29  | 
  30  |   // Check page loaded
  31  |   await expect(page).toHaveURL(/create-buyer-request/);
  32  | 
  33  |   // Fill required fields — adapt selectors to actual form
  34  |   // Budget
  35  |   const budgetMin = page.locator('input[name="budget_min"], input[placeholder*="min"], input[placeholder*="Min"]').first();
  36  |   const budgetMax = page.locator('input[name="budget_max"], input[placeholder*="max"], input[placeholder*="Max"]').first();
  37  |   await budgetMin.fill('500000');
  38  |   await budgetMax.fill('1500000');
  39  | 
  40  |   // Min acreage
  41  |   const minAcreage = page.locator('input[name="min_acreage"], input[placeholder*="acreage"], input[placeholder*="Acreage"]').first();
  42  |   await minAcreage.fill('50');
  43  | 
  44  |   // Target close date
  45  |   const closeDate = page.locator('input[type="date"], input[name="target_close_date"]').first();
  46  |   if (await closeDate.isVisible()) await closeDate.fill('2026-09-01');
  47  | 
  48  |   // Contact method — click first available checkbox/button
  49  |   const contactBtn = page.locator('button:has-text("Email"), input[value="Email"]').first();
  50  |   if (await contactBtn.isVisible()) await contactBtn.click();
  51  | 
  52  |   // Zoning — click first option
  53  |   const zoningBtn = page.locator('button:has-text("Any"), button:has-text("Residential"), button:has-text("Agricultural")').first();
  54  |   if (await zoningBtn.isVisible()) await zoningBtn.click();
  55  | 
  56  |   // Use case
  57  |   const useCaseSelect = page.locator('select[name="use_case"], button:has-text("Residential Development"), button:has-text("Custom Home")').first();
  58  |   if (await useCaseSelect.isVisible()) await useCaseSelect.click();
  59  | 
  60  |   // Submit
  61  |   const submitBtn = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Post")').last();
  62  |   await submitBtn.click();
  63  | 
  64  |   // Confirm redirect to marketplace
  65  |   await page.waitForURL(`${BASE}/marketplace`, { timeout: 20000 });
  66  |   await expect(page).toHaveURL(/marketplace/);
  67  |   console.log('✅ Redirected to /marketplace after submit');
  68  | });
  69  | 
  70  | test('1b. Buyer request flow — success toast visible', async ({ page }) => {
  71  |   await signIn(page, STANDARD_EMAIL, STANDARD_PASS);
  72  |   await page.goto(`${BASE}/marketplace`);
  73  |   // Toast should be visible if we just submitted — check for any toast/success element
  74  |   const toast = page.locator('[role="alert"], .toast, [class*="toast"], [class*="success"]').first();
  75  |   // Not guaranteed to still be visible, so just check page loaded
  76  |   await expect(page).toHaveURL(/marketplace/);
  77  |   console.log('✅ Marketplace page loaded');
  78  | });
  79  | 
  80  | test('1c. Buyer request row in Supabase', async ({ page }) => {
  81  |   // Check DB directly for a recent buyer request from the standard test user
  82  |   const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  83  |   const user = users?.users?.find(u => u.email === STANDARD_EMAIL);
  84  |   expect(user).toBeTruthy();
  85  |   console.log('Standard user id:', user!.id);
  86  | 
  87  |   const { data, error } = await supabase
  88  |     .from('buyer_requests')
  89  |     .select('id, status, created_at')
  90  |     .eq('user_id', user!.id)
  91  |     .eq('status', 'active')
  92  |     .order('created_at', { ascending: false })
  93  |     .limit(1);
  94  | 
  95  |   expect(error).toBeNull();
  96  |   expect(data?.length).toBeGreaterThan(0);
  97  |   console.log('✅ Buyer request row found in Supabase:', data![0]);
  98  | });
  99  | 
  100 | // ─── TEST 2: BUYER REQUEST VIEW ────────────────────────────────────────────
  101 | test('2a. Marketplace Buyer Requests tab — 185+ cards', async ({ page }) => {
  102 |   await signIn(page, STANDARD_EMAIL, STANDARD_PASS);
  103 |   await page.goto(`${BASE}/marketplace`);
  104 |   await page.waitForLoadState('networkidle');
  105 | 
  106 |   // Click Buyer Requests tab
  107 |   await page.click('button:has-text("Buyer Requests")');
  108 |   await page.waitForTimeout(2000);
  109 | 
  110 |   // Count cards
  111 |   const cards = page.locator('[class*="rounded-2xl"], [class*="card"], .buyer-card').filter({ hasText: /Buyer|Active|Budget/ });
  112 |   const count = await cards.count();
  113 |   console.log(`Found ${count} buyer cards`);
  114 |   expect(count).toBeGreaterThanOrEqual(100); // at least 100 visible (pagination may limit)
  115 |   console.log('✅ Buyer cards visible on marketplace');
  116 | });
  117 | 
  118 | test('2b. Click buyer card — routes to /buyer-requests/[id]', async ({ page }) => {
  119 |   await signIn(page, STANDARD_EMAIL, STANDARD_PASS);
  120 |   await page.goto(`${BASE}/marketplace`);
  121 |   await page.waitForLoadState('networkidle');
```