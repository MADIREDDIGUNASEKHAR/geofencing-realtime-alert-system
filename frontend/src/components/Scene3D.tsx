import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import type * as THREE from 'three'

const NODE_COLORS = ['#6366f1', '#4f46e5', '#3b82f6', '#8b5cf6']

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

interface NodeSpec {
  position: [number, number, number]
  scale: number
  color: string
  geometry: 'icosahedron' | 'octahedron'
  speed: number
  floatIntensity: number
  rotationIntensity: number
}

function useNodeField(count: number): NodeSpec[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        position: [(Math.random() - 0.5) * 17, (Math.random() - 0.5) * 10, -Math.random() * 6 - 1.5] as [
          number,
          number,
          number,
        ],
        scale: 0.35 + Math.random() * 0.55,
        color: NODE_COLORS[i % NODE_COLORS.length],
        geometry: Math.random() > 0.5 ? 'icosahedron' : ('octahedron' as const),
        speed: 0.6 + Math.random() * 0.8,
        floatIntensity: 0.7 + Math.random() * 0.9,
        rotationIntensity: 0.3 + Math.random() * 0.6,
      })),
    [count],
  )
}

/** A single abstract "geofence node" — a wireframe polyhedron standing in
 * for a map boundary/marker, drifting in place via drei's Float. */
function GeofenceNode({ spec }: { spec: NodeSpec }) {
  return (
    <Float speed={spec.speed} floatIntensity={spec.floatIntensity} rotationIntensity={spec.rotationIntensity}>
      <mesh position={spec.position} scale={spec.scale}>
        {spec.geometry === 'icosahedron' ? <icosahedronGeometry args={[1, 0]} /> : <octahedronGeometry args={[1, 0]} />}
        <meshBasicMaterial color={spec.color} wireframe transparent opacity={0.32} />
      </mesh>
    </Float>
  )
}

/** Nudges the whole scene a few degrees toward the cursor, eased, so the
 * background reads as a real 3D space rather than a flat animated texture. */
function ParallaxGroup({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    const targetY = state.pointer.x * 0.22
    const targetX = -state.pointer.y * 0.12
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.03
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.03
  })
  return <group ref={group}>{children}</group>
}

/** Ambient WebGL background: a handful of translucent wireframe polyhedra
 * plus a sparse particle field, both drifting and gently parallaxing with
 * the cursor. Sits behind every page (mounted once in App) as a cheap,
 * low-opacity layer — it should read as texture/depth, never compete with
 * foreground content for attention. Opts out under prefers-reduced-motion. */
export default function Scene3D() {
  const reducedMotion = usePrefersReducedMotion()
  const nodes = useNodeField(9)

  if (reducedMotion) return null

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 9], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <ParallaxGroup>
          {nodes.map((spec, i) => (
            <GeofenceNode key={i} spec={spec} />
          ))}
          <Sparkles count={70} scale={[17, 10, 6]} size={2.2} speed={0.25} color="#818cf8" opacity={0.4} />
        </ParallaxGroup>
      </Canvas>
    </div>
  )
}
