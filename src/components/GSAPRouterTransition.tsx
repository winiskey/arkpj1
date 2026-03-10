import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LOGO_IMAGE_SRC } from "../lib/logo";

gsap.registerPlugin(ScrollTrigger);

type TransitionDirection = 1 | -1;

const ROUTE_ORDER = ["/", "/live", "/teams", "/rules"] as const;

function getRouteOrder(pathname: string) {
  const index = ROUTE_ORDER.indexOf(pathname as (typeof ROUTE_ORDER)[number]);
  return index === -1 ? ROUTE_ORDER.length : index;
}

function getDirection(fromPath: string, toPath: string): TransitionDirection {
  return getRouteOrder(toPath) >= getRouteOrder(fromPath) ? 1 : -1;
}

export function GSAPRouterTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const transitionRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  const currentPathRef = useRef(location.pathname);
  const nextChildrenRef = useRef<ReactNode | null>(null);
  const isTransitioning = useRef(false);

  const direction = useMemo(
    () => getDirection(currentPathRef.current, location.pathname),
    [location.pathname],
  );

  useLayoutEffect(() => {
    if (location.pathname === currentPathRef.current) return;

    // Avoid interrupting ongoing transition
    if (isTransitioning.current) {
      setDisplayChildren(children);
      currentPathRef.current = location.pathname;
      return;
    }

    isTransitioning.current = true;
    nextChildrenRef.current = children;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Swap React components out of sight
          setDisplayChildren(nextChildrenRef.current);
          currentPathRef.current = location.pathname;

          // Reset scroll correctly
          window.scrollTo(0, 0);

          // Let React render, then animate the new content in
          requestAnimationFrame(() => {
            // The Enter Timeline
            const enterTl = gsap.timeline({
              onComplete: () => {
                isTransitioning.current = false;
                ScrollTrigger.refresh(true);
              }
            });

            // Base page enter: Scale up from below slightly, opacity fades in
            enterTl.fromTo(".page-container", {
              y: 40,
              scale: 0.96,
              opacity: 0
            }, {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 0.8,
              ease: "power3.out",
              clearProps: "all"
            }, 0);

            // Staggered contents inside the page
            enterTl.fromTo(".gsap-stagger-item", {
              y: 30,
              opacity: 0
            }, {
              y: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.08,
              ease: "power2.out",
              clearProps: "all"
            }, 0.1);
          });
        }
      });

      // The Exit Timeline
      // 1. Current page sinks back and fades
      tl.to(".page-container", {
        y: -40 * direction,
        scale: 1.03,
        opacity: 0,
        duration: 0.45,
        ease: "power2.inOut"
      }, 0);

      // 2. The Translucent Prism Sweep (Giant blurred orb crosses screen)
      if (orbRef.current) {
        tl.fromTo(orbRef.current, {
          x: direction > 0 ? "-100vw" : "100vw",
          opacity: 0
        }, {
          x: direction > 0 ? "50vw" : "-50vw",
          opacity: 0.5,
          duration: 0.55,
          ease: "power2.out"
        }, 0.05)
          .to(orbRef.current, {
            x: direction > 0 ? "100vw" : "-100vw",
            opacity: 0,
            duration: 0.55,
            ease: "power2.in"
          }, 0.6);
      }

    }, transitionRef);

    return () => ctx.revert();
  }, [location.pathname, children, direction]);

  // Initial load scroll trigger refresh
  useEffect(() => {
    if (!isTransitioning.current) {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh(true);
      });
    }
  }, []);

  return (
    <div ref={transitionRef} className="relative flex-1 overflow-hidden bg-base">
      {/* The Ambient Flowing Prism Layer */}
      <div
        ref={orbRef}
        className="pointer-events-none fixed top-1/2 left-1/2 h-[80vh] w-[80vh] -translate-y-1/2 -translate-x-1/2 rounded-full bg-accent/10 blur-[120px] opacity-0 z-50 mix-blend-screen"
      />

      {/* Structural Decor */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid opacity-90" />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-96 bg-[radial-gradient(circle_at_top,rgba(212,190,136,0.06),transparent_58%)]" />
      <div className="pointer-events-none fixed inset-y-0 right-[-18%] z-0 w-[42vw] max-w-[560px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_62%)] blur-3xl" />

      {/* ── MASSIVE HOLOGRAPHIC LOGO GLOBALLY ── */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        {/* Subtle Grid Base */}
        <div className="absolute inset-0 bg-subtle-grid opacity-20" />

        {/* Huge Rotating Compass/Rings */}
        <div className="absolute h-[80vw] w-[80vw] max-w-[1200px] max-h-[1200px] border border-white/5 rounded-full border-dashed animate-spin-slow opacity-30" />
        <div className="absolute h-[60vw] w-[60vw] max-w-[900px] max-h-[900px] border border-accent/10 rounded-full border-dotted animate-spin-slower opacity-40" />

        {/* Tracking Crosshairs / Accents */}
        <div className="absolute top-[20%] left-[15%] h-8 w-8 border-l border-t border-accent/20" />
        <div className="absolute bottom-[20%] right-[15%] h-8 w-8 border-r border-b border-accent/20" />
        <div className="absolute top-[30%] right-[25%] text-accent/20 font-display text-[10px] tracking-widest">+</div>
        <div className="absolute bottom-[30%] left-[25%] text-accent/20 font-display text-[10px] tracking-widest">+</div>

        {/* Central Holographic Logo */}
        <div className="relative flex items-center justify-center mix-blend-screen opacity-10">
          {/* Base Glow */}
          <div className="absolute h-[400px] w-[400px] md:h-[600px] md:w-[600px] rounded-full bg-accent blur-[120px]" />
          {/* The Logo SVG itself */}
          <img
            src={LOGO_IMAGE_SRC}
            alt="Holographic Core"
            className="relative z-10 w-[300px] md:w-[500px] opacity-80 brightness-0 invert drop-shadow-[0_0_24px_rgba(212,190,136,0.8)]"
          />
        </div>

        {/* Slow Sweep Scanline Override (Creates the "scanning" holographic feel) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent h-[200%] w-full -translate-y-1/2 animate-float" />
      </div>

      {/* The Page Content Mount Point */}
      <div className="page-container relative z-10 h-full w-full">
        {displayChildren}
      </div>
    </div>
  );
}
