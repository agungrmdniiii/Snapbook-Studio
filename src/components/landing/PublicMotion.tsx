'use client';

import React, { useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** An enhancement only: content stays visible before hydration and on unsupported browsers. */
export function PublicMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.querySelector('.public-site main');
    if (!root) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    const seen = new WeakSet<Element>();
    const play = (element: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      if (!element.animate || preference.matches) return;
      const animation = element.animate(frames, options);
      animations.add(animation);
      animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    };
    play(root, [{ opacity: 0.8, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: ease });
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches) continue;
        if (entry.target.classList.contains('studio-gallery-frame')) {
          play(entry.target, [
            { clipPath: 'inset(0 0 8% 0 round 12px)', transform: 'translateY(20px)' },
            { clipPath: 'inset(0 0 0 0 round 12px)', transform: 'none' },
          ], { duration: 650, easing: ease });
        } else {
          play(entry.target, [{ opacity: 0.65, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: ease });
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    const observe = () => {
      for (const element of root.querySelectorAll('.studio-gallery-frame, .studio-section-heading, .studio-packages h2, #faq h2')) {
        if (seen.has(element)) continue;
        seen.add(element);
        // Already-visible content needs no entrance when restoring a page or following a hash.
        if (element.getBoundingClientRect().top < window.innerHeight && element.getBoundingClientRect().bottom > 0) continue;
        observer.observe(element);
      }
    };
    observe();
    const changes = new MutationObserver(observe);
    changes.observe(root, { childList: true, subtree: true });
    const stopMotion = () => { if (preference.matches) animations.forEach(animation => animation.cancel()); };
    preference.addEventListener('change', stopMotion);
    return () => {
      observer.disconnect();
      changes.disconnect();
      preference.removeEventListener('change', stopMotion);
      animations.forEach(animation => animation.cancel());
    };
  }, [pathname]);
  return null;
}

type MotionLinkProps = Omit<React.ComponentProps<typeof NextLink>, 'href'> & { href: string };

export function MotionLink({ href, onClick, ...props }: MotionLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  return <NextLink href={href} {...props} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank' || props.download) return;
    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin || destination.pathname === pathname) return;
    const main = document.querySelector('.public-site main');
    if (!main?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    const exit = main.animate([{ opacity: 1 }, { opacity: 0.7 }], { duration: 120, easing: 'ease-out' });
    exit.finished.catch(() => {}).then(() => router.push(href));
  }} />;
}
