import {
  PerceptionScenarioId,
  PerceptionTrackedObject,
  FreeSpaceMetrics,
  LidarScanPoint,
  Ros2BridgeTopic,
  RlPolicyOutput,
} from '../types/perception';

export const SCENARIO_IMAGES: Record<Exclude<PerceptionScenarioId, 'live_webcam'>, string> = {
  warehouse_aisle: '/src/assets/images/robot_cam_warehouse_aisle_1792843103131.jpg',
  loading_dock: '/src/assets/images/robot_cam_loading_dock_1792843104275.jpg',
  sorting_cell: '/src/assets/images/robot_cam_sorting_station_1792843103742.jpg',
};

export interface ScenarioDefinition {
  id: PerceptionScenarioId;
  name: string;
  description: string;
  image: string;
  cameraResolution: string;
  fovDegrees: number;
  initialObjects: PerceptionTrackedObject[];
  freeSpace: FreeSpaceMetrics;
}

export const PERCEPTION_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'loading_dock',
    name: 'Logistics Crossway & Loading Dock',
    description: 'Dynamic multi-agent crossway featuring moving forklift, walking safety technician, and floor pedestrian lanes.',
    image: SCENARIO_IMAGES.loading_dock,
    cameraResolution: '1920 x 1080 @ 60 FPS',
    fovDegrees: 90,
    initialObjects: [
      {
        id: 'obj-forklift-01',
        trackId: 104,
        class: 'forklift',
        label: 'Industrial Forklift Hyster 30',
        confidence: 0.98,
        bbox2d: { x: 0.30, y: 0.28, w: 0.32, h: 0.46 },
        distanceMeters: 8.5,
        position3d: { x: -1.2, y: 0.2, z: 8.5 },
        dimensions3d: { width: 1.6, height: 2.2, length: 3.4 },
        velocity: { vx: 0.95, vy: 0.0, vz: -0.4, speedMs: 1.03 },
        headingDeg: 105,
        timeToCollisionSec: 4.8,
        collisionRisk: 'caution',
        trackingState: 'confirmed',
        historyPath: [
          { x: 0.28, y: 0.28, time: -1200 },
          { x: 0.29, y: 0.28, time: -600 },
          { x: 0.30, y: 0.28, time: 0 },
        ],
      },
      {
        id: 'obj-worker-01',
        trackId: 109,
        class: 'worker',
        label: 'Warehouse Technician (High-Vis)',
        confidence: 0.96,
        bbox2d: { x: 0.72, y: 0.34, w: 0.16, h: 0.44 },
        distanceMeters: 4.8,
        position3d: { x: 1.8, y: -0.1, z: 4.8 },
        dimensions3d: { width: 0.6, height: 1.82, length: 0.5 },
        velocity: { vx: -0.85, vy: 0.0, vz: 0.15, speedMs: 0.86 },
        headingDeg: 280,
        timeToCollisionSec: 3.2,
        collisionRisk: 'critical',
        trackingState: 'confirmed',
        historyPath: [
          { x: 0.76, y: 0.34, time: -1200 },
          { x: 0.74, y: 0.34, time: -600 },
          { x: 0.72, y: 0.34, time: 0 },
        ],
      },
      {
        id: 'obj-pallet-01',
        trackId: 112,
        class: 'pallet',
        label: 'Loaded Blue Pallet Block',
        confidence: 0.94,
        bbox2d: { x: 0.52, y: 0.41, w: 0.12, h: 0.18 },
        distanceMeters: 7.2,
        position3d: { x: 0.4, y: -0.4, z: 7.2 },
        dimensions3d: { width: 1.2, height: 1.1, length: 1.2 },
        velocity: { vx: 0.0, vy: 0.0, vz: 0.0, speedMs: 0.0 },
        headingDeg: 0,
        timeToCollisionSec: null,
        collisionRisk: 'none',
        trackingState: 'confirmed',
        historyPath: [{ x: 0.52, y: 0.41, time: 0 }],
      },
    ],
    freeSpace: {
      traversableAreaRatio: 0.628,
      minClearanceWidthM: 1.45,
      groundPlaneSlopeDeg: 0.2,
      confidenceScore: 0.95,
      localCostmapDensity: 42,
      navigableBoundaryPoints: [
        { x: 0.12, y: 0.96 },
        { x: 0.28, y: 0.82 },
        { x: 0.38, y: 0.74 },
        { x: 0.50, y: 0.68 },
        { x: 0.64, y: 0.75 },
        { x: 0.75, y: 0.88 },
        { x: 0.88, y: 0.98 },
      ],
      dangerZones: [
        { x: 0.72, y: 0.65, radius: 0.15, reason: 'Walking worker trajectory interception' },
        { x: 0.42, y: 0.58, radius: 0.18, reason: 'Forklift dynamic swing envelope' },
      ],
    },
  },
  {
    id: 'warehouse_aisle',
    name: 'High-Bay Pallet Racking Aisle',
    description: 'Narrow high-density corridor bounded by vertical structural steel columns and yellow safety floor guide strips.',
    image: SCENARIO_IMAGES.warehouse_aisle,
    cameraResolution: '1920 x 1080 @ 60 FPS',
    fovDegrees: 90,
    initialObjects: [
      {
        id: 'obj-amr-ahead',
        trackId: 201,
        class: 'amr',
        label: 'Autonomous Carrier AMR-02',
        confidence: 0.95,
        bbox2d: { x: 0.47, y: 0.50, w: 0.07, h: 0.08 },
        distanceMeters: 14.5,
        position3d: { x: 0.05, y: -0.3, z: 14.5 },
        dimensions3d: { width: 0.8, height: 0.45, length: 1.1 },
        velocity: { vx: 0.0, vy: 0.0, vz: 0.75, speedMs: 0.75 },
        headingDeg: 0,
        timeToCollisionSec: null,
        collisionRisk: 'none',
        trackingState: 'confirmed',
        historyPath: [{ x: 0.47, y: 0.50, time: 0 }],
      },
      {
        id: 'obj-rack-left',
        trackId: 204,
        class: 'pallet',
        label: 'Storage Rack Bay 14-L',
        confidence: 0.99,
        bbox2d: { x: 0.01, y: 0.15, w: 0.28, h: 0.80 },
        distanceMeters: 2.4,
        position3d: { x: -1.6, y: 0.0, z: 2.4 },
        dimensions3d: { width: 1.4, height: 5.0, length: 18.0 },
        velocity: { vx: 0.0, vy: 0.0, vz: 0.0, speedMs: 0.0 },
        headingDeg: 0,
        timeToCollisionSec: null,
        collisionRisk: 'none',
        trackingState: 'confirmed',
        historyPath: [{ x: 0.01, y: 0.15, time: 0 }],
      },
      {
        id: 'obj-rack-right',
        trackId: 205,
        class: 'pallet',
        label: 'Storage Rack Bay 14-R',
        confidence: 0.99,
        bbox2d: { x: 0.70, y: 0.15, w: 0.29, h: 0.80 },
        distanceMeters: 2.4,
        position3d: { x: 1.6, y: 0.0, z: 2.4 },
        dimensions3d: { width: 1.4, height: 5.0, length: 18.0 },
        velocity: { vx: 0.0, vy: 0.0, vz: 0.0, speedMs: 0.0 },
        headingDeg: 0,
        timeToCollisionSec: null,
        collisionRisk: 'none',
        trackingState: 'confirmed',
        historyPath: [{ x: 0.70, y: 0.15, time: 0 }],
      },
    ],
    freeSpace: {
      traversableAreaRatio: 0.835,
      minClearanceWidthM: 2.42,
      groundPlaneSlopeDeg: 0.1,
      confidenceScore: 0.98,
      localCostmapDensity: 18,
      navigableBoundaryPoints: [
        { x: 0.26, y: 0.98 },
        { x: 0.32, y: 0.84 },
        { x: 0.40, y: 0.68 },
        { x: 0.48, y: 0.54 },
        { x: 0.52, y: 0.54 },
        { x: 0.60, y: 0.68 },
        { x: 0.68, y: 0.84 },
        { x: 0.74, y: 0.98 },
      ],
      dangerZones: [],
    },
  },
  {
    id: 'sorting_cell',
    name: 'Automated Sorting Cell & Conveyor',
    description: 'Robotic manipulator perimeter with conveyor tote lines, AMR staging vehicle, and orange safety markers.',
    image: SCENARIO_IMAGES.sorting_cell,
    cameraResolution: '1920 x 1080 @ 60 FPS',
    fovDegrees: 90,
    initialObjects: [
      {
        id: 'obj-amr-04',
        trackId: 301,
        class: 'amr',
        label: 'AMR-04 Fleet Staging Cart',
        confidence: 0.97,
        bbox2d: { x: 0.48, y: 0.58, w: 0.28, h: 0.36 },
        distanceMeters: 3.2,
        position3d: { x: 0.3, y: -0.3, z: 3.2 },
        dimensions3d: { width: 1.1, height: 0.7, length: 1.5 },
        velocity: { vx: 0.0, vy: 0.0, vz: 0.0, speedMs: 0.0 },
        headingDeg: 180,
        timeToCollisionSec: null,
        collisionRisk: 'none',
        trackingState: 'confirmed',
        historyPath: [{ x: 0.48, y: 0.58, time: 0 }],
      },
      {
        id: 'obj-robot-arm',
        trackId: 304,
        class: 'robotic_arm',
        label: 'Fanuc 6-Axis Articulated Arm',
        confidence: 0.95,
        bbox2d: { x: 0.24, y: 0.25, w: 0.25, h: 0.36 },
        distanceMeters: 6.8,
        position3d: { x: -1.8, y: 0.4, z: 6.8 },
        dimensions3d: { width: 2.0, height: 2.4, length: 2.0 },
        velocity: { vx: 0.2, vy: 0.1, vz: 0.0, speedMs: 0.22 },
        headingDeg: 45,
        timeToCollisionSec: null,
        collisionRisk: 'none',
        trackingState: 'confirmed',
        historyPath: [{ x: 0.24, y: 0.25, time: 0 }],
      },
      {
        id: 'obj-cone-cluster',
        trackId: 308,
        class: 'safety_cone',
        label: 'Safety Perimeter Cones',
        confidence: 0.96,
        bbox2d: { x: 0.74, y: 0.53, w: 0.15, h: 0.46 },
        distanceMeters: 2.6,
        position3d: { x: 1.4, y: -0.4, z: 2.6 },
        dimensions3d: { width: 0.4, height: 0.8, length: 2.8 },
        velocity: { vx: 0.0, vy: 0.0, vz: 0.0, speedMs: 0.0 },
        headingDeg: 0,
        timeToCollisionSec: null,
        collisionRisk: 'none',
        trackingState: 'confirmed',
        historyPath: [{ x: 0.74, y: 0.53, time: 0 }],
      },
    ],
    freeSpace: {
      traversableAreaRatio: 0.712,
      minClearanceWidthM: 1.78,
      groundPlaneSlopeDeg: 0.1,
      confidenceScore: 0.96,
      localCostmapDensity: 31,
      navigableBoundaryPoints: [
        { x: 0.02, y: 0.98 },
        { x: 0.18, y: 0.88 },
        { x: 0.36, y: 0.72 },
        { x: 0.44, y: 0.62 },
        { x: 0.52, y: 0.60 },
        { x: 0.68, y: 0.72 },
        { x: 0.72, y: 0.92 },
      ],
      dangerZones: [
        { x: 0.82, y: 0.74, radius: 0.14, reason: 'Perimeter cones keep-out buffer' },
      ],
    },
  },
];

// Helper to generate simulated LiDAR scan points (270° field-of-view, 100 rays)
export function generateSimulatedLidar(
  objects: PerceptionTrackedObject[],
  freeSpaceRatio: number
): LidarScanPoint[] {
  const points: LidarScanPoint[] = [];
  const numRays = 72; // every 3.75 degrees across 270 degrees
  const startAngle = -Math.PI * 0.75;
  const angleStep = (Math.PI * 1.5) / numRays;

  for (let i = 0; i < numRays; i++) {
    const angle = startAngle + i * angleStep;
    let dist = 12.0 + (Math.sin(angle * 3) * 1.5); // base walls
    let isObstacle = false;

    // Check collision with detected objects
    for (const obj of objects) {
      const objAngle = Math.atan2(obj.position3d.x, obj.position3d.z);
      const angleDiff = Math.abs(angle - objAngle);
      if (angleDiff < 0.22) {
        if (obj.distanceMeters < dist) {
          dist = Math.max(0.5, obj.distanceMeters + (Math.random() - 0.5) * 0.1);
          isObstacle = true;
        }
      }
    }

    points.push({
      angleRad: angle,
      distanceM: parseFloat(dist.toFixed(2)),
      intensity: isObstacle ? 0.95 : 0.45,
      isObstacle,
    });
  }
  return points;
}

// Active simulated ROS2 DDS bridge topics
export const INITIAL_ROS2_TOPICS: Ros2BridgeTopic[] = [
  {
    name: '/perception/camera/image_raw',
    type: 'sensor_msgs/msg/Image (RGB8, 1920x1080)',
    rateHz: 30.0,
    status: 'active',
    lastPayloadSummary: 'Frame timestamp synchronized with PTP IEEE 1588 master clock.',
  },
  {
    name: '/perception/depth/image_rect',
    type: 'sensor_msgs/msg/Image (16UC1 Metric Depth)',
    rateHz: 30.0,
    status: 'active',
    lastPayloadSummary: 'Stereo disparity point cloud computed via semi-global block matching.',
  },
  {
    name: '/perception/tracked_obstacles',
    type: 'vision_msgs/msg/Detection3DArray',
    rateHz: 30.0,
    status: 'active',
    lastPayloadSummary: 'Multi-Object Tracking: 3 active Kalman filter state vectors published.',
  },
  {
    name: '/perception/occupancy_grid',
    type: 'nav_msgs/msg/OccupancyGrid (100x100, 0.05m)',
    rateHz: 20.0,
    status: 'active',
    lastPayloadSummary: 'Ground-plane traversability mask fused into local costmap.',
  },
  {
    name: '/scan',
    type: 'sensor_msgs/msg/LaserScan (270° FOV, 72 beams)',
    rateHz: 20.0,
    status: 'active',
    lastPayloadSummary: 'Safety LiDAR range array fused with optical depth cones.',
  },
  {
    name: '/robot/cmd_vel',
    type: 'geometry_msgs/msg/Twist (linear.x, angular.z)',
    rateHz: 50.0,
    status: 'active',
    lastPayloadSummary: 'Velocity command output from active Reinforcement Learning policy.',
  },
];

// Reinforcement Learning baseline policy state
export const BASELINE_RL_POLICY: RlPolicyOutput = {
  policyType: 'PPO-Perception-Actor',
  actionLinearVel: 0.85,
  actionAngularVel: -0.12,
  entropy: 0.42,
  criticValueEstimate: 14.8,
  rewards: {
    progressReward: +1.42,
    clearanceReward: +0.68,
    smoothnessReward: +0.35,
    freeSpaceBonus: +0.55,
    totalStepReward: +3.00,
  },
  actionDistribution: [
    { actionName: 'Forward-Straight (0.95 m/s, 0.0 rad/s)', linearVel: 0.95, angularVel: 0.0, probability: 0.42, qValue: 16.2 },
    { actionName: 'Forward-Right Arc (0.85 m/s, -0.2 rad/s)', linearVel: 0.85, angularVel: -0.2, probability: 0.38, qValue: 15.8 },
    { actionName: 'Forward-Left Arc (0.75 m/s, +0.2 rad/s)', linearVel: 0.75, angularVel: +0.2, probability: 0.12, qValue: 12.1 },
    { actionName: 'Slow Creep (0.30 m/s, 0.0 rad/s)', linearVel: 0.30, angularVel: 0.0, probability: 0.06, qValue: 8.4 },
    { actionName: 'Decelerate / Stop (0.0 m/s, 0.0 rad/s)', linearVel: 0.0, angularVel: 0.0, probability: 0.02, qValue: 4.1 },
  ],
};
