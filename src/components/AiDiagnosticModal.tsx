import React, { useState } from 'react';
import { DiagnosticReport, TelemetryPoint, SystemScenario } from '../types/physicalAi';
import { X, Sparkles, Activity, CheckCircle2, AlertTriangle, FileText, Send, Wrench, Shield } from 'lucide-react';

interface AiDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DiagnosticReport | null;
  telemetry: TelemetryPoint;
  scenario: SystemScenario;
  isLoading: boolean;
  onTriggerDiagnosis: (customNote?: string) => void;
}

export const AiDiagnosticModal: React.FC<AiDiagnosticModalProps> = ({
  isOpen,
  onClose,
  report,
  telemetry,
  scenario,
  isLoading,
  onTriggerDiagnosis,
}) => {
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim()) return;
    onTriggerDiagnosis(customNote);
    setCustomNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Physical AI Diagnostic Reasoning Engine
              </h3>
              <p className="text-xs text-slate-400">
                Grounding: NIST SP 1284 Smart Manufacturing · ISO 10816-3 Vibration Severity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Active Physical Telemetry Snapshot */}
          <div className="p-3 bg-slate-950 rounded border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Vibration RMS</span>
              <span className="font-mono text-cyan-300 font-semibold">{telemetry.vibrationRms.toFixed(2)} mm/s</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bearing Temp</span>
              <span className="font-mono text-slate-200 font-semibold">{telemetry.temperature.toFixed(1)} °C</span>
            </div>
            <div>
              <span className="text-slate-500 block">Rotor Speed</span>
              <span className="font-mono text-slate-200 font-semibold">{telemetry.rotorRpm} RPM</span>
            </div>
            <div>
              <span className="text-slate-500 block">Signal Kurtosis</span>
              <span className={`font-mono font-semibold ${telemetry.kurtosis > 4 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {telemetry.kurtosis.toFixed(2)}
              </span>
            </div>
          </div>

          {/* AI Analysis Output */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-sm font-semibold text-white">Synthesizing Physical Kinematics...</div>
              <p className="text-xs text-slate-400 max-w-sm">
                Running multi-sensor correlation against 2026 NIST smart-manufacturing vibration and thermal degradation tensors.
              </p>
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Status & Confidence Banner */}
              <div className="flex items-center justify-between p-3 rounded bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Diagnostic Verdict:</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    report.status === 'NOMINAL'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Confidence: <span className="text-white font-semibold">{(report.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Physical Root Cause */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Physics & Reliability Root Cause
                </h4>
                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  {report.rootCause}
                </div>
              </div>

              {/* Remaining Useful Life */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-xs text-slate-500 block mb-0.5">Estimated RUL</span>
                  <span className="text-lg font-bold font-mono text-cyan-300">
                    {report.rulHours.toLocaleString()} Hours
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                    ({(report.rulHours / 24).toFixed(1)} Operational Days)
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-xs text-slate-500 block mb-0.5">Reliability Model</span>
                  <span className="text-sm font-semibold text-white block">Weibull 2-Parameter</span>
                  <span className="text-[11px] text-slate-400 font-mono">{report.rulConfidence}</span>
                </div>
              </div>

              {/* Engineered Actions */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                  Recommended Maintenance Work Order
                </h4>
                <div className="space-y-1.5">
                  {report.recommendedActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-slate-950 rounded border border-slate-800 text-xs text-slate-200">
                      <span className="text-cyan-400 font-mono font-bold mt-0.5">0{i + 1}.</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* NIST Note */}
              <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-200">
                <span className="font-semibold block mb-0.5">NIST SP 1284 Compliance Note</span>
                {report.nistComplianceNote}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No report generated yet. Click the button below to execute analysis.
            </div>
          )}

          {/* Prompt Engineer Note Input */}
          <form onSubmit={handleSubmitNote} className="pt-3 border-t border-slate-800">
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Add Field Engineer Observation / Custom Parameter:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Acoustic stethoscope detected harmonic chatter at bearing drive-end..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Re-evaluate</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Engine: Google Gemini 3.8 Flash + Physics Invariant Model</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
