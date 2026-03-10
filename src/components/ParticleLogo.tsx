import { useEffect, useMemo, useRef, useState } from "react";

interface ParticleLogoProps {
  imageSrc: string;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  alphaBoost: number;
  rowIndex: number;
  sprite: HTMLCanvasElement | null;
}

interface ParticleSprites {
  glow: HTMLCanvasElement;
  zero: HTMLCanvasElement;
  one: HTMLCanvasElement;
}

const PARTICLE_COLOR = "#49d9ff";
const PARTICLE_GLOW = "rgba(73, 217, 255, 0.65)";
const PARTICLE_FONT = "10px monospace";
const DOT_GLOW_SIZE = 24;
const DIGIT_SPRITE_SIZE = 24;
const DIGIT_SPRITE_HALF = DIGIT_SPRITE_SIZE / 2;
const DOT_GLOW_HALF = DOT_GLOW_SIZE / 2;
const MOUSE_RADIUS = 56;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const MAX_LOGO_SIZE = 520;
const PARTICLE_STEP = 6;
const WAVE_MULTIPLIER = 0.018;
const RETURN_EASE = 0.16;
const PUSH_FORCE = -3.4;

function createSprite(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const sprite = document.createElement("canvas");
  sprite.width = width;
  sprite.height = height;

  const spriteCtx = sprite.getContext("2d");
  if (spriteCtx) {
    draw(spriteCtx);
  }

  return sprite;
}

function createParticleSprites(): ParticleSprites {
  const glow = createSprite(DOT_GLOW_SIZE, DOT_GLOW_SIZE, (spriteCtx) => {
    const center = DOT_GLOW_HALF;
    const gradient = spriteCtx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, "rgba(73, 217, 255, 0.34)");
    gradient.addColorStop(0.45, "rgba(73, 217, 255, 0.18)");
    gradient.addColorStop(1, "rgba(73, 217, 255, 0)");

    spriteCtx.fillStyle = gradient;
    spriteCtx.fillRect(0, 0, DOT_GLOW_SIZE, DOT_GLOW_SIZE);
  });

  const createDigitSprite = (digit: "0" | "1") =>
    createSprite(DIGIT_SPRITE_SIZE, DIGIT_SPRITE_SIZE, (spriteCtx) => {
      spriteCtx.fillStyle = PARTICLE_COLOR;
      spriteCtx.font = PARTICLE_FONT;
      spriteCtx.textAlign = "center";
      spriteCtx.textBaseline = "middle";
      spriteCtx.shadowColor = PARTICLE_GLOW;
      spriteCtx.shadowBlur = 8;
      spriteCtx.fillText(digit, DIGIT_SPRITE_HALF, DIGIT_SPRITE_HALF);
    });

  return {
    glow,
    zero: createDigitSprite("0"),
    one: createDigitSprite("1"),
  };
}

export function ParticleLogo({ imageSrc }: ParticleLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const fallbackMarkup = useMemo(
    () => (
      <div className="relative flex h-[340px] w-full items-center justify-center lg:h-[620px]">
        <div className="absolute h-[70%] w-[70%] rounded-full border border-dashed border-white/10 animate-spin-slow" />
        <div className="absolute h-[48%] w-[48%] rounded-full border border-dotted border-accent/25 animate-spin-slower" />
        <div className="absolute h-48 w-48 rounded-full bg-accent/12 blur-3xl md:h-72 md:w-72" />
        <img
          alt="荆楚歌赛事标记"
          className="relative z-10 h-44 w-44 drop-shadow-[0_0_34px_rgba(0,209,255,0.58)] md:h-60 md:w-60"
          src={imageSrc}
        />
      </div>
    ),
    [imageSrc],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopMedia = window.matchMedia("(min-width: 1024px)");
    const updateMode = () => setShouldAnimate(!motionMedia.matches && desktopMedia.matches);

    updateMode();
    motionMedia.addEventListener("change", updateMode);
    desktopMedia.addEventListener("change", updateMode);

    return () => {
      motionMedia.removeEventListener("change", updateMode);
      desktopMedia.removeEventListener("change", updateMode);
    };
  }, []);

  useEffect(() => {
    if (!shouldAnimate || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const context = ctx;
    let animationFrameId = 0;
    let resizeFrameId = 0;
    let isDisposed = false;
    let isVisible = !document.hidden;
    let particles: Particle[] = [];
    let rowPhases = new Float32Array(0);
    let waveValues = new Float32Array(0);
    let canvasBounds = canvas.getBoundingClientRect();

    const sprites = createParticleSprites();
    const mouse = { x: -1000, y: -1000 };
    const sourceImage = new Image();

    const updateBounds = () => {
      canvasBounds = canvas.getBoundingClientRect();
    };

    const rebuildParticles = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }

      const rect = parent.getBoundingClientRect();
      const nextCanvasWidth = Math.floor(rect.width);
      const nextCanvasHeight = Math.floor(rect.height);
      if (!nextCanvasWidth || !nextCanvasHeight) {
        return;
      }

      canvas.width = nextCanvasWidth;
      canvas.height = nextCanvasHeight;
      updateBounds();

      if (!sourceImage.complete || !sourceImage.naturalWidth || !sourceImage.naturalHeight) {
        particles = [];
        rowPhases = new Float32Array(0);
        waveValues = new Float32Array(0);
        return;
      }

      const offCanvas = document.createElement("canvas");
      const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
      if (!offCtx) {
        return;
      }

      const scale = Math.min(
        MAX_LOGO_SIZE / sourceImage.naturalWidth,
        MAX_LOGO_SIZE / sourceImage.naturalHeight,
      );
      const sampledWidth = Math.max(1, Math.floor(sourceImage.naturalWidth * scale));
      const sampledHeight = Math.max(1, Math.floor(sourceImage.naturalHeight * scale));
      const offsetX = (canvas.width - sampledWidth) / 2;
      const offsetY = (canvas.height - sampledHeight) / 2;
      const nextParticles: Particle[] = [];
      const nextRowPhases: number[] = [];

      offCanvas.width = sampledWidth;
      offCanvas.height = sampledHeight;
      offCtx.drawImage(sourceImage, 0, 0, sampledWidth, sampledHeight);

      const imageData = offCtx.getImageData(0, 0, sampledWidth, sampledHeight).data;

      for (let y = 0; y < sampledHeight; y += PARTICLE_STEP) {
        const rowIndex = nextRowPhases.length;
        nextRowPhases.push((y + offsetY) * WAVE_MULTIPLIER);

        for (let x = 0; x < sampledWidth; x += PARTICLE_STEP) {
          const index = (y * sampledWidth + x) * 4;
          if (imageData[index + 3] <= 100) {
            continue;
          }

          const charRoll = Math.random();
          const sprite = charRoll > 0.84 ? (Math.random() > 0.5 ? sprites.zero : sprites.one) : null;

          nextParticles.push({
            x: x + offsetX + (Math.random() - 0.5) * 36,
            y: y + offsetY + (Math.random() - 0.5) * 36,
            baseX: x + offsetX,
            baseY: y + offsetY,
            size: Math.random() * 1.3 + 1.15,
            alphaBoost: Math.random() * 0.35 + 0.75,
            rowIndex,
            sprite,
          });
        }
      }

      particles = nextParticles;
      rowPhases = Float32Array.from(nextRowPhases);
      waveValues = new Float32Array(rowPhases.length);
    };

    const startAnimation = () => {
      if (animationFrameId === 0 && isVisible) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    };

    const stopAnimation = () => {
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    };

    function animate() {
      animationFrameId = 0;
      if (isDisposed || !isVisible) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = PARTICLE_COLOR;

      const time = performance.now() * 0.0018;
      for (let index = 0; index < rowPhases.length; index += 1) {
        waveValues[index] = Math.sin(rowPhases[index] - time) * 0.5 + 0.5;
      }

      for (const particle of particles) {
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq > 0.01 && distanceSq < MOUSE_RADIUS_SQ) {
          const distance = Math.sqrt(distanceSq);
          const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
          const scale = (PUSH_FORCE * force) / distance;

          particle.x += dx * scale;
          particle.y += dy * scale;
        } else {
          particle.x += (particle.baseX - particle.x) * RETURN_EASE;
          particle.y += (particle.baseY - particle.y) * RETURN_EASE;
        }

        context.globalAlpha = Math.min(1, waveValues[particle.rowIndex] * particle.alphaBoost + 0.22);

        if (particle.sprite) {
          context.drawImage(particle.sprite, particle.x - DIGIT_SPRITE_HALF, particle.y - DIGIT_SPRITE_HALF);
        } else {
          context.drawImage(
            sprites.glow,
            particle.x - DOT_GLOW_HALF + particle.size * 0.5,
            particle.y - DOT_GLOW_HALF + particle.size * 0.5,
          );
          context.fillRect(particle.x, particle.y, particle.size, particle.size);
        }
      }

      context.globalAlpha = 1;
      animationFrameId = window.requestAnimationFrame(animate);
    }

    const handleMouseEnter = () => {
      updateBounds();
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX - canvasBounds.left;
      mouse.y = event.clientY - canvasBounds.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      if (resizeFrameId !== 0) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = 0;
        rebuildParticles();
      });
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        updateBounds();
        startAnimation();
      } else {
        stopAnimation();
      }
    };

    sourceImage.crossOrigin = "anonymous";
    sourceImage.decoding = "async";
    sourceImage.onload = () => {
      if (isDisposed) {
        return;
      }

      rebuildParticles();
      startAnimation();
    };
    sourceImage.onerror = () => {
      particles = [];
      rowPhases = new Float32Array(0);
      waveValues = new Float32Array(0);
    };
    sourceImage.src = imageSrc;

    rebuildParticles();
    if (sourceImage.complete && sourceImage.naturalWidth) {
      rebuildParticles();
      startAnimation();
    }

    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updateBounds, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isDisposed = true;
      stopAnimation();

      if (resizeFrameId !== 0) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updateBounds);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [imageSrc, shouldAnimate]);

  if (!shouldAnimate) {
    return fallbackMarkup;
  }

  return (
    <div className="relative flex h-[620px] w-full items-center justify-center overflow-hidden">
      <div className="absolute h-[470px] w-[470px] rounded-full border border-dashed border-white/8 animate-spin-slower" />
      <div className="absolute h-[320px] w-[320px] rounded-full border border-dotted border-accent/25 animate-spin-slow" />
      <div className="absolute h-64 w-64 rounded-full bg-accent/12 blur-3xl" />
      <canvas ref={canvasRef} className="relative z-10 h-full w-full" />
    </div>
  );
}


