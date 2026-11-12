'use client';

import Image from 'next/image';
import './homepage.css';
import DemoContactForm from './DemoContactForm';
import LegalDisclosures from './LegalDisclosures';
import LandingMotion from './LandingMotion';
import RotatingMarketHeading from './RotatingMarketHeading';

const capabilities = [
 { key: 'zoning', label: 'Zoning', title: 'What land uses are nearby?', solution: 'Understand surrounding zoning before choosing where to investigate.' },
 { key: 'development', label: 'Development', title: 'How close is future supply?', solution: 'Distinguish raw land, developed lots, and active projects.' },
 { key: 'homebuilding', label: 'Homebuilding', title: 'What competition is taking shape?', solution: 'Compare future, permitted, for-sale, and sold homes in one market.' },
] as const;

export default function LotScoutHomePage() {
 return <div className="ls-home"><LandingMotion />
<header><a className="brand" href="/" aria-label="LotScout home"><Image src="/lotscout-logo.png" alt="" width={44} height={44} priority />LotScout</a><nav aria-label="Main navigation"><a href="/pricing" className="pricing-nav-link">Pricing</a><a href="/pricing" className="button">Claim My Market</a></nav></header>
<main>
<section className="hero"><div><div className="eyebrow"><span className="dot"></span>Built for teams planning their next move.</div><RotatingMarketHeading /><p>Reduce manual market research by 90%. We verify, translate, and publish public-source data so you don’t have to dig through thousands of datasets per market.</p><div className="actions"><a className="button" href="/pricing">Claim My Market</a></div><div className="micro">For residential and commercial builders, economic development teams, and companies that need tailored market research.</div></div>
<div className="map-shell" role="img" aria-label="Illustrative development map and sample site brief, not a real parcel or live data"><svg className="map" viewBox="0 0 600 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="lots" width="67" height="55" patternTransform="rotate(-22)" patternUnits="userSpaceOnUse"><rect width="67" height="55" fill="#e8ebdf"/><path d="M0 0H67V55H0Z" fill="none" stroke="#fafbf5" strokeWidth="7"/><path d="M32 0V55M0 26H67" stroke="#d4ddca" fill="none" strokeWidth="1"/></pattern></defs><rect width="600" height="540" fill="url(#lots)"/><path d="M0 80Q160 150 175 15L300 0Q210 190 60 200L0 190Z" fill="#c8d6b8"/><path d="M485-20Q345 120 470 210T500 560" fill="none" stroke="#bbd1ce" strokeWidth="32"/><path d="M-40 310 650 40" stroke="#c8ceb9" strokeWidth="24"/><path d="M-40 310 650 40" stroke="#fffff5" strokeWidth="16"/><path d="m210-20 120 600" stroke="#c8ceb9" strokeWidth="19"/><path d="m210-20 120 600" stroke="#fffff5" strokeWidth="12"/><path d="m310 177 77-31 35 78-79 33Z" fill="#aac76e" fillOpacity=".7" stroke="#376441" strokeWidth="2"/><path d="m310 177 77-31 35 78-79 33Z" fill="none" stroke="#376441" strokeWidth="9" strokeOpacity=".1"/><circle cx="365" cy="202" r="8" fill="#214b38" stroke="white" strokeWidth="3"/><circle cx="195" cy="113" r="5" fill="#899a6a" stroke="white" strokeWidth="2"/><circle cx="443" cy="110" r="5" fill="#899a6a" stroke="white" strokeWidth="2"/><text x="80" y="265" fill="#829077" fontFamily="Arial" fontSize="10" transform="rotate(-22 80 265)">GROWTH CORRIDOR</text></svg><div className="map-top"><div className="map-tag">◎ &nbsp; Your market, in focus</div><div className="map-tag"><span>●</span> &nbsp; Illustrative preview</div></div><div className="map-label">Your Focus Area</div><div className="brief"><h3>Our data. In context</h3><p>Connect development activity, economic trends, and policy changes in a market view shaped around your team’s priorities.</p></div></div></section>
<section className="section" id="economic-growth" style={{paddingTop:10}}>
<div className="filter-frame" aria-labelledby="filter-heading">
<div className="filter-heading"><h2 id="filter-heading">Learn your market.</h2><p>Updated daily. Directly sourced. Verified.</p></div>
<div className="filter-grid">{capabilities.map(item => <article className="filter-card" key={item.key}>
<div className="filter-image"><Image src={`/demo-${item.key}.jpg`} alt={`Queen Creek preview with the ${item.label.toLowerCase()} filter enabled`} fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 400px" style={{objectFit:'cover'}} /></div>
<div className="filter-copy"><div className="eyebrow">{item.label}</div><h3>{item.title}</h3><p>{item.solution}</p></div>
</article>)}</div></div>
<section className="comparison" aria-labelledby="comparison-title">
<div className="comparison-heading"><h2 id="comparison-title">From monthly reports to daily decisions.</h2></div>
<div className="comparison-table" role="table" aria-label="Before and with LotScout">
<div className="comparison-row comparison-head" role="row"><div role="columnheader">Before LotScout</div><div role="columnheader">With LotScout</div></div>
<div className="comparison-row" role="row"><div role="cell"><span className="eyebrow">Update frequency</span><h3>A monthly snapshot.</h3><p>Real estate and economic data refreshed monthly.</p></div><div role="cell"><span className="eyebrow">Update frequency</span><h3>A daily view of your market.</h3><p>Data updated daily to support your next decision.</p></div></div>
<div className="comparison-row" role="row"><div role="cell"><span className="eyebrow">Source transparency</span><h3>Numbers without a clear origin.</h3><p>Limited visibility into where the data comes from.</p></div><div role="cell"><span className="eyebrow">Source transparency</span><h3>Sources you can see.</h3><p>Verified data connected to viewable sources, so you can trace the information behind the numbers.</p></div></div>
<div className="comparison-row" role="row"><div role="cell"><span className="eyebrow">Integration & reporting</span><h3>More work in spreadsheets.</h3><p>Manually combine data and move it into your own systems.</p></div><div role="cell"><span className="eyebrow">Integration & reporting</span><h3>Connected systems. Clearer reporting.</h3><p>Automatic data integration with reporting built around your team’s workflow.</p></div></div>
<div className="comparison-row" role="row"><div role="cell"><span className="eyebrow">Research workflow</span><h3>Hours across disconnected tools.</h3><p>Manually research across websites, maps, and spreadsheets, then piece the findings together.</p></div><div role="cell"><span className="eyebrow">Research workflow</span><h3>90% less manual research.</h3><p>We verify, translate, and publish data from public sources. Get the context you need without digging through thousands of datasets per market.</p></div></div>
<div className="comparison-row" role="row"><div role="cell"><span className="eyebrow">County records</span><h3>Another search. Another outdated file.</h3><p>Search county portals and reconcile records yourself, or rely on older snapshots.</p></div><div role="cell"><span className="eyebrow">County records</span><h3>Weekly updates, brought together.</h3><p>Follow newly available county records in your covered markets without repeating the research.</p></div></div>
<div className="comparison-row" role="row"><div role="cell"><span className="eyebrow">Policy changes</span><h3>Changes disconnected from your plans.</h3><p>Track policy announcements separately and work out what they could mean for your projects.</p></div><div role="cell"><span className="eyebrow">Policy changes</span><h3>See what could affect your next move.</h3><p>Follow policy changes in covered markets and explore potential implications for investment and business development.</p></div></div>
</div>
</section>
</section>
<DemoContactForm />
<LegalDisclosures />
</main><footer><a className="brand" href="/"><Image src="/lotscout-logo.png" alt="" width={36} height={36} />LotScout</a><span>Land & Economic Data. Personalized.</span><span>© 2026 LotScout · <a href="/#terms">Terms & conditions</a> · <a href="/#privacy">Privacy</a></span></footer>
</div>;
}
