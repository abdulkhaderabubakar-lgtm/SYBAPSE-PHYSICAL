import React, { useState, useEffect, useRef } from 'react';
import {
  SimulatedRobotState,
  Ros2BridgeTopic,
  PerceptionTrackedObject,
} from '../types/perception';
import { INITIAL_ROS2_TOPICS } from '../data/mockPerceptionData';
import {
  Navigation,
  Compass,
  Radio,
  Zap,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface RobotSimulationBridgeViewProps {
  robotState: SimulatedRobotState;
  onUpdateRobotState: (updater: (prev: SimulatedRobotState) => SimulatedRobotState) => void;
  trackedObjects: PerceptionTrackedObject[];
  onTriggerEmergencyStop: () => void;
  onResetRobot: () => void;
}

export const RobotSimulationBridgeView: React.FC<RobotSimulationBridgeViewProps> = ({
  robotState,
  onUpdateRobotState,
  trackedObjects,
  onTriggerEmergencyStop,
  onResetRobot,
}) => {
  const [activeTopics, setActiveTopics] = useState<Ros2BridgeTopic[]>(INITIAL_ROS2_TOPICS);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [selectedWaypointName, setSelectedWaypointName] = useState<string>('Station B');
  const [isSpawnMenuOpen, setIsSpawnMenuOpen] = useState<boolean>(false);

  // Preset warehouse waypoints
  const WAYPOINTS = [
    { name: 'Staging Area A', x: 20, y: 25 },
    { name: 'Aisle 04 Crossway', x: 50, y: 45 },
    { name: 'High-Bay Rack 12', x: 75, y: 30 },
    { name: 'Loading Bay 02', x: 45, y: 70 },
    { name: 'Charging Dock', x: 15, y: 75 },
  ];

  // Static warehouse obstacles (racks and walls)
  const STATIC_RACKS = [
    { x: 10, y: 15, w: 25, h: 6, label: 'Rack A1' },
    { x: 10, y: 35, w: 25, h: 6, label: 'Rack A2' },
    { x: 10, y: 55, w: 25, h: 6, label: 'Rack A3' },
    { x: 65, y: 15, w: 25, h: 6, label: 'Rack B1' },
    { x: 65, y: 35, w: 25, h: 6, label: 'Rack B2' },
    { x: 65, y: 55, w: 25, h: 6, label: 'Rack B3' },
  ];

  // Handle click on canvas to set target goal
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    onUpdateRobotState((prev) => ({
      ...prev,
      targetGoal: { x: clickX, y: clickY, headingRad: prev.pose.headingRad },
      status: 'navigating',
      emergencyStopEngaged: false,
    }));
  };

  // Teleoperation Manual Step
  const handleTeleop = (linearDelta: number, angularDelta: number) => {
    onUpdateRobotState((prev) => {
      const newLinear = Math.max(-0.4, Math.min(1.2, prev.linearVelocity + linearDelta));
      const newAngular = Math.max(-1.5, Math.min(1.5, prev.angularVelocity + angularDelta));
      return {
        ...prev,
        linearVelocity: newLinear,
        angularVelocity: newAngular,
        controllerMode: 'manual_teleop',
        status: 'navigating',
      };
    });
  };

  // Main simulated robot kinematics loop (differential drive)
  useEffect(() => {
    if (!isSimRunning || robotState.emergencyStopEngaged) return;

    const interval = setInterval(() => {
      onUpdateRobotState((prev) => {
        let { x, y, headingRad } = prev.pose;
        let v = prev.linearVelocity;
        let w = prev.angularVelocity;
        let status = prev.status;

        // If in autonomous navigation to targetGoal
        if (prev.targetGoal && prev.controllerMode !== 'manual_teleop') {
          const dx = prev.targetGoal.x - x;
          const dy = prev.targetGoal.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 1.8) {
            // Reached goal!
            return {
              ...prev,
              linearVelocity: 0,
              angularVelocity: 0,
              status: 'goal_reached',
              targetGoal: null,
            };
          }

          // Desired heading to goal
          const targetHeading = Math.atan2(dy, dx);
          let headingError = targetHeading - headingRad;

          // Normalize heading angle difference to [-PI, PI]
          while (headingError > Math.PI) headingError -= 2 * Math.PI;
          while (headingError < -Math.PI) headingError += 2 * Math.PI;

          // Collision check against dynamic obstacle proximity
          let obstacleAvoidanceArc = 0;
          const criticalObstacle = trackedObjects.find(
            (o) => o.distanceMeters < 3.5 || o.collisionRisk === 'critical'
          );

          if (criticalObstacle) {
            status = 'avoiding_obstacle';
            v = 0.35; // decelerate
            obstacleAvoidanceArc = criticalObstacle.position3d.x > 0 ? -0.6 : 0.6; // steer away
          } else {
            status = 'navigating';
            v = Math.min(prev.maxLinearSpeed, 0.4 + dist * 0.08);
          }

          w = Math.max(-1.2, Math.min(1.2, headingError * 1.5 + obstacleAvoidanceArc));
        }

        // Integrate differential kinematics
        const dt = 0.08;
        headingRad += w * dt;
        x += Math.cos(headingRad) * v * dt * 10;
        y += Math.sin(headingRad) * v * dt * 10;

        // Keep inside bounds
        x = Math.max(5, Math.min(95, x));
        y = Math.max(5, Math.min(95, y));

        // Add breadcrumb trail
        const newBreadcrumbs = [...prev.breadcrumbs.slice(-40), { x, y }];

        return {
          ...prev,
          pose: { x, y, headingRad },
          linearVelocity: v,
          angularVelocity: w,
          status,
          breadcrumbs: newBreadcrumbs,
        };
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isSimRunning, robotState.emergencyStopEngaged, trackedObjects]);

  return (
    <div className="space-y-6">
      {/* Simulation Master Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Autonomy Mode:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
              <button
                onClick={() =>
                  onUpdateRobotState((p) => ({ ...p, controllerMode: 'rl_policy' }))
                }
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  robotState.controllerMode === 'rl_policy'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                RL Policy Agent
              </button>
              <button
                onClick={() =>
                  onUpdateRobotState((p) => ({ ...p, controllerMode: 'classical_dwa' }))
                }
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  robotState.controllerMode === 'classical_dwa'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Classical DWA Planner
              </button>
              <button
                onClick={() =>
                  onUpdateRobotState((p) => ({ ...p, controllerMode: 'manual_teleop' }))
                }
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  robotState.controllerMode === 'manual_teleop'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Manual Teleop
              </button>
            </div>
          </div>
        </div>

        {/* Quick Waypoints Dispatch */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Dispatch:</span>
          {WAYPOINTS.slice(0, 3).map((wp) => (
            <button
              key={wp.name}
              onClick={() => {
                onUpdateRobotState((p) => ({
                  ...p,
                  targetGoal: { x: wp.x, y: wp.y, headingRad: p.pose.headingRad },
                  status: 'navigating',
                }));
              }}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 font-medium transition-colors"
            >
              {wp.name}
            </button>
          ))}
        </div>

        {/* Play / Reset / E-Stop Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimRunning(!isSimRunning)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            title={isSimRunning ? 'Pause Clock' : 'Resume Clock'}
          >
            {isSimRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={onResetRobot}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            title="Reset Position"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onTriggerEmergencyStop}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-xs transition-colors shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Stop</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Arena & Side Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive 2D Warehouse Arena (Col span 3) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-2xl select-none">
            <svg
              className="w-full h-full cursor-crosshair"
              viewBox="0 0 100 100"
              onClick={handleCanvasClick}
            >
              {/* Floor Grid Lines */}
              <defs>
                <pattern id="simGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#simGrid)" />

              {/* Warehouse Lane Boundaries */}
              <line x1="48" y1="5" x2="48" y2="95" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="52" y1="5" x2="52" y2="95" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="5" y1="48" x2="95" y2="48" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="5" y1="52" x2="95" y2="52" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />

              {/* Static Shelving Racks */}
              {STATIC_RACKS.map((rack, i) => (
                <g key={i}>
                  <rect
                    x={rack.x}
                    y={rack.y}
                    width={rack.w}
                    height={rack.h}
                    fill="#0f172a"
                    stroke="#0284c7"
                    strokeWidth="0.6"
                    rx="1"
                  />
                  <text
                    x={rack.x + rack.w / 2}
                    y={rack.y + rack.h / 2 + 1}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="2.5"
                    fontFamily="monospace"
                  >
                    {rack.label}
                  </text>
                </g>
              ))}

              {/* Target Goal Waypoint Pin */}
              {robotState.targetGoal && (
                <g>
                  <circle
                    cx={robotState.targetGoal.x}
                    cy={robotState.targetGoal.y}
                    r="3.5"
                    fill="rgba(6, 182, 212, 0.25)"
                    stroke="#06b6d4"
                    strokeWidth="0.6"
                    strokeDasharray="1.5 1"
                  />
                  <circle
                    cx={robotState.targetGoal.x}
                    cy={robotState.targetGoal.y}
                    r="1.2"
                    fill="#06b6d4"
                  />
                  {/* Trajectory Guide Line from robot to goal */}
                  <line
                    x1={robotState.pose.x}
                    y1={robotState.pose.y}
                    x2={robotState.targetGoal.x}
                    y2={robotState.targetGoal.y}
                    stroke="#06b6d4"
                    strokeWidth="0.4"
                    strokeDasharray="1.5 1"
                    opacity="0.6"
                  />
                </g>
              )}

              {/* Robot Breadcrumb History */}
              {robotState.breadcrumbs.length > 1 && (
                <polyline
                  points={robotState.breadcrumbs.map((b) => `${b.x},${b.y}`).join(' ')}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="0.4"
                  opacity="0.4"
                />
              )}

              {/* Robot Sensor Frustum Cone (90° camera field of view projecting from pose) */}
              {(() => {
                const rx = robotState.pose.x;
                const ry = robotState.pose.y;
                const h = robotState.pose.headingRad;
                const fov = (90 * Math.PI) / 180;
                const range = 24;

                const p1x = rx + Math.cos(h - fov / 2) * range;
                const p1y = ry + Math.sin(h - fov / 2) * range;
                const p2x = rx + Math.cos(h + fov / 2) * range;
                const p2y = ry + Math.sin(h + fov / 2) * range;

                return (
                  <polygon
                    points={`${rx},${ry} ${p1x},${p1y} ${p2x},${p2y}`}
                    fill="rgba(56, 189, 248, 0.12)"
                    stroke="rgba(56, 189, 248, 0.5)"
                    strokeWidth="0.4"
                    strokeDasharray="1.5 1"
                  />
                );
              })()}

              {/* AMR Robot Footprint */}
              <g transform={`translate(${robotState.pose.x}, ${robotState.pose.y}) rotate(${(robotState.pose.headingRad * 180) / Math.PI})`}>
                {/* Safety Bubble */}
                <circle
                  cx="0"
                  cy="0"
                  r={robotState.perceptionSafetyBubbleM * 2.2}
                  fill="none"
                  stroke={robotState.status === 'avoiding_obstacle' ? '#ef4444' : '#10b981'}
                  strokeWidth="0.4"
                  strokeDasharray="1.2 0.8"
                />

                {/* Robot Chassis Body */}
                <rect
                  x="-2.5"
                  y="-1.8"
                  width="5"
                  height="3.6"
                  fill="#0369a1"
                  stroke="#38bdf8"
                  strokeWidth="0.5"
                  rx="0.8"
                />

                {/* Wheels */}
                <rect x="-1.5" y="-2.2" width="3" height="0.6" fill="#0f172a" rx="0.2" />
                <rect x="-1.5" y="1.6" width="3" height="0.6" fill="#0f172a" rx="0.2" />

                {/* Direction Pointer Triangle */}
                <polygon points="1.8,0 0.8,-0.9 0.8,0.9" fill="#f8fafc" />

                {/* LiDAR Puck at Center */}
                <circle cx="0" cy="0" r="0.8" fill="#10b981" />
              </g>

              {/* Dynamic Obstacles from Perception System */}
              {trackedObjects.map((obj) => {
                // Map camera relative 3D position to warehouse world frame
                const ox = robotState.pose.x + obj.position3d.x * 2.2;
                const oy = robotState.pose.y + obj.position3d.z * 1.8;

                return (
                  <g key={`world-${obj.id}`}>
                    <circle
                      cx={ox}
                      cy={oy}
                      r="2.2"
                      fill={obj.collisionRisk === 'critical' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.3)'}
                      stroke={obj.collisionRisk === 'critical' ? '#ef4444' : '#f59e0b'}
                      strokeWidth="0.5"
                    />
                    <text
                      x={ox}
                      y={oy - 2.8}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="2.0"
                      fontFamily="monospace"
                    >
                      {obj.label.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Canvas Click Hint */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded text-[11px] text-slate-300 font-mono flex items-center gap-2 pointer-events-none">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Click anywhere on the warehouse floor to set a target navigation waypoint</span>
            </div>

            {/* Bottom State HUD */}
            <div className="absolute bottom-3 inset-x-3 bg-slate-900/90 backdrop-blur border border-slate-800 px-4 py-2 rounded flex items-center justify-between text-xs text-slate-300 pointer-events-none">
              <div className="flex items-center gap-4">
                <span>
                  Status:{' '}
                  <strong className="text-emerald-400 font-semibold uppercase">
                    {robotState.status.replace('_', ' ')}
                  </strong>
                </span>
                <span>
                  Pose: <strong className="text-white font-mono">X:{robotState.pose.x.toFixed(1)}, Y:{robotState.pose.y.toFixed(1)}</strong>
                </span>
                <span>
                  Speed: <strong className="text-cyan-400 font-mono">{robotState.linearVelocity.toFixed(2)} m/s</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono text-[11px]">DDS Bridge Connected</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Teleop Control & ROS2 Bridge Inspector (Col span 1) */}
        <div className="space-y-4">
          {/* Manual Teleop Keypad */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Manual Teleoperation</span>
            </h3>

            {/* D-Pad Buttons */}
            <div className="grid grid-cols-3 gap-2 w-36 mx-auto pt-1">
              <div />
              <button
                onClick={() => handleTeleop(0.2, 0)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded text-slate-200 flex items-center justify-center transition-colors"
                title="Forward (W)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div />
              <button
                onClick={() => handleTeleop(0, -0.3)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded text-slate-200 flex items-center justify-center transition-colors"
                title="Turn Left (A)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  onUpdateRobotState((p) => ({
                    ...p,
                    linearVelocity: 0,
                    angularVelocity: 0,
                    status: 'idle',
                  }));
                }}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-slate-400 rounded flex items-center justify-center border border-slate-800"
              >
                STOP
              </button>
              <button
                onClick={() => handleTeleop(0, 0.3)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded text-slate-200 flex items-center justify-center transition-colors"
                title="Turn Right (D)"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <div />
              <button
                onClick={() => handleTeleop(-0.2, 0)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded text-slate-200 flex items-center justify-center transition-colors"
                title="Reverse (S)"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <div />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-500 block text-[10px]">LINEAR V</span>
                <span className="text-cyan-400 font-semibold">{robotState.linearVelocity.toFixed(2)} m/s</span>
              </div>
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-500 block text-[10px]">ANGULAR ω</span>
                <span className="text-white font-semibold">{robotState.angularVelocity.toFixed(2)} rad/s</span>
              </div>
            </div>
          </div>

          {/* ROS2 DDS Bridge Active Topics */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>ROS2 Active Topics</span>
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">6 Published</span>
            </h4>

            <div className="space-y-2 text-[11px] font-mono max-h-56 overflow-y-auto pr-1">
              {activeTopics.map((topic) => (
                <div key={topic.name} className="bg-slate-950 p-2 rounded border border-slate-800/80">
                  <div className="flex items-center justify-between font-semibold text-cyan-300">
                    <span className="truncate">{topic.name}</span>
                    <span className="text-slate-400 font-normal">{topic.rateHz} Hz</span>
                  </div>
                  <div className="text-slate-500 text-[10px] truncate">{topic.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
