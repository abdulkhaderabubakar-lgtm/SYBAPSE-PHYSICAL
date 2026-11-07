import React, { useState } from 'react';
import { RlPolicyOutput, RlStateVector } from '../types/perception';
import { BASELINE_RL_POLICY } from '../data/mockPerceptionData';
import {
  Brain,
  Sliders,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Award,
  CheckCircle2,
} from 'lucide-react';

interface RlPerceptionPolicyViewProps {
  freeSpaceRatio: number;
  robotSpeed: number;
  closestObstacleDist: number;
}

export const RlPerceptionPolicyView: React.FC<RlPerceptionPolicyViewProps> = ({
  freeSpaceRatio,
  robotSpeed,
  closestObstacleDist,
}) => {
  const [controllerComparison, setControllerComparison] = useState<'rl' | 'dwa'>('rl');
  const [policyData, setPolicyData] = useState<RlPolicyOutput>(BASELINE_RL_POLICY);

  // 16-sector simulated radar inputs
  const sectors16 = [
    0.85, 0.92, 0.95, 0.88, // Front-right
    0.65, 0.45, 0.42, 0.38, // Right (racks/obstacles)
    0.35, 0.40, 0.50, 0.62, // Rear
    0.78, 0.82, 0.86, 0.88, // Left
  ];

  return (
    <div className="space-y-6">
      {/* Policy Overview Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              Deep Reinforcement Learning Perception-Action Policy
            </h2>
            <p className="text-xs text-slate-400">
              Proximal Policy Optimization (PPO) Actor-Critic trained on multimodal camera free-space & LiDAR occupancy vectors.
            </p>
          </div>
        </div>

        {/* Controller Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Controller:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-xs">
            <button
              onClick={() => setControllerComparison('rl')}
              className={`px-3 py-1.5 font-medium rounded transition-colors ${
                controllerComparison === 'rl'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trained RL Policy (PPO)
            </button>
            <button
              onClick={() => setControllerComparison('dwa')}
              className={`px-3 py-1.5 font-medium rounded transition-colors ${
                controllerComparison === 'dwa'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Classical DWA Planner
            </button>
          </div>
        </div>
      </div>

      {/* Grid: State Vector, Reward Breakdown, Action Distribution, Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: State Space Vector & LiDAR Radar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Observation State Vector $s_t$</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Multimodal sensory fusion mapped to 24-dimensional continuous state
            </span>
          </div>

          {/* 16-Sector Radar Polar Chart (SVG) */}
          <div className="relative aspect-square max-w-[260px] mx-auto bg-slate-950 rounded-full border border-slate-800 p-2 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Concentric distance circles */}
              <circle cx="100" cy="100" r="30" fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="#334155" strokeWidth="0.8" />

              {/* 16-Sector Range Rays */}
              {sectors16.map((val, i) => {
                const angle = (i * 2 * Math.PI) / 16 - Math.PI / 2;
                const r = val * 90;
                const x2 = 100 + Math.cos(angle) * r;
                const y2 = 100 + Math.sin(angle) * r;

                return (
                  <g key={i}>
                    <line
                      x1="100"
                      y1="100"
                      x2={x2}
                      y2={y2}
                      stroke={val < 0.5 ? '#ef4444' : '#06b6d4'}
                      strokeWidth="2.5"
                    />
                    <circle cx={x2} cy={y2} r="2.5" fill={val < 0.5 ? '#ef4444' : '#38bdf8'} />
                  </g>
                );
              })}

              {/* Robot Center Marker */}
              <circle cx="100" cy="100" r="5" fill="#10b981" />
              <polygon points="100,88 96,96 104,96" fill="#f8fafc" />
            </svg>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400">
              FRONT (0°)
            </div>
          </div>

          {/* State Values List */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between bg-slate-950 p-1.5 rounded">
              <span className="text-slate-400">Free Space Ratio:</span>
              <span className="text-emerald-400 font-semibold">
                {(freeSpaceRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between bg-slate-950 p-1.5 rounded">
              <span className="text-slate-400">Closest Obstacle:</span>
              <span className="text-cyan-400 font-semibold">
                {closestObstacleDist.toFixed(2)} m
              </span>
            </div>
            <div className="flex justify-between bg-slate-950 p-1.5 rounded">
              <span className="text-slate-400">Current Velocity:</span>
              <span className="text-white font-semibold">
                {robotSpeed.toFixed(2)} m/s
              </span>
            </div>
            <div className="flex justify-between bg-slate-950 p-1.5 rounded">
              <span className="text-slate-400">Relative Bearing:</span>
              <span className="text-slate-200">-0.12 rad</span>
            </div>
          </div>
        </div>

        {/* Col 2: Reward Function Decomposition & Critic Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Multi-Objective Reward Decomposition</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Balancing goal convergence, safety clearance, and kinematic smoothness
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-medium">Goal Progress Reward (R_goal)</span>
                <span className="text-emerald-400 font-mono font-semibold">+1.42</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }} />
              </div>
              <span className="text-[10px] text-slate-500">Euclidean distance decrement towards target waypoint</span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-medium">Clearance Margin Bonus (R_clear)</span>
                <span className="text-cyan-400 font-mono font-semibold">+0.68</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '60%' }} />
              </div>
              <span className="text-[10px] text-slate-500">Maintaining &ge; 1.5m dynamic buffer from pedestrians/forklifts</span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-medium">Free Space Alignment (R_free)</span>
                <span className="text-blue-400 font-mono font-semibold">+0.55</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '50%' }} />
              </div>
              <span className="text-[10px] text-slate-500">Path overlap with camera segmented drivable corridor</span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-medium">Kinematic Smoothness (R_smooth)</span>
                <span className="text-purple-400 font-mono font-semibold">+0.35</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '35%' }} />
              </div>
              <span className="text-[10px] text-slate-500">Penalizes excessive angular acceleration jerk</span>
            </div>

            {/* Total Step Reward Summary */}
            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between font-mono mt-4">
              <div>
                <span className="text-slate-500 block text-[10px]">TOTAL STEP REWARD</span>
                <span className="text-xl font-bold text-emerald-400">+3.00</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">CRITIC VALUE V(s)</span>
                <span className="text-lg font-bold text-cyan-400">14.80</span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Action Distribution & Benchmark Comparison */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Action Selection & Benchmark</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Policy action distribution and comparative performance
            </span>
          </div>

          {/* Action Distribution Table */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Action Candidate Probabilities:</div>
            {policyData.actionDistribution.map((act, idx) => (
              <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800/80 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">{act.actionName.split(' ')[0]}</span>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {(act.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${act.probability * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>v: {act.linearVel} m/s, ω: {act.angularVel} rad/s</span>
                  <span>Q: {act.qValue.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Comparative Benchmark Box */}
          <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2 text-xs">
            <div className="text-slate-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>RL Policy vs Classical DWA Benchmark</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Path Efficiency:</span>
                <span className="text-emerald-400 font-semibold">94.6% vs 87.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avg Clearance Margin:</span>
                <span className="text-cyan-400 font-semibold">0.68m vs 0.42m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dynamic Obstacle Avoidance:</span>
                <span className="text-emerald-400 font-semibold">Proactive vs Reactive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
