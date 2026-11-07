import React from 'react';
import { Activity, Sparkles, Eye } from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAiAudit: () => void;
  isAiProcessing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAiAudit,
  isAiProcessing = false,
}) => {
  const navItems = [
    { id: 'perception', label: 'Perception Stream' },
    { id: 'freespace', label: 'Spatial Occupancy' },
    { id: 'simulation', label: 'Simulated Robot' },
    { id: 'rl_policy', label: 'RL Policy' },
    { id: 'industrial', label: 'Industrial Fleet' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center text-white shadow-inner font-mono font-bold text-sm">
            Φ
          </div>
          <button
            onClick={() => onSelectTab('perception')}
            className="text-lg font-semibold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap text-left"
          >
            SynapsePerception
          </button>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-sm ${
                  isActive
                    ? 'border-cyan-400 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenAiAudit}
            disabled={isAiProcessing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 shadow-sm"
          >
            {isAiProcessing ? (
              <Activity className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>AI Perception Audit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
