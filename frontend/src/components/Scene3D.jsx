import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls, Text } from '@react-three/drei';

// Tool-shaped 3D geometry: a wrench-like torus knot
function ServiceOrb({ position, color, size = 1, speed = 1, delay = 0 }) {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + delay;
    meshRef.current.rotation.x = Math.sin(t * 0.4) * 0.3;
    meshRef.current.rotation.y += 0.008 * speed;
    meshRef.current.position.y = Math.sin(t * 0.6) * 0.3;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      scale={hovered ? size * 1.15 : size}
    >
      <torusKnotGeometry args={[1.0, 0.35, 128, 16]} />
      <meshPhysicalMaterial
        color={hovered ? '#5b8bff' : color}
        roughness={0.1}
        metalness={0.7}
        clearcoat={1}
        clearcoatRoughness={0.05}
        transmission={0.1}
        thickness={0.5}
      />
    </mesh>
  );
}

// A floating ring/gear
function ServiceRing({ position, color, size = 1, speed = 1 }) {
  const meshRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    meshRef.current.rotation.z += 0.005 * speed;
    meshRef.current.rotation.x = Math.sin(t * 0.4) * 0.2;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.7) * 0.25;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[1.2, 0.3, 16, 32]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.05}
        metalness={0.9}
        clearcoat={1}
        transmission={0.15}
      />
    </mesh>
  );
}

// Central main object - an icosahedron with glow
function MainOrb() {
  const meshRef = useRef();
  const outerRef = useRef();
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x += 0.003;
    meshRef.current.rotation.y += 0.006;
    outerRef.current.rotation.x -= 0.002;
    outerRef.current.rotation.y -= 0.004;
    meshRef.current.position.y = Math.sin(t * 0.5) * 0.2;
    outerRef.current.position.y = Math.sin(t * 0.5) * 0.2;
  });

  return (
    <>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        scale={hovered ? 1.08 : 1}
      >
        <icosahedronGeometry args={[1.8, 1]} />
        <meshPhysicalMaterial
          color={hovered ? '#3b6cf4' : '#4a7af7'}
          roughness={0.05}
          metalness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.02}
          transmission={0.3}
          thickness={2}
          ior={1.5}
        />
      </mesh>
      {/* Wireframe shell */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[2.2, 1]} />
        <meshBasicMaterial color="#3b6cf4" wireframe transparent opacity={0.1} />
      </mesh>
    </>
  );
}

// Small orbiting spheres representing service types
function OrbitSphere({ angle, radius, color }) {
  const meshRef = useRef();
  const startAngle = useRef(angle);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.4;
    meshRef.current.position.x = Math.cos(startAngle.current + t) * radius;
    meshRef.current.position.z = Math.sin(startAngle.current + t) * radius;
    meshRef.current.position.y = Math.sin(t * 1.5 + startAngle.current) * 0.5;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.22, 16, 16]} />
      <meshPhysicalMaterial color={color} roughness={0.1} metalness={0.8} clearcoat={1} />
    </mesh>
  );
}

const Scene3D = () => {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-auto"
      style={{ height: '100%', width: '100%', opacity: 0.85 }}
    >
      <Canvas camera={{ position: [0, 0, 9], fov: 42 }}>
        {/* Lighting for light-theme: bright, blue-tinted */}
        <ambientLight intensity={1.2} color="#e8f0ff" />
        <spotLight position={[8, 10, 8]} angle={0.25} penumbra={1} intensity={3} color="#ffffff" castShadow />
        <pointLight position={[-6, -4, -6]} intensity={2} color="#7c3aed" />
        <pointLight position={[6, 6, 4]} intensity={1.5} color="#3b6cf4" />
        <pointLight position={[0, -6, 0]} intensity={0.8} color="#06b6d4" />

        <PresentationControls
          global
          config={{ mass: 2, tension: 400 }}
          snap={{ mass: 4, tension: 1200 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 1.8, Math.PI / 2]}
        >
          {/* Central main orb */}
          <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1}>
            <MainOrb />
          </Float>

          {/* Orbiting spheres - service type colors */}
          <OrbitSphere angle={0} radius={3.2} color="#3b6cf4" />
          <OrbitSphere angle={Math.PI / 3} radius={3.4} color="#7c3aed" />
          <OrbitSphere angle={(2 * Math.PI) / 3} radius={3.0} color="#06b6d4" />
          <OrbitSphere angle={Math.PI} radius={3.3} color="#10b981" />
          <OrbitSphere angle={(4 * Math.PI) / 3} radius={3.1} color="#f59e0b" />
          <OrbitSphere angle={(5 * Math.PI) / 3} radius={3.5} color="#ef4444" />

          {/* Surrounding service orbs */}
          <Float speed={2} floatIntensity={1.5} rotationIntensity={1}>
            <ServiceOrb position={[-4.5, 1.5, -1]} color="#7c3aed" size={0.5} speed={0.8} delay={0} />
          </Float>
          <Float speed={1.5} floatIntensity={1.2} rotationIntensity={0.8}>
            <ServiceOrb position={[4.5, -1, -1]} color="#06b6d4" size={0.45} speed={1.1} delay={1} />
          </Float>
          <Float speed={1.8} floatIntensity={1.8} rotationIntensity={1.2}>
            <ServiceRing position={[-3.5, -2, 0.5]} color="#3b6cf4" size={0.6} speed={0.7} />
          </Float>
          <Float speed={2.2} floatIntensity={1.4} rotationIntensity={0.9}>
            <ServiceRing position={[3.8, 2, -0.5]} color="#10b981" size={0.55} speed={1.2} />
          </Float>
        </PresentationControls>

        {/* Environment for reflections */}
        <Environment preset="warehouse" />

        {/* Ground shadow - very subtle */}
        <ContactShadows position={[0, -4, 0]} opacity={0.08} scale={25} blur={3} far={6} color="#3b6cf4" />
      </Canvas>
    </div>
  );
};

export default Scene3D;
