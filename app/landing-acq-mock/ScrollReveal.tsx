'use client';

import { useEffect } from 'react';

export default function ScrollReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (reduceMotion) {
      items.forEach((item) => item.classList.add('reveal-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.18 },
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      [data-reveal] {
        opacity: 0;
        transform: translate3d(0, 44px, 0) scale(0.985);
        transition:
          opacity 720ms cubic-bezier(0.16, 1, 0.3, 1),
          transform 720ms cubic-bezier(0.16, 1, 0.3, 1);
        transition-delay: var(--reveal-delay, 0ms);
        will-change: opacity, transform;
      }

      [data-reveal='left'] {
        transform: translate3d(-44px, 24px, 0) scale(0.985);
      }

      [data-reveal='right'] {
        transform: translate3d(44px, 24px, 0) scale(0.985);
      }

      [data-reveal].reveal-in {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }

      @media (prefers-reduced-motion: reduce) {
        [data-reveal] {
          opacity: 1;
          transform: none;
          transition: none;
        }
      }
    `}</style>
  );
}
