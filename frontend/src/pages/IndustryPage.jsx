import React from 'react';

export default function IndustryPage() {
  return (
    <div className="about-page" style={{ paddingBottom: '30px' }}>
      {/* Header */}
      <section className="about-hero" style={{ padding: '24px 16px', marginBottom: '10px' }}>
        <h1 className="hero-title" style={{ fontSize: '2.2rem', margin: '10px 0' }}>
          HFT Production & <span className="hero-highlight">Industry Insights</span>
        </h1>
        <p className="hero-sub" style={{ fontSize: '0.9rem', maxWidth: '800px', margin: '0 auto' }}>
          Rigorous research on how institutional quantitative desks and High-Frequency Trading (HFT) 
          firms design, accelerate, and execute real-world arbitrage loops in practice.
        </p>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Section 1: The Live Execution Pipeline */}
        <section className="about-section">
          <h2 className="section-title">
            <span className="section-icon">🌐</span>
            1. Production Software Pipeline
          </h2>
          
          <div className="about-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              In production, arbitrage is not modeled on static datasets or periodic checks. HFT software is designed 
              to parse price streams and route execution instructions in microseconds using a highly optimized, event-driven pipeline:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', margin: '10px 0', textAlign: 'center' }}>
              {[
                { title: '1. Ingestion', desc: 'L2/L3 WebSocket feed parses bid/ask updates in sub-microseconds.' },
                { title: '2. Parsing', desc: 'Asynchronous C++ parser feeds rates into memory.' },
                { title: '3. Adjacency Matrix', desc: 'Shared-memory graph matrix updates on every incoming tick.' },
                { title: '4. Hot-Loop Solver', desc: 'Bellman-Ford runs continuously in under 15 microseconds.' },
                { title: '5. Exec Router (SOR)', desc: 'Fires simultaneous IOC orders to the exchange matchers.' }
              ].map((step, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '8px', borderTop: '3px solid var(--accent-indigo)' }}>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--accent-indigo)', display: 'block', marginBottom: '4px' }}>{step.title}</strong>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid var(--border-medium)', marginTop: '4px' }}>
              <h4 style={{ color: 'var(--accent-indigo)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>💡 Operational Execution Highlights</h4>
              <ul style={{ paddingLeft: '16px', listStyleType: 'disc', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>
                  <strong>Event-Driven Hot Loops:</strong> Execution is never time-based (e.g. "every second"). An interval of one second represents an eternity in HFT. The solver thread runs continuously in an infinite loop, recalculating paths immediately upon receiving any price change.
                </li>
                <li>
                  <strong>Immediate-or-Cancel (IOC) Execution:</strong> To bypass <em>"leg execution risk"</em> (where the first three trades succeed, but the final trade fails because the rate shifted, leaving you with open currency exposure), HFT desks send all leg orders simultaneously as IOC. If the entire path cannot be filled at the calculated price, the exchange cancels all trades immediately.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Hardware Acceleration */}
        <section className="about-section">
          <h2 className="section-title">
            <span className="section-icon">⚡</span>
            2. The Latency Race & Hardware Acceleration
          </h2>
          
          <div className="about-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              Since arbitrage is a zero-sum, first-come-first-served race, standard computer processors (CPUs) 
              and operating systems are often too slow due to network stack delays and context switching. 
              Desks bypass these delays by moving their execution logic directly onto hardware:
            </p>

            <div className="algo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '6px' }}>
              
              {/* FPGA */}
              <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-green)', padding: '12px' }}>
                <h4 style={{ color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>FPGA Custom Silicon</h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Firms code their pathfinding algorithms directly in hardware descriptive languages (Verilog/VHDL) 
                  and burn them onto **Field Programmable Gate Arrays (FPGAs)**. The chip updates the graph 
                  and generates order packets in **nanoseconds**, bypassing the CPU entirely.
                </p>
              </div>

              {/* Kernel Bypass */}
              <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-blue)', padding: '12px' }}>
                <h4 style={{ color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Kernel Bypass (Solarflare)</h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Standard network packets must go through the OS kernel network stack. Desks use specialized 
                  network interface cards (NICs) with **Kernel Bypass** technology (like OpenOnload) 
                  which copies network bytes directly to user-space application memory in under a microsecond.
                </p>
              </div>

              {/* Microwave */}
              <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-amber)', padding: '12px' }}>
                <h4 style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Microwave Networks</h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  For cross-venue arbitrage (chasing price mismatches between geographically separated exchanges), 
                  firms transmit price updates via **Microwave Radio Waves** beamed between towers, 
                  which travel faster through the air than light does through fiber optic glass cables.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Section 3: Trader Perspective & Consensus */}
        <section className="about-section">
          <h2 className="section-title">
            <span className="section-icon">💬</span>
            3. Quantitative Trader & Industry Perspective
          </h2>
          
          <div className="about-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              To gauge the practical utility of this software, we researched industry whitepapers, quant developer forums, 
              and interview transcripts from algorithmic traders. Here is the industry consensus on how these systems operate:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {[
                {
                  q: "How do traders manage bid/ask spreads instead of mid-prices?",
                  a: "In production, the graph does not use a single mid-market rate. It uses double directed edges for every pair. To go from USD to EUR, you buy EUR at the Ask price (Edge weight = -ln(Ask)). To go back, you sell EUR at the Bid price (Edge weight = -ln(1/Bid))."
                },
                {
                  q: "Why is Bellman-Ford preferred over DFS/Dijkstra in pathfinding?",
                  a: "DFS is highly sensitive to node degree and suffers from combinatorial explosion on larger networks. Dijkstra cannot handle negative weights (which are necessary to model log-transformed rates). Bellman-Ford handles negative weights natively, is highly deterministic (O(V * E)), and runs in under 15 microseconds, making it the perfect choice."
                },
                {
                  q: "What is the biggest risk traders face in path arbitrage?",
                  a: "Execution/Leg Risk. If your network connection to the exchange is slow, or if your algorithm takes too long to run, the prices will adjust before your orders arrive, causing a loss. This is why firms spend millions of dollars optimizing their C++ codebase and hosting their servers in the same data center as the exchange (co-location)."
                }
              ].map((qa, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>🗣️ Q: {qa.q}</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{qa.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
