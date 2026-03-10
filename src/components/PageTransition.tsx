import type { PropsWithChildren } from "react";

export function PageTransition({ children }: PropsWithChildren) {
  return (
    <div
      className="gsap-route-shell bg-base relative min-h-screen w-full flex-1 overflow-hidden"
      style={{
        boxShadow: "0 -20px 40px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div className="gsap-route-grid bg-grid absolute inset-0 opacity-90" />
      <div className="scanline-overlay absolute inset-0 opacity-50" />
      <div className="gsap-route-parallax pointer-events-none absolute inset-x-0 top-0 z-0 h-96 bg-[radial-gradient(circle_at_top,rgba(212,190,136,0.1),transparent_58%)]" />
      <div className="gsap-route-parallax pointer-events-none absolute inset-y-0 right-[-18%] z-0 w-[42vw] max-w-[560px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_62%)] blur-3xl" />
      <div className="gsap-route-content relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
