import React, { useState, useEffect, useRef } from 'react';
import CurrencyGraph from '../components/CurrencyGraph.jsx';

const API_TICK_URL = 'http://127.0.0.1:8081/api/simulation/tick';
const API_LIST_URL = 'http://127.0.0.1:8081/api/simulation/list';

export default function TestPage() {
  const [mode, setMode] = useState('dfs');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rateMap, setRateMap] = useState({});
  const animationRef = useRef(null);

  // Simulation states
  const [simScenarios, setSimScenarios] = useState([]);
  const [selectedSimId, setSelectedSimId] = useState(1);
  const [simTick, setSimTick] = useState(-1);
  const [simTimer, setSimTimer] = useState(0);
  const [simIsRunning, setSimIsRunning] = useState(false);
  const [simIsPaused, setSimIsPaused] = useState(false);
  
  // Wallet / Trading states
  const [walletBalance, setWalletBalance] = useState(100000.0);
  const [autoTrade, setAutoTrade] = useState(true);
  const [ledger, setLedger] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([100000.0]);

  const processedTicksRef = useRef(new Set());
  const walletBalanceRef = useRef(100000.0);

  // Keep walletBalanceRef in sync
  useEffect(() => {
    walletBalanceRef.current = walletBalance;
  }, [walletBalance]);

  const [activeCycleIndex, setActiveCycleIndex] = useState(0);

  // Knapsack visual path cycling interval
  useEffect(() => {
    if (result && result.arbitrage_found && result.mode === 'knapsack' && result.cycles && result.cycles.length > 1) {
      let idx = 0;
      const intervalTime = result.cycles.length === 2 ? 1000 : 667;
      const interval = setInterval(() => {
        idx = (idx + 1) % result.cycles.length;
        setActiveCycleIndex(idx);
      }, intervalTime);
      return () => clearInterval(interval);
    } else {
      setActiveCycleIndex(0);
    }
  }, [result]);

  // Fetch simulation list on mount
  useEffect(() => {
    fetch(API_LIST_URL)
      .then((res) => res.json())
      .then((data) => setSimScenarios(data))
      .catch((err) => console.error('Failed to load scenarios:', err));
  }, []);

  // ───────────────────────────────────────────────────────────────────
  // Simulation Mode Triggers
  // ───────────────────────────────────────────────────────────────────
  const handleStartSim = () => {
    setSimIsRunning(true);
    setSimIsPaused(false);
    setSimTick(0);
    setSimTimer(0);
    setWalletBalance(100000.0);
    walletBalanceRef.current = 100000.0;
    setBalanceHistory([100000.0]);
    setLedger([]);
    processedTicksRef.current.clear();
    setResult(null);
    setRateMap({});
    if (animationRef.current) clearInterval(animationRef.current);
  };

  const handlePauseSim = () => {
    setSimIsPaused(!simIsPaused);
  };

  const handleStopSim = () => {
    setSimIsRunning(false);
    setSimIsPaused(false);
    setSimTick(-1);
    setSimTimer(0);
    setResult(null);
    setRateMap({});
    processedTicksRef.current.clear();
    if (animationRef.current) clearInterval(animationRef.current);
  };

  // Run the simulation loop
  useEffect(() => {
    if (!simIsRunning || simIsPaused || simTick < 0 || simTick >= 10) {
      if (simTick >= 10) {
        setSimIsRunning(false);
      }
      return;
    }

    let active = true;

    const fetchSimTick = async () => {
      if (processedTicksRef.current.has(simTick)) {
        return;
      }
      processedTicksRef.current.add(simTick);
      setLoading(true);
      try {
        const res = await fetch(API_TICK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            simulation_id: selectedSimId,
            tick_index: simTick,
          }),
        });
        const data = await res.json();

        if (!active) return;

        // Update rates on graph
        const rates = {};
        data.edges.forEach(e => { rates[`${e.from}->${e.to}`] = e.rate; });
        setRateMap(rates);

        // Convert the response to match the selected algorithm in TestConsole
        const algoRes = mode === 'knapsack' ? data.knapsack : (mode === 'dfs' ? data.dfs : data.bellman_ford);

        let arbitrageFound = false;
        let virtualResult = {};

        if (mode !== 'knapsack') {
          const cycle = algoRes.cycle;
          const profitPct = cycle ? cycle.profit_percent : 0;
          const hops = cycle ? cycle.path.length - 1 : 0;
          const feePct = hops * 0.05; // 0.05% fee per hop
          const netProfitPct = profitPct - feePct;
          arbitrageFound = algoRes.arbitrage_found;

          virtualResult = {
            mode,
            algorithm: algoRes.algorithm,
            algorithm_description: mode === 'dfs'
              ? "Modified DFS cycle detector."
              : "Bellman-Ford negative log weights.",
            arbitrage_found: arbitrageFound,
            cycle: cycle,
            profit: cycle ? walletBalanceRef.current * (netProfitPct / 100) : 0,
            initial_amount: 100000.0,
          };
          setResult(virtualResult);

          // Perform mock trading logic
          if (autoTrade && arbitrageFound && cycle) {
            const currentBalance = walletBalanceRef.current;
            const grossProfit = currentBalance * (profitPct / 100);
            const feePaid = currentBalance * (feePct / 100);
            const netProfit = currentBalance * (netProfitPct / 100);
            const newBalance = currentBalance + netProfit;

            walletBalanceRef.current = newBalance;
            setWalletBalance(newBalance);
            setBalanceHistory(prev => [...prev, newBalance]);
            setLedger(prev => [
              ...prev,
              {
                tick: simTick,
                time: `${simTick * 2}s`,
                path: cycle.path.join(' → '),
                grossProfitPct: profitPct,
                netProfitPct: netProfitPct,
                grossProfit: grossProfit,
                feePaid: feePaid,
                netProfit: netProfit,
                balanceAfter: newBalance,
                capitalAllocated: currentBalance,
                capitalRatio: 100
              }
            ]);
          } else {
            setBalanceHistory(prev => [...prev, walletBalanceRef.current]);
          }
        } else {
          // Knapsack Capital Allocation Mode
          let totalNetProfit = 0;
          let allocationsExecuted = [];
          if (algoRes.arbitrage_found) {
            algoRes.allocations.forEach(a => {
              const cycle = algoRes.cycles[a.cycle_index];
              if (!cycle) return;
              const hops = cycle.path.length - 1;
              const feePct = hops * 0.05;
              const grossProfitPct = cycle.profit_percent;
              const netProfitPct = grossProfitPct - feePct;
              
              const capitalRatio = a.capital / 100000.0;
              const actualCapital = walletBalanceRef.current * capitalRatio;
              const grossProfit = actualCapital * (grossProfitPct / 100);
              const feePaid = actualCapital * (feePct / 100);
              const netProfit = actualCapital * (netProfitPct / 100);
              totalNetProfit += netProfit;

              allocationsExecuted.push({
                path: cycle.path.join(' → '),
                grossProfitPct,
                netProfitPct,
                grossProfit,
                feePaid,
                netProfit,
                capitalAllocated: actualCapital,
                capitalRatio: capitalRatio * 100
              });
            });
          }

          arbitrageFound = allocationsExecuted.length > 0;

          virtualResult = {
            mode: 'knapsack',
            algorithm: algoRes.algorithm,
            algorithm_description: "Finds ALL cycles using DFS, then allocates limited capital greedily across the most profitable opportunities.",
            arbitrage_found: arbitrageFound,
            cycles: algoRes.cycles,
            allocation: {
              allocations: algoRes.allocations.map(a => ({
                ...a,
                capital: walletBalanceRef.current * (a.capital / 100000.0)
              }))
            },
            initial_amount: 100000.0,
          };
          setResult(virtualResult);

          if (autoTrade && arbitrageFound) {
            const currentBalance = walletBalanceRef.current;
            const newBalance = currentBalance + totalNetProfit;

            walletBalanceRef.current = newBalance;
            setWalletBalance(newBalance);
            setBalanceHistory(prev => [...prev, newBalance]);
            setLedger(prev => [
              ...prev,
              ...allocationsExecuted.map(alloc => ({
                tick: simTick,
                time: `${simTick * 2}s`,
                path: alloc.path,
                grossProfitPct: alloc.grossProfitPct,
                netProfitPct: alloc.netProfitPct,
                grossProfit: alloc.grossProfit,
                feePaid: alloc.feePaid,
                netProfit: alloc.netProfit,
                balanceAfter: newBalance,
                capitalAllocated: alloc.capitalAllocated,
                capitalRatio: alloc.capitalRatio
              }))
            ]);
          } else {
            setBalanceHistory(prev => [...prev, walletBalanceRef.current]);
          }
        }
      } catch (err) {
        if (active) console.error('Failed to run simulation tick:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSimTick();

    // Trigger next tick after 2s
    animationRef.current = setTimeout(() => {
      setSimTick((prev) => prev + 1);
      setSimTimer((prev) => prev + 2);
    }, 2000);

    return () => {
      active = false;
      clearTimeout(animationRef.current);
    };
  }, [simIsRunning, simIsPaused, simTick, selectedSimId, mode, autoTrade]);

  useEffect(() => () => {
    if (animationRef.current) clearInterval(animationRef.current);
  }, []);

  const getActiveCycles = () => {
    if (!result || !result.arbitrage_found) return [];
    if (result.mode === 'knapsack') {
      const cycles = result.cycles || [];
      if (cycles.length === 0) return [];
      const activeCycle = cycles[activeCycleIndex % cycles.length];
      return activeCycle ? [activeCycle] : [];
    }
    if (result.cycle) {
      return [result.cycle];
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

  // Render wallet balance SVG chart
  const renderBalanceChart = () => {
    const w = 500;
    const h = 100;
    const pad = 15;
    const chartW = w - 2 * pad;
    const chartH = h - 2 * pad;

    const maxB = Math.max(...balanceHistory, 100000.0 * 1.05);
    const minB = Math.min(...balanceHistory, 99900.0);

    const getX = (i) => pad + (i / Math.max(1, balanceHistory.length - 1)) * chartW;
    const getY = (val) => h - pad - ((val - minB) / (maxB - minB || 1)) * chartH;

    let pathStr = '';
    balanceHistory.forEach((v, idx) => {
      const x = getX(idx);
      const y = getY(v);
      if (idx === 0) pathStr = `M ${x} ${y}`;
      else pathStr += ` L ${x} ${y}`;
    });

    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        <path d={pathStr} fill="none" stroke="var(--accent-green)" strokeWidth={2} />
        {balanceHistory.map((v, idx) => (
          <circle key={idx} cx={getX(idx)} cy={getY(v)} r={2.5} fill="var(--accent-green)" />
        ))}
      </svg>
    );
  };

  const getSimSummarySplits = () => {
    const ticks = [2, 5, 8];
    return ticks.map(t => {
      const items = ledger.filter(item => item.tick === t);
      if (items.length === 0) return null;
      
      const timeStr = `${t * 2}s (Tick ${t})`;
      return (
        <div key={t} style={{ marginBottom: '6px' }}>
          <strong>{timeStr} — {items.length} Cycle{items.length > 1 ? 's' : ''} Active:</strong>
          <ul style={{ margin: '2px 0 0 12px', padding: 0, listStyle: 'disc', color: 'var(--text-muted)' }}>
            {items.map((item, idx) => {
              const hops = item.path.split(' → ').length - 1;
              const density = item.grossProfitPct / hops;
              return (
                <li key={idx}>
                  <span style={{ color: 'var(--accent-indigo)', fontWeight: '600' }}>{item.path}</span>:{' '}
                  <strong>{(item.capitalRatio || 100.0).toFixed(1)}%</strong> capital (~₹{Math.round(item.capitalAllocated || 100000.0).toLocaleString('en-IN')}) |{' '}
                  <span style={{ color: 'var(--accent-green)' }}>Gross +{item.grossProfitPct.toFixed(2)}%</span> |{' '}
                  Density: <strong>{density.toFixed(3)}</strong>
                </li>
              );
            })}
          </ul>
        </div>
      );
    });
  };

  return (
    <>
      {/* Mode + Controls */}
      <div className="glass-card" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Trading Algorithm</strong>
          <div className="mode-selector">
            {[
              { id: 'dfs', label: 'DFS', sub: 'Single Cycle' },
              { id: 'bellman-ford', label: 'Bellman-Ford', sub: 'Negative Log' },
              { id: 'knapsack', label: 'Knapsack', sub: 'Capital Allocation' },
            ].map(m => (
              <div key={m.id}
                className={`mode-card ${mode === m.id ? 'active' : ''}`}
                style={{ minWidth: '100px', padding: '6px 12px', opacity: simIsRunning ? 0.5 : 1, pointerEvents: simIsRunning ? 'none' : 'auto' }}
                onClick={() => {
                  setMode(m.id);
                  setResult(null);
                  setRateMap({});
                  if (m.id === 'knapsack') {
                    setSelectedSimId(4);
                  } else {
                    setSelectedSimId(1);
                  }
                }}
              >
                <h3 style={{ fontSize: '0.75rem' }}>{m.label}</h3>
                <p style={{ fontSize: '0.65rem' }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Simulation Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Simulation Scenarios</strong>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedSimId}
              onChange={(e) => setSelectedSimId(Number(e.target.value))}
              disabled={simIsRunning}
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {simScenarios
                .filter(s => mode === 'knapsack' ? s.id === 4 : s.id !== 4)
                .map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
            <button className="glow-btn" onClick={handleStartSim} disabled={simIsRunning && !simIsPaused} style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
              {simIsRunning ? 'Restart' : 'Start Simulation'}
            </button>
            {simIsRunning && (
              <button className="nav-btn" onClick={handlePauseSim} style={{ padding: '6px 12px', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)' }}>
                {simIsPaused ? 'Resume' : 'Pause'}
              </button>
            )}
            {simIsRunning && (
              <button className="nav-btn" onClick={handleStopSim} style={{ padding: '6px 12px', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', background: 'var(--accent-red-light)' }}>
                Stop
              </button>
            )}
            {simIsRunning && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginLeft: '6px', fontWeight: 'bold' }}>
                {simTimer}s / 20s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Graph + Results */}
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '12px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <CurrencyGraph graphData={graphData} cycles={getActiveCycles()} />

        {result && (
          <div className="glass-card result-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'slide-in 0.4s ease-out', overflowY: 'auto' }}>
            {/* Simulation Dashboard overlay */}
            <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid var(--accent-green)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-green)' }}>HFT Mock Trading Wallet</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoTrade} onChange={(e) => setAutoTrade(e.target.checked)} style={{ transform: 'scale(1.1)' }} />
                  Auto-Trade
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                  ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h1>
                <span style={{ fontSize: '0.78rem', color: walletBalance >= 100000.0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold' }}>
                  {walletBalance >= 100000.0 ? '+' : ''}{((walletBalance - 100000.0)/1000).toFixed(2)}% net returns
                </span>
              </div>
              {balanceHistory.length > 1 && renderBalanceChart()}
            </div>

            <h2>Detection Results</h2>
            <div className="algo-info">
              <strong>{result.algorithm}</strong>
              <p>{result.algorithm_description}</p>
            </div>

            {simTimer >= 20 && !simIsRunning ? (
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--accent-green)', borderRadius: '10px', textAlign: 'center', margin: '4px 0', animation: 'scale-in 0.3s ease-out' }}>
                <h3 style={{ color: 'var(--accent-green)', fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '6px' }}>
                  Simulation Completed Successfully
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  The 20-second real-time arbitrage HFT run is complete.
                </p>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Final Net Return</div>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                      +{((walletBalance - 100000.0)/1000).toFixed(2)}%
                    </strong>
                  </div>
                  <div style={{ width: '1px', height: '35px', background: 'var(--border-medium)' }}></div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Executed Trades</div>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                      {ledger.length} swaps
                    </strong>
                  </div>
                </div>
                {mode === 'knapsack' && (
                  <div style={{ marginTop: '14px', textAlign: 'left', borderTop: '1px solid var(--border-medium)', paddingTop: '10px' }}>
                    <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Proportional Allocation Splits:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', color: 'var(--text-primary)' }}>
                      {getSimSummarySplits()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {result.arbitrage_found ? (
                  <>
                    <h3 style={{ color: 'var(--accent-green)', fontSize: '1.05rem', marginBottom: '8px' }}>
                      Arbitrage Cycle Active
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {result.mode !== 'knapsack' && result.cycle && result.cycle.steps.map((step, idx) => (
                        <div key={idx} className="calc-step visible" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                          ₹{step.amount_before.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          {' × '}{step.rate.toFixed(4)}{' = '}
                          <strong style={{ color: 'var(--accent-green)' }}>
                            ₹{step.amount_after.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </strong>
                          <span style={{ float: 'right', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                            {step.from} → {step.to}
                          </span>
                        </div>
                      ))}
                      {result.mode === 'knapsack' && result.cycles && result.allocation && result.allocation.allocations.map((alloc, idx) => {
                        const cycle = result.cycles[alloc.cycle_index];
                        const pct = (alloc.capital / walletBalanceRef.current) * 100;
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

                    {result.mode !== 'knapsack' && result.cycle && (
                      <div className="final-profit" style={{ marginTop: '10px', padding: '8px' }}>
                        <h3>Cycle Profit Yield</h3>
                        <div className="profit-value" style={{ fontSize: '1.1rem' }}>
                          +{result.cycle.profit_percent.toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-arb">
                    <h3>No Arbitrage Available</h3>
                    <p>All cycle products ≤ 1.0 — no profitable path exists in this market tick.</p>
                  </div>
                )}
              </div>
            )}

            {/* Trading Ledger Table */}
            {ledger.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Mock Trade Ledger</h3>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '4px 6px' }}>Time</th>
                        <th style={{ padding: '4px 6px' }}>Swap Path</th>
                        <th style={{ padding: '4px 6px' }}>Capital Allocated</th>
                        <th style={{ padding: '4px 6px' }}>Gross %</th>
                        <th style={{ padding: '4px 6px' }}>Fee Paid</th>
                        <th style={{ padding: '4px 6px' }}>Net profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>{item.time}</td>
                          <td style={{ padding: '4px 6px', color: 'var(--accent-indigo)' }}>{item.path}</td>
                          <td style={{ padding: '4px 6px', color: 'var(--accent-purple)', fontWeight: 'bold' }}>
                            ₹{(item.capitalAllocated || 100000.0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({item.capitalRatio ? item.capitalRatio.toFixed(1) : '100.0'}%)
                          </td>
                          <td style={{ padding: '4px 6px', color: 'var(--accent-green)' }}>+{item.grossProfitPct.toFixed(2)}%</td>
                          <td style={{ padding: '4px 6px', color: 'var(--text-muted)' }}>₹{item.feePaid.toFixed(2)}</td>
                          <td style={{ padding: '4px 6px', fontWeight: 'bold', color: item.netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            ₹{item.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!result && !loading && (
        <div className="placeholder-text">
          <h2>Select an algorithm and click Start Simulation to begin</h2>
        </div>
      )}
      {loading && (
        <div className="placeholder-text">
          <h2 style={{ color: 'var(--accent-blue)' }}>Running algorithm on market graph...</h2>
        </div>
      )}
    </>
  );
}
