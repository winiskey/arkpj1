import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  angle: number;
  angularVel: number;
  speed: number;
}

type InteractiveParticleLogoMode = "default" | "hero";

interface InteractiveParticleLogoProps {
  imageSrc: string;
  className?: string;
  width?: number;
  height?: number;
  particleDensity?: number;
  particleColor?: string;
  interactionRadius?: number;
  mode?: InteractiveParticleLogoMode;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function drawStaticImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  padding: number,
  particleColor: string,
  mode: InteractiveParticleLogoMode,
) {
  ctx.clearRect(0, 0, width, height);

  const scale = Math.min((width - padding * 2) / img.width, (height - padding * 2) / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const dx = (width - drawWidth) / 2;
  const dy = (height - drawHeight) / 2;

  ctx.save();
  ctx.shadowColor = `rgba(${particleColor}, ${mode === "hero" ? 0.22 : 0.3})`;
  ctx.shadowBlur = mode === "hero" ? 24 : 18;
  ctx.globalAlpha = 0.92;
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  ctx.restore();
}

export function InteractiveParticleLogo({
  imageSrc,
  className = "",
  width = 300,
  height = 300,
  particleDensity = 4,
  particleColor = "255, 255, 255",
  interactionRadius,
  mode = "default",
}: InteractiveParticleLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    const reducedMotion = prefersReducedMotion();
    const config = mode === "hero"
      ? {
          padding: 42,
          wanderScale: 0.42,
          assembleDelay: 260,
          assembleLerp: 0.01,
          residualBrownian: 0.03,
          kickChance: 0.008,
          kickMin: 0.35,
          kickMax: 1.4,
          centerPullStart: 0.68,
          centerPullStrength: 0.002,
          assembleForce: 0.05,
          mouseThreshold: 0.9,
          mouseForce: 1.15,
          repelRadius: interactionRadius ?? 28,
          frictionBase: 0.92,
          frictionBoost: 0.02,
          glowAlpha: 0.16,
          glowScale: 2.25,
          alphaMin: 0.54,
          alphaRange: 0.28,
          initialVelocity: 0.36,
          speedMin: 0.12,
          speedMax: 0.9,
        }
      : {
          padding: 30,
          wanderScale: 0.45,
          assembleDelay: 600,
          assembleLerp: 0.015,
          residualBrownian: 0.1,
          kickChance: 0.02,
          kickMin: 1,
          kickMax: 4,
          centerPullStart: 0.6,
          centerPullStrength: 0.003,
          assembleForce: 0.06,
          mouseThreshold: 0.8,
          mouseForce: 3.5,
          repelRadius: interactionRadius ?? 35,
          frictionBase: 0.88,
          frictionBoost: 0.03,
          glowAlpha: 0.25,
          glowScale: 3,
          alphaMin: 0.6,
          alphaRange: 0.4,
          initialVelocity: 0.5,
          speedMin: 0.15,
          speedMax: 1.5,
        };

    let particles: Particle[] = [];
    let animationFrameId = 0;
    let assembleTimeoutId = 0;
    let isAssembling = false;
    let assembleT = reducedMotion ? 1 : 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let disposed = false;

    const centerX = width / 2;
    const centerY = height / 2;
    const wanderRadius = Math.min(width, height) * config.wanderScale;

    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "Anonymous";

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseX = (event.clientX - rect.left) * scaleX;
      mouseY = (event.clientY - rect.top) * scaleY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      assembleT += ((isAssembling ? 1 : 0) - assembleT) * config.assembleLerp;

      particles.forEach((particle) => {
        particle.angularVel += (Math.random() - 0.5) * (mode === "hero" ? 0.18 : 0.3);
        particle.angularVel *= mode === "hero" ? 0.9 : 0.85;
        particle.angle += particle.angularVel;

        particle.speed += (Math.random() - 0.5) * (mode === "hero" ? 0.1 : 0.2);
        particle.speed = Math.max(config.speedMin, Math.min(particle.speed, config.speedMax));

        const brownFx = Math.cos(particle.angle) * particle.speed * 0.5;
        const brownFy = Math.sin(particle.angle) * particle.speed * 0.5;

        let kickFx = 0;
        let kickFy = 0;
        if (Math.random() < config.kickChance) {
          const kickAngle = Math.random() * Math.PI * 2;
          const kickStrength = Math.random() * (config.kickMax - config.kickMin) + config.kickMin;
          kickFx = Math.cos(kickAngle) * kickStrength;
          kickFy = Math.sin(kickAngle) * kickStrength;
        }

        const dxCenter = centerX - particle.x;
        const dyCenter = centerY - particle.y;
        const distFromCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
        let centerFx = 0;
        let centerFy = 0;
        if (distFromCenter > wanderRadius * config.centerPullStart) {
          const pullStrength = config.centerPullStrength * (distFromCenter - wanderRadius * config.centerPullStart);
          centerFx = (dxCenter / distFromCenter) * pullStrength;
          centerFy = (dyCenter / distFromCenter) * pullStrength;
        }

        const dxOrigin = particle.originX - particle.x;
        const dyOrigin = particle.originY - particle.y;
        const assembleFx = dxOrigin * config.assembleForce;
        const assembleFy = dyOrigin * config.assembleForce;

        let mouseFx = 0;
        let mouseFy = 0;
        if (assembleT > config.mouseThreshold) {
          const dxMouse = mouseX - particle.x;
          const dyMouse = mouseY - particle.y;
          const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
          if (distMouseSq < config.repelRadius * config.repelRadius && distMouseSq > 0) {
            const distMouse = Math.sqrt(distMouseSq);
            const force = (config.repelRadius - distMouse) / config.repelRadius;
            mouseFx = -(dxMouse / distMouse) * force * config.mouseForce;
            mouseFy = -(dyMouse / distMouse) * force * config.mouseForce;
          }
        }

        const brownWeight = Math.max(1 - assembleT, config.residualBrownian);
        const assembleWeight = assembleT;

        particle.vx += brownFx * brownWeight + (assembleFx + mouseFx) * assembleWeight;
        particle.vy += brownFy * brownWeight + (assembleFy + mouseFy) * assembleWeight;
        particle.vx += (kickFx + centerFx) * (1 - assembleT);
        particle.vy += (kickFy + centerFy) * (1 - assembleT);

        const friction = config.frictionBase - assembleT * config.frictionBoost;
        particle.vx *= friction;
        particle.vy *= friction;

        particle.x += particle.vx;
        particle.y += particle.vy;

        const glowAlpha = assembleT * config.glowAlpha;
        if (glowAlpha > 0.02) {
          ctx.fillStyle = `rgba(${particleColor}, ${glowAlpha})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * config.glowScale, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = window.requestAnimationFrame(animate);
    };

    img.onload = () => {
      if (disposed) {
        return;
      }

      canvas.width = width;
      canvas.height = height;

      if (reducedMotion) {
        drawStaticImage(ctx, img, width, height, config.padding, particleColor, mode);
        return;
      }

      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      const offscreenContext = offscreenCanvas.getContext("2d", { willReadFrequently: true });
      if (!offscreenContext) {
        return;
      }

      const scale = Math.min((width - config.padding * 2) / img.width, (height - config.padding * 2) / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const dx = (width - drawWidth) / 2;
      const dy = (height - drawHeight) / 2;

      offscreenContext.drawImage(img, dx, dy, drawWidth, drawHeight);

      const imageData = offscreenContext.getImageData(0, 0, width, height);
      const data = imageData.data;

      particles = [];

      for (let y = 0; y < height; y += particleDensity) {
        for (let x = 0; x < width; x += particleDensity) {
          const index = (y * width + x) * 4;
          const alpha = data[index + 3];

          if (alpha <= 128) {
            continue;
          }

          const scatterAngle = Math.random() * Math.PI * 2;
          const scatterDistance = Math.random() * wanderRadius;
          const startX = centerX + Math.cos(scatterAngle) * scatterDistance;
          const startY = centerY + Math.sin(scatterAngle) * scatterDistance;
          const heading = Math.random() * Math.PI * 2;

          particles.push({
            x: startX,
            y: startY,
            originX: x,
            originY: y,
            vx: Math.cos(heading) * config.initialVelocity,
            vy: Math.sin(heading) * config.initialVelocity,
            color: `rgba(${particleColor}, ${Math.random() * config.alphaRange + config.alphaMin})`,
            size: Math.random() * (mode === "hero" ? 1.2 : 1.5) + (mode === "hero" ? 0.7 : 0.5),
            angle: heading,
            angularVel: (Math.random() - 0.5) * (mode === "hero" ? 0.08 : 0.15),
            speed: Math.random() * (config.speedMax - config.speedMin) + config.speedMin,
          });
        }
      }

      assembleTimeoutId = window.setTimeout(() => {
        isAssembling = true;
      }, config.assembleDelay);

      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
      animate();
    };

    return () => {
      disposed = true;
      window.clearTimeout(assembleTimeoutId);
      window.cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      img.onload = null;
    };
  }, [height, imageSrc, interactionRadius, mode, particleColor, particleDensity, width]);

  const cursorClass = mode === "hero" ? "cursor-default" : "cursor-crosshair";
  const glowClass = mode === "hero"
    ? "drop-shadow-[0_0_28px_rgba(214,192,138,0.22)] contrast-110"
    : "drop-shadow-[0_0_16px_rgba(212,190,136,0.6)] contrast-125";

  return <canvas ref={canvasRef} className={`touch-none ${cursorClass} ${glowClass} ${className}`} />;
}
