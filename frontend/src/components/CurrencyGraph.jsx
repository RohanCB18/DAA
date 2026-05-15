import React, { useMemo } from 'react';

// Spacious layout — nodes spread across full width
const NODE_POSITIONS = {
  'CHF': { x: 40,  y: 35 },
  'EUR': { x: 300, y: 25 },
  'HKD': { x: 550, y: 40 },
  'CAD': { x: 30,  y: 160 },
  'INR': { x: 250, y: 150 },
  'USD': { x: 520, y: 155 },
  'AUD': { x: 40,  y: 280 },
  'SGD': { x: 310, y: 275 },
  'JPY': { x: 550, y: 270 },
  'GBP': { x: 150, y: 340 },
};

const NODE_COLORS = {
  'INR': '#f59e0b', 'USD': '#10b981', 'EUR': '#3b82f6', 'GBP': '#8b5cf6',
  'JPY': '#ef4444', 'CHF': '#ec4899', 'AUD': '#14b8a6', 'CAD': '#f97316',
  'SGD': '#6366f1', 'HKD': '#06b6d4',
};

const ALL_CURRENCIES = ['INR','USD','EUR','GBP','JPY','CHF','AUD','CAD','SGD','HKD'];
const WIDTH = 590;
const HEIGHT = 370;
const R = 22;

export default function CurrencyGraph({ graphData, cycles }) {
  const activeEdges = useMemo(() => {
    const s = new Set();
    cycles?.forEach(c => { for (let i=0;i<c.path.length-1;i++) s.add(`${c.path[i]}->${c.path[i+1]}`); });
    return s;
  }, [cycles]);

  const hasEdges = graphData?.links?.length > 0;

  const edgePath = (from, to) => {
    const a = NODE_POSITIONS[from], b = NODE_POSITIONS[to];
    if (!a||!b) return '';
    const dx=b.x-a.x, dy=b.y-a.y, d=Math.sqrt(dx*dx+dy*dy);
    const ux=dx/d, uy=dy/d;
    const x1=a.x+ux*(R+2), y1=a.y+uy*(R+2), x2=b.x-ux*(R+7), y2=b.y-uy*(R+7);
    const rev = graphData?.links?.some(l=>l.from===to&&l.to===from);
    if (rev) { const c=20; return `M${x1} ${y1}Q${(x1+x2)/2+(-uy*c)} ${(y1+y2)/2+(ux*c)} ${x2} ${y2}`; }
    return `M${x1} ${y1}L${x2} ${y2}`;
  };

  const labelPos = (from, to) => {
    const a=NODE_POSITIONS[from], b=NODE_POSITIONS[to];
    if (!a||!b) return {x:0,y:0};
    const dx=b.x-a.x, dy=b.y-a.y, d=Math.sqrt(dx*dx+dy*dy), ux=dx/d, uy=dy/d;
    const rev = graphData?.links?.some(l=>l.from===to&&l.to===from);
    const o=rev?12:8;
    return {x:(a.x+b.x)/2+(-uy*o), y:(a.y+b.y)/2+(ux*o)};
  };

  return (
    <div className="glass-card" id="currency-graph-panel" style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div className="glass-card-header">
        <h2>Currency Graph</h2>
        {hasEdges && <span style={{fontSize:'0.65rem',color:'var(--text-dim)',fontFamily:'var(--font-mono)'}}>{graphData.links.length} edges</span>}
      </div>
      <div style={{padding:'4px 8px',flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{width:'100%',maxHeight:'340px'}}>
          <defs>
            <marker id="ad" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="6" markerHeight="4" orient="auto-start-reverse"><polygon points="0 0,10 3.5,0 7" fill="#94a3b8"/></marker>
            <marker id="aa" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="7" markerHeight="5" orient="auto-start-reverse"><polygon points="0 0,10 3.5,0 7" fill="#10b981"/></marker>
            <filter id="gg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="ns" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1"/></filter>
          </defs>

          {/* Layer 1: Inactive edges — dim them when cycle is active */}
          {hasEdges && graphData.links.filter(l => !activeEdges.has(`${l.from}->${l.to}`)).map((l,i) => {
            const lp=labelPos(l.from,l.to);
            const hasCycle = activeEdges.size > 0;
            return (<g key={`ie-${i}`} style={{animation:'fade-in 0.3s ease',animationDelay:`${i*15}ms`,animationFillMode:'both'}}>
              <path d={edgePath(l.from,l.to)} stroke="#94a3b8" strokeWidth={1.5}
                markerEnd="url(#ad)" opacity={hasCycle ? 0.15 : 0.7} fill="none"/>
              {l.rate && !hasCycle && <text x={lp.x} y={lp.y} fontSize="8px" fontWeight={500}
                fill="#64748b" textAnchor="middle" fontFamily="var(--font-mono)">{l.rate}</text>}
            </g>);
          })}

          {/* Layer 2: Active cycle edges — clean green, on top */}
          {hasEdges && graphData.links.filter(l => activeEdges.has(`${l.from}->${l.to}`)).map((l,i) => {
            const lp=labelPos(l.from,l.to);
            return (<g key={`ae-${i}`}>
              <path d={edgePath(l.from,l.to)} stroke="#10b981" strokeWidth={2.5}
                markerEnd="url(#aa)" opacity={1} fill="none"/>
              {l.rate && <text x={lp.x} y={lp.y} fontSize="9px" fontWeight={700}
                fill="#059669" textAnchor="middle" fontFamily="var(--font-mono)"
                stroke="#fff" strokeWidth="2.5" paintOrder="stroke">{l.rate}</text>}
            </g>);
          })}

          {/* Layer 3: Nodes */}
          {ALL_CURRENCIES.map(c => {
            const p=NODE_POSITIONS[c], col=NODE_COLORS[c], inC=cycles?.some(cy=>cy.path?.includes(c));
            return (<g key={c} transform={`translate(${p.x},${p.y})`} filter="url(#ns)">
              {inC && <circle r={R+5} fill="none" stroke="#10b981" strokeWidth="2.5" opacity=".6" filter="url(#gg)" style={{animation:'edge-glow 1.5s ease-in-out infinite'}}/>}
              <circle r={R} fill={col} stroke={inC?'#10b981':'#fff'} strokeWidth={inC?3:2}/>
              <text fill="#fff" fontSize="10px" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-sans)" style={{pointerEvents:'none'}}>{c}</text>
            </g>);
          })}
        </svg>
      </div>
    </div>
  );
}
