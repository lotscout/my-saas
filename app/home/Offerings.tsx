import FindYourFit from './FindYourFit';
import { FIT_OFFER } from './fit-offer';

export default function Offerings() {
  return <section className="section offerings-section" id="offerings" aria-label="Offerings">
    <div className="offering-grid">
      <article className="offering-card"><span className="eyebrow">National data</span><h3>Basic</h3><p>For individuals and teams exploring economic conditions and comparing markets across the U.S.</p><ul>
        <li><strong>National and local statistics:</strong> Explore population, income, housing, jobs, and residential permit trends, with local detail where available.</li>
        <li><strong>Market comparisons:</strong> Compare states, counties, and supported local areas to understand growth and change.</li>
        <li><strong>Source context:</strong> See where the numbers come from and the periods they cover.</li>
        <li><strong>Scout Search included:</strong> Ask questions and explore the data through chat. Normally $20/month on its own.</li>
        <li><strong>Scope:</strong> Standard public statistics, without detailed local-record research or company-specific reporting.</li>
      </ul><div className="offering-price">${FIT_OFFER.basicMonthly}/month</div><a className="button" href="/#contact">Ask About Basic</a></article>
      <article className="offering-card"><span className="eyebrow">In-depth local research</span><h3>Market</h3><p>For local builders and small companies evaluating or expanding into specific markets.</p><ul>
        <li><strong>Everything in Basic:</strong> National statistics, local statistical comparisons, and Scout Search.</li>
        <li><strong>Deeper market coverage:</strong> Explore permits, jobs, community activity, housing prices and floor plans, land development, policy changes, and economic trends.</li>
        <li><strong>Local records and updates:</strong> Follow collected public records and market developments without repeating the research yourself.</li>
        <li><strong>Market-level reports:</strong> Get standard reports, recommendations, and weekly email summaries, without company-specific customization.</li>
        <li><strong>Unlimited Scout and exports:</strong> Ask questions and export data from your purchased markets. Add as many markets as you need at $179 each per month.</li>
      </ul><div className="offering-price">${FIT_OFFER.marketMonthly}/market/month</div><a className="button" href="/#contact">Discuss Your Markets</a></article>
      <article className="offering-card"><span className="eyebrow">Built around your company</span><h3>Enterprise</h3><p>For teams that need market research tailored to their business, competitors, and existing workflows.</p><ul>
        <li><strong>Company-specific research:</strong> Focus the analysis on your strategy, questions, and selected markets.</li>
        <li><strong>Your data, connected:</strong> Bring your internal data together with market research.</li>
        <li><strong>Tailored competitor coverage:</strong> Follow the competitors and activity relevant to your business.</li>
        <li><strong>Custom reporting:</strong> Build reports around your needs and integrate findings into your existing reporting workflows.</li>
        <li><strong>Unlimited Scout Search:</strong> Explore your company’s research with ongoing support and organization access controls.</li>
      </ul><div className="offering-price">Custom pricing</div><a className="button" href="/#contact">Book a Call</a></article>
    </div><div className="quiz-prompt"><h3>Not sure?</h3><FindYourFit /></div><p className="micro">Contact us for package availability and coverage before purchasing.</p>
  </section>;
}
