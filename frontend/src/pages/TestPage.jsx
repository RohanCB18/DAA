import React, { useState, useEffect, useRef } from 'react';
import CurrencyGraph from '../components/CurrencyGraph.jsx';

const API_URL = 'http://127.0.0.1:8081/api/run';

export default function TestPage() {
  const [mode, setMode] = useState('dfs');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rateMap, setRateMap] = useState({});
  const [animatedStep, setAnimatedStep] = useState(-1);
  const animationRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setRateMap({});
    setAnimatedStep(-1);
    if (animationRef.current) clearInterval(animationRef.current);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();

      const rates = {};
      data.edges.forEach(e => { rates[`${e.from}->${e.to}`] = e.rate; });
      setRateMap(rates);
      setResult(data);

      setTimeout(() => {
        if (data.arbitrage_found && data.cycle && data.mode !== 'knapsack') {
          let step = 0;
          const totalSteps = data.cycle.steps.length;
          setAnimatedStep(0);
          animationRef.current = setInterval(() => {
            step++;
            if (step <= totalSteps) {
              setAnimatedStep(step);
            } else {
              clearInterval(animationRef.current);
            }
          }, 1000);
        } else if (data.mode === 'knapsack') {
          setAnimatedStep(999);
        }
      }, 800);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to connect to backend. Make sure server.exe is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => {
    if (animationRef.current) clearInterval(animationRef.current);
  }, []);

  const getActiveCycles = () => {
    if (!result || !result.arbitrage_found) return [];
    if (result.mode === 'knapsack') return result.cycles || [];
    if (result.cycle && animatedStep >= 0) {
      const currentPath = result.cycle.path.slice(0, animatedStep + 1);
      if (currentPath.length < 2) return [];
      return [{ ...result.cycle, path: currentPath }];
    }
    return [];
  };

  const DEFAULT_EDGES = [
    { from: 'CHF', to: 'EUR' }, { from: 'EUR', to: 'HKD' },
    { from: 'CHF', to: 'CAD' }, { from: 'EUR', to: 'INR' }, { from: 'HKD', to: 'USD' },
    { from: 'CAD', to: 'INR' }, { from: 'INR', to: 'USD' },
    { from: 'CAD', to: 'AUD' }, { from: 'INR', to: 'SGD' }, { from: 'USD', to: 'JPY' },
    { from: 'AUD', to: 'SGD' }, { from: 'SGD', to: 'JPY' },
    { from: 'SGD', to: 'GBP' }, { from: 'AUD', to: 'GBP' }, { from: 'JPY', to: 'GBP' },
    { from: 'CHF', to: 'INR' }, { from: 'USD', to: 'GBP' },
  ];

  const buildEdges = () => {
    const edgeSet = new Set(DEFAULT_EDGES.map(e => `${e.from}->${e.to}`));
    const extra = [];
    const activeCycles = getActiveCycles();
    if (result?.arbitrage_found) {
      const allCycles = result.mode === 'knapsack' ? (result.cycles || []) : (result.cycle ? [result.cycle] : []);
      allCycles.forEach(c => {
        if (!c.path) return;
        for (let i = 0; i < c.path.length - 1; i++) {
          const key = `${c.path[i]}->${c.path[i+1]}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            extra.push({ from: c.path[i], to: c.path[i+1] });
          }
        }
      });
    }
    return [...DEFAULT_EDGES, ...extra].map(edge => ({
      ...edge,
      rate: rateMap[`${edge.from}->${edge.to}`] || undefined
    }));
  };

  const graphData = {
    nodes: ['INR','USD','EUR','GBP','JPY','CHF','AUD','CAD','SGD','HKD'].map(c => ({ id: c })),
    links: buildEdges()
  };

  return (
    <>
      {/* Mode + Controls */}
      <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
        <div className="mode-selector">
          {[
            { id: 'dfs', label: 'Mode 1: DFS', sub: 'Single Cycle Detection' },
            { id: 'bellman-ford', label: 'Mode 2: Bellman-Ford', sub: 'Negative Log Weights' },
            { id: 'knapsack', label: 'Mode 3: Knapsack', sub: 'Capital Allocation' },
          ].map(m => (
            <div key={m.id}
              className={`mode-card ${mode === m.id ? 'active' : ''}`}
              onClick={() => { setMode(m.id); setResult(null); setRateMap({}); setAnimatedStep(-1); }}
            >
              <h3>{m.label}</h3>
              <p>{m.sub}</p>
            </div>
          ))}
        </div>
        <button className="glow-btn" onClick={handleGenerate} disabled={loading}
          style={{ fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '⏳ Processing...' : '🎲 Generate Rates & Detect'}
        </button>
      </div>

      {/* Main Content: Graph + Results */}
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '12px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <CurrencyGraph graphData={graphData} cycles={getActiveCycles()} />

        {result && (
          <div className="glass-card result-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'slide-in 0.4s ease-out', overflowY: 'auto' }}>
            <h2>Detection Results</h2>

            <div className="algo-info">
              <strong>{result.algorithm}</strong>
              <p>{result.algorithm_description}</p>
              <p style={{ marginTop: '8px' }}>Dataset: <strong style={{ color: 'var(--accent-purple)' }}>{result.dataset_name}</strong></p>
            </div>

            {result.mode !== 'knapsack' ? (
              <div>
                {result.arbitrage_found ? (
                  <>
                    <h3 style={{ color: 'var(--accent-green)', fontSize: '1.05rem', marginBottom: '12px' }}>
                      ✅ Arbitrage Opportunity Found!
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {result.cycle.steps.map((step, idx) => (
                        <div key={idx} className={`calc-step ${idx < animatedStep ? 'visible' : ''}`}
                          style={{ opacity: idx < animatedStep ? 1 : 0.25, transition: 'all 0.4s ease' }}>
                          ₹{step.amount_before.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          {' × '}{step.rate.toFixed(4)}{' = '}
                          <strong style={{ color: idx < animatedStep ? 'var(--accent-green)' : 'inherit' }}>
                            ₹{step.amount_after.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </strong>
                          <span style={{ float: 'right', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                            {step.from} → {step.to}
                          </span>
                        </div>
                      ))}
                    </div>

                    {animatedStep >= result.cycle.steps.length && (
                      <div className="final-profit" style={{ marginTop: '16px', animation: 'slide-in 0.5s ease-out' }}>
                        <h3>Total Profit</h3>
                        <div className="profit-value">
                          +₹{result.profit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({result.cycle.profit_percent.toFixed(2)}%)
                        </div>
                        <p className="profit-sub">Initial Capital: ₹{result.initial_amount.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-arb">
                    <h3>❌ No Arbitrage Available</h3>
                    <p>All cycle products ≤ 1.0 — no profitable path exists in this market snapshot.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {result.arbitrage_found ? (
                  <>
                    <h3 style={{ color: 'var(--accent-purple)', fontSize: '1.05rem', marginBottom: '12px' }}>
                      📊 Optimised Allocation — {result.cycles.length} profitable cycle{result.cycles.length > 1 ? 's' : ''}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {result.allocation.allocations.map((alloc, idx) => {
                        const cycle = result.cycles[alloc.cycle_index];
                        const pct = (alloc.capital / result.initial_amount) * 100;
                        return (
                          <div key={idx} className="alloc-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <strong style={{ color: 'var(--accent-indigo)', fontSize: '0.85rem' }}>
                                {cycle?.path?.join(' → ')}
                              </strong>
                              <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                +₹{alloc.expected_profit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </span>
                            </div>
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>₹{alloc.capital.toLocaleString('en-IN')} allocated ({pct.toFixed(1)}%)</span>
                              <span>Viability: {alloc.viability_score.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="final-profit" style={{ marginTop: '16px' }}>
                      <h3>Total Expected Portfolio Profit</h3>
                      <div className="profit-value">
                        +₹{result.allocation.total_expected_profit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({result.allocation.total_return_percent.toFixed(2)}%)
                      </div>
                      <p className="profit-sub">Total Capital: ₹{result.initial_amount.toLocaleString('en-IN')}</p>
                    </div>
                  </>
                ) : (
                  <div className="no-arb">
                    <h3>❌ No Profitable Cycles Found</h3>
                    <p>No arbitrage opportunities in this market snapshot.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!result && !loading && (
        <div className="placeholder-text">
          <h2>Select a mode and click Generate to analyze the market</h2>
        </div>
      )}
      {loading && (
        <div className="placeholder-text">
          <h2 style={{ color: 'var(--accent-blue)' }}>⏳ Running algorithm on market graph...</h2>
        </div>
      )}
    </>
  );
}
