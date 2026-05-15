import React, { useRef, useEffect, useState } from 'react';
import { formatRate } from '../utils/helpers';

/**
 * RateTicker — Bottom strip showing live exchange rates with change indicators.
 */
export default function RateTicker({ links }) {
  const [prevRates, setPrevRates] = useState({});
  const scrollRef = useRef(null);

  // Track previous rates for change indicators
  useEffect(() => {
    if (!links || links.length === 0) return;
    const currentRates = {};
    links.forEach((link) => {
      currentRates[`${link.from}/${link.to}`] = link.rate;
    });
    setPrevRates((prev) => {
      // Only update if we have previous data
      if (Object.keys(prev).length === 0) return currentRates;
      return prev;
    });

    // After a brief delay, store current as prev for next comparison
    const timer = setTimeout(() => {
      setPrevRates(currentRates);
    }, 400);
    return () => clearTimeout(timer);
  }, [links]);

  if (!links || links.length === 0) {
    return (
      <div className="rate-ticker" id="rate-ticker">
        <span className="rate-ticker-label">Live Rates</span>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
          Waiting for data...
        </span>
      </div>
    );
  }

  return (
    <div className="rate-ticker" id="rate-ticker">
      <span className="rate-ticker-label">Live Rates</span>
      <div className="rate-ticker-scroll" ref={scrollRef}>
        {links.map((link, idx) => {
          const pairKey = `${link.from}/${link.to}`;
          const prevRate = prevRates[pairKey];
          const change = prevRate ? link.rate - prevRate : 0;
          const isUp = change > 0.00001;
          const isDown = change < -0.00001;

          return (
            <div key={idx} className="rate-item">
              <span className="rate-pair">{link.from}/{link.to}:</span>
              <span className="rate-value">
                {formatRate(link.rate, link.from, link.to)}
              </span>
              {(isUp || isDown) && (
                <span className={`rate-change ${isUp ? 'up' : 'down'}`}>
                  {isUp ? '▲' : '▼'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
