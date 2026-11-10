# Find Your Fit tracking

Status: implemented locally; quiz remains unpublished until Basic/Market rates and Enterprise calendar URL are confirmed in app/home/fit-offer.ts.

## Where to review
- Vercel project `my-saas` → Analytics → custom events: `fit_opened`, `fit_answers_completed`, `fit_compare_all`, `fit_lead_submitted`, `fit_plan_clicked`, `fit_call_requested`, `fit_calendar_clicked`.
- These are event counts, not unique-person conversion rates. Opens and completions may repeat. A calendar click does not prove a booking; signup clicks do not prove account creation/payment. Booking-provider webhooks are not configured.
- Support inbox `support@lotscout.com`: subject `LotScout Find Your Fit: <recommended plan>`. Each receipt includes contact details, answers, recommendation, request ID, and opt-in decision/wording/version. Email timestamp records submission time. This inbox is the durable lead store for this implementation, not a new CRM database/dashboard.
- Marketing: only checked opt-ins invoke the existing Resend General audience sync. Unchecked submissions make no audience changes and do not unsubscribe an existing subscriber. Failed marketing sync is reported as pending and a review notice is attempted to support. Lead receipts remain available if the notice fails.
- Initial lead receipts do not capture later chosen-plan clicks per individual; those are aggregate analytics events. Do not claim person-level end-to-end attribution.

## Privacy and behavior
- Name and email required at quiz finalization; company/phone optional.
- Marketing checkbox unchecked and optional. It is not required to view results.
- Users may skip the quiz or view all plans without submitting contact details.
- Analytics props contain answer/plan categories and opt-in boolean, not names, email addresses, phone numbers or company names.
- No automated sales-contact or welcome campaign is sent by this endpoint. The only email is an internal support lead receipt (and sync-failure notice when applicable).
- Same-origin POST, size/field validation, honeypot, per-instance rate limiting, and stable email idempotency keys are implemented. Per-instance limiting is not a global abuse-control system.

## Verification
TypeScript plus mocked API checks: opt-out never syncs; opt-in syncs; malformed request/origin/honeypot rejected; receipt failure prevents subscription. Browser checks use intercepted requests, no external emails or subscriptions. Live provider delivery/enrollment and calendar booking remain unverified until configured and launch-tested.

## Deployment distinction
Production currently has motion/extra CTAs but no quiz. Staging homepage omits FindYourFit import/usages. When ready, copy the full current homepage, FindYourFit.tsx, fit-offer.ts, lib/fit-quiz.ts, API route, LegalDisclosures.tsx, homepage.css and proxy.ts to staging. Do not revive old marketplace pricing/checkout. Keep Enterprise rates private.
