import React, { useState, useEffect } from 'react';

interface AuctionProxyPageProps {
  onGetLicense?: () => void;
  onBack?: () => void;
  onNavigateToUpsell?: () => void;
}

const AuctionProxyPage: React.FC<AuctionProxyPageProps> = ({ onGetLicense, onBack, onNavigateToUpsell }) => {
  const handleBuy = () => {
    // Open Stripe checkout in new tab
    window.open('https://buy.stripe.com/00wbJ24kTaStesE6Mu33W0J', '_blank');
    // Navigate app to upsell page so it's ready when they return
    setTimeout(() => {
      if (onGetLicense) onGetLicense();
    }, 1500);
  };
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'tier1' | 'tier2'>('tier2');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const STRIPE_TIER1 = 'https://buy.stripe.com/00wbJ24kTaStesE6Mu33W0J';
  const STRIPE_TIER2 = 'https://buy.stripe.com/eVqfZidVt9Op3O0gn433W0I';

  // ── shared style tokens ──
  const PAGE: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    background: '#0a0a0a',
    color: '#f0f0f0',
    minHeight: '100vh',
    paddingBottom: '60px',
  };

  const SECTION: React.CSSProperties = {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 24px',
  };

  const LABEL: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 700,
    color: '#10b981',
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    marginBottom: '16px',
  };

  const H2: React.CSSProperties = {
    fontSize: 'clamp(28px, 4vw, 46px)',
    fontWeight: 900,
    letterSpacing: '-1.5px',
    color: '#fff',
    marginBottom: '16px',
    lineHeight: 1.1,
  };

  const BODY: React.CSSProperties = {
    fontSize: '17px',
    color: '#aaa',
    lineHeight: 1.7,
    maxWidth: '640px',
  };

  const BTN_GREEN: React.CSSProperties = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    borderRadius: '12px',
    padding: '18px 40px',
    fontSize: '17px',
    fontWeight: 800,
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
    letterSpacing: '0.3px',
    border: 'none',
  };

  const BTN_GHOST: React.CSSProperties = {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.06)',
    color: '#ccc',
    borderRadius: '12px',
    padding: '18px 36px',
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.12)',
  };

  const CARD: React.CSSProperties = {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '20px',
    padding: '32px',
  };

  const features = [
    { icon: '🎙️', title: 'Acoustic Engine AI', desc: 'Record 30–60 seconds of a running engine. The AI detects rod knock, injector tick, turbo failure, and diesel knock in real time. No mechanic needed.' },
    { icon: '🔍', title: 'Full Fraud Detection Stack', desc: 'Odometer rollback, title washing, VIN cloning, salvage title hiding — cross-referenced against 50-state DMV records. CarFax only knows what was reported.' },
    { icon: '🔌', title: 'OBD-II + J1939 Diagnostics', desc: 'Live sensor data, fuel trims, DPF/SCR/EGR emissions, and J1939 heavy-duty CAN bus for commercial trucks. We read everything.' },
    { icon: '📸', title: 'AI Photo Analysis', desc: '47 inspection points processed against a model trained on hundreds of thousands of vehicle photos. Paint overspray, panel gaps, rust, flood damage.' },
    { icon: '📄', title: 'Branded PDF Report in 60 Seconds', desc: 'Overall condition score, executive summary, dealer tricks flagged, repair cost estimates, and an AI recommendation: Buy / Negotiate / Walk.' },
    { icon: '🗺️', title: 'Exclusive Territory Model', desc: 'Once you claim your 50-mile radius, no competing inspector can buy the same license in your market. You own it.' },
  ];

  const vehicleTypes = [
    'Cars & SUVs', 'Pickup Trucks', 'Commercial 18-Wheelers', 'Electric Vehicles',
    'RVs & Motorhomes', 'Classic & Vintage', 'Motorcycles', 'Fleet Vehicles',
  ];

  const mathRows = [
    ['Used vehicles sold in the US annually', '38 million'],
    ['Vehicles with hidden defects', '1 in 7 (5.4M)'],
    ['Average buyer loss from undisclosed defects', '$4,000'],
    ['Auction proxy fee per car', '$75–$100'],
    ['Inspections per day (realistic)', '5–8'],
    ['Daily gross revenue (5 cars × $85)', '$425/day'],
    ['Annual gross (5/day × 250 days)', '$106,250'],
    ['Tier 1 license cost', '$1,497'],
    ['Inspections to break even', '18 cars'],
  ];

  const tier1Features = [
    'Full AI inspection app (all 8 vehicle types)',
    'Acoustic engine analysis',
    'OBD-II + J1939 diagnostics',
    'AI photo analysis (47 points)',
    'Branded PDF report generator',
    'Exclusive territory (50-mile radius)',
    'Copy-paste dealer outreach scripts',
    '50-point inspection checklist',
  ];

  const tier2Features = [
    'Everything in Tier 1',
    'Dealership Hunter AI (fully set up for you)',
    'Automated Copart + Manheim inventory scraping',
    'AI finds out-of-state dealer targets',
    'Personalized outreach emails sent automatically',
    'AI closer replies to dealer inquiries',
    '50 dealer emails sent per day on autopilot',
    'You wake up with booked inspections',
  ];

  return (
    <div style={PAGE}>

      {/* ── HEADER ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 32px', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,10,0.96)' : 'transparent',
        borderBottom: scrolled ? '1px solid #1a1a1a' : 'none',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#fff' }}>AI</div>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#f0f0f0' }}>AI Auto Pro</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>Features</button>
          <button onClick={() => scrollTo('math')} style={{ background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>The Math</button>
          <button onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>Pricing</button>
          <button onClick={handleBuy} style={{...{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', borderRadius: '8px', padding: '8px 20px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }, border: 'none', cursor: 'pointer'}}>Get The System</button>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{ paddingTop: '140px', paddingBottom: '100px', textAlign: 'center', ...SECTION }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '999px', padding: '6px 18px', marginBottom: '32px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>Auction Proxy Master License</span>
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2.5px', lineHeight: 1.05, color: '#fff', marginBottom: '28px', maxWidth: '900px', margin: '0 auto 28px' }}>
          There Are Thousands of Cars<br />
          <span style={{ color: '#10b981' }}>At Your Local Auction.</span><br />
          Dealers 500 Miles Away<br />Are Desperate to Buy Them.
        </h1>
        <p style={{ fontSize: '20px', color: '#888', lineHeight: 1.7, maxWidth: '660px', margin: '0 auto 48px' }}>
          Out-of-state dealers can't fly out to check every car. They're terrified of buying a lemon sight-unseen. They'll pay <strong style={{ color: '#fff' }}>$75–$100 per car</strong> for a local proxy to inspect before they bid. If you live within 45 minutes of a Copart or Manheim, <strong style={{ color: '#10b981' }}>you're sitting on a $500-a-day goldmine.</strong>
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleBuy} style={{...BTN_GREEN, border: 'none', cursor: 'pointer'}}>Get The Auction Proxy System</button>
          <button onClick={() => scrollTo('features')} style={BTN_GHOST}>See How It Works</button>
        </div>

        {/* quick math strip */}
        <div style={{ display: 'flex', gap: '0', justifyContent: 'center', marginTop: '72px', flexWrap: 'wrap', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '32px 0' }}>
          {[
            { val: '$75–$100', label: 'Per car inspection' },
            { val: '5 cars', label: 'Tuesday morning' },
            { val: '$375', label: 'Before lunch' },
            { val: '$500+', label: 'Per day potential' },
          ].map((item, i) => (
            <div key={i} style={{ flex: '1', minWidth: '140px', padding: '0 24px', borderRight: i < 3 ? '1px solid #1a1a1a' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, color: '#10b981', letterSpacing: '-1px' }}>{item.val}</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THE BLACK BOX ── */}
      <section style={{ padding: '100px 0', background: '#050505' }}>
        <div style={{ ...SECTION, textAlign: 'center' }}>
          <p style={LABEL}>The Black Box</p>
          <h2 style={{ ...H2, textAlign: 'center' }}>You Don't Need to Know<br />How to Change a Tire.</h2>
          <p style={{ ...BODY, textAlign: 'center', margin: '0 auto 60px' }}>
            I built the mechanic into this app. You plug it in, hold your phone near the engine, and the software does everything else.
          </p>
          {/* engine AI demo card */}
          <div style={{ maxWidth: '560px', margin: '0 auto', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ background: '#111', borderBottom: '1px solid #1e1e1e', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>acoustic-engine-ai — analyzing</span>
            </div>
            {[
              { label: 'Rod Knock Detected', result: '98.4% Match', color: '#ef4444' },
              { label: 'Injector Tick (Normal)', result: 'Safe ✓', color: '#10b981' },
              { label: 'Turbocharger Whine', result: 'Early Bearing Failure', color: '#f59e0b' },
              { label: 'Exhaust Leak', result: 'Manifold Crack', color: '#ef4444' },
              { label: 'Diesel Knock', result: 'Normal Combustion ✓', color: '#10b981' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < 4 ? '1px solid #151515' : 'none' }}>
                <span style={{ fontSize: '14px', color: '#ccc' }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: row.color }}>{row.result}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '100px 0' }}>
        <div style={SECTION}>
          <p style={LABEL}>What's Inside</p>
          <h2 style={H2}>The Only Platform That<br />Listens to an Engine.</h2>
          <p style={{ ...BODY, marginBottom: '64px' }}>Every other inspection tool looks at data. AI Auto Pro listens — and it covers every angle dealers try to hide.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => (
              <div key={i} style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '28px' }}>{f.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  <span style={{ color: '#10b981', marginRight: '8px', fontSize: '13px', fontWeight: 700 }}>0{i + 1}.</span>
                  {f.title}
                </div>
                <p style={{ fontSize: '15px', color: '#777', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VEHICLE TYPES ── */}
      <section style={{ padding: '80px 0', background: '#050505' }}>
        <div style={{ ...SECTION, textAlign: 'center' }}>
          <p style={LABEL}>Coverage</p>
          <h2 style={{ ...H2, textAlign: 'center' }}>Covers All 8 Vehicle Types</h2>
          <p style={{ ...BODY, textAlign: 'center', margin: '0 auto 48px' }}>Including high-ticket niches nobody else touches.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {vehicleTypes.map((v, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: '999px', padding: '10px 22px', fontSize: '14px', color: '#ccc', fontWeight: 500 }}>{v}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEALERSHIP HUNTER ── */}
      <section style={{ padding: '100px 0' }}>
        <div style={SECTION}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
            <div>
              <p style={LABEL}>The Reveal</p>
              <h2 style={H2}>"Okay, the app does the inspection. But how do I find the dealers?"</h2>
              <p style={{ ...BODY, marginBottom: '32px' }}>That used to be the hardest part. Not anymore. The <strong style={{ color: '#fff' }}>Dealership Hunter AI</strong> runs in the background 24/7. It scrapes your local auction inventory, finds out-of-state dealers who buy those exact vehicles, and emails them on your behalf — automatically.</p>
              <button onClick={handleBuy} style={{...BTN_GREEN, border: 'none', cursor: 'pointer'}}>Get The Auction Proxy System — $1,497</button>
            </div>
            <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ background: '#111', borderBottom: '1px solid #1e1e1e', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>dealership-hunter-ai — READY</span>
              </div>
              {[
                { step: '01', title: 'Scrapes Copart & Manheim', desc: 'Pulls upcoming inventory at your local auction' },
                { step: '02', title: 'Finds Out-of-State Dealers', desc: 'Identifies buyers 500+ miles away who buy those vehicles' },
                { step: '03', title: 'Writes Personalized Emails', desc: '"Hey, I see you buy F-150s. There are 12 at Dallas tomorrow..."' },
                { step: '04', title: 'Books Your Inspections', desc: 'When dealer replies, AI sends pricing and booking link' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', padding: '18px 20px', borderBottom: i < 3 ? '1px solid #151515' : 'none', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', fontFamily: 'monospace', minWidth: '24px', paddingTop: '2px' }}>{s.step}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{s.title}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE MATH ── */}
      <section id="math" style={{ padding: '100px 0', background: '#050505' }}>
        <div style={{ ...SECTION, textAlign: 'center' }}>
          <p style={LABEL}>08. The Math That Closes Every Objection</p>
          <h2 style={{ ...H2, textAlign: 'center' }}>The Risk Is Not Buying.<br />The Risk Is Watching Someone Else<br />Build This In Your City.</h2>
          <div style={{ maxWidth: '700px', margin: '48px auto 0', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '20px', overflow: 'hidden' }}>
            {mathRows.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < mathRows.length - 1 ? '1px solid #151515' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                <span style={{ fontSize: '14px', color: '#888' }}>{row[0]}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{row[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '100px 0' }}>
        <div style={{ ...SECTION, textAlign: 'center' }}>
          <p style={LABEL}>Choose Your Level</p>
          <h2 style={{ ...H2, textAlign: 'center' }}>Both tiers include the full AI inspection app.</h2>
          <p style={{ ...BODY, textAlign: 'center', margin: '0 auto 48px' }}>Tier 2 adds the Dealership Hunter AI that finds clients for you automatically.</p>

          {/* tab toggle */}
          <div style={{ display: 'inline-flex', background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '4px', marginBottom: '40px' }}>
            {(['tier1', 'tier2'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '10px 28px', borderRadius: '9px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: activeTab === t ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent', color: activeTab === t ? '#fff' : '#666', transition: 'all 0.2s' }}>
                {t === 'tier1' ? 'Tier 1 — Manual' : 'Tier 2 — Automated ⭐'}
              </button>
            ))}
          </div>

          {/* pricing cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Tier 1 */}
            <div style={{ ...CARD, border: activeTab === 'tier1' ? '2px solid #10b981' : '1px solid #222', position: 'relative' }}>
              <div style={{ marginBottom: '8px', fontSize: '13px', color: '#888', fontWeight: 600 }}>Tier 1 — Auction Proxy License</div>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#fff', letterSpacing: '-2px', marginBottom: '4px' }}>$1,497</div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '28px' }}>+ $97/mo</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', textAlign: 'left' }}>
                {tier1Features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '14px', marginTop: '1px' }}>✓</span>
                    <span style={{ fontSize: '14px', color: '#bbb' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleBuy} style={{...{ ...BTN_GHOST, display: 'block', textAlign: 'center', borderRadius: '10px', padding: '14px 24px', fontSize: '15px' }, border: 'none', cursor: 'pointer'}}>Get Tier 1 — $1,497</button>
            </div>

            {/* Tier 2 */}
            <div style={{ ...CARD, border: activeTab === 'tier2' ? '2px solid #10b981' : '1px solid #222', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 14px', borderRadius: '999px', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Most Popular</div>
              <div style={{ marginBottom: '8px', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>Tier 2 — Dealership Hunter System</div>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#fff', letterSpacing: '-2px', marginBottom: '4px' }}>$1,497</div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '28px' }}>+ $297/mo</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', textAlign: 'left' }}>
                {tier2Features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '14px', marginTop: '1px' }}>✓</span>
                    <span style={{ fontSize: '14px', color: '#bbb' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleBuy} style={{...{ ...BTN_GREEN, display: 'block', textAlign: 'center', borderRadius: '10px', padding: '14px 24px', fontSize: '15px' }, border: 'none', cursor: 'pointer'}}>Get The Auction Proxy System — $1,497</button>
            </div>
          </div>

          {/* value stack */}
          <div style={{ maxWidth: '600px', margin: '48px auto 0', ...CARD }}>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: 600, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>What You're Actually Getting (Value Stack)</div>
            {[
              { item: 'AI Inspection App', value: '$2,997' },
              { item: 'Dealership Hunter AI', value: '$2,997' },
              { item: 'Territory License', value: '$1,500' },
              { item: 'Outreach System + Scripts', value: '$997' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
                <span style={{ fontSize: '14px', color: '#888' }}>{row.item}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ccc' }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0' }}>
              <span style={{ fontSize: '15px', color: '#666' }}>Total Value:</span>
              <div>
                <span style={{ fontSize: '14px', color: '#555', textDecoration: 'line-through', marginRight: '12px' }}>$9,491</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>Your Price: $1,497</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '80px 0 40px' }}>
        <div style={{ ...SECTION, textAlign: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, #0d2b1f, #0a1f17)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '28px', padding: '72px 48px', boxShadow: '0 0 80px rgba(16,185,129,0.08)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '999px', padding: '6px 18px', marginBottom: '28px' }}>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>🔒 Limited Territories Available</span>
            </div>
            <h2 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 900, color: '#fff', letterSpacing: '-2px', marginBottom: '20px', lineHeight: 1.1 }}>
              Your City's Territory<br />Won't Wait.
            </h2>
            <p style={{ fontSize: '18px', color: '#777', maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.65 }}>
              Once a 50-mile radius is claimed, no one else can buy a license in your city. Check availability now.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleBuy} style={{...BTN_GREEN, border: 'none', cursor: 'pointer'}}>Get The Auction Proxy System — $1,497</button>
              <button onClick={handleBuy} style={{...BTN_GHOST, border: 'none', cursor: 'pointer'}}>Start with Tier 1 — $1,497</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AuctionProxyPage;
