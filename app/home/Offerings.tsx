import FindYourFit from './FindYourFit';

export default function Offerings() {
  return <section className="section offerings-section" id="offerings" aria-label="Offerings">
    <div className="offering-grid">
      <article className="offering-card"><span className="eyebrow">National overview</span><h3>Basic</h3><p>Understand where markets are growing and changing.</p><ul><li>National economic, population, jobs, and building-permit trends</li><li>Market comparisons and source context</li><li>Scout AI included</li></ul><div className="offering-price">Ask for pricing<span>National overview package</span></div><a className="button light" href="#contact">Ask About Basic</a></article>
      <article className="offering-card"><span className="eyebrow">Paid market coverage</span><h3>Market</h3><p>Follow local activity in the markets that matter to you.</p><ul><li>Everything in Basic</li><li>Standard local filters, reports, and covered-market updates</li><li>Scout AI with your included market data</li></ul><div className="offering-price">Ask for pricing<span>Purchased per market</span></div><a className="button" href="#contact">Discuss Your Markets</a></article>
      <article className="offering-card"><span className="eyebrow">Custom scope</span><h3>Enterprise</h3><p>Go deeper with analysis and workflows built for your team.</p><ul><li>National overview and contracted market coverage</li><li>Detailed research, custom reports, and policy monitoring</li><li>Custom integrations, team support, and Scout AI</li></ul><div className="offering-price">Custom quote<span>Scoped through a sales conversation</span></div><a className="button light" href="#contact">Book an Enterprise Demo</a></article>
    </div><div className="quiz-prompt"><h3>Not sure?</h3><FindYourFit /></div><p className="micro">Contact us to confirm available coverage, included tools, and usage allowances. Detailed local coverage is not included nationwide.</p>
  </section>;
}
