import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface CountUpProps {
    end: number | string;
    duration?: number;
    decimals?: number;
    className?: string;
}

export function CountUp({ end, duration = 1.5, decimals = 0, className = "" }: CountUpProps) {
    const nodeRef = useRef<HTMLSpanElement>(null);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        // Reset when `end` changes so the animation can replay
        hasStartedRef.current = false;

        const target = { val: 0 };

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasStartedRef.current) {
                    hasStartedRef.current = true;

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
            { threshold: 0.1 },
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [end, duration, decimals]);

    return <span ref={nodeRef} className={className}>0</span>;
}
