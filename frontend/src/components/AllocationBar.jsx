import React from 'react';
import { getSegmentColor, formatCurrency } from '../utils/helpers';

/**
 * AllocationBar — Capital allocation visualization.
 * Shows a horizontal stacked bar with one segment per allocated cycle,
 * plus a reserve segment for unallocated capital.
 */
export default function AllocationBar({ allocation, totalUnits, totalCapital }) {
  const units = totalUnits || 20;
  const capital = totalCapital || 10000;

  // Calculate allocated units
  let allocatedUnits = 0;
  if (allocation && allocation.length > 0) {
    allocatedUnits = allocation.reduce((sum, item) => {
      const weight = item.cycle?.weight || 0;
      const fraction = item.fraction || 0;
      return sum + weight * fraction;
    }, 0);
  }
  const reserveUnits = Math.max(0, units - allocatedUnits);
  const reservePct = (reserveUnits / units) * 100;

  return (
    <div className="glass-card" id="allocation-panel">
      <div className="glass-card-header">
        <h2>Capital Allocation</h2>
      </div>
      <div className="allocation-section">
        <div className="allocation-total">
          Total: <strong>{units} units</strong> ({formatCurrency(capital)})
          {allocatedUnits > 0 && (
            <span style={{ marginLeft: '12px', color: 'var(--accent-emerald)' }}>
              · {((allocatedUnits / units) * 100).toFixed(0)}% deployed
            </span>
          )}
        </div>

        {/* Stacked Bar */}
        <div className="allocation-stacked-bar">
          {allocation && allocation.length > 0 ? (
            <>
              {allocation.map((item, idx) => {
                const weight = item.cycle?.weight || 0;
                const fraction = item.fraction || 0;
                const pct = ((weight * fraction) / units) * 100;
                if (pct < 0.5) return null;
                return (
                  <div
                    key={idx}
                    className="allocation-segment"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: getSegmentColor(idx),
                    }}
                  >
                    {pct > 8 ? `${pct.toFixed(0)}%` : ''}
                  </div>
                );
              })}
              {reservePct > 0.5 && (
                <div
                  className="allocation-segment"
                  style={{
                    width: `${reservePct}%`,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-dim)',
                  }}
                >
                  {reservePct > 10 ? `${reservePct.toFixed(0)}%` : ''}
                </div>
              )}
            </>
          ) : (
            <div
              className="allocation-segment"
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: 'var(--text-dim)',
                fontSize: '0.7rem',
              }}
            >
              No allocations
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="allocation-legend">
          {allocation && allocation.map((item, idx) => {
            const path = item.cycle?.path;
            const label = path ? path.slice(0, -1).join('→') : `Cycle ${idx + 1}`;
            const fraction = item.fraction || 0;
            return (
              <div key={idx} className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: getSegmentColor(idx) }} />
                <span>{label} ({(fraction * 100).toFixed(0)}%)</span>
              </div>
            );
          })}
          {reserveUnits > 0 && (
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <span>Reserve ({reservePct.toFixed(0)}%)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
