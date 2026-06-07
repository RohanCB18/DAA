import React from 'react';

export default function AboutPage({ onNavigate }) {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <h1 className="hero-title">
          QuantArb:<br />
          <span className="hero-highlight">High-Frequency Arbitrage Detector</span>
        </h1>
        <p className="hero-sub">
          A graph-based system that models multi-currency exchange markets as weighted directed graphs
          and applies advanced algorithmic techniques to detect and exploit arbitrage opportunities in real time.
        </p>
        <button className="glow-btn" onClick={() => onNavigate('test')} style={{ marginTop: '16px' }}>
          🚀 Launch Test Console
        </button>
      </section>

      {/* Problem Statement */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon">🎯</span>
          Problem Statement
        </h2>
        <div className="about-card">
          <p>
            In foreign exchange markets, currency conversion rates fluctuate continuously.
            Occasionally, a sequence of conversions — say INR → USD → EUR → INR — can yield
            <strong> more money than the initial amount</strong>, creating an arbitrage opportunity.
          </p>
          <p style={{ marginTop: '12px' }}>
            Detecting these profitable cycles in a graph of <strong>10 currencies</strong> with
            dozens of directed edges requires efficient graph traversal and optimisation algorithms.
            This project implements three distinct algorithmic approaches to solve this problem.
          </p>
        </div>
      </section>

      {/* Currency Model */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon">💱</span>
          Currency Graph Model
        </h2>
        <div className="currency-grid">
          {[
            { code: 'INR', name: 'Indian Rupee', color: '#f59e0b', flag: '🇮🇳' },
            { code: 'USD', name: 'US Dollar', color: '#10b981', flag: '🇺🇸' },
            { code: 'EUR', name: 'Euro', color: '#3b82f6', flag: '🇪🇺' },
            { code: 'GBP', name: 'British Pound', color: '#8b5cf6', flag: '🇬🇧' },
            { code: 'JPY', name: 'Japanese Yen', color: '#ef4444', flag: '🇯🇵' },
            { code: 'CHF', name: 'Swiss Franc', color: '#ec4899', flag: '🇨🇭' },
            { code: 'AUD', name: 'Australian Dollar', color: '#14b8a6', flag: '🇦🇺' },
            { code: 'CAD', name: 'Canadian Dollar', color: '#f97316', flag: '🇨🇦' },
            { code: 'SGD', name: 'Singapore Dollar', color: '#6366f1', flag: '🇸🇬' },
            { code: 'HKD', name: 'Hong Kong Dollar', color: '#06b6d4', flag: '🇭🇰' },
          ].map(c => (
            <div key={c.code} className="currency-chip" style={{ borderColor: c.color }}>
              <span className="chip-flag">{c.flag}</span>
              <span className="chip-code" style={{ color: c.color }}>{c.code}</span>
              <span className="chip-name">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Algorithms */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon">⚙️</span>
          Algorithms Implemented
        </h2>
        <div className="algo-grid">
          {/* DFS */}
          <div className="algo-card">
            <div className="algo-card-header" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <span className="algo-mode">Mode 1</span>
              <h3>Modified DFS</h3>
            </div>
            <div className="algo-card-body">
              <p className="algo-tagline">Single Cycle Detection</p>
              <div className="algo-detail">
                <strong>Approach:</strong> Depth-First Search traversal of the currency graph, tracking the
                running product of exchange rates along each path. When a cycle is found whose product &gt; 1.0,
                an arbitrage opportunity exists.
              </div>
              <div className="algo-complexity">
                <span>Time: <code>O(V + E)</code></span>
                <span>Space: <code>O(V)</code></span>
              </div>
            </div>
          </div>

          {/* Bellman-Ford */}
          <div className="algo-card">
            <div className="algo-card-header" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}>
              <span className="algo-mode">Mode 2</span>
              <h3>Bellman-Ford</h3>
            </div>
            <div className="algo-card-body">
              <p className="algo-tagline">Negative Log Weight Transform</p>
              <div className="algo-detail">
                <strong>Approach:</strong> Transform each edge weight <em>r</em> to <code>−log(r)</code>.
                In this transformed graph, a negative-weight cycle corresponds to an arbitrage opportunity
                (since <code>−log(∏rᵢ) &lt; 0 ⟹ ∏rᵢ &gt; 1</code>). Standard Bellman-Ford detects
                negative cycles after V−1 relaxation passes.
              </div>
              <div className="algo-complexity">
                <span>Time: <code>O(V·E)</code></span>
                <span>Space: <code>O(V)</code></span>
              </div>
            </div>
          </div>

          {/* Knapsack */}
          <div className="algo-card">
            <div className="algo-card-header" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
              <span className="algo-mode">Mode 3</span>
              <h3>Fractional Knapsack</h3>
            </div>
            <div className="algo-card-body">
              <p className="algo-tagline">Greedy Capital Allocation</p>
              <div className="algo-detail">
                <strong>Approach:</strong> Once all profitable cycles are detected using DFS, capital is
                allocated across them using a Greedy/Fractional Knapsack strategy. Each cycle is assigned a
                <em> viability score</em> (profit % × confidence), and capital is distributed proportionally
                to maximise total portfolio return.
              </div>
              <div className="algo-complexity">
                <span>Time: <code>O(n log n)</code></span>
                <span>Space: <code>O(n)</code></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon">🔄</span>
          How It Works
        </h2>
        <div className="steps-flow">
          {[
            { step: '1', title: 'Market Snapshot', desc: 'Exchange rates are loaded dynamically for 10 sequential ticks across 4 curated market scenarios (Steady Growth, Flash Volatility, Flat Dry Market, and Knapsack Allocation).', icon: '📊' },
            { step: '2', title: 'Graph Construction', desc: 'Currencies become nodes, and exchange rates become directed weighted edges in the graph, using a logarithmic transform (-ln(rate)) for Bellman-Ford.', icon: '🕸️' },
            { step: '3', title: 'Cycle Detection', desc: 'The selected algorithm scans for cycles that are strictly net-profitable after accounting for a 0.05% transaction fee per hop.', icon: '🔍' },
            { step: '4', title: 'Profit Calculation', desc: 'For each cycle, a step-by-step trade simulation computes the exact profit from ₹1,00,000, displaying real-time fee deductions and ledger logs.', icon: '💰' },
          ].map(s => (
            <div key={s.step} className="step-item">
              <div className="step-number">{s.icon}</div>
              <div className="step-content">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon">🏗️</span>
          Tech Stack
        </h2>
        <div className="tech-grid">
          {[
            { name: 'C++17', role: 'Backend Engine', desc: 'High-performance REST API with statically-linked binary', color: '#00599C' },
            { name: 'React', role: 'Frontend UI', desc: 'Interactive dashboard with SVG graph visualization', color: '#61DAFB' },
            { name: 'Vite', role: 'Build Tool', desc: 'Lightning-fast HMR and optimized production builds', color: '#646CFF' },
            { name: 'Bellman-Ford', role: 'Core Algorithm', desc: 'Negative-log weight transform for cycle detection', color: '#10b981' },
          ].map(t => (
            <div key={t.name} className="tech-chip">
              <div className="tech-dot" style={{ background: t.color }}></div>
              <div>
                <strong>{t.name}</strong>
                <span className="tech-role">{t.role}</span>
                <p>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <h2>Ready to detect arbitrage?</h2>
        <p>Launch the test console to run live detection on randomized market data.</p>
        <button className="glow-btn" onClick={() => onNavigate('test')} style={{ marginTop: '12px', fontSize: '0.9rem' }}>
          🚀 Go to Test Console →
        </button>
      </section>
    </div>
  );
}
