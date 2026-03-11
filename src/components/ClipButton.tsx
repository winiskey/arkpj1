import type { AnchorHTMLAttributes, ButtonHTMLAttributes, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type ClipButtonVariant = "primary" | "secondary" | "ghost";
type ClipButtonSize = "md" | "lg";

interface ClipButtonProps {
  children: ReactNode;
  className?: string;
  variant?: ClipButtonVariant;
  size?: ClipButtonSize;
  primary?: boolean;
  to?: string;
  href?: string;
  onClick?: () => void;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: AnchorHTMLAttributes<HTMLAnchorElement>["rel"];
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

const variantClassName: Record<ClipButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

const sizeClassName: Record<ClipButtonSize, string> = {
  md: "px-5 py-3 text-[11px]",
  lg: "px-7 py-4 text-[12px]",
};

export function ClipButton({
  children,
  className = "",
  variant,
  size = "md",
  primary,
  to,
  href,
  onClick,
  target,
  rel,
  type = "button",
}: ClipButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pressed, setPressed] = useState(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const resolvedVariant = variant ?? (primary ? "primary" : "secondary");
  const combined = [
    "clip-corner",
    variantClassName[resolvedVariant],
    sizeClassName[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
    };
  }, []);

  const releasePress = useCallback(() => {
    setPressed(false);
  }, []);

  const spawnRipple = useCallback((x: number, y: number, sizePx: number) => {
    const nextRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size: sizePx,
    };

    setRipples((current) => [...current, nextRipple]);
    const timeoutId = window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== nextRipple.id));
      timeoutIdsRef.current = timeoutIdsRef.current.filter((currentId) => currentId !== timeoutId);
    }, 540);
    timeoutIdsRef.current.push(timeoutId);
  }, []);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const sizePx = Math.max(rect.width, rect.height) * 1.15;
    spawnRipple(event.clientX - rect.left, event.clientY - rect.top, sizePx);
    setPressed(true);
  }, [spawnRipple]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if ((event.key !== "Enter" && event.key !== " ") || event.repeat) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const sizePx = Math.max(rect.width, rect.height) * 0.9;
    spawnRipple(rect.width / 2, rect.height / 2, sizePx);
    setPressed(true);
  }, [spawnRipple]);

  const content = (
    <>
      <span className="flex items-center gap-2 transition-transform duration-[160ms] group-hover:translate-x-0.5 group-active:translate-x-0">
        {children}
      </span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden="true"
          className="btn-ripple"
          style={{ height: ripple.size, left: ripple.x, top: ripple.y, width: ripple.size }}
        />
      ))}
    </>
  );

  const interactionProps = {
    "data-pressed": pressed ? "true" : undefined,
    onBlur: releasePress,
    onKeyDown: handleKeyDown,
    onKeyUp: releasePress,
    onPointerCancel: releasePress,
    onPointerDown: handlePointerDown,
    onPointerLeave: releasePress,
    onPointerUp: releasePress,
  };

  if (to) {
    return (
      <Link {...interactionProps} className={`${combined} group`} onClick={onClick} to={to}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a {...interactionProps} className={`${combined} group`} href={href} onClick={onClick} rel={rel} target={target}>
        {content}
      </a>
    );
  }

  return (
    <button {...interactionProps} className={`${combined} group`} onClick={onClick} type={type}>
      {content}
    </button>
  );
}
