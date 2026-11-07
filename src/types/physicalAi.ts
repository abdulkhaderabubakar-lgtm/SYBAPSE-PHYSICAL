export type WorkcellId = 'cell-01' | 'cell-02' | 'cell-03' | 'cell-04';

export type SystemScenario =
  | 'nominal'
  | 'bearing_defect'
  | 'thermal_cavitation'
  | 'safety_intrusion'
  | 'optical_microfracture';

export interface TelemetryPoint {
  timestamp: number;
  vibrationRms: number; // mm/s (ISO 10816)
  peakAcceleration: number; // g
  temperature: number; // Celsius
  rotorRpm: number;
  acousticEmissionDb: number;
  kurtosis: number;
  crestFactor: number;
  pressureBar: number;
  motorTorqueNm: number;
}

export interface FftFrequencyBin {
  frequencyHz: number;
  amplitude: number;
  harmonicLabel?: string;
  isHarmonicAnomaly?: boolean;
}

export interface DigitalTwinSensor {
  id: string;
  name: string;
  type: 'accelerometer' | 'thermocouple' | 'tachometer' | 'pressure' | 'acoustic';
  location: string;
  currentValue: number;
  unit: string;
  status: 'nominal' | 'warning' | 'critical';
  isoLimit: number;
}

export interface InspectionDefect {
  id: string;
  type: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  severity: 'SEV-1 (Critical)' | 'SEV-2 (High)' | 'SEV-3 (Advisory)';
  depthDeviationMicrons: number;
  status: 'rejected' | 'rework' | 'passed';
  notes: string;
}

export interface AmrRobot {
  id: string;
  name: string;
  model: string;
  batterySoc: number; // percentage
  speedMs: number; // m/s
  maxAllowedSpeedMs: number;
  position: { x: number; y: number; headingDeg: number };
  targetDestination: string;
  operatorDistanceMeters: number;
  safetyZone: 'clear' | 'warning' | 'stop_interlock';
  payloadKg: number;
  brakingDistanceM: number;
  safetyVetoActive: boolean;
  vetoReason?: string;
}

export interface DiagnosticReport {
  timestamp: string;
  source: 'gemini_3.8_flash' | 'physics_rule_engine';
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL_FAULT';
  confidence: number;
  rootCause: string;
  rulHours: number;
  rulConfidence: string;
  recommendedActions: string[];
  nistComplianceNote: string;
}
