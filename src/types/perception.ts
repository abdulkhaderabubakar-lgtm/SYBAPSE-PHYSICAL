export type PerceptionScenarioId = 'warehouse_aisle' | 'loading_dock' | 'sorting_cell' | 'live_webcam';

export type ObjectClass =
  | 'worker'
  | 'forklift'
  | 'amr'
  | 'pallet'
  | 'tote_bin'
  | 'safety_cone'
  | 'robotic_arm';

export interface BoundingBox2D {
  x: number; // 0 to 1 (left)
  y: number; // 0 to 1 (top)
  w: number; // 0 to 1 (width)
  h: number; // 0 to 1 (height)
}

export interface Vector3D {
  x: number; // lateral (meters)
  y: number; // vertical (meters)
  z: number; // depth forward (meters)
}

export interface PerceptionTrackedObject {
  id: string;
  trackId: number;
  class: ObjectClass;
  label: string;
  confidence: number; // 0 to 1
  bbox2d: BoundingBox2D;
  distanceMeters: number;
  position3d: Vector3D;
  dimensions3d: { width: number; height: number; length: number };
  velocity: { vx: number; vy: number; vz: number; speedMs: number };
  headingDeg: number;
  timeToCollisionSec: number | null; // null if divergent path
  collisionRisk: 'none' | 'caution' | 'critical';
  trackingState: 'tentative' | 'confirmed' | 'coasted';
  historyPath: Array<{ x: number; y: number; time: number }>;
}

export interface OpticalFlowVector {
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  magnitude: number;
}

export interface FreeSpaceMetrics {
  traversableAreaRatio: number; // e.g. 0.742
  minClearanceWidthM: number; // e.g. 1.85m
  groundPlaneSlopeDeg: number; // e.g. 0.3°
  confidenceScore: number;
  navigableBoundaryPoints: Array<{ x: number; y: number }>;
  dangerZones: Array<{ x: number; y: number; radius: number; reason: string }>;
  localCostmapDensity: number; // 0 - 100
}

export interface LidarScanPoint {
  angleRad: number;
  distanceM: number;
  intensity: number;
  isObstacle: boolean;
}

export interface SensorFusionConfig {
  rgbActive: boolean;
  depthActive: boolean;
  lidarActive: boolean;
  opticalFlowActive: boolean;
  freeSpaceActive: boolean;
  trackingActive: boolean;
  boundingBox3dActive: boolean;
  fps: number;
  inferenceLatencyMs: number;
  depthColormap: 'turbo' | 'viridis' | 'inferno';
  minConfidenceThreshold: number;
}

export interface SimulatedRobotPose {
  x: number;
  y: number;
  headingRad: number;
}

export interface SimulatedRobotState {
  id: string;
  name: string;
  pose: SimulatedRobotPose;
  targetGoal: { x: number; y: number; headingRad: number } | null;
  linearVelocity: number; // m/s
  angularVelocity: number; // rad/s
  maxLinearSpeed: number; // m/s
  maxAngularSpeed: number; // rad/s
  batteryPercent: number;
  status: 'idle' | 'navigating' | 'avoiding_obstacle' | 'goal_reached' | 'emergency_stop';
  controllerMode: 'rl_policy' | 'classical_dwa' | 'manual_teleop';
  plannedTrajectory: Array<{ x: number; y: number }>;
  breadcrumbs: Array<{ x: number; y: number }>;
  perceptionSafetyBubbleM: number;
  emergencyStopEngaged: boolean;
}

export interface RlStateVector {
  lidarSectors16: number[]; // normalized 0 to 1 distance per 22.5° sector
  goalDistanceNormalized: number;
  relativeBearingRad: number;
  currentLinearVel: number;
  currentAngularVel: number;
  freeSpaceRatio: number;
  minObstacleDistM: number;
  timeToCollisionNormalized: number;
}

export interface RlPolicyOutput {
  policyType: 'PPO-Perception-Actor' | 'SAC-Continuous';
  actionLinearVel: number; // m/s
  actionAngularVel: number; // rad/s
  entropy: number;
  criticValueEstimate: number; // V(s)
  rewards: {
    progressReward: number;
    clearanceReward: number;
    smoothnessReward: number;
    freeSpaceBonus: number;
    totalStepReward: number;
  };
  actionDistribution: Array<{
    actionName: string;
    linearVel: number;
    angularVel: number;
    probability: number;
    qValue: number;
  }>;
}

export interface Ros2BridgeTopic {
  name: string;
  type: string;
  rateHz: number;
  status: 'active' | 'standby' | 'error';
  lastPayloadSummary: string;
}

export interface PerceptionAuditReport {
  timestamp: string;
  source: 'gemini_3.8_flash' | 'perception_safety_engine';
  riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL';
  safetyClearanceMet: boolean;
  detectedHazards: string[];
  dynamicTrajectoryVeto: boolean;
  recommendedDamping: string;
  rlDistributionScore: number;
  rlActionValidation: string;
  standardCompliance: string;
}
