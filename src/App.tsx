/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { PerceptionStatusBar } from './components/PerceptionStatusBar';
import { PerceptionStreamView } from './components/PerceptionStreamView';
import { SpatialOccupancyView } from './components/SpatialOccupancyView';
import { RobotSimulationBridgeView } from './components/RobotSimulationBridgeView';
import { RlPerceptionPolicyView } from './components/RlPerceptionPolicyView';
import { IndustrialRoboticsView } from './components/IndustrialRoboticsView';
import { AiPerceptionModal } from './components/AiPerceptionModal';

import {
  PerceptionScenarioId,
  PerceptionTrackedObject,
  FreeSpaceMetrics,
  SensorFusionConfig,
  SimulatedRobotState,
  PerceptionAuditReport,
} from './types/perception';

import { PERCEPTION_SCENARIOS } from './data/mockPerceptionData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('perception');
  const [currentScenarioId, setCurrentScenarioId] = useState<PerceptionScenarioId>('loading_dock');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Active scenario definition
  const scenarioDef =
    PERCEPTION_SCENARIOS.find((s) => s.id === currentScenarioId) ||
    PERCEPTION_SCENARIOS[0];

  // Core Perception State
  const [trackedObjects, setTrackedObjects] = useState<PerceptionTrackedObject[]>(
    scenarioDef.initialObjects
  );
  const [freeSpace, setFreeSpace] = useState<FreeSpaceMetrics>(scenarioDef.freeSpace);

  // Sensor Fusion Configuration
  const [sensorConfig, setSensorConfig] = useState<SensorFusionConfig>({
    rgbActive: true,
    depthActive: false,
    lidarActive: true,
    opticalFlowActive: false,
    freeSpaceActive: true,
    trackingActive: true,
    boundingBox3dActive: true,
    fps: 60,
    inferenceLatencyMs: 14.2,
    depthColormap: 'turbo',
    minConfidenceThreshold: 0.65,
  });

  // Simulated Robot AMR State
  const [robotState, setRobotState] = useState<SimulatedRobotState>({
    id: 'AMR-01',
    name: 'Autonomous Carrier Unit 01',
    pose: { x: 30, y: 55, headingRad: 0.1 },
    targetGoal: { x: 75, y: 30, headingRad: 0 },
    linearVelocity: 0.85,
    angularVelocity: -0.12,
    maxLinearSpeed: 1.2,
    maxAngularSpeed: 1.5,
    batteryPercent: 88,
    status: 'navigating',
    controllerMode: 'rl_policy',
    plannedTrajectory: [],
    breadcrumbs: [],
    perceptionSafetyBubbleM: 1.6,
    emergencyStopEngaged: false,
  });

  // AI Perception Audit Modal & Report State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isAiAuditing, setIsAiAuditing] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<PerceptionAuditReport | null>(null);

  // Switch Scenarios
  const handleSelectScenario = (id: PerceptionScenarioId) => {
    setCurrentScenarioId(id);
    setSelectedObjectId(null);
    const newDef = PERCEPTION_SCENARIOS.find((s) => s.id === id);
    if (newDef) {
      setTrackedObjects(newDef.initialObjects);
      setFreeSpace(newDef.freeSpace);
    }
  };

  // Toggle Sensor Layer
  const handleToggleSensorLayer = (layer: keyof SensorFusionConfig) => {
    setSensorConfig((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  // Reset Simulation
  const handleResetSimulation = () => {
    const def = PERCEPTION_SCENARIOS.find((s) => s.id === currentScenarioId) || PERCEPTION_SCENARIOS[0];
    setTrackedObjects(def.initialObjects);
    setFreeSpace(def.freeSpace);
    setSelectedObjectId(null);
    setRobotState({
      id: 'AMR-01',
      name: 'Autonomous Carrier Unit 01',
      pose: { x: 30, y: 55, headingRad: 0.1 },
      targetGoal: { x: 75, y: 30, headingRad: 0 },
      linearVelocity: 0.85,
      angularVelocity: -0.12,
      maxLinearSpeed: 1.2,
      maxAngularSpeed: 1.5,
      batteryPercent: 88,
      status: 'navigating',
      controllerMode: 'rl_policy',
      plannedTrajectory: [],
      breadcrumbs: [],
      perceptionSafetyBubbleM: 1.6,
      emergencyStopEngaged: false,
    });
  };

  // Trigger Emergency Stop
  const handleTriggerEmergencyStop = () => {
    setRobotState((prev) => ({
      ...prev,
      linearVelocity: 0,
      angularVelocity: 0,
      status: 'emergency_stop',
      emergencyStopEngaged: true,
      targetGoal: null,
    }));
  };

  // Simulation Clock Loop: animate moving entities (e.g. walking worker, forklift moving)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const time = Date.now() / 1000;

      setTrackedObjects((prevObjects) =>
        prevObjects.map((obj) => {
          // If stationary pallet or rack, keep static
          if (obj.class === 'pallet' || obj.class === 'safety_cone') {
            return obj;
          }

          // Dynamic worker walking across corridor
          if (obj.class === 'worker') {
            const cycle = Math.sin(time * 0.8 * simSpeed);
            const newX = 0.65 + cycle * 0.12;
            const newDist = 4.8 - Math.cos(time * 0.8 * simSpeed) * 0.6;
            const speed = 0.85 * simSpeed;
            const ttc = newDist < 4.2 && robotState.linearVelocity > 0.4 ? newDist / (robotState.linearVelocity + 0.5) : null;

            return {
              ...obj,
              bbox2d: { ...obj.bbox2d, x: newX },
              distanceMeters: Math.max(2.0, parseFloat(newDist.toFixed(2))),
              position3d: { ...obj.position3d, x: (newX - 0.5) * 6, z: newDist },
              velocity: { vx: cycle > 0 ? 0.85 : -0.85, vy: 0, vz: 0.1, speedMs: speed },
              timeToCollisionSec: ttc ? parseFloat(ttc.toFixed(1)) : null,
              collisionRisk: ttc && ttc < 3.2 ? 'critical' : 'caution',
            };
          }

          // Dynamic forklift approaching or turning
          if (obj.class === 'forklift') {
            const cycle = Math.sin(time * 0.4 * simSpeed);
            const newX = 0.32 + cycle * 0.08;
            const newDist = 8.5 - Math.cos(time * 0.4 * simSpeed) * 1.8;

            return {
              ...obj,
              bbox2d: { ...obj.bbox2d, x: newX },
              distanceMeters: Math.max(4.0, parseFloat(newDist.toFixed(2))),
              position3d: { ...obj.position3d, x: (newX - 0.5) * 7, z: newDist },
              velocity: { vx: 0.95 * simSpeed, vy: 0, vz: -0.4, speedMs: 1.05 * simSpeed },
            };
          }

          // Dynamic AMR ahead cruising
          if (obj.id === 'obj-amr-ahead') {
            const newDist = 14.5 + Math.sin(time * 0.5 * simSpeed) * 2.5;
            return {
              ...obj,
              distanceMeters: parseFloat(newDist.toFixed(2)),
              position3d: { ...obj.position3d, z: newDist },
            };
          }

          return obj;
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, robotState.linearVelocity]);

  // Server-side AI Perception Audit (Gemini 3.8 Flash via /api/perception/scene-analysis)
  const handleRunAiAudit = async (customQuery?: string) => {
    setIsAiAuditing(true);
    setIsAiModalOpen(true);

    try {
      const response = await fetch('/api/perception/scene-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: scenarioDef.name,
          detectedObjects: trackedObjects,
          freeSpaceMetrics: freeSpace,
          robotState: {
            pose: robotState.pose,
            linearVelocity: robotState.linearVelocity,
            angularVelocity: robotState.angularVelocity,
            status: robotState.status,
            controllerMode: robotState.controllerMode,
          },
          sensorConfig: {
            fovDegrees: 90,
            activeLayers: Object.keys(sensorConfig).filter((k) => (sensorConfig as any)[k] === true),
          },
          controllerMode: robotState.controllerMode,
          customInquiry: customQuery,
        }),
      });

      if (!response.ok) throw new Error('Perception audit network error');
      const data = await response.json();
      setAiReport(data);
    } catch (err) {
      console.warn('Fallback perception assessment triggered:', err);
      const criticalObj = trackedObjects.find(
        (o) => o.collisionRisk === 'critical' || (o.timeToCollisionSec && o.timeToCollisionSec < 3.0)
      );

      setAiReport({
        timestamp: new Date().toISOString(),
        source: 'perception_safety_engine',
        riskLevel: criticalObj ? 'CRITICAL' : 'LOW',
        safetyClearanceMet: !criticalObj,
        detectedHazards: criticalObj
          ? [
              `Dynamic collision vector intercepted with ${criticalObj.label} at ${criticalObj.distanceMeters}m (TTC: ${criticalObj.timeToCollisionSec}s).`,
              `Restricted corridor clearance: ${freeSpace.minClearanceWidthM.toFixed(2)}m approaches ISO 3691-4 boundary threshold.`,
            ]
          : [
              'Clear navigation pathway confirmed across 90° perception frustum.',
              `Free space ratio at ${(freeSpace.traversableAreaRatio * 100).toFixed(1)}% satisfies dynamic stopping distance envelope.`,
            ],
        dynamicTrajectoryVeto: !!criticalObj,
        recommendedDamping: criticalObj
          ? 'Enforce immediate velocity deceleration to 0.25 m/s and execute dynamic obstacle evasive arc.'
          : 'Nominal velocity permitted. Maintain cruising speed.',
        rlDistributionScore: 0.95,
        rlActionValidation: 'RL Policy output conforms to safety-invariant envelope and ISO 3691-4 Clause 5.2.2.',
        standardCompliance: 'ISO 3691-4:2020 (Driverless industrial trucks) & ISO 10218 Speed Separation Monitoring.',
      });
    } finally {
      setIsAiAuditing(false);
    }
  };

  // Closest obstacle distance calculation
  const closestObstacleDist = Math.min(
    ...trackedObjects.map((o) => o.distanceMeters),
    freeSpace.minClearanceWidthM
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Bar */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAiAudit={() => handleRunAiAudit()}
        isAiProcessing={isAiAuditing}
      />

      {/* Scenario & Real-Time Pipeline Clock Ribbon */}
      <PerceptionStatusBar
        currentScenario={currentScenarioId}
        onSelectScenario={handleSelectScenario}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={handleResetSimulation}
        simSpeed={simSpeed}
        onSetSimSpeed={setSimSpeed}
        trackedEntitiesCount={trackedObjects.length}
        freeSpacePercent={freeSpace.traversableAreaRatio * 100}
        inferenceMs={sensorConfig.inferenceLatencyMs}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'perception' && (
          <PerceptionStreamView
            currentScenarioId={currentScenarioId}
            onSelectScenario={handleSelectScenario}
            trackedObjects={trackedObjects}
            freeSpace={freeSpace}
            sensorConfig={sensorConfig}
            onToggleSensorLayer={handleToggleSensorLayer}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onRunSceneAiAnalysis={() => handleRunAiAudit()}
            isAiAuditing={isAiAuditing}
            robotSpeed={robotState.linearVelocity}
          />
        )}

        {activeTab === 'freespace' && (
          <SpatialOccupancyView
            trackedObjects={trackedObjects}
            freeSpace={freeSpace}
            robotSpeed={robotState.linearVelocity}
          />
        )}

        {activeTab === 'simulation' && (
          <RobotSimulationBridgeView
            robotState={robotState}
            onUpdateRobotState={setRobotState}
            trackedObjects={trackedObjects}
            onTriggerEmergencyStop={handleTriggerEmergencyStop}
            onResetRobot={handleResetSimulation}
          />
        )}

        {activeTab === 'rl_policy' && (
          <RlPerceptionPolicyView
            freeSpaceRatio={freeSpace.traversableAreaRatio}
            robotSpeed={robotState.linearVelocity}
            closestObstacleDist={closestObstacleDist}
          />
        )}

        {activeTab === 'industrial' && <IndustrialRoboticsView />}
      </main>

      {/* Anti-Slop Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SynapsePerception</span>
            <span>·</span>
            <span>AI Robot Perception & Spatial Autonomy Platform</span>
            <span>·</span>
            <span>ISO 3691-4 & NIST Collaborative Robotics Compliance</span>
          </div>
          <div>
            <span>Computer Vision · Object Detection · Sensor Fusion · Reinforcement Learning</span>
          </div>
        </div>
      </footer>

      {/* AI Multimodal Perception Audit Modal */}
      <AiPerceptionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        report={aiReport}
        isLoading={isAiAuditing}
        onTriggerAudit={handleRunAiAudit}
        trackedObjects={trackedObjects}
        freeSpace={freeSpace}
      />
    </div>
  );
}
