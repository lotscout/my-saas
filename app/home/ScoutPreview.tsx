'use client';
import { useEffect, useState } from 'react';

const examples = [
  { question: 'What should I look at before building in a new market?', answer: 'Compare household growth with new housing supply. Then examine permit trends, housing prices, and local policy changes to identify where deeper research is needed.', source: 'Explore housing and development' },
  { question: 'How can I tell whether a local economy is growing?', answer: 'Look at employment, wages, population, and business activity together. A rise in jobs is more useful when you can see which industries are growing and whether residents are benefiting.', source: 'Explore jobs and economic trends' },
  { question: 'Which policy changes could affect a company relocation?', answer: 'Start with zoning, tax incentives, infrastructure plans, and workforce programs. Check whether each proposal is adopted, when it takes effect, and which locations or businesses it covers.', source: 'Explore policy and site selection' },
];

export default function ScoutPreview() {
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const example = examples[index];
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 800px)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || reduced) return;
    const done = chars >= example.question.length;
    const timer = window.setTimeout(() => {
      if (done) { setIndex(i => (i + 1) % examples.length); setChars(0); }
      else setChars(c => c + 1);
    }, done ? 8000 : 35);
    return () => window.clearTimeout(timer);
  }, [chars, index, paused, reduced, example.question.length]);
  const complete = reduced || chars >= example.question.length;
  return <aside className="scout-preview" aria-label="Scout Search examples">
    <div className="scout-preview-top"><strong>Scout Search</strong><span>Example</span></div>
    <h2>Your market questions.<br />A clearer starting point.</h2>
    <div className="scout-example" aria-hidden="true">
      <div className="scout-example-question">{reduced ? example.question : example.question.slice(0, chars)}{!complete && <span className="typing-cursor">|</span>}</div>
      <div className={`scout-example-answer ${complete ? 'is-ready' : ''}`}><span className="scout-answer-label">SCOUT</span><p>{example.answer}</p><span className="scout-example-topic">{example.source}</span></div>
    </div>
    <div className="sr-only"><p>{example.question}</p><p>{example.answer}</p></div>
    <div className="scout-preview-bottom"><a className="button" href="/scout">Ask Scout</a>{!reduced && <button type="button" className="scout-preview-pause" onClick={() => setPaused(v => !v)}>{paused ? 'Play examples' : 'Pause examples'}</button>}</div>
    <p className="scout-preview-note">Illustrative answers, not a live market report.</p>
  </aside>;
}
