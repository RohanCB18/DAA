import React from 'react';

/**
 * Header — Top bar with branding, connection status, and tick counter.
 */
export default function Header({ tick, connected, isPaused, onStart, onStop }) {
  return (
    <header className="header" id="header">
      <div className="header-brand">
        <div className="header-logo" style={{ animationPlayState: isPaused ? 'paused' : 'running' }}>Q</div>
        <div>
          <div className="header-title">QuantArb</div>
          <div className="header-subtitle">Live Arbitrage Detection Engine</div>
        </div>
      </div>

      <div className="header-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          onClick={onStart} 
          disabled={!isPaused || !connected}
          style={{
            background: (!isPaused || !connected) ? 'var(--bg-tertiary)' : 'var(--accent-emerald-dim)',
            color: (!isPaused || !connected) ? 'var(--text-muted)' : 'var(--accent-emerald)',
            border: `1px solid ${(!isPaused || !connected) ? 'transparent' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            cursor: (!isPaused || !connected) ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}
        >
          ▶ Start
        </button>
        <button 
          onClick={onStop} 
          disabled={isPaused || !connected}
          style={{
            background: (isPaused || !connected) ? 'var(--bg-tertiary)' : 'var(--accent-rose-dim)',
            color: (isPaused || !connected) ? 'var(--text-muted)' : 'var(--accent-rose)',
            border: `1px solid ${(isPaused || !connected) ? 'transparent' : 'rgba(244, 63, 94, 0.3)'}`,
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            cursor: (isPaused || !connected) ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}
        >
          ⏸ Stop
        </button>
      </div>

      <div className="header-status">
        <div className="status-indicator">
          <span
            className={`status-dot ${connected ? 'connected' : 'disconnected'}`}
          />
          {connected ? 'Connected' : 'Disconnected'}
        </div>

        <div className="tick-counter" id="tick-counter">
          Tick #{tick} {isPaused ? '(Paused)' : ''}
        </div>
      </div>
    </header>
  );
}
