import type { Ref } from "react";

interface PageBackgroundProps {
    /** Ref returned by `useParallaxLogo`. */
    logoRef: Ref<HTMLImageElement>;
    /** Horizontal positioning of the logo container (tailwind `left-*`). */
    left?: string;
    /** Vertical positioning of the logo container (tailwind `top-*`). */
    top?: string;
}

/**
 * Shared full-page background decoration used on LivePage & TeamsPage.
 *
 * Consolidates the background logo parallax container and the ambient
 * radial glow that were previously duplicated across pages.
 */
export function PageBackground({
    logoRef,
    left = "left-[75%]",
    top = "top-[15%]",
}: PageBackgroundProps) {
    return (
        <>
            {/* Global Parallax Matrix Background */}
            <div
                className={`pointer-events-none absolute ${left} ${top} -z-30 flex h-[160vw] w-[160vw] max-w-[1600px] -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-[0.06] mix-blend-screen md:left-[80%] md:top-[20%] xl:left-[85%]`}
            >
                <img
                    ref={logoRef}
                    src="/logo.svg"
                    alt=""
                    className="animate-spin-slower animate-float-subtle h-full w-full object-contain brightness-75 drop-shadow-[0_0_40px_rgba(214,192,138,0.15)]"
                />
            </div>
            {/* Ambient breathing pulse */}
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_70%_25%,rgba(214,192,138,0.06),transparent_75%)] animate-pulse-subtle" />
        </>
    );
}
