import type { Metadata } from 'next';
import Image from 'next/image';
import '../home/homepage.css';
import Offerings from '../home/Offerings';
import LandingMotion from '../home/LandingMotion';

export const metadata: Metadata = { title: 'Pricing | LotScout', description: 'Compare Scout, national data, in-depth market coverage, and research tailored to your company.' };

export default function PricingPage() {
  return <div className="ls-home pricing-page"><LandingMotion />
    <header><a className="brand" href="/" aria-label="LotScout home"><Image src="/lotscout-logo.png" alt="" width={44} height={44} priority />LotScout</a><nav aria-label="Main navigation"><a className="pricing-nav-link" href="/pricing" aria-current="page">Pricing</a><a className="button" href="#offerings">Claim My Market</a></nav></header>
    <main><section className="section pricing-intro"><h1>Choose how you learn your market.</h1><p>Start with Scout, explore national trends, or go deeper into the markets that matter to you.</p></section>
      <Offerings />
      <section className="section scout-plan" aria-labelledby="scout-plan-title"><div><span className="eyebrow">Just need answers?</span><h2 id="scout-plan-title">Scout</h2><p>Ask about housing, jobs, development, and policy. The standalone plan includes 100 questions per month.</p><div className="offering-price">$20/month</div><p>Try Scout before choosing a data package. Contact us to activate the new plan.</p></div><a className="button" href="/scout">Try Scout</a></section>
    </main><footer><a className="brand" href="/">LotScout</a><span>Monthly subscriptions.</span><span><a href="/#terms">Terms & conditions</a> · <a href="/#privacy">Privacy</a></span></footer>
  </div>;
}
