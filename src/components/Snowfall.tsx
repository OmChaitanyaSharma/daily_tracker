import { useEffect, useRef } from 'react';

export function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setupCanvas();

    // Original calm, subtle snowfall settings
    const numParticles = 40;
    const flakeChars = ['❄', '❅', '❆'];
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      wind: number;
      opacity: number;
      char: string;
      rotation: number;
      rotSpeed: number;
    }> = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 12 + 6, // 6px to 18px
        speed: Math.random() * 0.4 + 0.1, // gentle, peaceful drift
        wind: (Math.random() - 0.5) * 0.3, // soft horizontal drift
        opacity: Math.random() * 0.3 + 0.1, // subtle 0.1 to 0.4 opacity
        char: flakeChars[Math.floor(Math.random() * flakeChars.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const isDark = document.documentElement.classList.contains('dark');
      // Icy blue (blue-300 in dark mode, blue-400 in light mode)
      const fillStyle = isDark ? '147, 197, 253' : '96, 165, 250';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        ctx.fillStyle = `rgba(${fillStyle}, ${p.opacity})`;
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
        
        ctx.restore();

        p.y += p.speed;
        p.x += p.wind;
        p.rotation += p.rotSpeed;

        if (p.y > height + p.size) {
          p.y = -p.size;
          p.x = Math.random() * width;
        }
        if (p.x > width + p.size) p.x = -p.size;
        if (p.x < -p.size) p.x = width + p.size;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      aria-hidden="true"
    />
  );
}
