'use client';

import Image from 'next/image';
import './homepage.css';
import DemoContactForm from './DemoContactForm';
import LegalDisclosures from './LegalDisclosures';

const capabilities = [
 { key: 'community', label: 'Community', title: 'What surrounds the site?', solution: 'See schools, parks, shopping, and dining without piecing together separate maps.' },
 { key: 'zoning', label: 'Zoning', title: 'What land uses are nearby?', solution: 'Understand surrounding zoning before choosing where to investigate.' },
 { key: 'entitlements', label: 'Entitlements', title: 'What is actually moving forward?', solution: 'Separate submitted plans from approved and recorded projects.' },
 { key: 'land', label: 'Land', title: 'Where are competitors buying?', solution: 'Connect builder purchases with recorded transactions and land comps.' },
 { key: 'development', label: 'Development', title: 'How close is future supply?', solution: 'Distinguish raw land, developed lots, and active projects.' },
 { key: 'homebuilding', label: 'Homebuilding', title: 'What competition is taking shape?', solution: 'Compare future, permitted, for-sale, and sold homes in one market.' },
] as const;

export default function LotScoutHomePage() {
 return <div className="ls-home">
<header><a className="brand" href="/" aria-label="LotScout home"><Image src="/lotscout-logo.png" alt="" width={44} height={44} priority />LotScout</a><nav aria-label="Main navigation"><a href="#contact" className="button">Book a Demo</a><a href="/sign-up" className="button light">Sign Up</a></nav></header>
<main>
<section className="hero"><div><div className="eyebrow"><span className="dot"></span>Land & market data for your team</div><h1>Your markets.<br /><em>Your next move.</em></h1><p>Land, development, and builder data in context. Understand your market, assess the competition, and decide where to focus next.</p><div className="actions"><a className="button" href="#contact">Book a Demo</a><a href="/sign-up" className="button light">Sign Up</a></div><div className="micro">Built for homebuilders, developers, and enterprise real estate teams.</div></div>
<div className="map-shell" role="img" aria-label="Illustrative development map and sample site brief, not a real parcel or live data"><svg className="map" viewBox="0 0 600 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="lots" width="67" height="55" patternTransform="rotate(-22)" patternUnits="userSpaceOnUse"><rect width="67" height="55" fill="#e8ebdf"/><path d="M0 0H67V55H0Z" fill="none" stroke="#fafbf5" strokeWidth="7"/><path d="M32 0V55M0 26H67" stroke="#d4ddca" fill="none" strokeWidth="1"/></pattern></defs><rect width="600" height="540" fill="url(#lots)"/><path d="M0 80Q160 150 175 15L300 0Q210 190 60 200L0 190Z" fill="#c8d6b8"/><path d="M485-20Q345 120 470 210T500 560" fill="none" stroke="#bbd1ce" strokeWidth="32"/><path d="M-40 310 650 40" stroke="#c8ceb9" strokeWidth="24"/><path d="M-40 310 650 40" stroke="#fffff5" strokeWidth="16"/><path d="m210-20 120 600" stroke="#c8ceb9" strokeWidth="19"/><path d="m210-20 120 600" stroke="#fffff5" strokeWidth="12"/><path d="m310 177 77-31 35 78-79 33Z" fill="#aac76e" fillOpacity=".7" stroke="#376441" strokeWidth="2"/><path d="m310 177 77-31 35 78-79 33Z" fill="none" stroke="#376441" strokeWidth="9" strokeOpacity=".1"/><circle cx="365" cy="202" r="8" fill="#214b38" stroke="white" strokeWidth="3"/><circle cx="195" cy="113" r="5" fill="#899a6a" stroke="white" strokeWidth="2"/><circle cx="443" cy="110" r="5" fill="#899a6a" stroke="white" strokeWidth="2"/><text x="80" y="265" fill="#829077" fontFamily="Arial" fontSize="10" transform="rotate(-22 80 265)">GROWTH CORRIDOR</text></svg><div className="map-top"><div className="map-tag">◎ &nbsp; Your market, in focus</div><div className="map-tag"><span>●</span> &nbsp; Illustrative preview</div></div><div className="map-label">Your Focus Area</div><div className="brief"><div className="brief-top"><span>THE BIGGER PICTURE</span><span>EXAMPLE BRIEF / 01</span></div><h3>Your data. In context.</h3><p>Connect land activity, residential development, and economic growth in a market view shaped around your company’s priorities.</p><div className="brief-bottom"><div>Pipeline<span>Plans, plats & permits</span></div><div>Pace<span>Recorded closings</span></div><div>Product<span>Size, price & lot mix</span></div></div></div></div></section>
<section className="section" id="economic-growth" style={{paddingTop:10}}>
<div className="filter-frame" aria-labelledby="filter-heading">
<div className="filter-heading"><h2 id="filter-heading">Learn your market before your competitors.</h2><p>Updated daily. Directly sourced. Verified.</p></div>
<div className="filter-grid">{capabilities.map(item => <article className="filter-card" key={item.key}>
<div className="filter-image"><Image src={`/demo-${item.key}.jpg`} alt={`Queen Creek preview with the ${item.label.toLowerCase()} filter enabled`} fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 400px" style={{objectFit:'cover'}} /></div>
<div className="filter-copy"><div className="eyebrow">{item.label}</div><h3>{item.title}</h3><p>{item.solution}</p></div>
</article>)}</div></div>
<p className="micro">Product previews. Coverage and reporting dates vary by market.</p>
<div className="audience"><div><div className="eyebrow">Trace the fact. Understand the assumption.</div><h3 style={{"marginTop":"18px"}}>A number is only useful if you can question it.</h3><p>Know where a number comes from, when it was reported, and whether it is recorded or estimated. Question the assumptions before building your strategy.</p></div><div className="signals"><div className="signal"><span>Source context</span><small>County records, permits & builder websites</small></div><div className="signal"><span>Forecasts & estimates</span><small>Clearly labeled assumptions</small></div><div className="signal"><span>Dates & definitions</span><small>Reporting periods and metric context</small></div></div></div>
<p style={{"fontSize":"12px"}}>Public records show closings, not pending contracts, and can lag by several months. LotScout updates daily; source availability and coverage vary by market.</p>
</section>
<section className="dark" id="scout"><div className="section"><div><div className="eyebrow">Meet Scout by LotScout</div><h2>Less time searching.<br />A clearer starting point.</h2><p>Ask Scout about land, zoning, and development. Get a clearer starting point for your real estate research.</p><p><a className="button" href="/scout">Try Scout Search</a></p><p>Start with a free preview question. Contact us about expanded access for your team.</p></div><div className="steps"><div className="step"><span className="num">01</span><div><strong>Start with your question.</strong><p>Ask about land, zoning, development concepts, or how to approach a market research question.</p></div></div><div className="step"><span className="num">02</span><div><strong>Explore the context.</strong><p>Use conversation to organize your research and identify the details worth investigating further.</p></div></div><div className="step"><span className="num">03</span><div><strong>Bring your team’s needs.</strong><p>Request a demo to discuss your markets, available data coverage, and company-specific reporting.</p></div></div></div></div></section>
<DemoContactForm />
<LegalDisclosures />
</main><footer><a className="brand" href="/"><Image src="/lotscout-logo.png" alt="" width={36} height={36} />LotScout</a><span>Land & Economic Data. Personalized.</span><span>© 2026 LotScout · <a href="/#terms">Terms & conditions</a> · <a href="/#privacy">Privacy</a></span></footer>
</div>;
}
