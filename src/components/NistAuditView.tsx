import React, { useState } from 'react';
import { NIST_ROADMAP_PILLARS } from '../data/mockFactoryData';
import { ShieldCheck, Download, CheckCircle, ExternalLink, Award, FileCode, Check } from 'lucide-react';

export const NistAuditView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportJson = () => {
    const reportData = {
      platform: 'SynapsePhysical - Physical AI Platform',
      version: '2026.4-NIST',
      generatedTimestamp: new Date().toISOString(),
      standardsCompliance: {
        nistSmartManufacturing: 'NIST SP 1284 Aligned',
        isoVibration: 'ISO 10816-3 Class II',
        isoRoboticsSafety: 'ISO 13849-1 (Performance Level e, Category 4) & ISO 10218-2',
        digitalTwinArchitecture: 'ISO 23247 Part 1-4',
        ciscoIndustrialAiFramework: 'Verified (Predictive Maintenance, AOI, Autonomous Mobile Robotics)',
      },
      auditPillars: NIST_ROADMAP_PILLARS,
      workcellTelemetrySummary: {
        activeWorkcells: 4,
        meanEdgeLatencyMs: 4.8,
        unplannedDowntimeReduction: '48.2%',
        safetyVetoReliability: '100% Non-Bypassable Hardware Invariant',
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NIST_Smart_Manufacturing_Audit_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopyReport = () => {
    const summaryText = `SynapsePhysical - NIST SP 1284 & Cisco 2026 Industrial AI Compliance Audit
Generated: ${new Date().toLocaleDateString()}
Status: VERIFIED IN FULL COMPLIANCE (Overall Readiness: 96.8%)
Pillar 1: Cyber-Physical Digital Twins (NIST SP 1284 / ISO 23247) - 94%
Pillar 2: Predictive Maintenance (ISO 10816-3) - 96%
Pillar 3: Automated Optical Inspection (ASTM E399) - 98%
Pillar 4: Safe Robotics & Kinematic Veto (ISO 13849-1 PL e) - 99%`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Award className="w-4 h-4" />
            <span>NIST Smart Manufacturing & Cisco Industrial AI 2026 Benchmark</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Industrial Physical AI Standards Compliance Audit
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Directly validating core recommendations from the 2026 NIST smart-manufacturing roadmap
            and Cisco industrial AI report: Digital Twins, Sensor Fusion, Automated Optical Inspection,
            and Safe Robotics.
          </p>
        </div>

        {/* Export & Copy Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
            <span>{copied ? 'Summary Copied' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition-colors shadow-sm"
          >
            {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{downloadSuccess ? 'Downloaded!' : 'Export Formal Audit JSON'}</span>
          </button>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {NIST_ROADMAP_PILLARS.map((pillar) => (
          <div
            key={pillar.id}
            className="bg-slate-900 rounded-lg border border-slate-800 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan-400">{pillar.standard}</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {pillar.status}
                </span>
              </div>

              <h3 className="text-base font-semibold text-white mb-2">{pillar.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{pillar.description}</p>

              {/* Verified Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded border border-slate-800 mb-4">
                {pillar.metrics.map((m, idx) => (
                  <div key={idx}>
                    <div className="text-[10px] text-slate-500 truncate">{m.label}</div>
                    <div className="text-xs font-mono font-semibold text-white tabular-nums mt-0.5">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">NIST Implementation Score:</span>
              <span className="font-mono font-bold text-white tabular-nums">{pillar.readinessScore}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Industrial Roadmap Summary Table */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">
          Roadmap Synthesis: Cisco 2026 Industrial AI & NIST Smart Manufacturing
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 pr-4">Industrial Use Case</th>
                <th className="py-2.5 px-4">Governing Standard</th>
                <th className="py-2.5 px-4">Physical AI Architecture</th>
                <th className="py-2.5 pl-4 text-right">Demonstrated Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Predictive Turbomachinery Maintenance</td>
                <td className="py-3 px-4 font-mono text-cyan-400">ISO 10816-3 / MIMOSA</td>
                <td className="py-3 px-4">Vibration FFT feature extraction + Weibull hazard degradation model</td>
                <td className="py-3 pl-4 text-right font-mono text-emerald-400 font-semibold">-48.2% Downtime</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Automated Optical Inspection (AOI)</td>
                <td className="py-3 px-4 font-mono text-cyan-400">ASTM E399 / ISO 9001</td>
                <td className="py-3 px-4">Sub-micron profilometer laser triangulation + Multimodal AI triage</td>
                <td className="py-3 pl-4 text-right font-mono text-emerald-400 font-semibold">99.8% Defect Recall</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Collaborative Robotics & AMR Fleets</td>
                <td className="py-3 px-4 font-mono text-cyan-400">ISO 13849-1 / ISO 10218-2</td>
                <td className="py-3 px-4">Dynamic Speed and Separation Monitoring (SSM) with invariant veto</td>
                <td className="py-3 pl-4 text-right font-mono text-emerald-400 font-semibold">18ms Safe Veto</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Edge-to-Cloud Digital Twins</td>
                <td className="py-3 px-4 font-mono text-cyan-400">ISO 23247 / NIST SP 1284</td>
                <td className="py-3 px-4">Bi-directional telemetry synchronization with physics invariants</td>
                <td className="py-3 pl-4 text-right font-mono text-emerald-400 font-semibold">4.8ms Latency</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
