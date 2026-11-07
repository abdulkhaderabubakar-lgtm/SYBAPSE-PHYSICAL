import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PerceptionTrackedObject, FreeSpaceMetrics } from '../types/perception';
import {
  Box,
  Compass,
  Layers,
  RotateCw,
  Eye,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface SpatialOccupancyViewProps {
  trackedObjects: PerceptionTrackedObject[];
  freeSpace: FreeSpaceMetrics;
  robotSpeed: number;
}

export const SpatialOccupancyView: React.FC<SpatialOccupancyViewProps> = ({
  trackedObjects,
  freeSpace,
  robotSpeed,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'perspective' | 'bev'>('perspective');
  const [showCostmap, setShowCostmap] = useState<boolean>(true);
  const [showPointcloud, setShowPointcloud] = useState<boolean>(true);
  const [showFrustum, setShowFrustum] = useState<boolean>(true);
  const [gridResolution, setGridResolution] = useState<number>(0.1); // 10cm cells

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const obstacleGroupRef = useRef<THREE.Group | null>(null);
  const pointsGroupRef = useRef<THREE.Points | null>(null);
  const frustumGroupRef = useRef<THREE.LineSegments | null>(null);
  const costmapMeshRef = useRef<THREE.Mesh | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // slate-950
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 10, 14);
    camera.lookAt(0, 0, 4);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 5. Grid Helper (Ground floor)
    const gridHelper = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 6. Robot Footprint Model
    const robotGroup = new THREE.Group();
    robotGroup.name = 'robot';

    // Robot base body (metallic AMR chassis)
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.4, 1.6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.8,
      roughness: 0.2,
    });
    const robotBody = new THREE.Mesh(bodyGeo, bodyMat);
    robotBody.position.y = 0.25;
    robotGroup.add(robotBody);

    // Sensor mast
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 0.6, 0.4);
    robotGroup.add(mast);

    // LiDAR puck atop mast
    const lidarGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 24);
    const lidarMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.4,
    });
    const lidarPuck = new THREE.Mesh(lidarGeo, lidarMat);
    lidarPuck.position.set(0, 0.9, 0.4);
    robotGroup.add(lidarPuck);

    // Safety exclusion halo circle around robot
    const haloGeo = new THREE.RingGeometry(1.6, 1.7, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.02;
    robotGroup.add(halo);

    scene.add(robotGroup);

    // 7. Sensor Frustum Wireframe (90° FOV Camera projection cone)
    const frustumVertices = new Float32Array([
      // from camera origin
      0, 0.9, 0.4,   -7, 0, 14,
      0, 0.9, 0.4,    7, 0, 14,
      0, 0.9, 0.4,   -7, 6, 14,
      0, 0.9, 0.4,    7, 6, 14,
      // far plane box
      -7, 0, 14,   7, 0, 14,
       7, 0, 14,   7, 6, 14,
       7, 6, 14,  -7, 6, 14,
      -7, 6, 14,  -7, 0, 14,
    ]);
    const frustumGeo = new THREE.BufferGeometry();
    frustumGeo.setAttribute('position', new THREE.BufferAttribute(frustumVertices, 3));
    const frustumMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
    });
    const frustumMesh = new THREE.LineSegments(frustumGeo, frustumMat);
    scene.add(frustumMesh);
    frustumGroupRef.current = frustumMesh;

    // 8. Dynamic Obstacles Group
    const obstacleGroup = new THREE.Group();
    scene.add(obstacleGroup);
    obstacleGroupRef.current = obstacleGroup;

    // 9. Costmap Mesh (plane on ground with dynamic texture)
    const costmapCanvas = document.createElement('canvas');
    costmapCanvas.width = 128;
    costmapCanvas.height = 128;
    const costmapTex = new THREE.CanvasTexture(costmapCanvas);
    const costmapGeo = new THREE.PlaneGeometry(24, 24);
    const costmapMat = new THREE.MeshBasicMaterial({
      map: costmapTex,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const costmapMesh = new THREE.Mesh(costmapGeo, costmapMat);
    costmapMesh.rotation.x = -Math.PI / 2;
    costmapMesh.position.set(0, 0.01, 7);
    scene.add(costmapMesh);
    costmapMeshRef.current = costmapMesh;

    // 10. Simulated LiDAR Point Cloud (720 points across ground/obstacles)
    const pCount = 720;
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      const angle = -Math.PI * 0.75 + (i / pCount) * (Math.PI * 1.5);
      const dist = 3 + Math.random() * 12;
      pPositions[i * 3] = Math.sin(angle) * dist;
      pPositions[i * 3 + 1] = 0.05 + Math.random() * 0.8;
      pPositions[i * 3 + 2] = Math.cos(angle) * dist;

      // Color from green (far) to cyan to red (close)
      const ratio = Math.min(1, dist / 12);
      pColors[i * 3] = 1 - ratio; // red
      pColors[i * 3 + 1] = ratio; // green
      pColors[i * 3 + 2] = 0.8;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const pointsMesh = new THREE.Points(pGeo, pMat);
    scene.add(pointsMesh);
    pointsGroupRef.current = pointsMesh;

    // Drag-to-rotate interaction handlers
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let azimuth = 0;
    let elevation = 0.6;
    let distance = 16;

    const updateCameraFromSpherical = () => {
      const x = distance * Math.sin(azimuth) * Math.cos(elevation);
      const y = distance * Math.sin(elevation);
      const z = distance * Math.cos(azimuth) * Math.cos(elevation);
      camera.position.set(x, Math.max(1, y), z + 4);
      camera.lookAt(0, 0.5, 4);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      azimuth -= deltaX * 0.008;
      elevation = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, elevation + deltaY * 0.008));
      updateCameraFromSpherical();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance = Math.max(6, Math.min(30, distance + e.deltaY * 0.02));
      updateCameraFromSpherical();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animId: number;
    let clock = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.02;

      // Pulse LiDAR puck
      if (lidarPuck) {
        lidarPuck.rotation.y += 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, []);

  // Update dynamic obstacle 3D meshes when trackedObjects changes
  useEffect(() => {
    const group = obstacleGroupRef.current;
    if (!group) return;

    // Clear old meshes
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    trackedObjects.forEach((obj) => {
      const obsGroup = new THREE.Group();

      // 3D Bounding Box Geometry
      const geo = new THREE.BoxGeometry(
        Math.max(0.5, obj.dimensions3d.width),
        Math.max(0.5, obj.dimensions3d.height),
        Math.max(0.5, obj.dimensions3d.length)
      );

      const color =
        obj.collisionRisk === 'critical'
          ? 0xef4444
          : obj.collisionRisk === 'caution'
          ? 0xf59e0b
          : 0x38bdf8;

      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.65,
        wireframe: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        obj.position3d.x,
        obj.dimensions3d.height / 2,
        obj.position3d.z
      );
      obsGroup.add(mesh);

      // Wireframe outline
      const wireGeo = new THREE.WireframeGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      wire.position.copy(mesh.position);
      obsGroup.add(wire);

      // Velocity Vector Arrow in 3D
      if (obj.velocity.speedMs > 0.05) {
        const dir = new THREE.Vector3(obj.velocity.vx, 0, obj.velocity.vz).normalize();
        const arrow = new THREE.ArrowHelper(
          dir,
          mesh.position,
          obj.velocity.speedMs * 1.5,
          color,
          0.4,
          0.25
        );
        obsGroup.add(arrow);
      }

      // Costmap Inflation Danger Ring on ground
      const ringGeo = new THREE.RingGeometry(1.2, 1.35, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(obj.position3d.x, 0.02, obj.position3d.z);
      obsGroup.add(ring);

      group.add(obsGroup);
    });
  }, [trackedObjects]);

  // Toggle View Modes (Perspective 3D vs Top-Down BEV)
  const handleToggleViewMode = (mode: 'perspective' | 'bev') => {
    setViewMode(mode);
    const camera = cameraRef.current;
    if (!camera) return;

    if (mode === 'bev') {
      // Top-down directly above robot looking down
      camera.position.set(0, 22, 5);
      camera.lookAt(0, 0, 5);
    } else {
      camera.position.set(0, 10, 14);
      camera.lookAt(0, 0, 4);
    }
  };

  return (
    <div className="space-y-6">
      {/* Viewport Control Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Camera Angle:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
            <button
              onClick={() => handleToggleViewMode('perspective')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'perspective'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Perspective 3D
            </button>
            <button
              onClick={() => handleToggleViewMode('bev')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'bev'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bird's-Eye View (BEV)
            </button>
          </div>
        </div>

        {/* Feature Visibility Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              setShowCostmap(!showCostmap);
              if (costmapMeshRef.current) costmapMeshRef.current.visible = !showCostmap;
            }}
            className={`px-2.5 py-1 rounded border transition-colors ${
              showCostmap
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'text-slate-500 border-slate-800'
            }`}
          >
            Costmap Layer
          </button>
          <button
            onClick={() => {
              setShowPointcloud(!showPointcloud);
              if (pointsGroupRef.current) pointsGroupRef.current.visible = !showPointcloud;
            }}
            className={`px-2.5 py-1 rounded border transition-colors ${
              showPointcloud
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                : 'text-slate-500 border-slate-800'
            }`}
          >
            LiDAR Points
          </button>
          <button
            onClick={() => {
              setShowFrustum(!showFrustum);
              if (frustumGroupRef.current) frustumGroupRef.current.visible = !showFrustum;
            }}
            className={`px-2.5 py-1 rounded border transition-colors ${
              showFrustum
                ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                : 'text-slate-500 border-slate-800'
            }`}
          >
            Camera 90° Frustum
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
          <span>Grid: <strong className="text-white">10cm / cell</strong></span>
          <span>·</span>
          <span>FOV: <strong className="text-cyan-400">90° Horiz / 60° Vert</strong></span>
        </div>
      </div>

      {/* Main 3D Canvas Area and Telemetry Sidecard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Three.js WebGL Container */}
        <div className="lg:col-span-3 relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-2xl h-[540px]">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Interactive Hint Floating Pill */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded text-[11px] text-slate-400 font-mono flex items-center gap-2 pointer-events-none">
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click & Drag to Orbit · Scroll to Zoom</span>
          </div>

          {/* Bottom HUD Legend */}
          <div className="absolute bottom-3 inset-x-3 bg-slate-900/90 backdrop-blur border border-slate-800 px-4 py-2 rounded flex items-center justify-between text-xs text-slate-400 pointer-events-none">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-cyan-600" />
                <span className="text-slate-200">Robot AMR Chassis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>Safety Halo (1.6m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Dynamic Obstacle</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-sky-400" />
                <span>90° Perception Frustum</span>
              </div>
            </div>
            <div className="text-slate-500 font-mono">
              Render Engine: Three.js WebGL
            </div>
          </div>
        </div>

        {/* Spatial Occupancy Metrics Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-cyan-400" />
                <span>Spatial Free Space Metrics</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">
                  Corridor Bottleneck Clearance
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-cyan-400">
                    {freeSpace.minClearanceWidthM.toFixed(2)} m
                  </span>
                  <span className="text-slate-400 font-mono">
                    Req: &ge; 1.50 m
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Compliant with ISO 3691-4 industrial dynamic vehicle clearance margins.
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">
                  Traversable Ground Surface
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {(freeSpace.traversableAreaRatio * 100).toFixed(1)}%
                  </span>
                  <span className="text-slate-400 font-mono">
                    Density: {freeSpace.localCostmapDensity} / m²
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${freeSpace.traversableAreaRatio * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-400 text-[10px] uppercase font-sans">
                  Ground Plane Estimation (RANSAC)
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Surface Normal:</span>
                  <span className="text-slate-300">[0.00, 1.00, 0.01]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plane Pitch / Tilt:</span>
                  <span className="text-slate-300">
                    {freeSpace.groundPlaneSlopeDeg.toFixed(2)}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confidence:</span>
                  <span className="text-emerald-400 font-semibold">98.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Voxel Resolution:</span>
                  <span className="text-cyan-400">10 cm³</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
            <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">
              Local Costmap Inflation
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Obstacles detected by the RGB-D camera and LiDAR are expanded by an inflation radius
              of 0.65m. Cost values decay exponentially to guarantee the robot maintains a safe separation distance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
