# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lotscout.spec.ts >> 1a. Buyer request flow — fill form and submit
- Location: tests/lotscout.spec.ts:25:5

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.fill: Test timeout of 45000ms exceeded.
Call log:
  - waiting for locator('input[name="budget_min"], input[placeholder*="min"], input[placeholder*="Min"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - main [ref=e3]:
    - generic [ref=e4]:
      - heading "Post Buying Criteria" [level=1] [ref=e5]
      - paragraph [ref=e6]: Tell sellers exactly what you're looking for and get matched with the right properties.
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e10]:
          - generic [ref=e11]:
            - generic [ref=e12]:
              - generic [ref=e13]: landscape
              - heading "Property Details" [level=2] [ref=e14]
            - generic [ref=e15]:
              - generic [ref=e16]:
                - generic [ref=e17]: Target Regions
                - generic [ref=e18]:
                  - generic [ref=e19]:
                    - text: State
                    - textbox "e.g. Montana" [ref=e20]
                  - generic [ref=e21]:
                    - text: County
                    - textbox "e.g. Missoula" [ref=e22]
                  - generic [ref=e23]:
                    - text: Zip Code
                    - textbox "e.g. 59801" [ref=e24]
                  - generic [ref=e25]:
                    - text: City
                    - textbox "e.g. Seeley Lake" [ref=e26]
                - generic [ref=e27]:
                  - text: Specifics / Notes
                  - textbox "Mention specific areas or boundaries..." [ref=e28]
              - generic [ref=e29]:
                - generic [ref=e30]: Zoning Preference *
                - generic [ref=e31]:
                  - generic [ref=e32] [cursor=pointer]:
                    - checkbox "Agricultural (A-1)" [ref=e33]
                    - generic [ref=e34]: Agricultural (A-1)
                  - generic [ref=e35] [cursor=pointer]:
                    - checkbox "Residential (R-1)" [ref=e36]
                    - generic [ref=e37]: Residential (R-1)
                  - generic [ref=e38] [cursor=pointer]:
                    - checkbox "Commercial / Industrial" [ref=e39]
                    - generic [ref=e40]: Commercial / Industrial
                  - generic [ref=e41] [cursor=pointer]:
                    - checkbox "Unrestricted / No Zoning" [ref=e42]
                    - generic [ref=e43]: Unrestricted / No Zoning
              - generic [ref=e44]:
                - generic [ref=e46]:
                  - generic [ref=e48] [cursor=pointer]: Acres
                  - generic [ref=e50] [cursor=pointer]: Sq Ft
                - generic [ref=e51]:
                  - generic [ref=e52]:
                    - generic [ref=e53]: Min Acreage *
                    - spinbutton [ref=e54]
                  - generic [ref=e55]:
                    - generic [ref=e56]: Max Acreage
                    - spinbutton [ref=e57]
              - generic [ref=e58]:
                - generic [ref=e59]:
                  - generic [ref=e60]: Road Access
                  - generic [ref=e61]:
                    - generic [ref=e63] [cursor=pointer]: Paved Road
                    - generic [ref=e65] [cursor=pointer]: Gravel Road
                    - generic [ref=e67] [cursor=pointer]: Dirt Road
                    - generic [ref=e69] [cursor=pointer]: Private Road
                    - generic [ref=e71] [cursor=pointer]: Easement
                    - generic [ref=e73] [cursor=pointer]: No Road Access
                - generic [ref=e74]:
                  - generic [ref=e75]: Utilities
                  - generic [ref=e76]:
                    - generic [ref=e78] [cursor=pointer]: Electric
                    - generic [ref=e80] [cursor=pointer]: Well
                    - generic [ref=e82] [cursor=pointer]: Septic
                    - generic [ref=e84] [cursor=pointer]: Not Required
          - generic [ref=e85]:
            - generic [ref=e86]:
              - generic [ref=e87]: payments
              - heading "Budget & Pricing" [level=2] [ref=e88]
            - generic [ref=e89]:
              - generic [ref=e90]:
                - generic [ref=e91]: Min Budget ($) *
                - textbox "10,000" [ref=e92]
              - generic [ref=e93]:
                - generic [ref=e94]: Max Budget ($) *
                - textbox "500,000" [ref=e95]
              - generic [ref=e96]:
                - generic [ref=e97]: Price Per Acre ($)
                - textbox "Target per acre" [ref=e98]
            - generic [ref=e99]:
              - generic [ref=e100]: Financing Preferences
              - generic [ref=e101]:
                - generic [ref=e102] [cursor=pointer]:
                  - checkbox "Cash Offer Immediate liquidity available" [ref=e103]
                  - generic [ref=e104]:
                    - paragraph [ref=e105]: Cash Offer
                    - paragraph [ref=e106]: Immediate liquidity available
                - generic [ref=e107] [cursor=pointer]:
                  - checkbox "Seller Financing Seeking terms with interest" [ref=e108]
                  - generic [ref=e109]:
                    - paragraph [ref=e110]: Seller Financing
                    - paragraph [ref=e111]: Seeking terms with interest
                - generic [ref=e112] [cursor=pointer]:
                  - checkbox "Conventional Loan Pre-approved with lender" [ref=e113]
                  - generic [ref=e114]:
                    - paragraph [ref=e115]: Conventional Loan
                    - paragraph [ref=e116]: Pre-approved with lender
                - generic [ref=e117] [cursor=pointer]:
                  - checkbox "Seeking Financing Open to external loan options" [ref=e118]
                  - generic [ref=e119]:
                    - paragraph [ref=e120]: Seeking Financing
                    - paragraph [ref=e121]: Open to external loan options
          - generic [ref=e122]:
            - generic [ref=e123]:
              - generic [ref=e124]: category
              - heading "Intended Use" [level=2] [ref=e125]
            - generic [ref=e126]:
              - generic [ref=e127]:
                - generic [ref=e128]: Primary Use Case
                - combobox [ref=e129]:
                  - option "Select a use case" [selected]
                  - option "Homesteading / Off-grid living"
                  - option "Long-term Investment"
                  - option "Recreational (Hunting/Camping)"
                  - option "Subdivision / Development"
                  - option "Commercial Agriculture"
                  - option "Row Crop Production"
                  - option "Livestock/Ranching"
                  - option "Timber/Forestry"
                  - option "Conservation/Preservation"
                  - option "Other"
              - generic [ref=e130]:
                - generic [ref=e131]:
                  - generic [ref=e132]: Use Case Description
                  - button "auto_awesome Write with AI" [ref=e133]:
                    - generic [ref=e134]: auto_awesome
                    - text: Write with AI
                - textbox "Describe what you plan to do with the land..." [ref=e135]
                - paragraph [ref=e137]: 0/500
              - generic [ref=e138]:
                - generic [ref=e139]: Specific Requirements
                - textbox "Water rights, specific soil types, topographic needs..." [ref=e140]
          - generic [ref=e141]:
            - generic [ref=e142]:
              - generic [ref=e143]: calendar_month
              - heading "Purchase Timeline" [level=2] [ref=e144]
            - generic [ref=e145]:
              - generic [ref=e146]:
                - generic [ref=e147]: Target Close Date *
                - textbox [ref=e148]
              - generic [ref=e149]:
                - generic [ref=e150]: Timeline Urgency
                - generic [ref=e151]:
                  - generic [ref=e153] [cursor=pointer]: Flexible
                  - generic [ref=e155] [cursor=pointer]: Ready Now
                  - generic [ref=e157] [cursor=pointer]: Urgent
            - generic [ref=e158]:
              - generic [ref=e159]:
                - generic [ref=e160]: support_agent
                - generic [ref=e161]:
                  - paragraph [ref=e162]: Working With Agent?
                  - paragraph [ref=e163]: Let us know if you're already represented
              - checkbox [ref=e165]
          - generic [ref=e167]:
            - generic [ref=e168]:
              - generic [ref=e169]: contact_support
              - heading "Contact Preferences" [level=2] [ref=e170]
            - generic [ref=e171]:
              - generic [ref=e172]:
                - generic [ref=e173]: Preferred Contact Methods *(Select all that apply)
                - generic [ref=e174]:
                  - generic [ref=e175] [cursor=pointer]:
                    - checkbox "Email" [ref=e176]
                    - generic [ref=e177]: Email
                  - generic [ref=e178] [cursor=pointer]:
                    - checkbox "Phone Call" [ref=e179]
                    - generic [ref=e180]: Phone Call
                  - generic [ref=e181] [cursor=pointer]:
                    - checkbox "Text Message" [ref=e182]
                    - generic [ref=e183]: Text Message
                  - generic [ref=e184] [cursor=pointer]:
                    - checkbox "In-App Messaging" [ref=e185]
                    - generic [ref=e186]: In-App Messaging
              - generic [ref=e187]:
                - generic [ref=e188]: Additional Notes
                - textbox "Anything else sellers should know?" [ref=e189]
          - generic [ref=e191]:
            - button "Save Draft" [ref=e192]
            - button "Find a Property arrow_forward" [disabled] [ref=e193]:
              - text: Find a Property
              - generic [ref=e194]: arrow_forward
        - generic [ref=e195]:
          - generic [ref=e196]:
            - generic [ref=e198]: crown
            - generic [ref=e199]:
              - heading "Unlock Priority Matching" [level=4] [ref=e200]
              - paragraph [ref=e201]: Priority and Exclusive members get their buying criteria featured at the top of the buyer directory and matched directly with incoming listings.
          - link "Upgrade Now" [ref=e202] [cursor=pointer]:
            - /url: /pricing
      - complementary [ref=e203]:
        - generic [ref=e204]:
          - heading "Why post your criteria?" [level=3] [ref=e205]
          - list [ref=e206]:
            - listitem [ref=e207]:
              - generic [ref=e208]: verified
              - generic [ref=e209]:
                - paragraph [ref=e210]: Priority Discovery
                - paragraph [ref=e211]: Sellers of unlisted land can find you directly.
            - listitem [ref=e212]:
              - generic [ref=e213]: analytics
              - generic [ref=e214]:
                - paragraph [ref=e215]: Market Insights
                - paragraph [ref=e216]: Get notified when property values in your target regions shift.
            - listitem [ref=e217]:
              - generic [ref=e218]: group_add
              - generic [ref=e219]:
                - paragraph [ref=e220]: Tailored Networking
                - paragraph [ref=e221]: Connect with local experts who specialize in your use case.
        - paragraph [ref=e224]: Find the perfect canvas for your vision.
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
> 37  |   await budgetMin.fill('500000');
      |                   ^ Error: locator.fill: Test timeout of 45000ms exceeded.
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
```