import React, { useRef, useEffect } from 'react';

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

interface InteractiveParticleLogoProps {
    imageSrc: string;
    className?: string;
    width?: number;
    height?: number;
    particleDensity?: number;
    particleColor?: string;
    interactionRadius?: number;
}

export const InteractiveParticleLogo: React.FC<InteractiveParticleLogoProps> = ({
    imageSrc,
    className = '',
    width = 300,
    height = 300,
    particleDensity = 4,
    particleColor = '255, 255, 255',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;
        let isAssembling = false;
        let assembleT = 0;
        let mouseX = -1000;
        let mouseY = -1000;

        const centerX = width / 2;
        const centerY = height / 2;
        const wanderRadius = Math.min(width, height) * 0.45;

        const img = new Image();
        img.src = imageSrc;
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            canvas.width = width;
            canvas.height = height;

            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = width;
            offscreenCanvas.height = height;
            const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
            if (!offCtx) return;

            const padding = 30;
            const scale = Math.min((width - padding * 2) / img.width, (height - padding * 2) / img.height);
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const dx = (width - drawWidth) / 2;
            const dy = (height - drawHeight) / 2;

            offCtx.drawImage(img, dx, dy, drawWidth, drawHeight);

            const imageData = offCtx.getImageData(0, 0, width, height);
            const data = imageData.data;

            particles = [];

            for (let y = 0; y < height; y += particleDensity) {
                for (let x = 0; x < width; x += particleDensity) {
                    const index = (y * width + x) * 4;
                    const alpha = data[index + 3];

                    if (alpha > 128) {
                        // Scatter in a circular area, not rectangular
                        const scatterAngle = Math.random() * Math.PI * 2;
                        const scatterDist = Math.random() * wanderRadius;
                        const startX = centerX + Math.cos(scatterAngle) * scatterDist;
                        const startY = centerY + Math.sin(scatterAngle) * scatterDist;
                        const headAngle = Math.random() * Math.PI * 2;

                        particles.push({
                            x: startX,
                            y: startY,
                            originX: x,
                            originY: y,
                            vx: Math.cos(headAngle) * 0.5,
                            vy: Math.sin(headAngle) * 0.5,
                            color: `rgba(${particleColor}, ${Math.random() * 0.4 + 0.6})`,
                            size: Math.random() * 1.5 + 0.5,
                            angle: headAngle,
                            angularVel: (Math.random() - 0.5) * 0.15,
                            speed: Math.random() * 0.8 + 0.3,
                        });
                    }
                }
            }

            setTimeout(() => {
                isAssembling = true;
            }, 600);

            animate();
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Smooth transition (slightly slower for a majestic intro)
            const targetT = isAssembling ? 1 : 0;
            assembleT += (targetT - assembleT) * 0.015;

            particles.forEach(p => {
                // ── Brownian motion: per-particle random walk ──
                p.angularVel += (Math.random() - 0.5) * 0.3;
                p.angularVel *= 0.85;
                p.angle += p.angularVel;

                p.speed += (Math.random() - 0.5) * 0.2;
                p.speed = Math.max(0.15, Math.min(p.speed, 1.5));

                const brownFx = Math.cos(p.angle) * p.speed * 0.5;
                const brownFy = Math.sin(p.angle) * p.speed * 0.5;

                // Occasional random kicks
                let kickFx = 0, kickFy = 0;
                if (Math.random() < 0.02) {
                    const kickAngle = Math.random() * Math.PI * 2;
                    const kickStrength = Math.random() * 3 + 1;
                    kickFx = Math.cos(kickAngle) * kickStrength;
                    kickFy = Math.sin(kickAngle) * kickStrength;
                }

                // Gentle centripetal pull towards canvas center (keeps cloud circular, not boxy)
                const dxCenter = centerX - p.x;
                const dyCenter = centerY - p.y;
                const distFromCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
                let centerFx = 0, centerFy = 0;
                if (distFromCenter > wanderRadius * 0.6) {
                    const pullStrength = 0.003 * (distFromCenter - wanderRadius * 0.6);
                    centerFx = (dxCenter / distFromCenter) * pullStrength;
                    centerFy = (dyCenter / distFromCenter) * pullStrength;
                }

                // ── Assembly force: spring towards logo origin ──
                const dxOrigin = p.originX - p.x;
                const dyOrigin = p.originY - p.y;
                const assembleFx = dxOrigin * 0.06;
                const assembleFy = dyOrigin * 0.06;

                // ── Mouse Repulsion (only when mostly assembled) ──
                let mouseFx = 0, mouseFy = 0;
                if (assembleT > 0.8) {
                    const dxMouse = mouseX - p.x;
                    const dyMouse = mouseY - p.y;
                    const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
                    const repelRadius = 35;
                    if (distMouseSq < repelRadius * repelRadius && distMouseSq > 0) {
                        const distMouse = Math.sqrt(distMouseSq);
                        const force = (repelRadius - distMouse) / repelRadius;
                        mouseFx = -(dxMouse / distMouse) * force * 3.5;
                        mouseFy = -(dyMouse / distMouse) * force * 3.5;
                    }
                }

                // ── Blend forces ──
                // Keep a residual 10% Brownian noise even when fully assembled
                // so particles gently breathe around their origin
                const brownWeight = Math.max(1 - assembleT, 0.10);
                const assembleWeight = assembleT;

                p.vx += brownFx * brownWeight + (assembleFx + mouseFx) * assembleWeight;
                p.vy += brownFy * brownWeight + (assembleFy + mouseFy) * assembleWeight;
                // Kicks and centripetal only during drift phase
                p.vx += (kickFx + centerFx) * (1 - assembleT);
                p.vy += (kickFy + centerFy) * (1 - assembleT);

                // Friction (less friction when assembling for a floatier feel)
                const friction = 0.88 - assembleT * 0.03;
                p.vx *= friction;
                p.vy *= friction;

                p.x += p.vx;
                p.y += p.vy;

                // ── Draw ──
                const glowAlpha = assembleT * 0.25;
                if (glowAlpha > 0.02) {
                    ctx.fillStyle = `rgba(${particleColor}, ${glowAlpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            // Scale CSS coords to canvas internal coords (canvas may be larger than display)
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            mouseX = (e.clientX - rect.left) * scaleX;
            mouseY = (e.clientY - rect.top) * scaleY;
        };

        const handleMouseLeave = () => {
            mouseX = -1000;
            mouseY = -1000;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [imageSrc, width, height, particleDensity, particleColor]);

    return (
        <canvas
            ref={canvasRef}
            className={`touch-none cursor-crosshair drop-shadow-[0_0_16px_rgba(212,190,136,0.6)] contrast-125 ${className}`}
        />
    );
};
