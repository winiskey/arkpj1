import React, { useEffect, useRef, useState } from "react";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    spotlightColor?: string;
    /** Enable the conic-gradient sweeping border glow */
    glowBorder?: boolean;
}

export function SpotlightCard({
    children,
    className = "",
    spotlightColor = "rgba(255, 255, 255, 0.08)",
    glowBorder = false,
    ...props
}: SpotlightCardProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const borderRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);
    const [borderAngle, setBorderAngle] = useState(0);
    const rafRef = useRef<number | null>(null);
    const isHoveredRef = useRef(false);

    // Animate the sweeping border glow
    useEffect(() => {
        if (!glowBorder) return;

        let angle = 0;
        let animFrameId: number;

        const tick = () => {
            angle = (angle + 0.8) % 360;
            setBorderAngle(angle);
            animFrameId = requestAnimationFrame(tick);
        };

        animFrameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animFrameId);
    }, [glowBorder]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current || isFocused) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
        isHoveredRef.current = true;
    };

    const handleMouseLeave = () => {
        setOpacity(0);
        isHoveredRef.current = false;
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden ${className}`}
            {...props}
        >
            {/* Flowing conic-gradient border glow */}
            {glowBorder && (
                <div
                    className="pointer-events-none absolute -inset-[1px] rounded-[inherit] opacity-60 transition-opacity duration-700"
                    style={{
                        background: `conic-gradient(from ${borderAngle}deg at 50% 50%, transparent 0deg, rgba(214,192,138,0.6) 40deg, transparent 90deg, transparent 360deg)`,
                        WebkitMask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                        padding: "1px",
                    }}
                />
            )}

            {/* Radial spotlight follow effect */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
                }}
            />
            {children}
        </div>
    );
}
