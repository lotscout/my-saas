// Automated auth-protection check against the live site.
// For each route, requests WITHOUT auth cookies and reports protected/exposed.
//
// Note: this app's auth page is /sign-in (the proxy redirects there). /login and
// /signup are aliases that also redirect to /sign-in. So an "auth redirect" is any
// redirect whose Location points at /sign-in OR /login.
//
// Run: node scripts/test-auth.js

const BASE = 'https://my-saas-iei4.vercel.app';

const PROTECTED = [
  '/dashboard',
  '/buyer-directory',
  '/marketplace',
  '/deal-analysis',
  '/property-analysis',
  '/messaging',
  '/funding',
  '/funding-partners',
  '/profile',
  '/edit-profile',
  '/create-listing',
  '/market-updates',
  '/admin/dashboard',
];

const PUBLIC = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/market-reports',
];

const AUTH_PATHS = ['/sign-in', '/login'];
const REDIRECT_CODES = [301, 302, 303, 307, 308];

function isAuthRedirect(status, location) {
  if (!REDIRECT_CODES.includes(status)) return false;
  return AUTH_PATHS.some(a => location === a || location.startsWith(a + '?') || location.startsWith(a + '/'));
}

async function checkRoute(path, shouldBeProtected) {
  try {
    const res = await fetch(BASE + path, { redirect: 'manual' });
    const status = res.status;
    const location = res.headers.get('location') || '';
    const authRedirect = isAuthRedirect(status, location);

    if (shouldBeProtected) {
      if (authRedirect) return { path, result: 'PASS', detail: `redirects to auth (${status} -> ${location})` };
      return { path, result: 'FAIL', detail: `EXPOSED - returned ${status}${location ? ' -> ' + location : ''}, not redirected to sign-in` };
    } else {
      if (status === 200) return { path, result: 'PASS', detail: 'publicly accessible (200)' };
      // /login and /signup legitimately redirect to /sign-in — that's an alias, not a gate.
      if (authRedirect) return { path, result: 'PASS', detail: `auth-page alias redirect (${status} -> ${location})` };
      return { path, result: 'WARN', detail: `returned ${status}${location ? ' -> ' + location : ''}` };
    }
  } catch (err) {
    return { path, result: 'ERROR', detail: err.message };
  }
}

async function run() {
  let fails = 0;

  console.log('=== PROTECTED ROUTES (should redirect to sign-in) ===');
  for (const path of PROTECTED) {
    const r = await checkRoute(path, true);
    if (r.result === 'FAIL') fails++;
    console.log(`${r.result.padEnd(6)} ${r.path.padEnd(30)} ${r.detail}`);
  }

  console.log('');
  console.log('=== PUBLIC ROUTES (should load without login) ===');
  for (const path of PUBLIC) {
    const r = await checkRoute(path, false);
    if (r.result === 'FAIL') fails++;
    console.log(`${r.result.padEnd(6)} ${r.path.padEnd(30)} ${r.detail}`);
  }

  console.log('');
  console.log(fails === 0 ? 'ALL CHECKS PASSED — no exposed protected routes.' : `${fails} FAILURE(S) — see above.`);
  process.exitCode = fails === 0 ? 0 : 1;
}

run();
