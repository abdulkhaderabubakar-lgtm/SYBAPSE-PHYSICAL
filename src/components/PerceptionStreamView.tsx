import React, { useState, useRef, useEffect } from 'react';
import {
  PerceptionScenarioId,
  PerceptionTrackedObject,
  SensorFusionConfig,
  OpticalFlowVector,
  FreeSpaceMetrics,
} from '../types/perception';
import { PERCEPTION_SCENARIOS } from '../data/mockPerceptionData';
import {
  Eye,
  Camera,
  Layers,
  Activity,
  AlertTriangle,
  Compass,
  Zap,
  Maximize2,
  Minimize2,
  Video,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface PerceptionStreamViewProps {
  currentScenarioId: PerceptionScenarioId;
  onSelectScenario: (id: PerceptionScenarioId) => void;
  trackedObjects: PerceptionTrackedObject[];
  freeSpace: FreeSpaceMetrics;
  sensorConfig: SensorFusionConfig;
  onToggleSensorLayer: (layer: keyof SensorFusionConfig) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onRunSceneAiAnalysis: () => void;
  isAiAuditing: boolean;
  robotSpeed: number;
}

export const PerceptionStreamView: React.FC<PerceptionStreamViewProps> = ({
  currentScenarioId,
  onSelectScenario,
  trackedObjects,
  freeSpace,
  sensorConfig,
  onToggleSensorLayer,
  selectedObjectId,
  onSelectObject,
  onRunSceneAiAnalysis,
  isAiAuditing,
  robotSpeed,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [opticalFlowVectors, setOpticalFlowVectors] = useState<OpticalFlowVector[]>([]);
  const [depthSlider, setDepthSlider] = useState<number>(15); // max depth meters

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scenario =
    PERCEPTION_SCENARIOS.find((s) => s.id === currentScenarioId) ||
    PERCEPTION_SCENARIOS[0];

  // Selected object detail
  const selectedObject = trackedObjects.find((o) => o.id === selectedObjectId) || null;

  // Handle Live Webcam toggle
  const handleToggleWebcam = async () => {
    if (isWebcamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
      onSelectScenario('loading_dock');
    } else {
      try {
        setWebcamError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsWebcamActive(true);
        onSelectScenario('live_webcam');
      } catch (err: any) {
        console.warn('Webcam access error:', err);
        setWebcamError('Camera access not granted or not available in this environment. Showing simulated sensor stream.');
        setIsWebcamActive(false);
      }
    }
  };

  // Generate dynamic optical flow vectors to simulate camera motion and dynamic object movement
  useEffect(() => {
    const vectors: OpticalFlowVector[] = [];
    const rows = 8;
    const cols = 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const startX = (c + 0.5) / cols;
        const startY = (r + 0.5) / rows;

        // Radial expansion from central vanishing point simulating forward robot motion
        const cx = 0.5;
        const cy = 0.45;
        const dirX = startX - cx;
        const dirY = startY - cy;
        const dist = Math.sqrt(dirX * dirX + dirY * dirY);

        // Ground plane has higher apparent flow than distant ceiling
        const speedFactor = startY > 0.5 ? robotSpeed * 1.4 : robotSpeed * 0.4;
        let dx = (dirX / (dist + 0.001)) * 0.02 * speedFactor;
        let dy = (dirY / (dist + 0.001)) * 0.025 * speedFactor;

        // Check if point falls within any moving dynamic object
        for (const obj of trackedObjects) {
          if (
            startX >= obj.bbox2d.x &&
            startX <= obj.bbox2d.x + obj.bbox2d.w &&
            startY >= obj.bbox2d.y &&
            startY <= obj.bbox2d.y + obj.bbox2d.h
          ) {
            // Apply object's own velocity vector to optical flow
            dx += (obj.velocity.vx / 10) * 0.04;
            dy += (obj.velocity.vy / 10) * 0.04;
          }
        }

        const mag = Math.sqrt(dx * dx + dy * dy);
        vectors.push({
          startX,
          startY,
          dx,
          dy,
          magnitude: mag,
        });
      }
    }
    setOpticalFlowVectors(vectors);
  }, [robotSpeed, trackedObjects]);

  // Color mapping for classes
  const getClassColor = (cls: string, risk: string) => {
    if (risk === 'critical') return '#ef4444'; // red
    if (risk === 'caution') return '#f59e0b'; // amber
    switch (cls) {
      case 'worker':
        return '#06b6d4'; // cyan
      case 'forklift':
        return '#f97316'; // orange
      case 'amr':
        return '#10b981'; // emerald
      case 'robotic_arm':
        return '#8b5cf6'; // violet
      case 'safety_cone':
        return '#ec4899'; // pink
      default:
        return '#3b82f6'; // blue
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Preset Scenarios, Layer Toggles, Pipeline Latency */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Scenario Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Camera Feed:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
            {PERCEPTION_SCENARIOS.map((scen) => (
              <button
                key={scen.id}
                onClick={() => {
                  if (isWebcamActive) handleToggleWebcam();
                  onSelectScenario(scen.id);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  currentScenarioId === scen.id && !isWebcamActive
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {scen.name.split('&')[0]}
              </button>
            ))}
            <button
              onClick={handleToggleWebcam}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                isWebcamActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>{isWebcamActive ? 'Live Webcam (On)' : 'Live Webcam'}</span>
            </button>
          </div>
        </div>

        {/* Sensor Fusion Layers */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Layers:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-xs">
            <button
              onClick={() => onToggleSensorLayer('boundingBox3dActive')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sensorConfig.boundingBox3dActive
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              3D Bounding
            </button>
            <button
              onClick={() => onToggleSensorLayer('freeSpaceActive')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sensorConfig.freeSpaceActive
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Free Space Mask
            </button>
            <button
              onClick={() => onToggleSensorLayer('trackingActive')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sensorConfig.trackingActive
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              MOT & Vectors
            </button>
            <button
              onClick={() => onToggleSensorLayer('depthActive')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sensorConfig.depthActive
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Depth Map
            </button>
            <button
              onClick={() => onToggleSensorLayer('opticalFlowActive')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sensorConfig.opticalFlowActive
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Optical Flow
            </button>
            <button
              onClick={() => onToggleSensorLayer('lidarActive')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sensorConfig.lidarActive
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              LiDAR Overlay
            </button>
          </div>
        </div>

        {/* Real-time Hardware Telemetry */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">FPS:</span>
            <span className="text-emerald-400 font-semibold tabular-nums">
              {sensorConfig.fps}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Inference:</span>
            <span className="text-cyan-400 font-semibold tabular-nums">
              {sensorConfig.inferenceLatencyMs.toFixed(1)} ms
            </span>
          </div>
          <button
            onClick={onRunSceneAiAnalysis}
            disabled={isAiAuditing}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-sans font-semibold transition-colors disabled:opacity-50"
          >
            {isAiAuditing ? (
              <Activity className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>AI Scene Audit</span>
          </button>
        </div>
      </div>

      {webcamError && (
        <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{webcamError}</span>
        </div>
      )}

      {/* Main Viewport & Overlay Canvas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Camera Viewport (Col span 3) */}
        <div className="lg:col-span-3 space-y-3">
          <div
            ref={containerRef}
            className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 shadow-2xl select-none"
          >
            {/* Base Image or Live Webcam Feed */}
            {isWebcamActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={scenario.image}
                alt={scenario.name}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-filter duration-300 ${
                  sensorConfig.depthActive ? 'brightness-75 contrast-125' : ''
                }`}
              />
            )}

            {/* Depth Map False-Color Shader Overlay (simulated stereo depth) */}
            {sensorConfig.depthActive && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-80"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(20, 0, 80, 0.9) 0%, rgba(0, 150, 220, 0.7) 45%, rgba(20, 220, 100, 0.8) 75%, rgba(240, 240, 40, 0.9) 100%)',
                }}
              />
            )}

            {/* SVG Overlay for Free Space Segmentation, Vector Trails, and 3D Bounding Wireframes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 562.5"
              preserveAspectRatio="none"
            >
              {/* Semantic Free Space Drivable Plane Polygon */}
              {sensorConfig.freeSpaceActive && (
                <g className="transition-opacity duration-300">
                  <polygon
                    points={freeSpace.navigableBoundaryPoints
                      .map((p) => `${p.x * 1000},${p.y * 562.5}`)
                      .join(' ')}
                    fill="rgba(16, 185, 129, 0.22)"
                    stroke="rgba(52, 211, 153, 0.85)"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                  />
                  {/* Free Space Centerline Navigation Path */}
                  <path
                    d="M 500 562.5 Q 500 420 500 320"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                  />

                  {/* Hazard Zone Circles */}
                  {freeSpace.dangerZones.map((zone, idx) => (
                    <circle
                      key={idx}
                      cx={zone.x * 1000}
                      cy={zone.y * 562.5}
                      r={zone.radius * 600}
                      fill="rgba(239, 68, 68, 0.25)"
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              )}

              {/* Optical Flow Sparse Vector Arrows */}
              {sensorConfig.opticalFlowActive && (
                <g className="transition-opacity duration-300">
                  {opticalFlowVectors.map((v, i) => {
                    const x1 = v.startX * 1000;
                    const y1 = v.startY * 562.5;
                    const x2 = x1 + v.dx * 800;
                    const y2 = y1 + v.dy * 800;
                    return (
                      <g key={i}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          opacity="0.8"
                        />
                        <circle cx={x2} cy={y2} r="2" fill="#38bdf8" />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Multi-Object Tracking (MOT) Vector Arrows and Trajectory Trails */}
              {sensorConfig.trackingActive &&
                trackedObjects.map((obj) => {
                  const cx = (obj.bbox2d.x + obj.bbox2d.w / 2) * 1000;
                  const cy = (obj.bbox2d.y + obj.bbox2d.h) * 562.5; // footpoint
                  const endVx = cx + obj.velocity.vx * 70;
                  const endVy = cy + obj.velocity.vz * -40; // forward/back in screen projection

                  return (
                    <g key={`track-${obj.id}`}>
                      {/* Projected footprint ground ellipse */}
                      <ellipse
                        cx={cx}
                        cy={cy}
                        rx={obj.dimensions3d.width * 20}
                        ry={obj.dimensions3d.length * 8}
                        fill="none"
                        stroke={getClassColor(obj.class, obj.collisionRisk)}
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />

                      {/* Velocity Vector */}
                      {obj.velocity.speedMs > 0.05 && (
                        <g>
                          <line
                            x1={cx}
                            y1={cy}
                            x2={endVx}
                            y2={endVy}
                            stroke={getClassColor(obj.class, obj.collisionRisk)}
                            strokeWidth="3"
                          />
                          <circle
                            cx={endVx}
                            cy={endVy}
                            r="4"
                            fill={getClassColor(obj.class, obj.collisionRisk)}
                          />
                        </g>
                      )}

                      {/* Time-To-Collision (TTC) Interception Warning Line */}
                      {obj.timeToCollisionSec && obj.timeToCollisionSec < 3.5 && (
                        <line
                          x1={cx}
                          y1={cy}
                          x2={500}
                          y2={560}
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeDasharray="5 5"
                          opacity="0.9"
                        />
                      )}
                    </g>
                  );
                })}

              {/* 3D Wireframe Bounding Projections */}
              {sensorConfig.boundingBox3dActive &&
                trackedObjects.map((obj) => {
                  const x = obj.bbox2d.x * 1000;
                  const y = obj.bbox2d.y * 562.5;
                  const w = obj.bbox2d.w * 1000;
                  const h = obj.bbox2d.h * 562.5;
                  const color = getClassColor(obj.class, obj.collisionRisk);

                  // 3D Isometric depth projection offset
                  const dx = (w * 0.25) * (x > 500 ? -1 : 1);
                  const dy = -(h * 0.18);

                  return (
                    <g key={`cube-${obj.id}`}>
                      {/* Back face projection lines */}
                      <line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <line x1={x + w} y1={y} x2={x + w + dx} y2={y + dy} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <line x1={x + w} y1={y + h} x2={x + w + dx} y2={y + h + dy} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <line x1={x} y1={y + h} x2={x + dx} y2={y + h + dy} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      {/* Back rectangle */}
                      <rect
                        x={x + dx}
                        y={y + dy}
                        width={w}
                        height={h}
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.4"
                      />
                    </g>
                  );
                })}

              {/* Simulated LiDAR Scan overlay lines */}
              {sensorConfig.lidarActive && (
                <g>
                  {Array.from({ length: 36 }).map((_, i) => {
                    const angle = -Math.PI * 0.8 + (i * (Math.PI * 1.6)) / 36;
                    const len = 320 + Math.sin(i * 1.2) * 80;
                    const lx = 500 + Math.sin(angle) * len;
                    const ly = 560 - Math.cos(angle) * len * 0.6;
                    return (
                      <circle
                        key={i}
                        cx={lx}
                        cy={ly}
                        r="3"
                        fill="#f43f5e"
                        opacity="0.85"
                      />
                    );
                  })}
                </g>
              )}
            </svg>

            {/* Interactive 2D Bounding Box HTML Overlays */}
            {trackedObjects.map((obj) => {
              const isSelected = obj.id === selectedObjectId;
              const color = getClassColor(obj.class, obj.collisionRisk);

              return (
                <div
                  key={obj.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject(isSelected ? null : obj.id);
                  }}
                  className={`absolute cursor-pointer transition-all duration-150 ${
                    isSelected ? 'ring-2 ring-white shadow-lg z-30' : 'hover:ring-1 hover:ring-cyan-300 z-20'
                  }`}
                  style={{
                    left: `${obj.bbox2d.x * 100}%`,
                    top: `${obj.bbox2d.y * 100}%`,
                    width: `${obj.bbox2d.w * 100}%`,
                    height: `${obj.bbox2d.h * 100}%`,
                    borderColor: color,
                    borderWidth: isSelected ? '2.5px' : '1.5px',
                    borderStyle: 'solid',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                  }}
                >
                  {/* Bounding Box Header Tag */}
                  <div
                    className="absolute -top-6 left-0 flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap text-white font-semibold shadow"
                    style={{ backgroundColor: color }}
                  >
                    <span>ID #{obj.trackId}</span>
                    <span>·</span>
                    <span>{obj.label.split(' ')[0]}</span>
                    <span>·</span>
                    <span>{(obj.confidence * 100).toFixed(0)}%</span>
                  </div>

                  {/* Distance & Velocity Subtitle at bottom of box */}
                  <div className="absolute -bottom-5 left-0 flex items-center gap-2 px-1 py-0.2 text-[9px] font-mono text-white bg-slate-950/85 rounded border border-slate-700 whitespace-nowrap">
                    <span>{obj.distanceMeters.toFixed(1)}m</span>
                    {obj.velocity.speedMs > 0.05 && (
                      <>
                        <span className="text-slate-500">|</span>
                        <span className="text-cyan-400">
                          {obj.velocity.speedMs.toFixed(2)} m/s
                        </span>
                      </>
                    )}
                    {obj.timeToCollisionSec && (
                      <>
                        <span className="text-slate-500">|</span>
                        <span
                          className={`font-semibold ${
                            obj.collisionRisk === 'critical' ? 'text-red-400' : 'text-amber-400'
                          }`}
                        >
                          TTC: {obj.timeToCollisionSec.toFixed(1)}s
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bottom Status HUD Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-sm border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-4">
                <span className="text-slate-400">
                  FOV: <strong className="text-white font-mono">90° Horiz</strong>
                </span>
                <span className="text-slate-400">
                  Free Space: <strong className="text-emerald-400 font-mono">{(freeSpace.traversableAreaRatio * 100).toFixed(1)}%</strong>
                </span>
                <span className="text-slate-400">
                  Min Clearance: <strong className="text-cyan-400 font-mono">{freeSpace.minClearanceWidthM.toFixed(2)}m</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[11px] font-mono">
                  {trackedObjects.length} Entities Tracked
                </span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Quick Perception Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-400" />
                <span>Traversable Free Space</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-400" />
                <span>Pedestrian / Worker</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-500/30 border border-orange-400" />
                <span>Forklift / Vehicle</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500/30 border border-red-400" />
                <span>Collision Trajectory</span>
              </div>
            </div>
            <div>
              <span>Click any bounding box to inspect Kalman state</span>
            </div>
          </div>
        </div>

        {/* Object Inspector & Sensor Telemetry Card (Col span 1) */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Tracked Entity Inspector</span>
              </h3>
              {selectedObject && (
                <button
                  onClick={() => onSelectObject(null)}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {selectedObject ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Object Classification</div>
                  <div className="text-sm font-semibold text-white">
                    {selectedObject.label}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    Track ID #{selectedObject.trackId} · Confidence {(selectedObject.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">DISTANCE (Z)</span>
                    <span className="text-cyan-400 font-semibold tabular-nums text-sm">
                      {selectedObject.distanceMeters.toFixed(2)} m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">VELOCITY (V)</span>
                    <span className="text-white font-semibold tabular-nums text-sm">
                      {selectedObject.velocity.speedMs.toFixed(2)} m/s
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">COLLISION RISK</span>
                    <span
                      className={`font-semibold capitalize ${
                        selectedObject.collisionRisk === 'critical'
                          ? 'text-red-400'
                          : selectedObject.collisionRisk === 'caution'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {selectedObject.collisionRisk}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TIME TO IMPACT</span>
                    <span className="text-white font-semibold tabular-nums">
                      {selectedObject.timeToCollisionSec
                        ? `${selectedObject.timeToCollisionSec.toFixed(1)} s`
                        : 'Safe'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] mb-1">
                    Extended Kalman Filter (EKF) State
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pose [X, Y, Z]:</span>
                      <span className="text-slate-300">
                        [{selectedObject.position3d.x.toFixed(2)}, {selectedObject.position3d.y.toFixed(2)}, {selectedObject.position3d.z.toFixed(2)}]
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vel [Vx, Vy, Vz]:</span>
                      <span className="text-slate-300">
                        [{selectedObject.velocity.vx.toFixed(2)}, {selectedObject.velocity.vy.toFixed(2)}, {selectedObject.velocity.vz.toFixed(2)}]
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dimensions [W, H, L]:</span>
                      <span className="text-slate-300">
                        {selectedObject.dimensions3d.width}m x {selectedObject.dimensions3d.height}m x {selectedObject.dimensions3d.length}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tracker State:</span>
                      <span className="text-emerald-400 font-semibold uppercase">
                        {selectedObject.trackingState}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                <Layers className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <p>Click any detected bounding box on the camera stream to inspect Kalman motion vectors & 3D telemetry.</p>
              </div>
            )}
          </div>

          {/* Free Space Summary Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Free Space Estimation</span>
              <span className="text-emerald-400 font-mono">
                {(freeSpace.traversableAreaRatio * 100).toFixed(0)}% Clear
              </span>
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Traversable Width:</span>
                <span className="text-white font-mono font-semibold">
                  {freeSpace.minClearanceWidthM.toFixed(2)} meters
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${freeSpace.traversableAreaRatio * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-slate-400 pt-1">
                <span>Ground Plane Tilt:</span>
                <span className="text-slate-200 font-mono">
                  {freeSpace.groundPlaneSlopeDeg.toFixed(2)}° (Level)
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Local Costmap Density:</span>
                <span className="text-cyan-400 font-mono">
                  {freeSpace.localCostmapDensity} pts / m²
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
