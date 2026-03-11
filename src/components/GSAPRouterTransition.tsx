import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LOGO_IMAGE_SRC } from "../lib/logo";

gsap.registerPlugin(ScrollTrigger);

type TransitionDirection = 1 | -1;

const ROUTE_ORDER = ["/", "/live", "/teams", "/rules"] as const;
const ROUTE_LABELS: Record<string, string> = {
  "/": "首页",
  "/live": "赛事大厅",
  "/teams": "队伍情报",
  "/rules": "赛事手册",
};

function getRouteOrder(pathname: string) {
  const index = ROUTE_ORDER.indexOf(pathname as (typeof ROUTE_ORDER)[number]);
  return index === -1 ? ROUTE_ORDER.length : index;
}

function getDirection(fromPath: string, toPath: string): TransitionDirection {
  return getRouteOrder(toPath) >= getRouteOrder(fromPath) ? 1 : -1;
}

function getRouteLabel(pathname: string) {
  return ROUTE_LABELS[pathname] ?? "界面切换";
}

function getReducedMotionPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function GSAPRouterTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionLabel, setTransitionLabel] = useState(getRouteLabel(location.pathname));
  const transitionRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const frameGlowRef = useRef<HTMLDivElement>(null);
  const currentPathRef = useRef(location.pathname);
  const nextChildrenRef = useRef<ReactNode | null>(null);
  const isTransitioning = useRef(false);

  const direction = useMemo(
    () => getDirection(currentPathRef.current, location.pathname),
    [location.pathname],
  );

  const transitionHint = direction > 0 ? "advancing" : "rewinding";

  useLayoutEffect(() => {
    if (location.pathname === currentPathRef.current) {
      return;
    }

    const nextLabel = getRouteLabel(location.pathname);
    setTransitionLabel(nextLabel);

    if (getReducedMotionPreference()) {
      setDisplayChildren(children);
      currentPathRef.current = location.pathname;
      window.scrollTo(0, 0);
      requestAnimationFrame(() => ScrollTrigger.refresh(true));
      return;
    }

    if (isTransitioning.current) {
      setDisplayChildren(children);
      currentPathRef.current = location.pathname;
      return;
    }

    isTransitioning.current = true;
    nextChildrenRef.current = children;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: "expo.inOut" },
        onComplete: () => {
          setDisplayChildren(nextChildrenRef.current);
          currentPathRef.current = location.pathname;
          window.scrollTo(0, 0);

          requestAnimationFrame(() => {
            const enterTimeline = gsap.timeline({
              onComplete: () => {
                isTransitioning.current = false;
                ScrollTrigger.refresh(true);
              },
            });

            enterTimeline.fromTo(
              ".page-container",
              { autoAlpha: 0, scale: 1.15, filter: "url(#prism-refraction) blur(40px)" },
              { autoAlpha: 1, scale: 1, filter: "url(#prism-refraction) blur(0px)", duration: 1.1, ease: "expo.out", clearProps: "all" },
              0,
            );

            enterTimeline.to(
              "#prism-refraction feDisplacementMap",
              { attr: { scale: 0 }, duration: 1.2, ease: "expo.out" },
              0.05,
            );

            enterTimeline.fromTo(
              ".gsap-stagger-item",
              { autoAlpha: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
              { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.08, ease: "expo.out", clearProps: "all" },
              0.2,
            );

            if (labelRef.current) {
              enterTimeline.to(labelRef.current, { autoAlpha: 0, y: -20, duration: 0.3, ease: "power2.in" }, 0);
            }

            if (veilRef.current) {
              enterTimeline.to(veilRef.current, { autoAlpha: 0, duration: 0.6, ease: "power2.out" }, 0.1);
            }

            if (frameGlowRef.current) {
              enterTimeline.to(frameGlowRef.current, { autoAlpha: 0, scaleX: 1.15, duration: 0.5, ease: "power2.out" }, 0.05);
            }

            if (progressRef.current) {
              enterTimeline.to(
                progressRef.current,
                {
                  scaleX: 0,
                  transformOrigin: direction > 0 ? "right center" : "left center",
                  duration: 0.5,
                  ease: "power2.inOut",
                },
                0.1,
              );
            }
          });
        },
      });

      // Exit Animation (Dissolve & Diffusion)
      if (progressRef.current) {
        timeline.fromTo(
          progressRef.current,
          { scaleX: 0, transformOrigin: direction > 0 ? "left center" : "right center" },
          { scaleX: 1, duration: 0.6, ease: "power3.inOut" },
          0,
        );
      }

      if (frameGlowRef.current) {
        timeline
          .fromTo(frameGlowRef.current, { autoAlpha: 0, scaleX: 0.8 }, { autoAlpha: 1, scaleX: 1, duration: 0.4 }, 0)
          .to(frameGlowRef.current, { autoAlpha: 0.3, scaleX: 1.2, duration: 0.5 }, 0.4);
      }

      if (veilRef.current) {
        timeline.fromTo(veilRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0);
      }

      if (labelRef.current) {
        timeline.fromTo(labelRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.15);
      }

      timeline.to(
        ".page-container",
        {
          autoAlpha: 0,
          scale: 0.85,
          filter: "url(#prism-refraction) blur(50px)",
          duration: 0.5,
          ease: "expo.inOut",
        },
        0,
      );

      timeline.to(
        "#prism-refraction feDisplacementMap",
        { attr: { scale: 120 }, duration: 0.5, ease: "power2.in" },
        0,
      );

      timeline.to(
        "#prism-refraction feTurbulence",
        { attr: { baseFrequency: 0.02 }, duration: 0.5, ease: "power2.in" },
        0,
      );

      if (orbRef.current) {
        const blobs = orbRef.current.querySelectorAll(".prism-blob");

        timeline
          .fromTo(
            orbRef.current,
            { x: direction > 0 ? "-80vw" : "80vw", autoAlpha: 0, scale: 0.6 },
            {
              x: "0vw",
              autoAlpha: 1,
              scale: 3.5,
              duration: 0.8,
              ease: "expo.inOut",
            },
            0,
          )
          .to(
            orbRef.current,
            {
              x: direction > 0 ? "80vw" : "-80vw",
              autoAlpha: 0,
              scale: 1,
              duration: 0.8,
              ease: "expo.inOut"
            },
            0.7,
          );

        // Animate internal blobs for "Internal Flow" feel
        blobs.forEach((blob, i) => {
          timeline.fromTo(
            blob,
            { x: "-20%", y: "-20%", scale: 0.8, opacity: 0 },
            {
              x: "20%",
              y: "20%",
              scale: 1.2,
              opacity: 0.4,
              duration: 1.2,
              ease: "none",
              delay: i * 0.1
            },
            0,
          );
        });

        timeline.to(
          orbRef.current,
          { filter: "hue-rotate(90deg) blur(140px)", duration: 1.5, ease: "none" },
          0
        );
      }
    }, transitionRef);

    return () => ctx.revert();
  }, [children, direction, location.pathname]);

  useEffect(() => {
    if (getReducedMotionPreference()) {
      return;
    }

    requestAnimationFrame(() => {
      ScrollTrigger.refresh(true);
    });
  }, []);

  return (
    <div ref={transitionRef} className="relative flex-1 overflow-hidden bg-canvas" style={{ perspective: "1200px" }}>
      {/* SVG Refraction Filter for "Neural Prism" effect */}
      <svg className="pointer-events-none absolute h-0 w-0 opacity-0">
        <defs>
          <filter id="prism-refraction">
            <feTurbulence baseFrequency="0.0" numOctaves="3" result="noise" seed="2" type="fractalNoise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div
        ref={orbRef}
        className="will-change-[transform,opacity,filter] pointer-events-none fixed left-1/2 top-1/2 z-40 h-[65vh] w-[65vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-[130px] mix-blend-screen"
        style={{
          background: "radial-gradient(circle, rgba(214,192,138,0.25) 0%, rgba(138,180,248,0.1) 45%, transparent 70%)"
        }}
      >
        {/* Prismatic Internal Blobs */}
        <div className="prism-blob absolute left-[10%] top-[10%] h-[60%] w-[60%] rounded-full bg-brand/20 blur-3xl" />
        <div className="prism-blob absolute right-[15%] bottom-[10%] h-[50%] w-[50%] rounded-full bg-purple-500/15 blur-3xl" />
        <div className="prism-blob absolute left-[20%] bottom-[20%] h-[40%] w-[40%] rounded-full bg-blue-400/15 blur-3xl" />
      </div>
      <div ref={veilRef} className="will-change-[opacity] pointer-events-none fixed inset-0 z-30 bg-[linear-gradient(180deg,rgba(11,13,16,0.18),rgba(11,13,16,0.56))] opacity-0" />
      <div ref={frameGlowRef} className="will-change-[transform,opacity] pointer-events-none fixed inset-x-0 top-0 z-40 h-28 origin-center opacity-0">
        <div className="h-full bg-[radial-gradient(circle_at_top,rgba(214,192,138,0.18),transparent_64%)]" />
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-1 bg-white/[0.04]">
        <div ref={progressRef} className="will-change-[transform] h-full origin-left scale-x-0 bg-gradient-to-r from-brand/20 via-brand to-brand/20 shadow-[0_0_18px_rgba(214,192,138,0.45)]" />
      </div>
      <div ref={labelRef} className="will-change-[transform,opacity] pointer-events-none fixed inset-x-0 top-24 z-40 opacity-0 md:top-28">
        <div className="mx-auto flex w-full max-w-[1440px] items-center px-4 md:px-8 lg:px-10 xl:px-12">
          <div className="route-hud relative px-4 py-2.5 md:px-5 md:py-3">
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand/16 bg-brand/8">
                <img
                  alt="Transitioning"
                  className="h-4 w-4 brightness-0 invert drop-shadow-[0_0_10px_rgba(214,192,138,0.36)]"
                  src={LOGO_IMAGE_SRC}
                />
              </div>
              <div>
                <div className="font-display text-[11px] uppercase tracking-[0.18em] text-brand/75">{transitionHint}</div>
                <div className="mt-1 font-title text-xl font-black tracking-[0.03em] text-text1">{transitionLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-0 z-0 bg-cyber-grid opacity-[0.25]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(214,192,138,0.12),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(214,192,138,0.08),transparent_22%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-black/36 to-transparent" />

      <div className="pointer-events-none fixed inset-0 z-0 flex items-start justify-center pt-28 md:pt-32">
        <div className="relative flex items-center justify-center opacity-[0.08]">
          <div className="absolute h-[300px] w-[300px] rounded-full border border-brand/20 md:h-[420px] md:w-[420px]" />
          <div className="absolute h-[360px] w-[360px] rounded-full border border-white/6 border-dashed md:h-[520px] md:w-[520px]" />
          <img
            alt="Background insignia"
            className="w-[180px] brightness-0 invert drop-shadow-[0_0_24px_rgba(214,192,138,0.45)] md:w-[260px]"
            src={LOGO_IMAGE_SRC}
          />
        </div>
      </div>

      <div className="page-container will-change-[transform,opacity] relative z-10 h-full w-full">{displayChildren}</div>
    </div>
  );
}
