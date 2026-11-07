import React, { useState } from 'react';
import { InspectionDefect } from '../types/physicalAi';
import { Eye, CheckCircle2, AlertOctagon, RefreshCw, Sliders, Sparkles, FileText, Activity } from 'lucide-react';

interface VisualInspectionViewProps {
  inspectionImage: string;
  defects: InspectionDefect[];
  onInspectDefectWithAi: (defect: InspectionDefect) => void;
  isAiInspecting: boolean;
  aiDispositionResult: any | null;
}

export const VisualInspectionView: React.FC<VisualInspectionViewProps> = ({
  inspectionImage,
  defects,
  onInspectDefectWithAi,
  isAiInspecting,
  aiDispositionResult,
}) => {
  const [selectedDefectId, setSelectedDefectId] = useState<string>(defects[0]?.id || 'DEF-8821');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(90);
  const [toleranceMicrons, setToleranceMicrons] = useState<number>(25);
  const [showLaserCrosshair, setShowLaserCrosshair] = useState<boolean>(true);

  const activeDefect = defects.find((d) => d.id === selectedDefectId) || defects[0];

  // Profilometer laser scan line data
  const profilometerPoints = [
    { x: 0, depth: 0.2 },
    { x: 10, depth: -0.4 },
    { x: 20, depth: 0.1 },
    { x: 30, depth: -0.8 },
    { x: 38, depth: -2.1 },
    { x: 42, depth: -18.4 },
    { x: 44, depth: -52.0 },
    { x: 46, depth: activeDefect.depthDeviationMicrons }, // Defect trough!
    { x: 48, depth: -48.2 },
    { x: 50, depth: -15.1 },
    { x: 60, depth: -0.5 },
    { x: 70, depth: 0.4 },
    { x: 80, depth: -0.2 },
    { x: 90, depth: 0.6 },
    { x: 100, depth: 0.1 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Quality Control KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">AOI Yield Rate (Current Shift)</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">98.84%</span>
            <span className="text-xs text-slate-400">First-Pass Yield</span>
          </div>
          <div className="text-xs text-slate-400">1,420 inspected · 16 reworks · 2 scrap</div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Metrology Cycle Time</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">418 ms</span>
            <span className="text-xs text-slate-400">/ Part</span>
          </div>
          <div className="text-xs text-slate-400">20.4 Megapixel HDR Optical + Line Laser</div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Current Tolerance Band</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">±{toleranceMicrons} µm</span>
            <span className="text-xs text-slate-400">ISO 2768-m</span>
          </div>
          <div className="text-xs text-slate-400">CNC Aerospace Alloy 7075-T6</div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Defect Dispositions</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">1 Active</span>
            <span className="text-xs text-slate-400">Awaiting Disposition</span>
          </div>
          <div className="text-xs text-slate-400">ASTM E399 Stress Concentration Risk</div>
        </div>
      </div>

      {/* Main Inspection Chamber Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Res Camera Viewport with Real AI Bounding Box */}
        <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Automated Optical Inspection (AOI) - Camera Feed 01
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Sensor: Sony Pregius S 24.5MP Global Shutter</span>
                  <span aria-hidden="true">·</span>
                  <span>Magnification: 12x Telecentric</span>
                </div>
              </div>

              {/* View Overlay Controls */}
              <button
                onClick={() => setShowLaserCrosshair(!showLaserCrosshair)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  showLaserCrosshair
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Laser Crosshair: {showLaserCrosshair ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* High-Resolution Optical Inspection Feed with Bounding Box */}
            <div className="relative rounded overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] group select-none">
              <img
                src={inspectionImage}
                alt="Automated Optical Inspection Component"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Laser Line Profilometer Grid Overlay */}
              {showLaserCrosshair && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Horizontal laser scan line */}
                  <div className="absolute top-[46%] left-0 right-0 h-[1.5px] bg-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  {/* Vertical optical center */}
                  <div className="absolute top-0 bottom-0 left-[52%] w-[1.5px] bg-cyan-400/40" />
                  {/* Micron Coordinate Crosshairs */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-2 py-1 text-[11px] font-mono text-cyan-300">
                    X: +14.280mm · Y: -04.120mm · Focus: 99.8%
                  </div>
                </div>
              )}

              {/* Defect Bounding Boxes */}
              {defects.map((defect) => {
                const isSelected = defect.id === selectedDefectId;
                return (
                  <div
                    key={defect.id}
                    onClick={() => setSelectedDefectId(defect.id)}
                    style={{
                      left: `${defect.bbox.x}%`,
                      top: `${defect.bbox.y}%`,
                      width: `${defect.bbox.width}%`,
                      height: `${defect.bbox.height}%`,
                    }}
                    className={`absolute cursor-pointer transition-all border-2 rounded ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                        : 'border-amber-400/80 bg-amber-400/10 hover:border-rose-400'
                    }`}
                  >
                    <div className="absolute -top-6 left-0 bg-slate-950/95 border border-slate-800 text-[10px] font-mono px-1.5 py-0.5 rounded text-rose-300 whitespace-nowrap shadow-sm">
                      {defect.type} ({(defect.confidence * 100).toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Surface Laser Profilometry Depth Profile Graph */}
            <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300">
                  Laser Profilometer Cross-Section Scan (Flank Root)
                </span>
                <span className="font-mono text-rose-400 text-[11px]">
                  Max Depth Trough: {activeDefect.depthDeviationMicrons.toFixed(1)} µm
                </span>
              </div>

              <div className="h-20 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="none">
                  {/* Zero reference level */}
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#334155" strokeWidth="0.8" />
                  <text x="2" y="16" fill="#64748b" fontSize="5" fontFamily="monospace">0.0 µm</text>

                  {/* Tolerance boundary line (-25 µm) */}
                  <line x1="0" y1="45" x2="100" y2="45" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
                  <text x="75" y="42" fill="#f59e0b" fontSize="5" fontFamily="monospace">-25 µm Limit</text>

                  {/* Surface Profile Curve */}
                  <path
                    d={`M 0,20 ${profilometerPoints
                      .map((p) => `L ${p.x},${Math.min(75, Math.max(15, 20 - p.depth * 0.8))}`)
                      .join(' ')}`}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Inspection Audit Strip */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Traceability Hash: <code className="text-slate-300 font-mono">LOT-2026-X84-0419</code></span>
            <span>ASTM E399 Standard Reference</span>
          </div>
        </div>

        {/* Right Col: Defect Metadata & AI Metallurgical Disposition */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Active Defect Telemetry</h3>
              <span className="text-xs font-mono text-cyan-400">{activeDefect.id}</span>
            </div>

            {/* Defect Selector Pills */}
            <div className="space-y-2 mb-4">
              {defects.map((def) => {
                const isSelected = def.id === selectedDefectId;
                return (
                  <button
                    key={def.id}
                    onClick={() => setSelectedDefectId(def.id)}
                    className={`w-full text-left p-2.5 rounded border transition-colors ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span className="text-white">{def.type}</span>
                      <span className="font-mono text-rose-400">{(def.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{def.notes}</div>
                  </button>
                );
              })}
            </div>

            {/* Threshold Inspection Sliders */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800 mb-4 space-y-3">
              <div className="text-xs font-semibold text-slate-300">Optical Inspection Calibration</div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Confidence Threshold</span>
                  <span className="font-mono text-white">{confidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="99"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="w-full accent-cyan-500 h-1 bg-slate-800 rounded"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Surface Tolerance Band</span>
                  <span className="font-mono text-white">±{toleranceMicrons} µm</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={toleranceMicrons}
                  onChange={(e) => setToleranceMicrons(Number(e.target.value))}
                  className="w-full accent-cyan-500 h-1 bg-slate-800 rounded"
                />
              </div>
            </div>

            {/* AI Metallurgical Disposition Card */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400">Engineering Disposition:</span>
                <span className="font-mono font-bold text-amber-400">
                  {aiDispositionResult ? aiDispositionResult.disposition : 'REWORK MANDATORY'}
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed mb-3">
                {aiDispositionResult ? (
                  aiDispositionResult.metallurgicalImpact
                ) : (
                  'Depth trough of 68.4 µm exceeds allowable ±25 µm specification. Stress concentration factor Kt ~ 2.45 at flank radius creates high risk of cyclic fatigue spalling.'
                )}
              </div>

              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                Prescribed Corrective Action:
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {(aiDispositionResult?.actionItems || [
                  'Route part to Station 4 CNC precision micro-honing cell.',
                  'Verify tooth root radius with laser triangulation probe.',
                  'Re-run automated optical inspection pass post-rework.',
                ]).map((act: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-mono">0{i + 1}.</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trigger Gemini Multimodal Disposition */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onInspectDefectWithAi(activeDefect)}
              disabled={isAiInspecting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm"
            >
              {isAiInspecting ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Analyzing Metallurgical Physics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Metallurgical Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
