import React from 'react';
import type { Delivery } from '../../types';

interface OverTimelineProps {
  deliveries: Delivery[];
  onSelectDelivery?: (delivery: Delivery) => void;
  canEdit?: boolean;
}

export const OverTimeline: React.FC<OverTimelineProps> = ({
  deliveries,
  onSelectDelivery,
  canEdit = false
}) => {
  // Group deliveries by over
  const oversMap: { [overNumber: number]: Delivery[] } = {};
  deliveries.forEach((d) => {
    if (!oversMap[d.overNumber]) {
      oversMap[d.overNumber] = [];
    }
    oversMap[d.overNumber].push(d);
  });

  const overKeys = Object.keys(oversMap).map(Number).sort((a, b) => a - b);
  const currentOverIndex = overKeys.length > 0 ? overKeys[overKeys.length - 1] : 0;
  const currentOverDeliveries = oversMap[currentOverIndex] || [];

  const getBallBadge = (del: Delivery) => {
    if (del.isWicket) {
      return { label: 'W', className: 'ball-dot-wicket', desc: 'WICKET' };
    }
    if (del.extraType === 'Wide') {
      const runs = (del.penaltyExtraRuns || 0) + (del.runningExtraRuns || 0);
      return { label: runs > 1 ? `Wd+${runs - 1}` : 'Wd', className: 'ball-dot-wide', desc: 'WIDE' };
    }
    if (del.extraType === 'NoBall') {
      const runs = (del.runsOffBat || 0) + (del.penaltyExtraRuns || 0);
      return { label: runs > 1 ? `Nb+${runs - 1}` : 'Nb', className: 'ball-dot-noball', desc: 'NO BALL' };
    }
    if (del.extraType === 'Bye') {
      return { label: `B${del.runningExtraRuns}`, className: 'ball-dot-1', desc: 'BYE' };
    }
    if (del.extraType === 'LegBye') {
      return { label: `LB${del.runningExtraRuns}`, className: 'ball-dot-1', desc: 'LEG BYE' };
    }
    if (del.runsOffBat === 0) {
      return { label: '•', className: 'ball-dot-dot', desc: 'DOT' };
    }
    if (del.runsOffBat === 4) {
      return { label: '4', className: 'ball-dot-4', desc: 'FOUR' };
    }
    if (del.runsOffBat === 6) {
      return { label: '6', className: 'ball-dot-6', desc: 'SIX' };
    }
    return { label: `${del.runsOffBat}`, className: `ball-dot-${del.runsOffBat}`, desc: `${del.runsOffBat} RUNS` };
  };

  // Calculate runs in current over
  const currentOverRuns = currentOverDeliveries.reduce((sum, d) => {
    return sum + (d.runsOffBat || 0) + (d.penaltyExtraRuns || 0) + (d.runningExtraRuns || 0);
  }, 0);

  return (
    <div className="glass-panel p-4 sm:p-5 w-full space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
            THIS OVER (Over {currentOverIndex + 1})
          </span>
          <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-sky-500/20 text-sky-300">
            {currentOverRuns} runs
          </span>
        </div>
        {canEdit && (
          <span className="text-[11px] text-slate-400 font-medium">
            💡 Tap any ball to edit
          </span>
        )}
      </div>

      {/* Current Over Strip */}
      <div className="flex items-center space-x-2.5 overflow-x-auto py-2">
        {currentOverDeliveries.length === 0 ? (
          <span className="text-xs text-slate-500 italic">No balls bowled in this over yet</span>
        ) : (
          currentOverDeliveries.map((del) => {
            const badge = getBallBadge(del);
            return (
              <button
                key={del._id}
                onClick={() => canEdit && onSelectDelivery && onSelectDelivery(del)}
                disabled={!canEdit}
                title={`${badge.desc} - Over ${del.overNumber}.${del.ballNumber}`}
                className={`ball-dot ${badge.className} ${canEdit ? 'hover:scale-110 cursor-pointer shadow-md' : 'cursor-default'}`}
              >
                {badge.label}
              </button>
            );
          })
        )}
      </div>

      {/* Previous Overs Collapsible or Historical Stream */}
      {overKeys.length > 1 && (
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Recent Completed Overs
          </span>
          <div className="flex flex-wrap gap-2">
            {overKeys.slice(-4, -1).reverse().map((oIdx) => {
              const oDels = oversMap[oIdx] || [];
              const oRuns = oDels.reduce((sum, d) => sum + (d.runsOffBat || 0) + (d.penaltyExtraRuns || 0) + (d.runningExtraRuns || 0), 0);
              return (
                <div key={oIdx} className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-slate-800/50 border border-white/5 text-xs font-mono">
                  <span className="text-slate-400 font-semibold mr-1">Ov {oIdx + 1} ({oRuns}r):</span>
                  {oDels.map((del) => {
                    const badge = getBallBadge(del);
                    return (
                      <span
                        key={del._id}
                        onClick={() => canEdit && onSelectDelivery && onSelectDelivery(del)}
                        className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${badge.className} ${canEdit ? 'cursor-pointer' : ''}`}
                      >
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
