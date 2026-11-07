import React, { useState } from 'react';
import {
  PerceptionAuditReport,
  PerceptionTrackedObject,
  FreeSpaceMetrics,
} from '../types/perception';
import {
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Send,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface AiPerceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PerceptionAuditReport | null;
  isLoading: boolean;
  onTriggerAudit: (customQuery?: string) => void;
  trackedObjects: PerceptionTrackedObject[];
  freeSpace: FreeSpaceMetrics;
}

export const AiPerceptionModal: React.FC<AiPerceptionModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  onTriggerAudit,
  trackedObjects,
  freeSpace,
}) => {
  const [customPrompt, setCustomPrompt] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      onTriggerAudit(customPrompt.trim());
      setCustomPrompt('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Multimodal AI Perception & Robotics Safety Audit
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Powered by Gemini 3.8 Flash · Conforming to ISO 3691-4 & NIST Standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Active Sensor Context Snapshot */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">TRACKED ENTITIES</span>
              <span className="text-white font-semibold text-sm">
                {trackedObjects.length} Active
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">FREE SPACE RATIO</span>
              <span className="text-emerald-400 font-semibold text-sm">
                {(freeSpace.traversableAreaRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">CORRIDOR CLEARANCE</span>
              <span className="text-cyan-400 font-semibold text-sm">
                {freeSpace.minClearanceWidthM.toFixed(2)} m
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-slate-300 font-medium">Evaluating Scene Perception Dynamics...</div>
              <p className="text-slate-500 text-[11px] max-w-sm text-center">
                Querying Gemini 3.8 Flash to evaluate kinematic trajectory vectors, blindspots, and ISO 3691-4 safety margins.
              </p>
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Risk Banner */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  report.riskLevel === 'CRITICAL'
                    ? 'bg-red-950/40 border-red-800 text-red-200'
                    : report.riskLevel === 'MODERATE'
                    ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {report.riskLevel === 'CRITICAL' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-semibold uppercase tracking-wider">
                    {report.riskLevel} SAFETY RISK ENVELOPE
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  Engine: {report.source}
                </span>
              </div>

              {/* Detected Hazards List */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider">
                  Perceived Spatial Hazards & Blindspots
                </span>
                <div className="space-y-1.5">
                  {report.detectedHazards.map((hazard, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-200">
                      <span className="text-cyan-400 font-mono font-bold">·</span>
                      <span>{hazard}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Damping & Control Action */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider">
                  Recommended Velocity & Kinematic Damping
                </span>
                <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                  {report.recommendedDamping}
                </p>
              </div>

              {/* RL Policy Distribution Validation */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Reinforcement Learning In-Distribution Score
                  </span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {(report.rlDistributionScore * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  {report.rlActionValidation}
                </p>
              </div>

              {/* ISO Standard Compliance Note */}
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Standard Conformance: <strong className="text-slate-200 font-mono">{report.standardCompliance}</strong></span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <p>Click "Run Scene Audit" or submit a custom inquiry below to perform a multimodal AI perception safety check.</p>
            </div>
          )}
        </div>

        {/* Custom Inquiry Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Evaluate pedestrian blindspot near pallet racking during right turn..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
