import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    strength?: number;
}

export function MagneticButton({ children, strength = 30, className = "", ...props }: MagneticButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const button = buttonRef.current;
            const container = containerRef.current;
            if (!button || !container) return;

            const xTo = gsap.quickTo(button, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
            const yTo = gsap.quickTo(button, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

            const handleMouseMove = (e: MouseEvent) => {
                const { clientX, clientY } = e;
                const { height, width, left, top } = button.getBoundingClientRect();
                const x = clientX - (left + width / 2);
                const y = clientY - (top + height / 2);
                xTo(x * (strength / 100));
                yTo(y * (strength / 100));
            };

            const handleMouseLeave = () => {
                xTo(0);
                yTo(0);
            };

            container.addEventListener("mousemove", handleMouseMove);
            container.addEventListener("mouseleave", handleMouseLeave);

            return () => {
                container.removeEventListener("mousemove", handleMouseMove);
                container.removeEventListener("mouseleave", handleMouseLeave);
            };
        },
        { scope: containerRef }
    );

    return (
        <div ref={containerRef} className="relative inline-flex items-center justify-center p-4 -m-4">
            <button ref={buttonRef} className={className} {...props}>
                {children}
            </button>
        </div>
    );
}
