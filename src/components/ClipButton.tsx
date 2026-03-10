import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface ClipButtonProps {
  children: ReactNode;
  className?: string;
  primary?: boolean;
  to?: string;
  href?: string;
  onClick?: () => void;
}

const sharedClassName =
  "group clip-corner relative inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 overflow-hidden";

export function ClipButton({
  children,
  className = "",
  primary = false,
  to,
  href,
  onClick,
}: ClipButtonProps) {
  const tone = primary
    ? "bg-white text-black shadow-glow hover:bg-accent hover:shadow-glowStrong focus:ring-2 focus:ring-accent/50"
    : "border border-white/10 bg-black/40 text-white hover:border-white/30 hover:bg-white/5";

  // More subtle, faster sweeping light
  const glowOverlay = <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-300 group-hover:translate-x-full" />;

  const content = (
    <>
      <span className="relative z-10 flex items-center gap-2 group-hover:translate-x-0.5 transition-transform duration-300">
        {children}
      </span>
      {glowOverlay}
    </>
  );

  const combined = `${sharedClassName} ${tone} ${className}`;

  if (to) {
    return (
      <Link className={combined} to={to}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={combined} href={href} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button className={combined} onClick={onClick} type="button">
      {content}
    </button>
  );
}
