import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  Environment,
  Html,
  useGLTF,
  useProgress,
  useTexture,
} from "@react-three/drei";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { MotionValue } from "framer-motion";
import type { LegacyProductShape } from "@/lib/data-adapter";

type RotationState = { x: number; y: number };

type ProductHeroStageProps = {
  products: LegacyProductShape[];
  activeIndex: number;
  progress: MotionValue<number>;
  rotation: RefObject<RotationState>;
  stepPhysics: (delta: number) => void;
};

function proxiedTextureUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:"
      ? `/api/public/image-proxy?url=${encodeURIComponent(url.toString())}`
      : value;
  } catch {
    return value;
  }
}

function ProductImage({ url }: { url: string }) {
  const texture = useTexture(proxiedTextureUrl(url));
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);
  const image = texture.image as { width?: number; height?: number } | undefined;
  const ratio = image?.width && image?.height ? image.width / image.height : 1;
  return (
    <mesh>
      <planeGeometry args={[Math.min(2.8, 2.4 * ratio), Math.min(2.8, 2.4 / ratio)]} />
      <meshStandardMaterial map={texture} transparent alphaTest={0.025} roughness={0.62} />
    </mesh>
  );
}

function ProductModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => cloneSkeleton(scene), [scene]);
  useEffect(() => {
    clone.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
    });
  }, [clone]);
  return <primitive object={clone} />;
}

class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ProductObject({ product }: { product: LegacyProductShape }) {
  return (
    <Center top>
      <group scale={product.modelUrl ? 1.25 : 1}>
        {product.modelUrl ? (
          <ModelErrorBoundary fallback={<ProductImage url={product.image} />}>
            <ProductModel url={product.modelUrl} />
          </ModelErrorBoundary>
        ) : (
          <ProductImage url={product.image} />
        )}
      </group>
    </Center>
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="w-40 text-center text-[10px] font-bold tracking-[0.22em] text-white/70">
        <div className="mb-2 h-px overflow-hidden bg-white/15">
          <div
            className="h-full bg-cyan-300 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        LOADING {Math.round(progress)}%
      </div>
    </Html>
  );
}

function ProductLayer({
  product,
  index,
  activeIndex,
}: {
  product: LegacyProductShape;
  index: number;
  activeIndex: number;
}) {
  const layer = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!layer.current) return;
    const active = index === activeIndex;
    const direction = index < activeIndex ? -1 : 1;
    const targetScale = active ? 1 : 0.001;
    layer.current.scale.setScalar(
      THREE.MathUtils.damp(layer.current.scale.x, targetScale, 10, delta),
    );
    layer.current.position.x = THREE.MathUtils.damp(
      layer.current.position.x,
      active ? 0 : direction * 2.6,
      9,
      delta,
    );
    layer.current.rotation.y = THREE.MathUtils.damp(
      layer.current.rotation.y,
      active ? 0 : direction * Math.PI * 0.42,
      9,
      delta,
    );
    layer.current.visible = active || layer.current.scale.x > 0.018;
  });
  return (
    <group ref={layer} scale={index === activeIndex ? 1 : 0.001}>
      <ProductObject product={product} />
    </group>
  );
}

function Scene({ products, activeIndex, progress, rotation, stepPhysics }: ProductHeroStageProps) {
  const rig = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const { camera } = useThree();
  useFrame((state, delta) => {
    if (!rig.current) return;
    stepPhysics(delta);
    const scroll = progress.get();
    const segment = products.length > 1 ? scroll * (products.length - 1) : 0;
    const local = segment - Math.floor(segment);
    const transition = Math.sin(local * Math.PI);

    rig.current.rotation.x = THREE.MathUtils.damp(
      rig.current.rotation.x,
      rotation.current.x + transition * 0.1,
      8,
      delta,
    );
    rig.current.rotation.y = THREE.MathUtils.damp(
      rig.current.rotation.y,
      rotation.current.y + scroll * Math.PI * 1.4,
      8,
      delta,
    );
    rig.current.position.y = THREE.MathUtils.damp(
      rig.current.position.y,
      Math.sin(state.clock.elapsedTime * 0.85) * 0.08 - transition * 0.14,
      5,
      delta,
    );
    const scale = 1 - transition * 0.13;
    rig.current.scale.setScalar(THREE.MathUtils.damp(rig.current.scale.x, scale, 8, delta));

    camera.position.x = THREE.MathUtils.damp(camera.position.x, (scroll - 0.5) * 0.85, 5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.35 + scroll * 0.45, 5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 5.2 - scroll * 0.55, 5, delta);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, 38 + transition * 7, 6, delta);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0, 0.15, 0);

    if (light.current) {
      const cool = new THREE.Color("#67e8f9");
      const warm = new THREE.Color("#fb923c");
      light.current.color.lerpColors(cool, warm, scroll);
    }
  });

  if (!products.length) return null;

  return (
    <>
      <ambientLight intensity={0.72} />
      <directionalLight castShadow position={[3, 5, 3]} intensity={3.2} color="#fff7ed" />
      <pointLight ref={light} position={[-3, 1.5, 2]} intensity={18} color="#67e8f9" />
      <pointLight position={[3, -0.5, -2]} intensity={11} color="#a855f7" />
      <Suspense fallback={<Loader />}>
        <group ref={rig}>
          {products.map((product, index) => (
            <ProductLayer
              key={product.id}
              product={product}
              index={index}
              activeIndex={activeIndex}
            />
          ))}
        </group>
        <Environment preset="city" environmentIntensity={0.35} />
      </Suspense>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
        <circleGeometry args={[2.2, 64]} />
        <meshPhysicalMaterial
          color="#08111d"
          metalness={0.82}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.16}
        />
      </mesh>
      <ContactShadows position={[0, -1.31, 0]} scale={5.5} opacity={0.48} blur={2.6} far={3} />
    </>
  );
}

export function ProductHeroStage(props: ProductHeroStageProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.4, 5.2], fov: 38, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      performance={{ min: 0.55 }}
      style={{ background: "transparent", touchAction: "pan-y" }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
