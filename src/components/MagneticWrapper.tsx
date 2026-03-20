import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface MagneticWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    strength?: number;
}

export function MagneticWrapper({ children, strength = 35, className = "", ...props }: MagneticWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const container = containerRef.current;
            const item = itemRef.current;
            if (!item || !container) return;

            const xTo = gsap.quickTo(item, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
            const yTo = gsap.quickTo(item, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

            const handleMouseMove = (e: MouseEvent) => {
                const { clientX, clientY } = e;
                const { height, width, left, top } = container.getBoundingClientRect();
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
        <div ref={containerRef} className={`relative inline-flex items-center justify-center p-6 -m-6 ${className}`} {...props}>
            <div ref={itemRef} className="will-change-transform">
                {children}
            </div>
        </div>
    );
}
