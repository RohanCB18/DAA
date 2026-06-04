import React, { useState, useEffect, useRef } from 'react';
import CurrencyGraph from '../components/CurrencyGraph.jsx';

const API_LIST_URL = 'http://127.0.0.1:8081/api/simulation/list';
const API_TICK_URL = 'http://127.0.0.1:8081/api/simulation/tick';

export default function ComparisonPage() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedSimId, setSelectedSimId] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTick, setCurrentTick] = useState(-1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  // Stores array of results for each tick
  const [tickResults, setTickResults] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    // Load simulation scenarios on mount
    fetch(API_LIST_URL)
      .then((res) => res.json())
      .then((data) => setScenarios(data))
      .catch((err) => console.error('Failed to load scenarios:', err));
  }, []);

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentTick(0);
    setElapsedSeconds(0);
    setTickResults([]);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentTick(-1);
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Run the current tick
  useEffect(() => {
    if (!isRunning || isPaused || currentTick < 0 || currentTick >= 10) {
      if (currentTick >= 10) {
        setIsRunning(false);
      }
      return;
    }

    let active = true;

    const fetchTick = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_TICK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            simulation_id: selectedSimId,
            tick_index: currentTick,
          }),
        });
        const data = await res.json();
        if (!active) return;
        setTickResults((prev) => {
          const next = [...prev];
          next[currentTick] = data;
          return next;
        });
      } catch (err) {
        if (active) console.error('Error fetching tick:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTick();

    // Setup timer to advance tick after 2 seconds
    timerRef.current = setTimeout(() => {
      setCurrentTick((prev) => prev + 1);
      setElapsedSeconds((prev) => prev + 2);
    }, 2000);

    return () => {
      active = false;
      clearTimeout(timerRef.current);
    };
  }, [isRunning, isPaused, currentTick, selectedSimId]);

  // Clean up timer on unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const currentResult = tickResults[currentTick] || tickResults[tickResults.length - 1];

  const getDfsActiveCycles = () => {
    if (!currentResult?.dfs?.arbitrage_found) return [];
    const cycle = currentResult.dfs.cycle;
    return cycle ? [cycle] : [];
  };

  const getBfActiveCycles = () => {
    if (!currentResult?.bellman_ford?.arbitrage_found) return [];
    const cycle = currentResult.bellman_ford.cycle;
    return cycle ? [cycle] : [];
  };

  // Build edges based on rates in result
  const buildEdges = () => {
    if (!currentResult) return [];
    const rates = {};
    currentResult.edges.forEach((e) => {
      rates[`${e.from}->${e.to}`] = e.rate;
    });

    const DEFAULT_EDGES = [
      { from: 'CHF', to: 'EUR' }, { from: 'EUR', to: 'HKD' },
      { from: 'CHF', to: 'CAD' }, { from: 'EUR', to: 'INR' }, { from: 'HKD', to: 'USD' },
      { from: 'CAD', to: 'INR' }, { from: 'INR', to: 'USD' },
      { from: 'CAD', to: 'AUD' }, { from: 'INR', to: 'SGD' }, { from: 'USD', to: 'JPY' },
      { from: 'AUD', to: 'SGD' }, { from: 'SGD', to: 'JPY' },
      { from: 'SGD', to: 'GBP' }, { from: 'AUD', to: 'GBP' }, { from: 'JPY', to: 'GBP' },
      { from: 'CHF', to: 'INR' }, { from: 'USD', to: 'GBP' },
    ];

    const edgeSet = new Set(DEFAULT_EDGES.map((e) => `${e.from}->${e.to}`));
    const extra = [];

    // Add paths from both active cycles
    [getDfsActiveCycles(), getBfActiveCycles()].forEach((cyclesList) => {
      cyclesList.forEach((c) => {
        if (!c.path) return;
        for (let i = 0; i < c.path.length - 1; i++) {
          const key = `${c.path[i]}->${c.path[i + 1]}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            extra.push({ from: c.path[i], to: c.path[i + 1] });
          }
        }
      });
    });

    return [...DEFAULT_EDGES, ...extra].map((edge) => ({
      ...edge,
      rate: rates[`${edge.from}->${edge.to}`] || undefined,
    }));
  };

  const graphData = {
    nodes: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'SGD', 'HKD'].map((c) => ({ id: c })),
    links: buildEdges(),
  };



  return (
    <div className="about-page" style={{ gap: '12px' }}>
      {/* Active Simulation Scenario Info */}
      <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2>1. Benchmark Scenario</h2>
        <div 
          className="mode-card active"
          style={{ padding: '12px 16px', textAlign: 'left', borderLeft: '4px solid var(--accent-blue)', cursor: 'default' }}
        >
          <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', fontWeight: 'bold' }}>Steady Growth Market</h3>
          <p style={{ fontSize: '0.75rem', marginTop: '6px', lineHeight: '1.4', color: 'var(--text-muted)' }}>
            A low-volatility market presenting steady, minor arbitrage opportunities (total compounded net return: ~1.4%). The benchmark runs a 20-second simulation comparing the processing speed (execution time in microseconds), graph operation count (traversals/relaxations), and path accuracy of Modified DFS vs Bellman-Ford side-by-side.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '4px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="glow-btn" onClick={handleStart} disabled={isRunning && !isPaused} style={{ background: 'var(--accent-indigo)' }}>
              {isRunning ? '🔄 Restart' : '▶ Start 20s Simulation'}
            </button>
            {isRunning && (
              <button className="nav-btn" onClick={handlePause} style={{ border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)' }}>
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
            {isRunning && (
              <button className="nav-btn" onClick={handleStop} style={{ border: '1px solid var(--accent-red)', color: 'var(--accent-red)', background: 'var(--accent-red-light)' }}>
                ⏹ Stop
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 'bold' }}>
              Time Elapsed: <span style={{ color: 'var(--accent-blue)' }}>{elapsedSeconds}s / 20s</span>
            </div>
            {isRunning && (
              <div className="status-indicator" style={{ background: isPaused ? 'var(--accent-amber)' : 'var(--accent-green)' }}></div>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Graph Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Left: DFS Graph */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="glass-card-header" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderBottom: 'none', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)', padding: '8px 14px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="tech-dot" style={{ background: 'var(--accent-blue)', width: '8px', height: '8px' }}></span>
              Algorithm A: Modified DFS
            </h2>
          </div>
          <CurrencyGraph graphData={graphData} cycles={getDfsActiveCycles()} />
        </div>

        {/* Right: Bellman-Ford Graph */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="glass-card-header" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderBottom: 'none', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)', padding: '8px 14px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="tech-dot" style={{ background: 'var(--accent-green)', width: '8px', height: '8px' }}></span>
              Algorithm B: Bellman-Ford
            </h2>
          </div>
          <CurrencyGraph graphData={graphData} cycles={getBfActiveCycles()} />
        </div>
      </div>

      {/* Metric comparison block */}
      {currentResult && (
        <div className="glass-card" style={{ padding: '14px', animation: 'slide-in 0.3s ease-out' }}>
          <h2>2. Benchmark Comparison (Tick #{currentResult.tick_index + 1} at {currentResult.tick_index * 2}s)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '6px' }}>Metric</th>
                <th style={{ padding: '6px', color: 'var(--accent-blue)' }}>Modified DFS</th>
                <th style={{ padding: '6px', color: 'var(--accent-green)' }}>Bellman-Ford</th>
                <th style={{ padding: '6px' }}>Comparison / Verdict</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>Execution Time</td>
                <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>
                  {currentResult.dfs.execution_time_us.toFixed(2)} μs
                </td>
                <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>
                  {currentResult.bellman_ford.execution_time_us.toFixed(2)} μs
                </td>
                <td style={{ padding: '8px 6px' }}>
                  {currentResult.dfs.execution_time_us < currentResult.bellman_ford.execution_time_us ? (
                    <strong style={{ color: 'var(--accent-blue)' }}>DFS is {(currentResult.bellman_ford.execution_time_us / (currentResult.dfs.execution_time_us || 1)).toFixed(1)}x faster</strong>
                  ) : (
                    <strong style={{ color: 'var(--accent-green)' }}>Bellman-Ford is {(currentResult.dfs.execution_time_us / (currentResult.bellman_ford.execution_time_us || 1)).toFixed(1)}x faster</strong>
                  )}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>Operations Count</td>
                <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>{currentResult.dfs.operation_count} traversals</td>
                <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>{currentResult.bellman_ford.operation_count} relaxations</td>
                <td style={{ padding: '8px 6px', color: 'var(--text-secondary)' }}>
                  DFS: Backtracking depth limit (5). BF: Full V relaxation passes (9 × 30 edges).
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>Arbitrage Found</td>
                <td style={{ padding: '8px 6px' }}>{currentResult.dfs.arbitrage_found ? '✅ Yes' : '❌ No'}</td>
                <td style={{ padding: '8px 6px' }}>{currentResult.bellman_ford.arbitrage_found ? '✅ Yes' : '❌ No'}</td>
                <td style={{ padding: '8px 6px' }}>
                  {currentResult.dfs.arbitrage_found === currentResult.bellman_ford.arbitrage_found ? (
                    <span style={{ color: 'var(--accent-green)' }}>Algorithms are in agreement</span>
                  ) : (
                    <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>Disagreement! DFS depth limits vs BF global scan.</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}


    </div>
  );
}
