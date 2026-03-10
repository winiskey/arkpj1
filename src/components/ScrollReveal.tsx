import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right";
    distance?: number;
    duration?: number;
}

export function ScrollReveal({
    children,
    className = "",
    delay = 0,
    direction = "up",
    distance = 50,
    duration = 0.8,
}: ScrollRevealProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!containerRef.current) return;

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

        gsap.fromTo(
            containerRef.current,
            {
                opacity: 0,
                x,
                y,
            },
            {
                opacity: 1,
                x: 0,
                y: 0,
                duration,
                delay,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 85%", // Trigger when the top of the element hits 85% down the viewport
                },
            }
        );
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className={`will-change-transform ${className}`}>
            {children}
        </div>
    );
}
