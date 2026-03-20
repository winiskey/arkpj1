import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { hasHoverCapability, prefersReducedMotion } from "./motion";

/**
 * Parallax logo effect driven by the mouse cursor.
 *
 * Extracted from the three pages that duplicated this exact logic
 * (HomePage, LivePage, TeamsPage).
 *
 * @param amplitude  Maximum pixel offset applied to the element. Defaults to 240.
 * @returns          A ref to attach to the `<img>` element.
 */
export function useParallaxLogo(amplitude = 240) {
    const logoRef = useRef<HTMLImageElement>(null);

    useGSAP(() => {
        const logo = logoRef.current;
        if (!logo) return;

        // Skip on reduced-motion or touch-only devices
        if (prefersReducedMotion()) return;
        if (!hasHoverCapability()) return;

        const xTo = gsap.quickTo(logo, "x", { duration: 1.2, ease: "power3.out" });
        const yTo = gsap.quickTo(logo, "y", { duration: 1.2, ease: "power3.out" });

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const xOffset = (clientX / innerWidth - 0.5) * -amplitude;
            const yOffset = (clientY / innerHeight - 0.5) * -amplitude;
            xTo(xOffset);
            yTo(yOffset);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    });

    return logoRef;
}
