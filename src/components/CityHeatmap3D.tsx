import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Instances, Instance, Environment } from '@react-three/drei';
import { format, subDays } from 'date-fns';

import * as THREE from 'three';

interface CityHeatmap3DProps {
  logs: any[];
}

export function CityHeatmap3D({ logs }: CityHeatmap3DProps) {
  const days = 30;
  
  const blocks = useMemo(() => {
    const today = new Date();
    const map = new Map<string, number>();
    
    logs.forEach(l => {
       if (l.status === 'completed') {
          map.set(l.date, (map.get(l.date) || 0) + 1);
       }
    });

    const arr = [];
    const gridSize = Math.ceil(Math.sqrt(days));
    
    for (let i = 0; i < days; i++) {
      const d = subDays(today, i);
      const ds = format(d, 'yyyy-MM-dd');
      
      const count = map.get(ds) || 0;
      
      // Calculate position in a grid
      const x = (i % gridSize) - (gridSize / 2);
      const z = Math.floor(i / gridSize) - (gridSize / 2);
      
      // Height based on completed habits (min height for empty)
      const height = count > 0 ? 0.5 + (count * 0.2) : 0.1;
      
      // Color
      const color = new THREE.Color();
      if (count === 0) color.set('#27272a'); // empty/grey
      else if (count <= 2) color.set('#3b82f6'); // blue
      else if (count <= 4) color.set('#10b981'); // green
      else color.set('#e0af68'); // yellow/gold (max)

      arr.push({ x, z, height, color });
    }
    return arr;
  }, [logs]);

  return (
    <div className="w-full h-[400px] rounded-[2rem] overflow-hidden border border-border-strong bg-[#09090b] relative shadow-inner">
      <div className="absolute top-4 left-6 z-10">
        <h3 className="text-xl font-serif font-bold text-text-main">3D City Builder</h3>
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest">Last 30 Days (Interactive)</p>
      </div>
      
      <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        
        <Instances limit={100} castShadow receiveShadow>
          <boxGeometry args={[0.8, 1, 0.8]} />
          <meshStandardMaterial roughness={0.2} metalness={0.1} />
          {blocks.map((b, i) => (
            <Instance 
              key={i} 
              position={[b.x, b.height / 2, b.z]} 
              scale={[1, b.height, 1]} 
              color={b.color} 
            />
          ))}
        </Instances>

        <gridHelper args={[20, 20, '#3f3f46', '#27272a']} position={[0, 0, 0]} />
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2.5} 
          minDistance={5} 
          maxDistance={15} 
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
