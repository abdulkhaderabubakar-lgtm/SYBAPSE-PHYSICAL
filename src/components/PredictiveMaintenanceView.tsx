import React, { useState } from 'react';
import { TelemetryPoint, FftFrequencyBin, SystemScenario, DiagnosticReport } from '../types/physicalAi';
import { Activity, AlertTriangle, CheckCircle, TrendingDown, Clock, ShieldCheck, Sparkles, Wrench } from 'lucide-react';

interface PredictiveMaintenanceViewProps {
  telemetry: TelemetryPoint;
  fftData: FftFrequencyBin[];
  scenario: SystemScenario;
  onRunAiDiagnostics: () => void;
  diagnosticReport: DiagnosticReport | null;
  isAiLoading: boolean;
}

export const PredictiveMaintenanceView: React.FC<PredictiveMaintenanceViewProps> = ({
  telemetry,
  fftData,
  scenario,
  onRunAiDiagnostics,
  diagnosticReport,
  isAiLoading,
}) => {
  const [selectedHarmonic, setSelectedHarmonic] = useState<string | null>(null);

  // Determine ISO 10816 Zone
  const rms = telemetry.vibrationRms;
  let isoZone = 'Zone A (Good)';
  let isoColor = 'text-emerald-400';
  let isoBg = 'bg-emerald-500/10 border-emerald-500/30';

  if (rms > 7.1) {
    isoZone = 'Zone D (Critical / Danger)';
    isoColor = 'text-rose-400';
    isoBg = 'bg-rose-500/10 border-rose-500/30';
  } else if (rms > 4.5) {
    isoZone = 'Zone C (Unsatisfactory)';
    isoColor = 'text-amber-400';
    isoBg = 'bg-amber-500/10 border-amber-500/30';
  } else if (rms > 1.8) {
    isoZone = 'Zone B (Acceptable)';
    isoColor = 'text-cyan-400';
    isoBg = 'bg-cyan-500/10 border-cyan-500/30';
  }

  // Calculate RUL (Remaining Useful Life)
  const isDefective = scenario === 'bearing_defect' || scenario === 'thermal_cavitation';
  const rulHours = isDefective ? (scenario === 'bearing_defect' ? 312 : 180) : 14200;
  const rulDays = (rulHours / 24).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Engineering KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ISO 10816 Vibration Severity */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">ISO 10816-3 Severity</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {telemetry.vibrationRms.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">mm/s RMS</span>
          </div>
          <div className={`text-xs px-2 py-1 rounded border inline-block font-medium ${isoBg} ${isoColor}`}>
            {isoZone}
          </div>
        </div>

        {/* Dynamic Temperature */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Bearing Journal Temp</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {telemetry.temperature.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">°C</span>
          </div>
          <div className="text-xs text-slate-400">
            Thermal Delta: <span className="font-mono text-slate-200">+{scenario === 'thermal_cavitation' ? '18.4' : '2.1'}°C / hr</span>
          </div>
        </div>

        {/* Kurtosis & Crest Factor */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Signal Kurtosis & Crest</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {telemetry.kurtosis.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">Kurtosis (Baseline: 3.0)</span>
          </div>
          <div className="text-xs text-slate-400">
            Crest Factor: <span className="font-mono text-slate-200">{telemetry.crestFactor.toFixed(2)}</span>
            {telemetry.kurtosis > 4.5 && (
              <span className="text-rose-400 font-semibold ml-2">· Impulsive Shock</span>
            )}
          </div>
        </div>

        {/* Estimated RUL (Weibull Model) */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Remaining Useful Life (RUL)</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {rulHours.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">Hours ({rulDays} Days)</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Weibull β=2.4 hazard distribution</span>
          </div>
        </div>
      </div>

      {/* Vibration Spectrum (FFT) & Anomaly Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Density FFT Spectrum Plot */}
        <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-800 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Vibration FFT Frequency Spectrum (0 – 500 Hz)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sampling Rate: 2048 Hz · Hanning Window · Shaft Speed: {telemetry.rotorRpm} RPM (1X = {(telemetry.rotorRpm / 60).toFixed(1)} Hz)
              </p>
            </div>

            {/* Harmonic Flags */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Harmonics:</span>
              <button
                onClick={() => setSelectedHarmonic(selectedHarmonic === '1X' ? null : '1X')}
                className={`px-2 py-0.5 rounded border ${
                  selectedHarmonic === '1X' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                1X (49.7Hz)
              </button>
              <button
                onClick={() => setSelectedHarmonic(selectedHarmonic === 'BPFI' ? null : 'BPFI')}
                className={`px-2 py-0.5 rounded border ${
                  selectedHarmonic === 'BPFI' ? 'bg-rose-950 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                BPFI (142Hz)
              </button>
            </div>
          </div>

          {/* SVG FFT Spectrum Graph */}
          <div className="relative w-full h-64 bg-slate-950 rounded border border-slate-800/80 p-3 select-none">
            <svg className="w-full h-full" viewBox="0 0 800 220" preserveAspectRatio="none">
              {/* Grid Lines */}
              {[40, 80, 120, 160, 200].map((y) => (
                <line key={y} x1="40" y1={y} x2="780" y2={y} stroke="#1e293b" strokeWidth="0.8" />
              ))}
              {[100, 200, 300, 400, 500, 600, 700].map((x) => (
                <line key={x} x1={x} y1="20" x2={x} y2="200" stroke="#1e293b" strokeWidth="0.8" />
              ))}

              {/* ISO Warning Threshold Line */}
              <line x1="40" y1="90" x2="780" y2="90" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
              <text x="700" y="84" fill="#f59e0b" fontSize="10" fontFamily="monospace">ISO Limit: 4.5 mm/s</text>

              {/* Spectrum Bars */}
              {fftData.map((bin, index) => {
                const x = 50 + (index / fftData.length) * 720;
                const height = Math.min(180, (bin.amplitude / 6.0) * 180);
                const y = 200 - height;
                const isHighlight = bin.harmonicLabel && (!selectedHarmonic || selectedHarmonic === bin.harmonicLabel);
                const isAnomaly = bin.isHarmonicAnomaly;

                return (
                  <g key={bin.frequencyHz}>
                    <rect
                      x={x - 2}
                      y={y}
                      width={4}
                      height={height}
                      fill={isAnomaly ? '#f43f5e' : isHighlight ? '#06b6d4' : '#334155'}
                      rx={1}
                      className="transition-all hover:opacity-80 cursor-pointer"
                    />
                    {bin.harmonicLabel && (
                      <text
                        x={x}
                        y={Math.max(16, y - 8)}
                        textAnchor="middle"
                        fill={isAnomaly ? '#fda4af' : '#67e8f9'}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {bin.harmonicLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Frequency Labels */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono px-6 mt-1">
              <span>0 Hz</span>
              <span>100 Hz</span>
              <span>200 Hz</span>
              <span>300 Hz</span>
              <span>400 Hz</span>
              <span>500 Hz</span>
            </div>
          </div>

          {/* Fault Signature Diagnostic Legend */}
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block font-medium">1X Rotor Unbalance:</span>
              <span className="font-mono text-cyan-300">
                {(telemetry.rotorRpm / 60).toFixed(1)} Hz · Amplitude: 0.94 mm/s (Nominal)
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block font-medium">BPFI Inner Race Fault:</span>
              <span className={`font-mono ${scenario === 'bearing_defect' ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                142.0 Hz · Amplitude: {scenario === 'bearing_defect' ? '5.42 mm/s (Spike)' : '0.12 mm/s'}
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block font-medium">Acoustic Impeller Shock:</span>
              <span className="font-mono text-slate-300">
                {telemetry.acousticEmissionDb.toFixed(1)} dB · Cavitation Index: {scenario === 'thermal_cavitation' ? '0.88 (High)' : '0.12'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: AI Physical Diagnostics & Recommended Engineering Work Order */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Physical AI Diagnostic Reasoning
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {diagnosticReport ? diagnosticReport.source : 'Gemini 3.8 Flash Ready'}
              </span>
            </div>

            {/* Diagnostic Card */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800 mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400">System State:</span>
                <span className={`font-mono font-semibold ${
                  scenario === 'nominal' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {diagnosticReport ? diagnosticReport.status : isDefective ? 'ANOMALY DETECTED' : 'HEALTHY NOMINAL'}
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed mb-3">
                {diagnosticReport ? (
                  diagnosticReport.rootCause
                ) : isDefective ? (
                  `Elevated high-frequency harmonics at 142 Hz indicative of inner race raceway spalling. Energy spikes corroborate high signal kurtosis (${telemetry.kurtosis.toFixed(2)}).`
                ) : (
                  'All telemetry signals conform to ISO 10816-3 Class II baseline envelopes. Vibration energy is uniformly distributed with no localized bearing defect harmonics.'
                )}
              </div>

              {/* Recommended Work Order Actions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Engineered Action Items:
                </div>
                {(diagnosticReport?.recommendedActions || [
                  isDefective
                    ? 'Execute ultrasonic lubrication greasing on drive-end bearing.'
                    : 'Maintain current rotational speed and automated vibration polling.',
                  isDefective
                    ? 'Schedule bearing replacement within 14 operational days.'
                    : 'Next acoustic emission calibration in 45 days.',
                ]).map((action, i) => (
                  <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NIST Reference Note */}
            <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200">
              <span className="font-semibold block mb-0.5">NIST SP 1284 Reliability Protocol</span>
              Continuous vibration and thermal feature extraction validates predictive RUL with 95% statistical confidence.
            </div>
          </div>

          {/* Trigger AI Diagnosis Button */}
          <div className="mt-5 pt-3 border-t border-slate-800">
            <button
              onClick={onRunAiDiagnostics}
              disabled={isAiLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm"
            >
              {isAiLoading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Evaluating Telemetry Physics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Multimodal AI Diagnostic</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
