import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  once?: boolean;
  staggerChildren?: boolean;
  childSelector?: string;
  start?: string;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getFallbackChildren(container: HTMLDivElement) {
  return Array.from(container.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 32,
  duration = 0.58,
  once = true,
  staggerChildren = true,
  childSelector,
  start = "top 88%",
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) {
        return;
      }

      const container = containerRef.current;
      const targets = staggerChildren
        ? Array.from(
            container.querySelectorAll<HTMLElement>(childSelector ?? "[data-reveal-item], .gsap-stagger-item"),
          )
        : [];
      const revealTargets = targets.length > 0 ? targets : staggerChildren ? getFallbackChildren(container) : [];

      if (prefersReducedMotion()) {
        gsap.set([container, ...revealTargets], { clearProps: "all", autoAlpha: 1, x: 0, y: 0, scale: 1 });
        return;
      }

      let x = 0;
      let y = 0;

      switch (direction) {
        case "up":
          y = distance;
          break;
        case "down":
          y = -distance;
          break;
        case "left":
          x = distance;
          break;
        case "right":
          x = -distance;
          break;
      }

      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: container,
          start,
          once,
          toggleActions: once ? "play none none none" : "play none none reverse",
        },
      });

      timeline.fromTo(
        container,
        {
          autoAlpha: 0,
          x,
          y,
          scale: 0.992,
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration,
          delay,
          clearProps: "transform,opacity,visibility",
        },
      );

      if (revealTargets.length > 0) {
        timeline.fromTo(
          revealTargets,
          {
            autoAlpha: 0,
            y: 18,
            scale: 0.994,
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: Math.max(0.28, duration - 0.12),
            stagger: 0.08,
            clearProps: "transform,opacity,visibility",
          },
          delay + 0.08,
        );
      }
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
