import React from 'react';
import { PerceptionScenarioId } from '../types/perception';
import { PERCEPTION_SCENARIOS } from '../data/mockPerceptionData';
import {
  Play,
  Pause,
  RotateCcw,
  Camera,
  Activity,
  Layers,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface PerceptionStatusBarProps {
  currentScenario: PerceptionScenarioId;
  onSelectScenario: (id: PerceptionScenarioId) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
  trackedEntitiesCount: number;
  freeSpacePercent: number;
  inferenceMs: number;
}

export const PerceptionStatusBar: React.FC<PerceptionStatusBarProps> = ({
  currentScenario,
  onSelectScenario,
  isPlaying,
  onTogglePlay,
  onReset,
  simSpeed,
  onSetSimSpeed,
  trackedEntitiesCount,
  freeSpacePercent,
  inferenceMs,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Scenario Selectors */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Perception Feed:</span>
          </span>
          <div className="flex items-center gap-1">
            {PERCEPTION_SCENARIOS.map((scen) => (
              <button
                key={scen.id}
                onClick={() => onSelectScenario(scen.id)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  currentScenario === scen.id
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {scen.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Simulation Controls & Speed */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={onTogglePlay}
              className="p-1 rounded text-slate-300 hover:bg-slate-800 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onReset}
              className="p-1 rounded text-slate-300 hover:bg-slate-800 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <span>Speed:</span>
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onSetSimSpeed(s)}
                className={`px-1.5 py-0.5 rounded ${
                  simSpeed === s
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Live Telemetry Ticker */}
        <div className="flex items-center gap-4 font-mono text-slate-400 text-[11px]">
          <div>
            <span>Tracker: </span>
            <strong className="text-white">{trackedEntitiesCount} Entities</strong>
          </div>
          <div>
            <span>Free Space: </span>
            <strong className="text-emerald-400">{freeSpacePercent.toFixed(1)}%</strong>
          </div>
          <div>
            <span>Latency: </span>
            <strong className="text-cyan-400">{inferenceMs.toFixed(1)}ms</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
