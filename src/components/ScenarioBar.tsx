import React from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, Cpu, Shield, Eye, Flame } from 'lucide-react';
import { SystemScenario } from '../types/physicalAi';

interface ScenarioBarProps {
  scenario: SystemScenario;
  onSelectScenario: (scenario: SystemScenario) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
  activeWorkcell: string;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  scenario,
  onSelectScenario,
  isPlaying,
  onTogglePlay,
  onReset,
  simSpeed,
  onSetSimSpeed,
  activeWorkcell,
}) => {
  const scenarios: { id: SystemScenario; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'nominal',
      label: 'Nominal Baseline',
      icon: <Cpu className="w-3.5 h-3.5" />,
      desc: 'All cells operating within ISO 10816 normal limits',
    },
    {
      id: 'bearing_defect',
      label: 'Bearing Inner Race Fault',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      desc: 'BPFI 142Hz harmonic spike & high kurtosis on Cell 01 pump',
    },
    {
      id: 'thermal_cavitation',
      label: 'Thermal & Cavitation Loss',
      icon: <Flame className="w-3.5 h-3.5" />,
      desc: 'Inlet pressure drop & +18°C temperature runaway',
    },
    {
      id: 'safety_intrusion',
      label: 'Operator Safety Hazard',
      icon: <Shield className="w-3.5 h-3.5" />,
      desc: 'Human enters AMR transit lane triggering safety veto',
    },
    {
      id: 'optical_microfracture',
      label: 'AOI Micro-Fracture Defect',
      icon: <Eye className="w-3.5 h-3.5" />,
      desc: 'Sub-millimeter fatigue crack detected on aerospace gear',
    },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Simulation Execution Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Physics' : 'Resume Physics'}</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-800/80 rounded p-0.5 border border-slate-700/60">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onSetSimSpeed(speed)}
                className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors ${
                  simSpeed === speed
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Unboxed Metadata (Zero-Pill Discipline) */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Tick: 100Hz</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Target: {activeWorkcell}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>NIST SP 1284 Compliant</span>
          </div>
        </div>

        {/* Physical Anomaly Injection Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-xs text-slate-400 shrink-0 mr-1 font-medium">
            Test Scenario:
          </span>
          {scenarios.map((sc) => {
            const isSelected = scenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs whitespace-nowrap transition-colors shrink-0 font-medium ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
                }`}
                title={sc.desc}
              >
                {sc.icon}
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
