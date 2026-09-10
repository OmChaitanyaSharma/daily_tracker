import { useEffect, useState } from 'react';

export function SakuraFall() {
  const [petals, setPetals] = useState<any[]>([]);

  useEffect(() => {
    const createPetal = () => ({
      id: Math.random(),
      left: `${Math.random() * 100}vw`,
      animationDuration: `${Math.random() * 5 + 5}s`,
      animationDelay: `-${Math.random() * 5}s`,
      opacity: Math.random() * 0.5 + 0.3,
      size: `${Math.random() * 8 + 6}px`,
      rotation: Math.random() * 360,
    });
    
    setPetals(Array.from({ length: 40 }, createPetal));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {petals.map(petal => (
        <div
          key={petal.id}
          className="absolute top-[-10%] rounded-full bg-accent-red blur-[1px]"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size,
            opacity: petal.opacity,
            animation: `fall-sakura ${petal.animationDuration} linear infinite`,
            animationDelay: petal.animationDelay,
            transform: `rotate(${petal.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall-sakura {
          0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(20vw) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
