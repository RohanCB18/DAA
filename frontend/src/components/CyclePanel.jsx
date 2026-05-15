import React from 'react';
import { normalizeViability } from '../utils/helpers';

/**
 * CyclePanel — Displays detected arbitrage cycles with viability scores.
 */
export default function CyclePanel({ cycles }) {
  const maxViability = cycles?.length
    ? Math.max(...cycles.map((c) => c.viability_score || 0))
    : 0;

  return (
    <div className="glass-card" id="cycle-panel" style={{ flex: 1, minHeight: 0 }}>
      <div className="glass-card-header">
        <h2>Detected Cycles</h2>
        <span style={{
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: cycles?.length ? 'var(--accent-emerald)' : 'var(--text-dim)',
        }}>
          {cycles?.length || 0} active
        </span>
      </div>
      <div className="glass-card-body" style={{ padding: 'var(--gap-md)' }}>
        {(!cycles || cycles.length === 0) ? (
          <div className="no-data">No arbitrage cycles detected</div>
        ) : (
          <div className="cycle-list">
            {cycles
              .sort((a, b) => (b.viability_score || 0) - (a.viability_score || 0))
              .map((cycle, idx) => (
                <CycleCard
                  key={idx}
                  cycle={cycle}
                  maxViability={maxViability}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CycleCard({ cycle, maxViability }) {
  const viabilityPct = normalizeViability(cycle.viability_score, maxViability);

  return (
    <div className="cycle-card">
      {/* Path */}
      <div className="cycle-path">
        {cycle.path.map((currency, i) => (
          <React.Fragment key={i}>
            <span>{currency}</span>
            {i < cycle.path.length - 1 && <span className="arrow">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Badges */}
      <div className="cycle-meta">
        <span className="cycle-badge badge-profit">
          ↑ {cycle.profit_pct?.toFixed(2)}%
        </span>
        <span className="cycle-badge badge-hops">
          {cycle.hop_count} hops
        </span>
        <span className="cycle-badge badge-capital">
          {cycle.weight} units · ${cycle.weight * 500}
        </span>
      </div>

      {/* Viability Bar */}
      <div className="viability-bar-wrapper">
        <div className="viability-label">
          <span>Viability</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {cycle.viability_score?.toFixed(1)}
          </span>
        </div>
        <div className="viability-bar-track">
          <div
            className="viability-bar-fill"
            style={{ width: `${Math.max(2, viabilityPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
