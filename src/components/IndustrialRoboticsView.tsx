import React, { useState } from 'react';
import {
  Boxes,
  Truck,
  Bot,
  Cpu,
  BarChart2,
  FileCode,
  CheckCircle2,
  Download,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const IndustrialRoboticsView: React.FC = () => {
  const [copiedYaml, setCopiedYaml] = useState<boolean>(false);
  const [selectedArch, setSelectedArch] = useState<'amr' | 'forklift' | 'manipulator'>('amr');

  const ARCHITECTURES = [
    {
      id: 'amr' as const,
      name: 'Warehouse Autonomous Mobile Robots (AMRs)',
      tagline: 'Goods-to-Person fulfillment & high-density sorting',
      icon: Bot,
      specs: {
        payload: '500 kg - 1,500 kg',
        maxSpeed: '1.8 m/s (6.5 km/h)',
        sensors: 'Dual 90° RGB-D Stereo + 360° Safety LiDAR',
        perceptionRole: 'Dynamic pedestrian crossway tracking & safe corridor velocity regulation',
        isoStandards: 'ISO 3691-4 (Industrial driverless trucks), ISO 12100',
      },
      benefits: [
        'Dynamically navigates narrow 2.2m warehouse aisles without magnetic floor tapes.',
        'Anticipates human worker movement up to 4.5 seconds prior to corridor intersection.',
        'Continuous occupancy costmap update maintains maximum throughput while preventing emergency stops.',
      ],
    },
    {
      id: 'forklift' as const,
      name: 'Autonomous Industrial Forklifts & AGVs',
      tagline: 'Heavy pallet handling & automated rack staging',
      icon: Truck,
      specs: {
        payload: '2,000 kg - 4,500 kg',
        maxSpeed: '2.5 m/s (9.0 km/h)',
        sensors: 'Long-Range Solid-State LiDAR + High-Dynamic-Range Cameras + Ultrasonic',
        perceptionRole: 'Pallet pocket 6-DoF pose estimation & blindspot cross-traffic veto',
        isoStandards: 'ISO 3691-4 Clause 5.2.2, ANSI/ITSDF B56.5',
      },
      benefits: [
        'Calculates 3D pocket entry vectors for wooden & plastic euro-pallets with ±3mm tolerance.',
        'Dynamic speed-separation monitoring guarantees safe braking distance curve for heavy loads.',
        'Integrates with facility Warehouse Management Systems (WMS) via standard VDA 5050 protocol.',
      ],
    },
    {
      id: 'manipulator' as const,
      name: 'Mobile Manipulators (Cobot + AMR)',
      tagline: 'Autonomous tote picking & machine tending',
      icon: Boxes,
      specs: {
        payload: '10 kg Arm Reach / 300 kg AMR Base',
        maxSpeed: '1.2 m/s transit / 0.5 m/s arm motion',
        sensors: 'Eye-in-Hand RGB-D + Base Perimeter LiDAR',
        perceptionRole: 'Active object pose estimation, bin picking segmentation & workspace monitoring',
        isoStandards: 'ISO 10218-1/2 (Industrial robots), ISO/TS 15066 (Collaborative robots)',
      },
      benefits: [
        'Performs 6-DoF grasp pose synthesis for cluttered warehouse totes and bin picking.',
        'Monitors safety separation between arm swing radius and human coworkers.',
        'Reinforcement learning policy optimizes coordinated base-and-arm trajectory execution.',
      ],
    },
  ];

  const currentArch = ARCHITECTURES.find((a) => a.id === selectedArch) || ARCHITECTURES[0];

  const ROS2_CONFIG_YAML = `perception_system:
  ros__parameters:
    camera:
      topic: "/camera/color/image_raw"
      depth_topic: "/camera/depth/image_rect_raw"
      frame_id: "camera_optical_link"
      horizontal_fov_deg: 90.0
      inference_resolution: [1920, 1080]
      model_backbone: "YOLOv11-DETR-3D-TensorRT-FP16"
      confidence_threshold: 0.65

    multi_object_tracker:
      algorithm: "Extended_Kalman_Filter_MOT"
      max_coast_cycles: 15
      iou_association_threshold: 0.45
      velocity_smoothing_alpha: 0.85
      time_to_collision_alert_sec: 3.0

    free_space_occupancy:
      grid_resolution_m: 0.05
      local_costmap_size: [100, 100]
      inflation_radius_m: 0.65
      ground_plane_ransac_distance_m: 0.03
      ground_max_slope_deg: 5.0

    rl_policy_bridge:
      policy_model_path: "policies/ppo_warehouse_amr_v4.onnx"
      action_frequency_hz: 50
      max_linear_vel_ms: 1.2
      max_angular_vel_rads: 1.5
      safety_interlock_iso: "ISO_3691_4"`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(ROS2_CONFIG_YAML);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Future Potential Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
        <h2 className="text-base font-semibold text-white">
          Future Potential: Autonomous Systems & Industrial Robotics
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          The combination of real-time computer vision, 3D free space estimation, multi-object tracking,
          and reinforcement learning policies forms the foundational physical AI stack for modern industrial logistics,
          autonomous transport, and collaborative robotics.
        </p>
      </div>

      {/* Architecture Selector & Detailed Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Architecture Buttons */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Select Robotic System:
          </span>
          {ARCHITECTURES.map((arch) => {
            const Icon = arch.icon;
            const isSelected = arch.id === selectedArch;
            return (
              <button
                key={arch.id}
                onClick={() => setSelectedArch(arch.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{arch.name.split('(')[0]}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{arch.tagline}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Architecture Deep-Dive (Col span 2) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">{currentArch.name}</h3>
              <p className="text-xs text-cyan-400 font-mono mt-0.5">{currentArch.tagline}</p>
            </div>
            <div className="text-xs px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
              {currentArch.specs.isoStandards.split(',')[0]}
            </div>
          </div>

          {/* Specification Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Payload Rating</span>
              <span className="text-white font-semibold">{currentArch.specs.payload}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Max Velocity</span>
              <span className="text-cyan-400 font-semibold">{currentArch.specs.maxSpeed}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 md:col-span-2">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Perception Sensor Rig</span>
              <span className="text-slate-200">{currentArch.specs.sensors}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 md:col-span-2">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Physical AI Perception Role</span>
              <span className="text-emerald-400">{currentArch.specs.perceptionRole}</span>
            </div>
          </div>

          {/* Core Advantages */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Key Perception Engineering Capabilities
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {currentArch.benefits.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ML & Computer Vision Benchmarks Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span>Perception Engine ML Performance Benchmarks</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Validated on Industrial Warehouse Dataset (65,000 Annotated Frames)
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px] font-sans">OBJECT DETECTION (mAP@50)</span>
            <span className="text-2xl font-bold text-emerald-400">94.2%</span>
            <span className="text-[10px] text-slate-500 block mt-1">Forklifts, workers, pallets, totes</span>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px] font-sans">TRACKING ACCURACY (MOTA)</span>
            <span className="text-2xl font-bold text-cyan-400">91.8%</span>
            <span className="text-[10px] text-slate-500 block mt-1">EKF tracking persistence across occlusions</span>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px] font-sans">FREE SPACE IoU</span>
            <span className="text-2xl font-bold text-purple-400">88.5%</span>
            <span className="text-[10px] text-slate-500 block mt-1">Drivable ground plane segmentation</span>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px] font-sans">PIPELINE LATENCY</span>
            <span className="text-2xl font-bold text-amber-400">13.9 ms</span>
            <span className="text-[10px] text-slate-500 block mt-1">71.9 Hz total perception-to-control loop</span>
          </div>
        </div>
      </div>

      {/* Ready-to-Deploy ROS2 YAML Configuration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Export ROS2 Perception Node Configuration
            </h3>
            <span className="text-slate-500 text-xs font-mono">perception_node.yaml</span>
          </div>

          <button
            onClick={handleCopyYaml}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            {copiedYaml ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedYaml ? 'Copied!' : 'Copy YAML'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
          {ROS2_CONFIG_YAML}
        </pre>
      </div>
    </div>
  );
};
