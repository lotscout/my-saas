import Image from 'next/image';
import './homepage.css';
import DemoContactForm from './DemoContactForm';
import LegalDisclosures from './LegalDisclosures';

const useCases = [
  { number: '01', audience: 'Homebuilders', title: 'Find your next market advantage.', copy: 'Research development activity, competing communities, and recorded closing pace to inform your next land acquisition.' },
  { number: '02', audience: 'Land developers', title: 'Understand the opportunity around your land.', copy: 'Connect plats, permits, and builder activity to investigate the development pipeline and potential demand for lots.' },
  { number: '03', audience: 'Teams that depend on real estate data', title: 'Put local growth in context.', copy: 'Give investment, lending, supplier, and economic-development teams a clearer starting point for market research.' },
];

export default function LotScoutHomePage() {
  return <div className="ls-home launch-home">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header>
      <a className="brand" href="/" aria-label="LotScout home"><Image src="/lotscout-logo.png" alt="" width={44} height={44} priority />LotScout</a>
      <nav aria-label="Main navigation"><a href="#intelligence">Who it’s for</a><a href="/scout">Scout Search</a><a href="#contact" className="button">Request a Demo</a></nav>
    </header>
    <main id="main-content">
      <section className="hero">
        <div><div className="eyebrow"><span className="dot" />Land & market intelligence</div>
          <h1>Know where to<br /><em>build next.</em></h1>
          <p>Land and market data for homebuilders, developers, and enterprise teams. Research development activity, understand your markets, and explore real estate questions with Scout Search.</p>
          <div className="actions"><a className="button" href="#contact">Request a Demo <span aria-hidden="true">↗</span></a><a className="button light" href="/scout">Try Scout Search</a></div>
          <div className="micro">Your markets. Your questions. A clearer next move.</div>
        </div>
        <div className="map-shell" role="img" aria-label="Illustrative development map and sample site brief, not a real parcel or live data"><svg className="map" viewBox="0 0 600 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="lots" width="67" height="55" patternTransform="rotate(-22)" patternUnits="userSpaceOnUse"><rect width="67" height="55" fill="#e8ebdf"/><path d="M0 0H67V55H0Z" fill="none" stroke="#fafbf5" strokeWidth="7"/><path d="M32 0V55M0 26H67" stroke="#d4ddca" fill="none" strokeWidth="1"/></pattern></defs><rect width="600" height="540" fill="url(#lots)"/><path d="M0 80Q160 150 175 15L300 0Q210 190 60 200L0 190Z" fill="#c8d6b8"/><path d="M485-20Q345 120 470 210T500 560" fill="none" stroke="#bbd1ce" strokeWidth="32"/><path d="M-40 310 650 40" stroke="#c8ceb9" strokeWidth="24"/><path d="M-40 310 650 40" stroke="#fffff5" strokeWidth="16"/><path d="m210-20 120 600" stroke="#c8ceb9" strokeWidth="19"/><path d="m210-20 120 600" stroke="#fffff5" strokeWidth="12"/><path d="m310 177 77-31 35 78-79 33Z" fill="#aac76e" fillOpacity=".7" stroke="#376441" strokeWidth="2"/><path d="m310 177 77-31 35 78-79 33Z" fill="none" stroke="#376441" strokeWidth="9" strokeOpacity=".1"/><circle cx="365" cy="202" r="8" fill="#214b38" stroke="white" strokeWidth="3"/><circle cx="195" cy="113" r="5" fill="#899a6a" stroke="white" strokeWidth="2"/><circle cx="443" cy="110" r="5" fill="#899a6a" stroke="white" strokeWidth="2"/><text x="80" y="265" fill="#829077" fontFamily="Arial" fontSize="10" transform="rotate(-22 80 265)">GROWTH CORRIDOR</text></svg><div className="map-top"><div className="map-tag">◎ &nbsp; Your market, in focus</div><div className="map-tag"><span>●</span> &nbsp; Illustrative preview</div></div><div className="map-label">Your Focus Area</div><div className="brief"><div className="brief-top"><span>THE BIGGER PICTURE</span><span>EXAMPLE BRIEF / 01</span></div><h3>Your data. In context.</h3><p>Connect land activity, residential development, and economic growth in a market view shaped around your company’s priorities.</p><div className="brief-bottom"><div>Pipeline<span>Plans, plats & permits</span></div><div>Pace<span>Recorded closings</span></div><div>Product<span>Size, price & lot mix</span></div></div></div></div>
      </section>
      <div className="strip"><span>BUILT FOR YOUR NEXT DECISION</span><span>Land acquisition</span><span>Development research</span><span>Market intelligence</span><span>AI-assisted research</span></div>
      <section className="section" id="intelligence">
        <div className="section-heading"><div><div className="eyebrow">Built for the people building what’s next</div><h2>Better context.<br />More informed decisions.</h2></div><p>Start with the decisions your team needs to make. We’ll discuss the markets, records, and reporting that can support them.</p></div>
        <div className="use-case-grid">{useCases.map(item => <article className="use-case" key={item.number}><span className="case-number">{item.number}</span><div className="eyebrow">{item.audience}</div><h3>{item.title}</h3><p>{item.copy}</p><a className="text-link" href="#contact">Discuss your market <span aria-hidden="true">↗</span></a></article>)}</div>
      </section>
      <section className="dark scout-feature" id="scout">
        <div className="section">
          <div><div className="eyebrow">Meet Scout by LotScout</div><h2>Your next real estate question.<br />Start with Scout.</h2><p>Scout is your AI real estate research assistant. Explore market questions, understand development concepts, and organize your next round of research through conversation.</p><p>From a first question to a more focused investigation—less time figuring out where to start.</p><a className="button" href="/scout">Try Scout Search <span aria-hidden="true">↗</span></a><p className="micro">Start with a free preview question. Talk to us about access for your team.</p></div>
          <div className="scout-preview" aria-label="Example questions to explore with Scout"><div className="scout-preview-heading"><span className="scout-avatar">S</span><div><strong>Scout</strong><small>Your real estate research assistant</small></div></div><div className="example-label">A FEW PLACES TO START</div><div className="question">What should I research before buying land for a new community?</div><div className="question">How can permit activity help me compare two markets?</div><div className="question">What’s the difference between entitled land and finished lots?</div><p>Example prompts, not live answers. Market-specific data availability is confirmed during your demo.</p></div>
        </div>
      </section>
      <section className="section" id="approach"><div className="section-heading"><div><div className="eyebrow">Intelligence with context</div><h2>Know what’s behind<br />the bigger picture.</h2></div><p>Useful research starts with understanding the source, the date, and what the data can—and cannot—tell you.</p></div><div className="trust-grid"><div><h3>Land & development</h3><p>Connect available permits, plats, and recorded transactions to investigate local activity.</p></div><div><h3>Markets that matter to you</h3><p>Discuss company-specific market views and reporting built around your team’s priorities.</p></div><div><h3>Sources & assumptions</h3><p>Distinguish recorded facts from estimates. Confirm coverage and refresh schedules for your markets.</p></div></div><p className="micro">Coverage varies by market. Public records may lag; recorded closings are not pending contracts. Map previews are illustrative.</p></section>
      <DemoContactForm />
      <LegalDisclosures />
    </main>
    <footer><a className="brand" href="/"><Image src="/lotscout-logo.png" alt="" width={36} height={36} />LotScout</a><span>Land. Markets. A clearer next move.</span><span>© 2026 LotScout · <a href="/#terms">Terms</a> · <a href="/#privacy">Privacy</a></span></footer>
  </div>;
}
