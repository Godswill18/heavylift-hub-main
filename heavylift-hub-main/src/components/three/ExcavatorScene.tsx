import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRef, Suspense } from 'react';
import * as THREE from 'three';

// Stylized excavator model using basic geometries
const Excavator = () => {
  const groupRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
    if (armRef.current) {
      armRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1 - 0.2;
    }
  });

  const orangeMaterial = new THREE.MeshStandardMaterial({ 
    color: '#F97316', 
    metalness: 0.3, 
    roughness: 0.4 
  });
  
  const darkMaterial = new THREE.MeshStandardMaterial({ 
    color: '#1e293b', 
    metalness: 0.5, 
    roughness: 0.3 
  });
  
  const grayMaterial = new THREE.MeshStandardMaterial({ 
    color: '#64748b', 
    metalness: 0.6, 
    roughness: 0.2 
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Tracks */}
      <mesh position={[-0.8, 0.3, 0]} material={darkMaterial}>
        <boxGeometry args={[0.6, 0.5, 2.5]} />
      </mesh>
      <mesh position={[0.8, 0.3, 0]} material={darkMaterial}>
        <boxGeometry args={[0.6, 0.5, 2.5]} />
      </mesh>
      
      {/* Track wheels */}
      {[-1, 0, 1].map((z, i) => (
        <group key={i}>
          <mesh position={[-0.8, 0.3, z * 0.9]} rotation={[0, 0, Math.PI / 2]} material={grayMaterial}>
            <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
          </mesh>
          <mesh position={[0.8, 0.3, z * 0.9]} rotation={[0, 0, Math.PI / 2]} material={grayMaterial}>
            <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
          </mesh>
        </group>
      ))}

      {/* Main body */}
      <mesh position={[0, 1, 0]} material={orangeMaterial}>
        <boxGeometry args={[1.8, 0.8, 1.8]} />
      </mesh>
      
      {/* Engine compartment */}
      <mesh position={[0, 1, -0.6]} material={orangeMaterial}>
        <boxGeometry args={[1.6, 1, 0.8]} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 1.7, 0.2]} material={orangeMaterial}>
        <boxGeometry args={[1.4, 1, 1]} />
      </mesh>
      
      {/* Cabin window */}
      <mesh position={[0, 1.8, 0.71]}>
        <boxGeometry args={[1, 0.6, 0.02]} />
        <meshStandardMaterial color="#87ceeb" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Arm assembly */}
      <group ref={armRef} position={[0, 1.2, 0.9]}>
        {/* Main boom */}
        <mesh position={[0, 0.3, 0.8]} rotation={[0.3, 0, 0]} material={orangeMaterial}>
          <boxGeometry args={[0.4, 0.3, 2]} />
        </mesh>
        
        {/* Arm */}
        <mesh position={[0, 0.2, 2]} rotation={[-0.2, 0, 0]} material={orangeMaterial}>
          <boxGeometry args={[0.35, 0.25, 1.5]} />
        </mesh>
        
        {/* Bucket */}
        <group position={[0, -0.1, 2.8]}>
          <mesh material={grayMaterial}>
            <boxGeometry args={[0.8, 0.4, 0.5]} />
          </mesh>
          {/* Teeth */}
          {[-0.25, 0, 0.25].map((x, i) => (
            <mesh key={i} position={[x, -0.25, 0.25]} material={grayMaterial}>
              <boxGeometry args={[0.1, 0.15, 0.08]} />
            </mesh>
          ))}
        </group>
        
        {/* Hydraulic cylinders */}
        <mesh position={[0.25, 0.5, 0.4]} rotation={[0.5, 0, 0]} material={grayMaterial}>
          <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        </mesh>
        <mesh position={[-0.25, 0.5, 0.4]} rotation={[0.5, 0, 0]} material={grayMaterial}>
          <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        </mesh>
      </group>

      {/* Counterweight */}
      <mesh position={[0, 1, -1.2]} material={darkMaterial}>
        <boxGeometry args={[1.6, 0.6, 0.4]} />
      </mesh>
    </group>
  );
};

// Ground plane
const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#e2e8f0" />
    </mesh>
  );
};

// Loading fallback
const LoadingFallback = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#F97316" />
    </mesh>
  );
};

interface ExcavatorSceneProps {
  className?: string;
}

const ExcavatorScene = ({ className }: ExcavatorSceneProps) => {
  return (
    <div className={className}>
      <Canvas shadows className="three-canvas">
        <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={50} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        
        <Suspense fallback={<LoadingFallback />}>
          <Excavator />
          <Ground />
        </Suspense>
        
        {/* Soft fill lighting instead of HDR environment */}
        <hemisphereLight args={['#87ceeb', '#f0e68c', 0.5]} />
      </Canvas>
    </div>
  );
};

export default ExcavatorScene;