import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface CountUpProps {
    end: number | string;
    duration?: number;
    decimals?: number;
    className?: string;
}

export function CountUp({ end, duration = 1.5, decimals = 0, className = "" }: CountUpProps) {
    const nodeRef = useRef<HTMLSpanElement>(null);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (!nodeRef.current) return;

        const target = { val: 0 };

        // Create an Intersection Observer to start animation when visible
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasStarted) {
                    setHasStarted(true);

                    const numericEnd = typeof end === "string" ? parseFloat(end.replace(/,/g, "")) : end;

                    gsap.to(target, {
                        val: numericEnd,
                        duration,
                        ease: "expo.out",
                        onUpdate: () => {
                            if (nodeRef.current) {
                                nodeRef.current.innerText = target.val.toFixed(decimals);
                            }
                        },
                    });

                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(nodeRef.current);

        return () => {
            observer.disconnect();
        };
    }, [end, duration, decimals, hasStarted]);

    return <span ref={nodeRef} className={className}>0</span>;
}
