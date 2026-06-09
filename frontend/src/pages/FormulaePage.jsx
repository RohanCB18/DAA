import React from 'react';

export default function FormulaePage() {
  return (
    <div className="about-page" style={{ paddingBottom: '30px' }}>
      {/* Hero Header */}
      <section className="about-hero" style={{ padding: '24px 16px', marginBottom: '10px' }}>
        <h1 className="hero-title" style={{ fontSize: '2.2rem', margin: '10px 0' }}>
          Mathematical <span className="hero-highlight">Formulations</span>
        </h1>
        <p className="hero-sub" style={{ fontSize: '0.9rem', maxWidth: '800px', margin: '0 auto' }}>
          A detailed review of the mathematical modeling, log-transformations, and algorithmic formulas 
          powering the QuantArb high-frequency pathfinding engine.
        </p>
      </section>

      {/* Grid of Formulas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* SECTION 1: Triangular Arbitrage & Log Transformation */}
        <section className="about-section">
          <h2 className="section-title">
            1. Logarithmic Weight Transformation
          </h2>
          <div className="about-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              In currency markets, arbitrage is a <strong>multiplicative</strong> phenomenon. If you trade through a loop of 
              currencies, you start with an initial amount and multiply it by each rate along the path. 
              A cycle of currencies is profitable if the product of their exchange rates is greater than 1:
            </p>

            {/* Formula Block */}
            <div className="glass-card" style={{ padding: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)', borderRadius: '8px', textAlign: 'center', margin: '8px 0' }}>
              <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                r<sub>1</sub> × r<sub>2</sub> × ... × r<sub>k</sub> &gt; 1.0
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                (Condition for Gross Arbitrage Profit)
              </div>
            </div>

            <p>
              However, standard pathfinding algorithms (like Bellman-Ford) are <strong>additive</strong>—they find the shortest 
              path by adding weights. To map this multiplicative problem onto an additive algorithm, we apply the 
              <strong>Negative Logarithmic Transformation</strong> to each rate:
            </p>

            {/* Formula Block */}
            <div className="glass-card" style={{ padding: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)', borderRadius: '8px', textAlign: 'center', margin: '8px 0' }}>
              <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent-indigo)' }}>
                w<sub>i</sub> = -ln(r<sub>i</sub>)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                (Negative Log Transformation of Individual Edge Weights)
              </div>
            </div>

            <p>
              Applying this transformation converts the cycle requirement:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '10px', background: 'rgba(99, 102, 241, 0.05)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--accent-indigo)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
              <div style={{ textAlign: 'right' }}>
                ln(r<sub>1</sub> × r<sub>2</sub> × ... × r<sub>k</sub>) &gt; ln(1.0)
              </div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>➔</div>
              <div style={{ textAlign: 'left' }}>
                -ln(r<sub>1</sub>) - ln(r<sub>2</sub>) - ... - ln(r<sub>k</sub>) &lt; 0.0
              </div>
            </div>

            <p style={{ marginTop: '4px' }}>
              This mathematically proves that a <strong>profitable arbitrage cycle</strong> (product &gt; 1.0) is identical to a 
              <strong>negative-weight cycle</strong> (sum of weights &lt; 0.0) in the transformed log-weight graph network.
            </p>
          </div>
        </section>

        {/* SECTION 2: Transaction Fees & Net Profitability */}
        <section className="about-section">
          <h2 className="section-title">
            2. Transaction Cost Adjustment
          </h2>
          <div className="about-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              In real-world markets, each transaction swap incurs a percentage fee. Our engine models this as a 
              <strong>0.05% fee per hop</strong> (or f = 0.0005). In a path of <i>k</i> hops, your final capital is reduced by the compounding fee:
            </p>

            {/* Formula Block */}
            <div className="glass-card" style={{ padding: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)', borderRadius: '8px', textAlign: 'center', margin: '8px 0' }}>
              <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Net Return = Gross Product × (1 - f)<sup>k</sup>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                (compounding fee penalty per execution step)
              </div>
            </div>

            <p>
              To ensure that we only trade when the cycle yields a net positive profit, the threshold for 
              arbitrage shifts. We adjust this math dynamically for both algorithms:
            </p>

            <div className="algo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
              {/* BF adjustment */}
              <div className="glass-card" style={{ padding: '12px', borderLeft: '4px solid var(--accent-green)' }}>
                <h4 style={{ color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Bellman-Ford Fee Offset</h4>
                <p style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                  The fee is embedded directly inside the negative log weights:
                </p>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 'bold', margin: '6px 0', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                  w'<sub>i</sub> = -ln(r<sub>i</sub>) + 0.0005
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  A negative cycle (Sum(w'<sub>i</sub>) &lt; 0) naturally guarantees net profitability.
                </p>
              </div>

              {/* DFS adjustment */}
              <div className="glass-card" style={{ padding: '12px', borderLeft: '4px solid var(--accent-blue)' }}>
                <h4 style={{ color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>DFS & Knapsack Validator</h4>
                <p style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                  The raw path product is validated against the exponential cost constraint:
                </p>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 'bold', margin: '6px 0', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                  Product(r<sub>i</sub>) &gt; (1.0005)<sup>k</sup>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Filters out any paths where transaction fees exceed gross gains.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Side-by-Side Algorithm Formulations */}
        <section className="about-section">
          <h2 className="section-title">
            3. Algorithm Formulations
          </h2>
          <div className="algo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Bellman-Ford Card */}
            <div className="algo-card">
              <div className="algo-card-header" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', padding: '12px 16px' }}>
                <span className="algo-mode">Method A</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>Bellman-Ford Pathfinder</h3>
              </div>
              <div className="algo-card-body" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                  An iterative dynamic programming algorithm that scans the graph of nodes (V) and edges (E) 
                  to resolve shortest path distances from a single source.
                </p>

                <div style={{ borderLeft: '3px solid var(--accent-green)', paddingLeft: '8px', margin: '4px 0' }}>
                  <h5 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Edge Relaxation Formula:</h5>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 'bold', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', marginTop: '2px' }}>
                    d[v] = min( d[v], d[u] + w(u,v) )
                  </div>
                </div>

                <div style={{ borderLeft: '3px solid var(--accent-green)', paddingLeft: '8px', margin: '4px 0' }}>
                  <h5 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>V-th Pass Negative Cycle Condition:</h5>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 'bold', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', marginTop: '2px', color: 'var(--accent-red)' }}>
                    if (d[u] + w(u,v) &lt; d[v]) ➔ Cycle Found
                  </div>
                </div>

                <div className="algo-complexity" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Time Complexity: <strong>O(V × E)</strong></span>
                  <span>Space: <strong>O(V)</strong></span>
                </div>
              </div>
            </div>

            {/* Modified DFS Card */}
            <div className="algo-card">
              <div className="algo-card-header" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '12px 16px' }}>
                <span className="algo-mode">Method B</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>Modified DFS Pathfinder</h3>
              </div>
              <div className="algo-card-body" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                  A recursive backtracking algorithm that traverses exchange paths up to a specified depth 
                  limit (D) and checks if the return path closes a profitable loop.
                </p>

                <div style={{ borderLeft: '3px solid var(--accent-blue)', paddingLeft: '8px', margin: '4px 0' }}>
                  <h5 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Path Accumulator Formula:</h5>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 'bold', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', marginTop: '2px' }}>
                    p<sub>new</sub> = p<sub>old</sub> × rate(u,v)
                  </div>
                </div>

                <div style={{ borderLeft: '3px solid var(--accent-blue)', paddingLeft: '8px', margin: '4px 0' }}>
                  <h5 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cycle Check Constraints:</h5>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 'bold', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', marginTop: '2px' }}>
                    len(path) &ge; 3 AND len(path) &le; 5
                  </div>
                </div>

                <div className="algo-complexity" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Time Complexity: <strong>O(V × deg<sup>D</sup>)</strong></span>
                  <span>Space: <strong>O(V)</strong></span>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
