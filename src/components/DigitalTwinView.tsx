import React, { useState } from 'react';
import { DigitalTwinSensor, SystemScenario, AmrRobot } from '../types/physicalAi';
import { Layers, Thermometer, Radio, Maximize2, ShieldCheck, Compass, Gauge, AlertCircle } from 'lucide-react';

interface DigitalTwinViewProps {
  sensors: DigitalTwinSensor[];
  selectedSensorId: string;
  onSelectSensor: (sensorId: string) => void;
  scenario: SystemScenario;
  amrFleet: AmrRobot[];
  pumpImage: string;
  roboticCellImage: string;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  sensors,
  selectedSensorId,
  onSelectSensor,
  scenario,
  amrFleet,
  pumpImage,
  roboticCellImage,
}) => {
  const [selectedCell, setSelectedCell] = useState<'cell-01' | 'cell-02' | 'cell-03' | 'cell-04'>('cell-01');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLidarBeams, setShowLidarBeams] = useState(true);
  const [showSafetyBoundaries, setShowSafetyBoundaries] = useState(true);

  const selectedSensor = sensors.find((s) => s.id === selectedSensorId) || sensors[0];

  const workcells = [
    {
      id: 'cell-01' as const,
      name: 'Cell 01: Hydraulic Turbopump',
      type: 'Rotating Equipment',
      status: scenario === 'bearing_defect' || scenario === 'thermal_cavitation' ? 'Degraded' : 'Nominal',
      sensorsCount: 4,
    },
    {
      id: 'cell-02' as const,
      name: 'Cell 02: 6-Axis Robotic Assembly',
      type: 'Robotic Manipulator',
      status: 'Nominal',
      sensorsCount: 6,
    },
    {
      id: 'cell-03' as const,
      name: 'Cell 03: Automated Optical Inspection',
      type: 'Vision & Metrology',
      status: scenario === 'optical_microfracture' ? 'Defect Alert' : 'Nominal',
      sensorsCount: 3,
    },
    {
      id: 'cell-04' as const,
      name: 'Cell 04: AMR Fleet Logistics',
      type: 'Autonomous Mobile Robots',
      status: scenario === 'safety_intrusion' ? 'Safety Veto Active' : 'Nominal',
      sensorsCount: 3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workcell Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {workcells.map((cell) => {
          const isSelected = selectedCell === cell.id;
          return (
            <button
              key={cell.id}
              onClick={() => setSelectedCell(cell.id)}
              className={`text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="text-xs text-slate-400 font-mono mb-1">{cell.type}</div>
              <div className="text-sm font-semibold text-white truncate mb-2">{cell.name}</div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className={cell.status !== 'Nominal' ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                  {cell.status}
                </span>
                <span className="font-mono">{cell.sensorsCount} Sensors</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Digital Twin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left 2 Cols: High-Fidelity Spatial Canvas & Equipment Twin */}
        <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Physical Environment & Spatial Twin
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Plant Coordinate Reference: WGS-84 / ISO 23247</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Edge Synced: 4.8ms</span>
                </div>
              </div>

              {/* Layer Toggles */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-800">
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    showHeatmap ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Thermal Gradient Layer"
                >
                  <Thermometer className="w-3.5 h-3.5 inline mr-1" />
                  Thermal
                </button>
                <button
                  onClick={() => setShowLidarBeams(!showLidarBeams)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    showLidarBeams ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle LiDAR Range Scanners"
                >
                  <Radio className="w-3.5 h-3.5 inline mr-1" />
                  LiDAR
                </button>
                <button
                  onClick={() => setShowSafetyBoundaries(!showSafetyBoundaries)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    showSafetyBoundaries ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Safety Exclusion Zones"
                >
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                  Safety Zones
                </button>
              </div>
            </div>

            {/* Spatial Plant Map (SVG Vector Environment Simulation) */}
            <div className="relative w-full h-80 rounded-md bg-slate-950 border border-slate-800/80 overflow-hidden select-none">
              <svg className="w-full h-full" viewBox="0 0 1000 500">
                <defs>
                  {/* Floor Grid Pattern */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                  </pattern>

                  {/* Thermal Heatmap Gradient */}
                  <radialGradient id="heatCell01" cx="240" cy="200" r="180" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={scenario === 'thermal_cavitation' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.25)'} />
                    <stop offset="60%" stopColor="rgba(245, 158, 11, 0.08)" />
                    <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
                  </radialGradient>

                  <radialGradient id="lidarPulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(6, 182, 212, 0.3)" />
                    <stop offset="85%" stopColor="rgba(6, 182, 212, 0.05)" />
                    <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
                  </radialGradient>
                </defs>

                {/* Base Grid */}
                <rect width="1000" height="500" fill="#030712" />
                <rect width="1000" height="500" fill="url(#grid)" />

                {/* Thermal Overlay */}
                {showHeatmap && (
                  <circle cx="240" cy="200" r="180" fill="url(#heatCell01)" />
                )}

                {/* Factory Pathways / Transit Lanes */}
                <path
                  d="M 120 380 L 880 380 M 500 80 L 500 440 M 240 80 L 240 380 M 760 80 L 760 380"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />

                {/* Workcell Zones */}
                {/* Cell 01: Hydraulic Turbomachine */}
                <rect
                  x="100"
                  y="90"
                  width="280"
                  height="220"
                  rx="6"
                  fill="#0f172a"
                  stroke={selectedCell === 'cell-01' ? '#06b6d4' : '#1e293b'}
                  strokeWidth={selectedCell === 'cell-01' ? '2' : '1'}
                  className="cursor-pointer transition-colors"
                  onClick={() => setSelectedCell('cell-01')}
                />
                <text x="120" y="125" fill="#94a3b8" fontSize="13" fontWeight="600" fontFamily="sans-serif">
                  CELL 01: HYDRAULIC TURBOMACHINERY
                </text>

                {/* Equipment Footprint Pump */}
                <rect x="150" y="150" width="180" height="110" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <circle cx="200" cy="205" r="32" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                <rect x="232" y="195" width="75" height="20" fill="#475569" rx="2" />

                {/* Sensor Indicators on Turbopump */}
                <circle
                  cx="200"
                  cy="175"
                  r="6"
                  fill={selectedSensorId === 'VIB-01' ? '#22d3ee' : '#0284c7'}
                  className="cursor-pointer hover:r-8 transition-all"
                  onClick={() => onSelectSensor('VIB-01')}
                />
                <text x="212" y="179" fill="#e2e8f0" fontSize="11" fontFamily="monospace">VIB-01</text>

                <circle
                  cx="290"
                  cy="205"
                  r="6"
                  fill={selectedSensorId === 'TEMP-02' ? '#22d3ee' : '#0284c7'}
                  className="cursor-pointer"
                  onClick={() => onSelectSensor('TEMP-02')}
                />
                <text x="302" y="209" fill="#e2e8f0" fontSize="11" fontFamily="monospace">TEMP-02</text>

                {/* Cell 02: 6-Axis Robot */}
                <rect
                  x="420"
                  y="90"
                  width="260"
                  height="220"
                  rx="6"
                  fill="#0f172a"
                  stroke={selectedCell === 'cell-02' ? '#06b6d4' : '#1e293b'}
                  strokeWidth={selectedCell === 'cell-02' ? '2' : '1'}
                  className="cursor-pointer transition-colors"
                  onClick={() => setSelectedCell('cell-02')}
                />
                <text x="440" y="125" fill="#94a3b8" fontSize="13" fontWeight="600" fontFamily="sans-serif">
                  CELL 02: 6-AXIS ASSEMBLY
                </text>
                <circle cx="550" cy="205" r="40" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <line x1="550" y1="205" x2="600" y2="175" stroke="#eab308" strokeWidth="8" strokeLinecap="round" />
                <line x1="600" y1="175" x2="625" y2="220" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />

                {/* Cell 03: Optical Inspection */}
                <rect
                  x="720"
                  y="90"
                  width="220"
                  height="220"
                  rx="6"
                  fill="#0f172a"
                  stroke={selectedCell === 'cell-03' ? '#06b6d4' : '#1e293b'}
                  strokeWidth={selectedCell === 'cell-03' ? '2' : '1'}
                  className="cursor-pointer transition-colors"
                  onClick={() => setSelectedCell('cell-03')}
                />
                <text x="735" y="125" fill="#94a3b8" fontSize="13" fontWeight="600" fontFamily="sans-serif">
                  CELL 03: OPTICAL AOI
                </text>
                <rect x="760" y="160" width="140" height="90" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <circle cx="830" cy="205" r="22" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 2" />

                {/* Safety Keep-Out Boundaries */}
                {showSafetyBoundaries && (
                  <>
                    <rect
                      x="400"
                      y="70"
                      width="300"
                      height="260"
                      rx="10"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="1.5"
                      strokeDasharray="8 6"
                      opacity="0.6"
                    />
                    <text x="410" y="85" fill="#eab308" fontSize="10" fontFamily="monospace">ISO 10218 SAFETY ENVELOPE</text>
                  </>
                )}

                {/* AMR Mobile Robots Running on Map */}
                {amrFleet.map((amr) => {
                  const x = amr.position.x * 10;
                  const y = amr.position.y * 5;
                  const isVetoed = amr.safetyVetoActive || (scenario === 'safety_intrusion' && amr.id === 'AMR-04');
                  return (
                    <g key={amr.id} className="cursor-pointer" transform={`translate(${x}, ${y})`}>
                      {/* LiDAR scan ring */}
                      {showLidarBeams && (
                        <circle
                          cx="0"
                          cy="0"
                          r={isVetoed ? 60 : 45}
                          fill="url(#lidarPulse)"
                          stroke={isVetoed ? '#ef4444' : '#06b6d4'}
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                      )}
                      {/* Robot Body */}
                      <rect
                        x="-18"
                        y="-12"
                        width="36"
                        height="24"
                        rx="4"
                        fill={isVetoed ? '#991b1b' : '#0e7490'}
                        stroke={isVetoed ? '#f87171' : '#22d3ee'}
                        strokeWidth="1.5"
                      />
                      {/* Directional heading marker */}
                      <circle cx="10" cy="0" r="3" fill="#ffffff" />
                      <text x="-16" y="22" fill="#e2e8f0" fontSize="9" fontFamily="monospace" fontWeight="600">
                        {amr.id}
                      </text>
                    </g>
                  );
                })}

                {/* Human Operator Beacon (for safety hazard scenario) */}
                {scenario === 'safety_intrusion' && (
                  <g transform="translate(420, 260)">
                    <circle cx="0" cy="0" r="28" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="0" cy="0" r="7" fill="#ef4444" />
                    <text x="-35" y="-14" fill="#fca5a5" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      HUMAN PROXIMITY: 1.1m (INTERLOCK TRIP)
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Plant Telemetry Summary Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                AMR Fleet Active: {amrFleet.length} Units
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                PLC Bus: Profinet IRT (0.5ms jitter)
              </span>
            </div>
            <div className="text-slate-400 font-mono">
              Workcell Coordinates: X: 14.82m · Y: 8.40m · Z: 2.15m
            </div>
          </div>
        </div>

        {/* Right Col: Machine Twin Photo & Sensor Telemetry Feed */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Physical Machine Twin</h3>
              <span className="text-xs font-mono text-cyan-400">
                {selectedCell === 'cell-01' ? 'ISO 10816 Class II' : 'ISO 10218-1'}
              </span>
            </div>

            {/* High-Fidelity Machine Photo */}
            <div className="relative rounded overflow-hidden mb-4 border border-slate-800 aspect-video bg-slate-950">
              <img
                src={selectedCell === 'cell-01' ? pumpImage : roboticCellImage}
                alt="Physical Equipment Twin"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                <div className="text-xs text-slate-200 font-mono">
                  {selectedCell === 'cell-01'
                    ? 'Turbopump Assembly #P-882 (Drive-End Sensor Array)'
                    : '6-Axis Articulated Cell #R-412 (Assembly & AOI)'}
                </div>
              </div>
            </div>

            {/* Live Sensor Telemetry on this Unit */}
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Attached Edge Sensors
            </h4>

            <div className="space-y-2">
              {sensors.map((sensor) => {
                const isSelected = sensor.id === selectedSensorId;
                const isWarning = sensor.currentValue > sensor.isoLimit;
                return (
                  <button
                    key={sensor.id}
                    onClick={() => onSelectSensor(sensor.id)}
                    className={`w-full text-left p-2.5 rounded border transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500'
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium text-white flex items-center gap-2">
                        <span className="font-mono text-cyan-400">{sensor.id}</span>
                        <span className="truncate max-w-[140px] text-slate-300">{sensor.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{sensor.location}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-mono font-semibold tabular-nums ${isWarning ? 'text-amber-400' : 'text-slate-100'}`}>
                        {sensor.currentValue.toFixed(1)} {sensor.unit}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Limit: {sensor.isoLimit}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Sensor Quick Detail */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Selected Point:</span>
              <span className="font-mono text-cyan-300 font-semibold">{selectedSensor.id}</span>
            </div>
            <div className="text-slate-400 text-[11px] leading-relaxed">
              Real-time spectral analysis active. Kinematic data streaming directly to NIST-compliant edge digital twin models.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
