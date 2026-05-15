import React, { useEffect, useState } from 'react';

/**
 * ArbitrageBanner — Flash banner that appears when a new arbitrage cycle is detected.
 * Appears with slide-down animation, holds for 3s, then slides out.
 */
export default function ArbitrageBanner({ cycles, tick }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [lastCycleCount, setLastCycleCount] = useState(0);

  useEffect(() => {
    const currentCount = cycles?.length || 0;

    // Trigger banner when new cycles appear (count increases)
    if (currentCount > lastCycleCount && lastCycleCount >= 0 && tick > 1) {
      setVisible(true);
      setExiting(false);

      // Start exit after 3 seconds
      const exitTimer = setTimeout(() => {
        setExiting(true);
      }, 3000);

      // Fully hide after exit animation
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 3400);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }

    setLastCycleCount(currentCount);
  }, [cycles?.length, tick]);

  if (!visible) return null;

  return (
    <div className={`arb-banner ${exiting ? 'exiting' : ''}`} id="arb-banner">
      <span className="arb-banner-icon">⚡</span>
      <span>ARBITRAGE DETECTED</span>
      <span className="arb-banner-icon">⚡</span>
    </div>
  );
}
