'use client';

import { useEffect, useState } from 'react';
const markets = ['housing', 'labor', 'development', 'business'];

export default function RotatingMarketHeading() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(() => { if (!document.hidden) setIndex(i => (i + 1) % markets.length); }, 1800);
    return () => window.clearInterval(timer);
  }, [paused, reduced]);
  return <div className="market-heading-wrap">
    <h1 className="market-heading" aria-label="Know your housing, labor, development, and business market.">
      <span aria-hidden="true">Know your<em className="market-word">{markets.map((word, i) => <span key={word} className={i === index ? 'is-current' : ''}>{word}</span>)}</em>market.</span>
    </h1>
    {!reduced && <button type="button" className="market-motion-toggle" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume headline rotation' : 'Pause headline rotation'}>{paused ? 'Resume' : 'Pause'}</button>}
  </div>;
}
