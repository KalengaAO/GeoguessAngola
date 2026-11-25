import { useEffect, useRef } from "react";
import "./GlitterWrap.css";

const COLORS = ["#C8102E", "#F2B400", "#FFFFFF"];

function GlitterWrap() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return undefined;

        const motionPreference = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );
        let width = 0;
        let height = 0;
        let frameId = null;
        let frame = 0;
        let particles = [];
        let isVisible = false;
        let pixelRatio = 1;
        let previousTime = 0;

        function resizeCanvas() {
            const bounds = canvas.getBoundingClientRect();
            width = bounds.width;
            height = bounds.height;
            pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

            const particleCount = width < 600 ? 60 : 120;
            const maxRadius = Math.hypot(width, height) * 0.62;
            particles = Array.from({ length: particleCount }, () => ({
                angle: Math.random() * Math.PI * 2,
                radius: Math.random() * maxRadius,
                speed: 0.3 + Math.random() * 0.65,
                size: 0.45 + Math.random() * 1.1,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                sparkleOffset: Math.random() * Math.PI * 2,
            }));
            drawFrame(0);
        }

        function drawFrame(delta) {
            if (!width || !height) return;

            const centerX = width / 2;
            const centerY = height / 2;
            const maxRadius = Math.hypot(width, height) * 0.62;
            context.clearRect(0, 0, width, height);

            particles.forEach((particle) => {
                let previousRadius = particle.radius;
                particle.radius += particle.speed * delta;

                if (particle.radius > maxRadius) {
                    particle.radius = Math.random() * 8;
                    particle.angle = Math.random() * Math.PI * 2;
                    previousRadius = particle.radius;
                }

                const cosine = Math.cos(particle.angle);
                const sine = Math.sin(particle.angle);
                const x = centerX + cosine * particle.radius;
                const y = centerY + sine * particle.radius;
                const trailRadius = Math.max(
                    0,
                    previousRadius - particle.speed * 10
                );
                const opacity =
                    0.14 + Math.min(particle.radius / maxRadius, 0.8) * 0.62;

                context.globalAlpha = opacity * 0.55;
                context.strokeStyle = particle.color;
                context.lineWidth = Math.max(0.45, particle.size * 0.55);
                context.beginPath();
                context.moveTo(
                    centerX + cosine * trailRadius,
                    centerY + sine * trailRadius
                );
                context.lineTo(x, y);
                context.stroke();

                context.globalAlpha = opacity;
                context.fillStyle = particle.color;
                context.beginPath();
                context.arc(x, y, particle.size, 0, Math.PI * 2);
                context.fill();

                if (Math.sin(frame * 0.06 + particle.sparkleOffset) > 0.90) {
                    const sparkleSize = particle.size * 2.5;
                    context.globalAlpha = opacity * 0.65;
                    context.lineWidth = 0.65;
                    context.beginPath();
                    context.moveTo(x - sparkleSize, y);
                    context.lineTo(x + sparkleSize, y);
                    context.moveTo(x, y - sparkleSize);
                    context.lineTo(x, y + sparkleSize);
                    context.stroke();
                }
            });

            context.globalAlpha = 1;
            frame += delta;
        }

        function animate(time) {
            const delta = previousTime
                ? Math.min((time - previousTime) / 16.67, 2)
                : 1;
            previousTime = time;
            drawFrame(delta);
            frameId = window.requestAnimationFrame(animate);
        }

        function stopAnimation() {
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
                frameId = null;
            }
            previousTime = 0;
        }

        function startAnimation() {
            if (
                motionPreference.matches ||
                !isVisible ||
                document.hidden ||
                frameId !== null
            ) {
                return;
            }
            frameId = window.requestAnimationFrame(animate);
        }

        function handleMotionChange() {
            stopAnimation();
            drawFrame(0);
            startAnimation();
        }

        function handleVisibilityChange() {
            if (document.hidden) {
                stopAnimation();
            } else {
                startAnimation();
            }
        }

        const resizeObserver =
            typeof ResizeObserver === "undefined"
                ? null
                : new ResizeObserver(resizeCanvas);
        if (resizeObserver) {
            resizeObserver.observe(canvas);
        } else {
            window.addEventListener("resize", resizeCanvas);
        }

        const intersectionObserver =
            typeof IntersectionObserver === "undefined"
                ? null
                : new IntersectionObserver(([entry]) => {
                      isVisible = entry.isIntersecting;
                      if (isVisible) {
                          startAnimation();
                      } else {
                          stopAnimation();
                      }
                  });
        if (intersectionObserver) {
            intersectionObserver.observe(canvas);
        } else {
            isVisible = true;
        }

        motionPreference.addEventListener("change", handleMotionChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        resizeCanvas();
        startAnimation();

        return () => {
            stopAnimation();
            resizeObserver?.disconnect();
            intersectionObserver?.disconnect();
            window.removeEventListener("resize", resizeCanvas);
            motionPreference.removeEventListener("change", handleMotionChange);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, []);

    return (
        <div className="glitter-wrap" aria-hidden="true">
            <canvas ref={canvasRef} />
        </div>
    );
}

export default GlitterWrap;
