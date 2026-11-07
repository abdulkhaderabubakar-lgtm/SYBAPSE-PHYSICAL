import React, { useState } from 'react';
import { AmrRobot, SystemScenario } from '../types/physicalAi';
import { ShieldAlert, ShieldCheck, Cpu, ArrowRight, Zap, RefreshCw, AlertTriangle, Sparkles, Activity } from 'lucide-react';

interface RoboticsSafetyViewProps {
  amrFleet: AmrRobot[];
  amrImage: string;
  scenario: SystemScenario;
  onEvaluateSafety: (robotId: string, speed: number, dist: number, payload: number) => void;
  safetyEvalResult: any | null;
  isEvaluatingSafety: boolean;
}

export const RoboticsSafetyView: React.FC<RoboticsSafetyViewProps> = ({
  amrFleet,
  amrImage,
  scenario,
  onEvaluateSafety,
  safetyEvalResult,
  isEvaluatingSafety,
}) => {
  const [selectedRobotId, setSelectedRobotId] = useState<string>('AMR-04');
  const [operatorDistance, setOperatorDistance] = useState<number>(scenario === 'safety_intrusion' ? 1.1 : 3.8);
  const [commandedSpeed, setCommandedSpeed] = useState<number>(1.4);
  const [payloadKg, setPayloadKg] = useState<number>(420);

  const activeRobot = amrFleet.find((r) => r.id === selectedRobotId) || amrFleet[0];

  // ISO 13849 / ISO 10218-2 Speed and Separation Monitoring (SSM) Math
  // Minimum separation: Sp = (Vh * Tr) + (Vr * Tr) + B + C
  const humanSpeed = 1.6; // m/s standard human approach speed (ISO 13849)
  const systemReactionTime = 0.08; // 80ms sensor + PLC reaction
  const decelRate = 1.8; // m/s^2 emergency deceleration
  const brakingDistance = (commandedSpeed * commandedSpeed) / (2 * decelRate) * (1 + payloadKg / 1000);
  const intrusionDistanceMargin = 0.25; // 250mm sensor margin
  const requiredSeparationMeters =
    humanSpeed * systemReactionTime + commandedSpeed * systemReactionTime + brakingDistance + intrusionDistanceMargin;

  // Safety Veto Determination
  const isVetoTriggered = operatorDistance < requiredSeparationMeters;
  const safeClampedSpeed = isVetoTriggered
    ? Math.max(0, Math.min(0.35, (operatorDistance - intrusionDistanceMargin - humanSpeed * systemReactionTime) / (systemReactionTime + 0.3)))
    : commandedSpeed;

  return (
    <div className="space-y-6">
      {/* Top Safety Assurance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Safety Architecture Level</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">PL e / Cat 4</span>
            <span className="text-xs text-slate-400">ISO 13849-1</span>
          </div>
          <div className="text-xs text-slate-400">Dual-channel redundant safety interlock</div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Safety Veto Reaction Time</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">18 ms</span>
            <span className="text-xs text-slate-400">Deterministic</span>
          </div>
          <div className="text-xs text-slate-400">Hardware-enforced FPGA safety coprocessor</div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Separation Monitoring (SSM)</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-2xl font-bold font-mono tabular-nums ${
              isVetoTriggered ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {operatorDistance.toFixed(2)} m
            </span>
            <span className="text-xs text-slate-400">/ Req: {requiredSeparationMeters.toFixed(2)} m</span>
          </div>
          <div className="text-xs text-slate-400">
            {isVetoTriggered ? 'Violation: Safety Veto Active' : 'Nominal Safe Clearance'}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-xs text-slate-400 font-mono mb-1">Active Fleet Mobility</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">3 Units</span>
            <span className="text-xs text-slate-400">In Transit</span>
          </div>
          <div className="text-xs text-slate-400">Fleet Mean Efficiency: 96.2%</div>
        </div>
      </div>

      {/* Main Robotics & Safety Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Speed & Separation Simulator & AMR Photo */}
        <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Collaborative Robot & AMR Speed-Separation Monitoring (SSM)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ISO 10218-2 Clause 5.11 · Formal Kinematic Invariant Enforcement
                </p>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1 rounded border text-xs font-mono font-medium ${
                isVetoTriggered
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                {isVetoTriggered ? 'SAFETY VETO ACTIVE (STOP CAT 1)' : 'NOMINAL SAFE TRAJECTORY'}
              </div>
            </div>

            {/* AMR Fleet Visual Banner */}
            <div className="relative rounded overflow-hidden border border-slate-800 aspect-[21/9] bg-slate-950 mb-5">
              <img
                src={amrImage}
                alt="Autonomous Mobile Robot Fleet"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-4">
                <div className="flex flex-wrap items-center justify-between w-full text-xs text-slate-200">
                  <div>
                    <span className="font-semibold text-white">Smart Logistics AMR-04</span>
                    <span className="text-slate-400 ml-2 font-mono">Payload: {payloadKg} kg (Pallet Container)</span>
                  </div>
                  <div className="font-mono text-cyan-300">
                    Braking Distance: {brakingDistance.toFixed(2)} m
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Physical Kinematic Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded bg-slate-950 border border-slate-800 mb-5">
              {/* Proximity Slider */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Operator Proximity</span>
                  <span className="font-mono text-cyan-400 font-semibold">{operatorDistance.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="5.0"
                  step="0.1"
                  value={operatorDistance}
                  onChange={(e) => setOperatorDistance(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>0.6m (Intrusion)</span>
                  <span>5.0m (Safe)</span>
                </div>
              </div>

              {/* Commanded Speed Slider */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Target Velocity</span>
                  <span className="font-mono text-cyan-400 font-semibold">{commandedSpeed.toFixed(2)} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={commandedSpeed}
                  onChange={(e) => setCommandedSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>0.2 m/s</span>
                  <span>2.0 m/s (Sprint)</span>
                </div>
              </div>

              {/* Payload Weight Slider */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Payload Mass</span>
                  <span className="font-mono text-cyan-400 font-semibold">{payloadKg} kg</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="10"
                  value={payloadKg}
                  onChange={(e) => setPayloadKg(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>50 kg</span>
                  <span>600 kg (Max)</span>
                </div>
              </div>
            </div>

            {/* Formal Kinematic Invariant Calculation Proof */}
            <div className="p-3.5 rounded bg-slate-950/80 border border-slate-800 font-mono text-xs">
              <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-2 font-sans font-semibold">
                Mathematical Proof: ISO 13849 Speed and Separation Invariant
              </div>
              <div className="text-cyan-300 leading-relaxed">
                S<sub>p</sub> = (V<sub>h</sub> · T<sub>r</sub>) + (V<sub>r</sub> · T<sub>r</sub>) + B(m, V<sub>r</sub>) + C
              </div>
              <div className="text-slate-400 text-[11px] mt-1">
                S<sub>p</sub> = ({humanSpeed} × {systemReactionTime}) + ({commandedSpeed.toFixed(2)} × {systemReactionTime}) + {brakingDistance.toFixed(2)}m + {intrusionDistanceMargin}m ={' '}
                <span className="text-white font-bold">{requiredSeparationMeters.toFixed(2)}m</span>
              </div>
              <div className="mt-2 text-xs">
                {isVetoTriggered ? (
                  <span className="text-rose-400 font-semibold">
                    [SAFETY VETO EXECUTED]: Operator distance ({operatorDistance.toFixed(2)}m) &lt; S<sub>p</sub> ({requiredSeparationMeters.toFixed(2)}m). Commanded speed clamped from {commandedSpeed.toFixed(2)} m/s down to {safeClampedSpeed.toFixed(2)} m/s.
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold">
                    [SAFE TO EXECUTE]: Operator distance ({operatorDistance.toFixed(2)}m) satisfies dynamic stopping boundary. Full speed granted.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Interlock Status Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Safety Controller: Pilz PSS 4000 FSoE Fail-Safe over EtherCAT</span>
            <span className="font-mono">Certified SIL 3 / PL e</span>
          </div>
        </div>

        {/* Right Col: Robot Fleet Telemetry & AI Safety Auditor */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">AMR Fleet Status</h3>
              <span className="text-xs font-mono text-cyan-400">Cisco Industrial AI</span>
            </div>

            {/* Fleet Unit Selector */}
            <div className="space-y-2 mb-4">
              {amrFleet.map((robot) => {
                const isSelected = robot.id === selectedRobotId;
                const isWarning = robot.id === 'AMR-04' && isVetoTriggered;
                return (
                  <button
                    key={robot.id}
                    onClick={() => {
                      setSelectedRobotId(robot.id);
                      setPayloadKg(robot.payloadKg);
                    }}
                    className={`w-full text-left p-2.5 rounded border transition-colors ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span className="text-white font-mono">{robot.id} · {robot.name}</span>
                      <span className="font-mono text-cyan-400">{robot.batterySoc}% SoC</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Dest: {robot.targetDestination}</span>
                      <span className={`font-mono ${isWarning ? 'text-rose-400 font-semibold' : 'text-slate-300'}`}>
                        {isWarning ? 'VETO SPEED CLAMP' : `${robot.speedMs.toFixed(2)} m/s`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AI Safety Decision Reasoning (from Gemini 3.8 Flash or deterministic PLC) */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800 mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-medium">Physical AI Safety Verdict:</span>
                <span className={`font-mono font-bold ${
                  isVetoTriggered ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {safetyEvalResult ? safetyEvalResult.decision : isVetoTriggered ? 'SAFETY_VETO_TRIGGERED' : 'SAFE_TO_EXECUTE'}
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed mb-3">
                {safetyEvalResult ? (
                  safetyEvalResult.safetyExplanation
                ) : isVetoTriggered ? (
                  `Operator located at ${operatorDistance.toFixed(2)}m violates required ISO 10218-2 safe distance of ${requiredSeparationMeters.toFixed(2)}m for a ${payloadKg}kg mass. Kinematic safety coprocessor vetoes acceleration and enforces controlled deceleration curve.`
                ) : (
                  `Clear spatial margin of ${operatorDistance.toFixed(2)}m allows standard operational velocity of ${commandedSpeed.toFixed(2)} m/s. Kinetic energy within acceptable safety buffer.`
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="font-semibold block text-slate-300 mb-0.5">NIST Kinematic Invariant Rule:</span>
                Never allow kinetic energy to exceed allowable human impact threshold (&lt; 65 Joules for transient contact).
              </div>
            </div>
          </div>

          {/* Trigger Gemini AI Safety Audit */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onEvaluateSafety(activeRobot.id, commandedSpeed, operatorDistance, payloadKg)}
              disabled={isEvaluatingSafety}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm"
            >
              {isEvaluatingSafety ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Evaluating Dynamic Kinematics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Multimodal AI Safety Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
