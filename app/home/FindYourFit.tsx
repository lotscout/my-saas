'use client';

import { useId, useRef, useState } from 'react';
import { FIT_OFFER } from './fit-offer';

type Plan = 'basic' | 'market' | 'enterprise';
const plans: { key: Plan; name: string; summary: string; features: string[] }[] = [
  { key: 'basic', name: 'Basic', summary: 'Explore the national picture.', features: ['National economic, jobs, and building-permit trends', 'Compare markets and inspect sources', 'Scout AI included'] },
  { key: 'market', name: 'Market', summary: 'Go deeper in the markets you choose.', features: ['Everything in Basic', 'Standard local data, filters, and reports in purchased markets', 'Covered-market updates and Scout AI'] },
  { key: 'enterprise', name: 'Enterprise', summary: 'Build around your organization.', features: ['National overview and contracted market coverage', 'Detailed analysis, custom reports, and policy monitoring', 'Custom integrations and Scout AI'] },
];
const questions = [
  { title: 'What do you need to understand?', options: [ ['national', 'Compare markets nationally', 'Economic, jobs, population, and building-permit trends.'], ['local', 'Follow specific markets', 'Local activity, development, and standard market reports.'], ['deep', 'Analyze my organization’s opportunities', 'Detailed competitive analysis and company-specific research.'] ] },
  { title: 'How do you want to use the data?', options: [ ['standard', 'Use ready-made tools', 'Select filters, ask Scout, and use standard reports.'], ['custom', 'Customize it for my team', 'Tailored reports, private data, or integrations with our systems.'] ] },
  { title: 'What coverage do you need?', options: [ ['national', 'A national overview', 'Compare U.S. markets without detailed local coverage.'], ['markets', 'One or more U.S. markets', 'Choose paid market coverage where available.'], ['special', 'A custom coverage area', 'Discuss specific boundaries or coverage requirements.'] ] },
];

export default function FindYourFit() {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [showPlans, setShowPlans] = useState(false);
  const [recommended, setRecommended] = useState<Plan | null>(null);

  function open() { dialog.current?.showModal(); }
  function next() {
    if (!answers[step]) return;
    if (step < questions.length - 1) { setStep(step + 1); }
    else {
      const choice: Plan = answers[0] === 'deep' || answers[1] === 'custom' || answers[2] === 'special'
        ? 'enterprise' : answers[0] === 'local' || answers[2] === 'markets' ? 'market' : 'basic';
      setRecommended(choice); setShowPlans(true);
    }
    requestAnimationFrame(() => heading.current?.focus());
  }
  const reason = recommended === 'enterprise'
    ? 'You selected detailed analysis, customization, or special coverage. A call will help us define the right scope.'
    : recommended === 'market'
      ? 'You want local detail in selected markets, with standard tools rather than custom implementation.'
      : 'You want national trends and market comparisons, without deeper local coverage or custom tools.';

  return <>
    <button className="button light" type="button" onClick={open}>Find Your Fit</button>
    <dialog className="fit-dialog" ref={dialog} aria-labelledby={titleId} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="fit-content">
        <button className="fit-close" type="button" aria-label="Close Find Your Fit" onClick={() => dialog.current?.close()}>×</button>
        <h2 id={titleId} ref={heading} tabIndex={-1}>{showPlans ? recommended ? `Your fit: ${plans.find(p => p.key === recommended)?.name}` : 'Compare your options.' : 'Find your fit.'}</h2>
        {showPlans ? <>
          <p className="fit-intro">{recommended ? reason : 'Choose the level of coverage and customization you need.'} You can choose any option below.</p>
          <div className="fit-plans">
            {plans.map(plan => <article key={plan.key} className={`fit-plan ${recommended === plan.key ? 'is-recommended' : ''}`}>
              <div className="fit-badge">{recommended === plan.key ? 'Recommended for you' : '\u00a0'}</div>
              <h3>{plan.name}</h3><p>{plan.summary}</p>
              <div className="fit-price">{plan.key === 'enterprise' ? 'Custom pricing' : (plan.key === 'basic' ? FIT_OFFER.basicMonthly : FIT_OFFER.marketMonthly) === null ? 'Pricing coming soon' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((plan.key === 'basic' ? FIT_OFFER.basicMonthly : FIT_OFFER.marketMonthly)!)}<small>{plan.key === 'basic' ? 'per month' : plan.key === 'market' ? 'per market / month' : 'Scoped with your team'}</small></div>
              <ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
              {plan.key === 'enterprise' ? FIT_OFFER.calendarUrl ? <a className="button" href={FIT_OFFER.calendarUrl} target="_blank" rel="noopener noreferrer">Schedule a Call <span className="sr-only">(opens booking calendar in a new tab)</span></a> : <a className="button" href="#contact" onClick={() => dialog.current?.close()}>Request a Call</a> : <a className="button light" href={`/sign-up?plan=${plan.key}`}>Choose {plan.name}</a>}
              {plan.key === 'enterprise' && FIT_OFFER.calendarUrl && <p className="fit-calendar-note">Choose an available time in our booking calendar.</p>}
            </article>)}
          </div>
          <p className="fit-note">Scout is included in every plan. Data access, usage allowances, and coverage depend on your plan. Detailed market coverage is purchased separately from the national overview.</p>
          <button className="fit-text-button" type="button" onClick={() => { setShowPlans(false); setStep(0); requestAnimationFrame(() => heading.current?.focus()); }}>Edit my answers</button>
        </> : <>
          <p className="fit-intro">Three quick questions. No contact details needed.</p>
          <div className="fit-progress">Question {step + 1} of {questions.length}</div>
          <fieldset className="fit-question"><legend>{questions[step].title}</legend>
            {questions[step].options.map(([value, label, detail]) => <label className={`fit-option ${answers[step] === value ? 'is-selected' : ''}`} key={value}>
              <input type="radio" name={`fit-${step}`} value={value} checked={answers[step] === value} onChange={() => setAnswers(answers.map((a, i) => i === step ? value : a))} />
              <span><strong>{label}</strong><small>{detail}</small></span>
            </label>)}
          </fieldset>
          <div className="fit-actions">{step > 0 && <button type="button" className="button light" onClick={() => setStep(step - 1)}>Back</button>}<button type="button" className="button" disabled={!answers[step]} onClick={next}>{step === questions.length - 1 ? 'See My Fit & Pricing' : 'Next'}</button></div>
          <button className="fit-text-button" type="button" onClick={() => { setRecommended(null); setShowPlans(true); }}>Skip the quiz. View all options.</button>
        </>}
      </div>
    </dialog>
  </>;
}
