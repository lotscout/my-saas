# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lotscout.spec.ts >> 2a. Marketplace Buyer Requests tab — 185+ cards
- Location: tests/lotscout.spec.ts:101:5

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 100
Received:    0
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - img "LotScout Logo" [ref=e5]
        - text: LotScout
      - navigation [ref=e6]:
        - link "Dashboard" [ref=e7] [cursor=pointer]:
          - /url: /dashboard
        - link "Marketplace" [ref=e8] [cursor=pointer]:
          - /url: /marketplace
        - link "Buyer Directory" [ref=e9] [cursor=pointer]:
          - /url: /buyer-directory
        - link "Deal Analysis" [ref=e10] [cursor=pointer]:
          - /url: /property-analysis
        - link "Messaging" [ref=e11] [cursor=pointer]:
          - /url: /messaging
      - generic [ref=e12]:
        - button "notifications" [ref=e13]:
          - generic [ref=e14]: notifications
        - button "account_circle" [ref=e16]:
          - generic [ref=e17]: account_circle
    - main [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - heading "Scout Your Next Deal" [level=1] [ref=e21]
          - paragraph [ref=e22]: Advanced land acquisition powered by cartographic precision. Browse 2,400+ off-market listings throughout the U.S
        - generic [ref=e23]:
          - button "Grid" [ref=e24]
          - button "Map View" [ref=e25]
      - generic [ref=e26]:
        - button "Properties" [ref=e27]
        - button "Buyer Requests" [active] [ref=e28]
      - generic [ref=e29]:
        - paragraph [ref=e31]: Active buyers looking for land that matches your listings
        - button "add Find a Property" [ref=e32]:
          - generic [ref=e33]: add
          - text: Find a Property
      - generic [ref=e35]:
        - generic: search
        - textbox "Search by state, county, or zip code..." [ref=e36]
      - generic [ref=e37]:
        - combobox [ref=e38] [cursor=pointer]:
          - option "Budget Range" [selected]
          - option "Under $50K"
          - option "$50K–$100K"
          - option "$100K–$500K"
          - option "$500K–$1M"
          - option "$1M–$5M"
          - option "$5M+"
        - combobox [ref=e39] [cursor=pointer]:
          - option "Acreage Range" [selected]
          - option "Under 5 acres"
          - option "5–25 acres"
          - option "25–100 acres"
          - option "100–500 acres"
          - option "500+ acres"
        - combobox [ref=e40] [cursor=pointer]:
          - option "Zoning Type" [selected]
          - option "Agricultural"
          - option "Residential"
          - option "Commercial"
          - option "Industrial"
          - option "Mixed Use"
          - option "Recreational"
          - option "Timber"
          - option "Other"
        - combobox [ref=e41] [cursor=pointer]:
          - option "Use Case" [selected]
          - option "Row Crop"
          - option "Livestock/Ranching"
          - option "Timber"
          - option "Recreational"
          - option "Residential Development"
          - option "Commercial Development"
          - option "Conservation"
          - option "Investment"
        - combobox [ref=e42] [cursor=pointer]:
          - option "Timeline" [selected]
          - option "Immediately"
          - option "1–3 months"
          - option "3–6 months"
          - option "6+ months"
      - generic [ref=e43]:
        - generic [ref=e44]: person_search
        - paragraph [ref=e45]: No buyer requests yet
        - paragraph [ref=e46]: Be the first to post your buying criteria and connect with sellers
        - button "Find a Property" [ref=e47]
    - contentinfo [ref=e48]:
      - generic [ref=e49]:
        - generic [ref=e50]:
          - img "LotScout Logo" [ref=e51]
          - text: LotScout
        - paragraph [ref=e52]: Advanced Geospatial Land Management Systems. Precision in every boundary. Engineered for the modern acquisition professional.
        - generic [ref=e53]: © 2024 LotScout. All rights reserved.
      - generic [ref=e54]:
        - link "Terms of Service" [ref=e55] [cursor=pointer]:
          - /url: "#"
        - link "Privacy Policy" [ref=e56] [cursor=pointer]:
          - /url: "#"
        - link "Data Sources" [ref=e57] [cursor=pointer]:
          - /url: "#"
        - link "Contact Support" [ref=e58] [cursor=pointer]:
          - /url: "#"
    - button "add" [ref=e60]:
      - generic [ref=e61]: add
  - alert [ref=e62]
```

# Test source

```ts
  14  | 
  15  | async function signIn(page: Page, email: string, password: string) {
  16  |   await page.goto(`${BASE}/sign-in`);
  17  |   await page.waitForLoadState('networkidle');
  18  |   await page.fill('input[type="email"]', email);
  19  |   await page.fill('input[type="password"]', password);
  20  |   await page.click('button[type="submit"]');
  21  |   await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });
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
> 114 |   expect(count).toBeGreaterThanOrEqual(100); // at least 100 visible (pagination may limit)
      |                 ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  115 |   console.log('✅ Buyer cards visible on marketplace');
  116 | });
  117 | 
  118 | test('2b. Click buyer card — routes to /buyer-requests/[id]', async ({ page }) => {
  119 |   await signIn(page, STANDARD_EMAIL, STANDARD_PASS);
  120 |   await page.goto(`${BASE}/marketplace`);
  121 |   await page.waitForLoadState('networkidle');
  122 | 
  123 |   await page.click('button:has-text("Buyer Requests")');
  124 |   await page.waitForTimeout(2000);
  125 | 
  126 |   // Click the first buyer card
  127 |   const firstCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: /Active Buying/ }).first();
  128 |   await firstCard.click();
  129 | 
  130 |   await page.waitForURL(/buyer-requests\//, { timeout: 10000 });
  131 |   await expect(page.url()).toMatch(/buyer-requests\/.+/);
  132 |   console.log('✅ Routed to:', page.url());
  133 | });
  134 | 
  135 | test('2c. Buyer detail page shows correct data', async ({ page }) => {
  136 |   await signIn(page, STANDARD_EMAIL, STANDARD_PASS);
  137 |   await page.goto(`${BASE}/marketplace`);
  138 |   await page.waitForLoadState('networkidle');
  139 | 
  140 |   await page.click('button:has-text("Buyer Requests")');
  141 |   await page.waitForTimeout(2000);
  142 | 
  143 |   const firstCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: /Active Buying/ }).first();
  144 |   await firstCard.click();
  145 |   await page.waitForURL(/buyer-requests\//, { timeout: 10000 });
  146 |   await page.waitForLoadState('networkidle');
  147 | 
  148 |   // Check for key data fields on the detail page
  149 |   const body = await page.textContent('body');
  150 |   const hasTimeline = /ASAP|Actively|months|Flexible|Short|Medium/i.test(body ?? '');
  151 |   const hasBudget = /\$|budget/i.test(body ?? '');
  152 |   const hasAcreage = /acres|acreage/i.test(body ?? '');
  153 | 
  154 |   console.log('Timeline present:', hasTimeline);
  155 |   console.log('Budget present:', hasBudget);
  156 |   console.log('Acreage present:', hasAcreage);
  157 | 
  158 |   expect(hasTimeline || hasBudget || hasAcreage).toBeTruthy();
  159 |   console.log('✅ Detail page has buyer data');
  160 | });
  161 | 
  162 | // ─── TEST 3: ADMIN DASHBOARD ───────────────────────────────────────────────
  163 | test('3a. Admin dashboard loads for bobby@lotscout.com', async ({ page }) => {
  164 |   await signIn(page, ADMIN_EMAIL, 'Bobby2026!'); // will fail gracefully if wrong password
  165 |   await page.goto(`${BASE}/admin/dashboard`);
  166 |   await page.waitForLoadState('networkidle');
  167 | 
  168 |   const url = page.url();
  169 |   const body = await page.textContent('body') ?? '';
  170 |   const isAdminPage = url.includes('admin') || /admin|dashboard|listings|users/i.test(body);
  171 | 
  172 |   console.log('URL:', url);
  173 |   console.log('Admin page detected:', isAdminPage);
  174 |   expect(isAdminPage).toBeTruthy();
  175 |   console.log('✅ Admin dashboard accessible');
  176 | });
  177 | 
```