import React, { useState, useEffect } from 'react';

const ACTIVITIES = [
  { icon: '🔍', name: 'Marcus T.', city: 'Houston, TX', action: 'just ran an inspection on a 2019 Ford F-150', result: 'saved $4,200', color: '#22c55e' },
  { icon: '🚨', name: 'Jennifer R.', city: 'Atlanta, GA', action: 'caught odometer fraud on a 2018 Honda Accord', result: 'client saved $8,500', color: '#ef4444' },
  { icon: '💰', name: 'Carlos M.', city: 'Miami, FL', action: 'completed 3 inspections today', result: 'earned $900', color: '#f59e0b' },
  { icon: '✅', name: 'David K.', city: 'Phoenix, AZ', action: 'just claimed the Phoenix territory', result: 'territory locked', color: '#3b82f6' },
  { icon: '🔍', name: 'Tanya W.', city: 'Chicago, IL', action: 'detected flood damage on a 2020 Chevy Tahoe', result: 'client saved $12,000', color: '#22c55e' },
  { icon: '💰', name: 'Robert J.', city: 'Dallas, TX', action: 'ran 5 fleet inspections this week', result: 'earned $2,250', color: '#f59e0b' },
  { icon: '🚨', name: 'Lisa P.', city: 'Los Angeles, CA', action: 'flagged title washing on a Tesla Model 3', result: 'fraud prevented', color: '#ef4444' },
  { icon: '✅', name: 'Kevin B.', city: 'Denver, CO', action: 'just got licensed — first inspection booked', result: 'territory claimed', color: '#3b82f6' },
  { icon: '🔍', name: 'Maria S.', city: 'San Antonio, TX', action: 'inspected a 2021 RAM 1500 for a first-time buyer', result: 'clean bill of health', color: '#22c55e' },
  { icon: '💰', name: 'James H.', city: 'Charlotte, NC', action: 'earned $1,200 in one Saturday', result: '6 inspections done', color: '#f59e0b' },
  { icon: '🚨', name: 'Angela T.', city: 'Nashville, TN', action: 'found hidden frame damage on a "clean" Camry', result: 'saved client $6,800', color: '#ef4444' },
  { icon: '✅', name: 'Derek M.', city: 'Seattle, WA', action: 'just claimed the Seattle territory', result: 'territory locked', color: '#3b82f6' },
  { icon: '🔍', name: 'Patricia L.', city: 'Orlando, FL', action: 'completed a commercial truck inspection', result: 'client saved $5,400', color: '#22c55e' },
  { icon: '💰', name: 'Tony R.', city: 'Las Vegas, NV', action: 'hit $3,000 in inspections this month', result: 'side hustle crushing it', color: '#f59e0b' },
  { icon: '🚨', name: 'Sandra K.', city: 'Minneapolis, MN', action: 'caught a VIN cloning scheme on a BMW 5 Series', result: 'police report filed', color: '#ef4444' },
  { icon: '🔍', name: 'Rachel G.', city: 'Austin, TX', action: 'inspected 4 vehicles for a dealer audit', result: 'earned $1,400', color: '#22c55e' },
  { icon: '💰', name: 'Brian N.', city: 'Columbus, OH', action: 'replaced his job income in 60 days', result: '$8,200 last month', color: '#f59e0b' },
  { icon: '🚨', name: 'Donna F.', city: 'Jacksonville, FL', action: 'detected Katrina flood damage on a 2017 Silverado', result: 'title wash caught', color: '#ef4444' },
  { icon: '✅', name: 'Chris W.', city: 'Indianapolis, IN', action: 'booked first 3 clients through referral network', result: 'pipeline building', color: '#3b82f6' },
  { icon: '🔍', name: 'Vanessa O.', city: 'Memphis, TN', action: 'ran a classic car authentication for a collector', result: 'numbers-matching confirmed', color: '#22c55e' },
  { icon: '💰', name: 'Steve A.', city: 'Baltimore, MD', action: 'doing 2 inspections before his day job ends', result: 'transition in progress', color: '#f59e0b' },
  { icon: '🚨', name: 'Monica J.', city: 'Albuquerque, NM', action: 'flagged a salvage title hidden by a private seller', result: 'buyer protected', color: '#ef4444' },
  { icon: '✅', name: 'Paul D.', city: 'Kansas City, MO', action: 'just claimed the KC metro territory', result: 'territory locked', color: '#3b82f6' },
  { icon: '🔍', name: 'Yolanda B.', city: 'Richmond, VA', action: 'inspected a fleet of 8 delivery vans', result: 'earned $2,800', color: '#22c55e' },
  { icon: '💰', name: 'Marcus L.', city: 'Portland, OR', action: 'signed his first fleet contract', result: '$600/month recurring', color: '#f59e0b' },
];

export const LiveActivityTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % ACTIVITIES.length);
        setFade(true);
      }, 300);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activity = ACTIVITIES[currentIndex];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9970,
        background: 'rgba(5, 8, 15, 0.97)',
        borderTop: '1px solid rgba(53,122,189,0.3)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '8px 20px',
        gap: '12px',
        minHeight: '44px',
      }}>
        {/* LIVE badge */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '100px',
          padding: '3px 10px',
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#ef4444',
            display: 'inline-block',
            boxShadow: '0 0 6px #ef4444',
          }} />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            Live
          </span>
        </div>

        {/* Activity message */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          opacity: fade ? 1 : 0,
          transform: fade ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap' as const,
        }}>
          <span style={{ fontSize: '13px' }}>{activity.icon}</span>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>{activity.name}</span>
          <span style={{ fontSize: '12px', color: '#4b5563' }}>in</span>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{activity.city}</span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{activity.action}</span>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: activity.color,
            background: `${activity.color}18`,
            border: `1px solid ${activity.color}40`,
            borderRadius: '100px',
            padding: '2px 9px',
            flexShrink: 0,
          }}>
            {activity.result}
          </span>
        </div>

        {/* Counter */}
        <div style={{ flexShrink: 0, fontSize: '11px', color: '#374151' }}>
          {currentIndex + 1}/{ACTIVITIES.length}
        </div>
      </div>
    </div>
  );
};

export default LiveActivityTicker;
