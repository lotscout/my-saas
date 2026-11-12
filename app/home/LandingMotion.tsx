'use client';
import { useEffect } from 'react';

export default function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const elements = document.querySelectorAll<HTMLElement>('.offering-card, .filter-card, .comparison-row:not(.comparison-head), .setup-step, .section-cta');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    elements.forEach(element => {
      // Keep already-visible content still to avoid a jump during hydration.
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add('motion-ready');
      observer.observe(element);
    });
    return () => { observer.disconnect(); elements.forEach(el => el.classList.remove('motion-ready', 'motion-visible')); };
  }, []);
  return null;
}
