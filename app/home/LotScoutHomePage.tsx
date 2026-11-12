'use client';

import Image from 'next/image';
import './homepage.css';
import DemoContactForm from './DemoContactForm';
import LegalDisclosures from './LegalDisclosures';
import LandingMotion from './LandingMotion';
import RotatingMarketHeading from './RotatingMarketHeading';
import ScoutPreview from './ScoutPreview';

const capabilities = [
 { key: 'zoning', label: 'Zoning', title: 'What land uses are nearby?', solution: 'Understand surrounding zoning before choosing where to investigate.' },
 { key: 'development', label: 'Development', title: 'How close is future supply?', solution: 'Distinguish raw land, developed lots, and active projects.' },
 { key: 'homebuilding', label: 'Homebuilding', title: 'What competition is taking shape?', solution: 'Compare future, permitted, for-sale, and sold homes in one market.' },
] as const;

export default function LotScoutHomePage() {
 return <div className="ls-home"><LandingMotion />
<header><a className="brand" href="/" aria-label="LotScout home"><Image src="/lotscout-logo.png" alt="" width={44} height={44} priority />LotScout</a><nav aria-label="Main navigation"><a href="/pricing" className="pricing-nav-link">Pricing</a><a href="/pricing" className="button">Claim My Market</a></nav></header>
<main>
<section className="hero"><div><RotatingMarketHeading /><p>We turn public records and economic data into clear market research, so you can decide where to build, invest, or expand.</p><div className="actions"><a className="button" href="/pricing">Claim My Market</a></div></div>
<ScoutPreview /></section>
<section className="built-for section" aria-labelledby="built-for-title"><h2 id="built-for-title">Built for</h2><div className="audience-list" aria-label="Who we serve"><span>Homebuilders</span><span>Economic development teams</span><span>Site selection consultants</span></div></section>
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
