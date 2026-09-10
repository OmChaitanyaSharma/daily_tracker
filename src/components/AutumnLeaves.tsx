import React, { useEffect, useState } from 'react';

export function AutumnLeaves() {
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    const createLeaf = () => ({
      id: Math.random(),
      left: `${Math.random() * 100}vw`,
      animationDuration: `${Math.random() * 4 + 6}s`,
      animationDelay: `-${Math.random() * 5}s`,
      spinDuration: `${Math.random() * 2 + 2}s`,
      opacity: Math.random() * 0.6 + 0.4,
      size: `${Math.random() * 10 + 10}px`,
      color: Math.random() > 0.5 ? 'var(--accent-yellow)' : 'var(--accent-red)',
    });
    
    setLeaves(Array.from({ length: 30 }, createLeaf));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          className="absolute top-[-10%]"
          style={{
            left: leaf.left,
            animation: `fall-leaf ${leaf.animationDuration} linear infinite`,
            animationDelay: leaf.animationDelay,
          }}
        >
          <div 
             className="rounded-tr-[50%] rounded-bl-[50%]"
             style={{
               width: leaf.size,
               height: leaf.size,
               backgroundColor: leaf.color,
               opacity: leaf.opacity,
               animation: `spin-leaf ${leaf.spinDuration} linear infinite alternate`
             }}
          />
        </div>
      ))}
      <style>{`
        @keyframes fall-leaf {
          0% { transform: translateY(-10vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(-15vw); opacity: 0; }
        }
        @keyframes spin-leaf {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
