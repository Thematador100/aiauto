import { vehicleImages } from '../vehicleImages';
import React, { useState, useEffect } from 'react';
import { SalesChatWidget } from './SalesChatWidget';
import { LiveActivityTicker } from './LiveActivityTicker';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
  onNavigateToManual?: () => void;
  onNavigateToDemo?: () => void;
  onNavigateToAffiliate?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToSignup,
  onNavigateToDemo,
  onNavigateToAffiliate,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [incomeTab, setIncomeTab] = useState<'sidehustle' | 'fulltime' | 'fleet'>('fulltime');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #357ABD, #1a5fa0)',
    border: 'none', color: '#fff', borderRadius: '10px',
    padding: '16px 36px', fontSize: '17px', fontWeight: 700,
    cursor: 'pointer', letterSpacing: '0.1px',
    boxShadow: '0 8px 32px rgba(53,122,189,0.45)',
  };

  const btnGhost: React.CSSProperties = {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)',
    color: '#f0f0f0', borderRadius: '10px', padding: '16px 32px',
    fontSize: '17px', fontWeight: 600, cursor: 'pointer',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '13px', fontWeight: 700, color: '#357ABD',
    letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px',
  };

  const h2Style: React.CSSProperties = {
    fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 900,
    letterSpacing: '-1.5px', marginBottom: '16px', color: '#fff',
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#0a0a0a', color: '#f0f0f0', minHeight: '100vh', paddingBottom: '44px' }}>

      {/* ─── HEADER ─── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 40px', height: '72px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,10,0.97)' : 'transparent',
        borderBottom: scrolled ? '1px solid #222' : 'none',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #357ABD, #1a4f8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', color: '#fff' }}>AI</div>
          <span style={{ fontWeight: 700, fontSize: '17px', color: '#f0f0f0' }}>AI Auto Pro</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {([['How It Works', 'how-it-works'], ['Income', 'income'], ['Pricing', 'pricing']] as const).map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: '#999', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>{label}</button>
          ))}
          {onNavigateToDemo && (
            <button onClick={onNavigateToDemo} style={{ background: 'none', border: '1px solid #333', color: '#ccc', borderRadius: '8px', padding: '8px 18px', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>Live Demo</button>
          )}
          <button onClick={onNavigateToLogin} style={{ background: 'none', border: 'none', color: '#999', fontSize: '14px', cursor: 'pointer' }}>Sign In</button>
          <button onClick={() => scrollTo('pricing')} style={{ background: 'linear-gradient(135deg, #357ABD, #1a5fa0)', border: 'none', color: '#fff', borderRadius: '8px', padding: '9px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(53,122,189,0.35)' }}>Get Licensed</button>
        </nav>
      </header>

      {/* ─── HERO ─── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${vehicleImages['hero-car-lot']})`, backgroundSize: 'cover', backgroundPosition: 'center 40%', filter: 'brightness(0.55)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.05) 0%, rgba(10,10,10,0.3) 60%, rgba(10,10,10,0.88) 100%)' }} />
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '860px', padding: '0 24px', marginTop: '72px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(53,122,189,0.15)', border: '1px solid rgba(53,122,189,0.4)', borderRadius: '100px', padding: '6px 18px', marginBottom: '28px', fontSize: '13px', fontWeight: 600, color: '#5fa3e8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Founding Inspector Licenses — Limited Territories
          </div>
          <h1 style={{ fontSize: 'clamp(42px, 6.5vw, 76px)', fontWeight: 900, lineHeight: 1.04, letterSpacing: '-2.5px', marginBottom: '24px', color: '#ffffff' }}>
            The AI That Catches<br />
            <span style={{ color: '#4a9de8' }}>What Dealers Hide.</span>
          </h1>
          <p style={{ fontSize: 'clamp(17px, 2.2vw, 21px)', color: '#bbb', lineHeight: 1.65, maxWidth: '680px', margin: '0 auto 16px', fontWeight: 400 }}>
            38 million used vehicles sold last year. Rolled-back odometers. Flood damage hidden under fresh carpet. Salvage titles washed across three states. The buyer had no idea — until it was too late.
          </p>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#f0f0f0', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto 44px', fontWeight: 600 }}>
            You license this AI. You run the inspections. You charge $200–$400 per report.{' '}
            <span style={{ color: '#4a9de8' }}>You keep every dollar.</span>
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('pricing')} style={btnPrimary}>Get Your License — Starting at $997 →</button>
            {onNavigateToDemo && <button onClick={onNavigateToDemo} style={btnGhost}>See the Live Demo First</button>}
          </div>
          <p style={{ marginTop: '28px', fontSize: '13px', color: '#555', letterSpacing: '0.3px' }}>
            No franchise fees &nbsp;·&nbsp; No royalties &nbsp;·&nbsp; No per-report charges &nbsp;·&nbsp; You own the business
          </p>
        </div>
      </section>

      {/* ─── PROBLEM ─── */}
      <section style={{ background: '#0a0a0a', padding: '100px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={sectionLabel}>The Problem</p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '48px', color: '#fff' }}>
            Every day, someone buys a vehicle<br /><span style={{ color: '#555' }}>that should never have been sold to them.</span>
          </h2>
          {[
            { title: 'The Odometer Rollback', body: "A 2019 F-150. 28,000 miles on the dash. Looks clean, drives fine. Real mileage: 187,000. The service record gaps tell the story — if you know where to look. The buyer didn't. He paid full retail. The engine failed at 90 days." },
            { title: 'The Flood Car', body: "Hurricane Harvey put 500,000 vehicles underwater. Many were cleaned, retitled in another state, and sold at auction. Fresh carpet. New paint. Corroded wiring that fails at 60 mph — six months after the sale." },
            { title: 'The Title Wash', body: "A salvage title in Texas becomes a rebuilt title in Montana. Three states later, it's sitting on a used car lot with a clean history report and a retail price tag. Legal. Undisclosed. Devastating to the buyer." },
            { title: 'The Commercial Truck Fraud', body: "A used semi at auction. $95,000. The seller says it's a cream puff. The frame has a hairline crack. The turbo is on its last legs. The injectors are worn. None of it shows on a visual inspection. A trucker buys it, puts it in service, and 60 days later it's sitting at a truck stop in Arkansas with a blown engine. The truck payment doesn't stop. The loads don't wait. One bad purchase can end a small trucking business. AI hears what humans miss — and now you can prove it before the check clears." },
          ].map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid #1e1e1e', padding: '36px 0', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', alignItems: 'start' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>{item.title}</h3>
              <p style={{ fontSize: '16px', color: '#888', lineHeight: 1.75, margin: 0 }}>{item.body}</p>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: '48px', marginTop: '12px' }}>
            <p style={{ fontSize: '22px', fontWeight: 700, color: '#f0f0f0', lineHeight: 1.5, margin: 0 }}>
              CarFax can't see this. Lemon Squad can't see this. A mechanic friend can't see this.<br />
              <span style={{ color: '#4a9de8' }}>The AI can. And now you can sell that.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── STATS BAND ─── */}
      <section style={{ background: '#0f0f0f', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '60px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', textAlign: 'center' }}>
          {[
            { stat: '$1.2B+', label: 'Lost to odometer fraud annually in the US' },
            { stat: '800K+', label: 'Flood-damaged vehicles resold each year' },
            { stat: '$4,000', label: 'Average loss per buyer who skips an inspection' },
            { stat: '1 in 7', label: 'Used vehicles has a hidden title brand or defect' },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 900, color: '#357ABD', letterSpacing: '-1px', marginBottom: '8px' }}>{item.stat}</div>
              <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" style={{ padding: '100px 24px', background: '#0a0a0a' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p style={sectionLabel}>How It Works</p>
          <h2 style={{ ...h2Style, marginBottom: '64px' }}>Three steps. Twenty minutes.<br />A report your client pays for.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden' }}>
            {[
              { step: '01', title: 'Enter the VIN', body: 'Type or scan any VIN. The AI instantly cross-references 50-state DMV records, NMVTIS, NICB, and CARFAX databases — detecting fraud before you even look at the vehicle.', img: vehicleImages['step1-driving'] },
              { step: '02', title: 'Run the Guided Inspection', body: 'The AI walks you through every inspection point — exterior, engine, undercarriage, interior. Take photos, record engine audio, plug in the OBD scanner. The AI analyzes everything: damage, wear, fraud indicators, and engine sounds. No mechanic license required.', img: vehicleImages['step2-mechanic'] },
              { step: '03', title: 'Deliver the Report', body: 'A professional branded PDF is generated automatically. Your name. Your logo. AI fraud analysis, condition score, and recommendations. You email it. Your client pays you.', img: vehicleImages['step3-report'] },
            ].map((item, i) => (
              <div key={i} style={{ background: '#111', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', backgroundImage: `url(${item.img})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.85)' }} />
                <div style={{ padding: '32px 28px', flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#357ABD', letterSpacing: '2px', marginBottom: '12px' }}>STEP {item.step}</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>{item.title}</h3>
                  <p style={{ fontSize: '14px', color: '#777', lineHeight: 1.7, margin: 0 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          {onNavigateToDemo && (
            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <button onClick={onNavigateToDemo} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: '10px', padding: '14px 32px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>Watch the Live Demo →</button>
            </div>
          )}
        </div>
      </section>

      {/* ─── VEHICLE TYPES ─── */}
      <section style={{ padding: '80px 24px', background: '#0d0d0d' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p style={{ ...sectionLabel, textAlign: 'center' }}>Every Vehicle. One Platform.</p>
          <h2 style={{ ...h2Style, textAlign: 'center', marginBottom: '12px' }}>Most inspection tools handle cars.<br />We handle everything — including where the real money is.</h2>
          <p style={{ textAlign: 'center', color: '#555', fontSize: '15px', marginBottom: '56px' }}>Commercial truck inspections bill at $250–$500 each. Fleet contracts mean recurring monthly revenue. AI engine audio analysis on every vehicle type — the only inspection platform that hears what your eyes can't see.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden' }}>
            {[
              { img: vehicleImages['v-car-suv'], label: 'Car / SUV', sub: 'AI engine audio + OBD-II + fraud detection' },
              { img: vehicleImages['v-pickup'], label: 'Pickup Truck', sub: 'AI engine audio + 4WD + towing systems' },
              { img: vehicleImages['v-commercial'], label: 'Commercial / 18-Wheeler', sub: 'AI engine audio + J1939 heavy-duty diagnostics' },
              { img: vehicleImages['v-ev'], label: 'Electric Vehicle', sub: 'Battery SoH + motor audio + range analysis' },
              { img: vehicleImages['v-rv'], label: 'RV / Motorhome', sub: 'AI engine audio + chassis + habitability' },
              { img: vehicleImages['v-classic'], label: 'Classic / Vintage', sub: 'AI engine audio + authenticity + provenance' },
              { img: vehicleImages['v-motorcycle'], label: 'Motorcycle', sub: 'AI engine audio + frame + brakes + electrics' },
              { img: vehicleImages['v-fleet'], label: 'Fleet Vehicles', sub: 'AI engine audio + multi-unit + recurring revenue' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#111', position: 'relative', overflow: 'hidden', aspectRatio: '1' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${item.img})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.78)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#777' }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INCOME ─── */}
      <section id="income" style={{ padding: '100px 24px', background: '#0a0a0a' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={sectionLabel}>The Numbers</p>
          <h2 style={{ ...h2Style, marginBottom: '16px' }}>What does this license actually pay?</h2>
          <p style={{ fontSize: '17px', color: '#777', lineHeight: 1.65, marginBottom: '48px' }}>Real numbers. No hype. Based on what licensed inspectors charge today. Your license pays for itself after your first 5 inspections.</p>
          <div style={{ display: 'flex', gap: '2px', background: '#111', borderRadius: '12px', padding: '4px', marginBottom: '40px', border: '1px solid #1e1e1e' }}>
            {([['sidehustle', 'Side Hustle'], ['fulltime', 'Full-Time Inspector'], ['fleet', 'Fleet Operator']] as [string, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setIncomeTab(key as 'sidehustle' | 'fulltime' | 'fleet')} style={{ flex: 1, padding: '12px', borderRadius: '9px', border: 'none', background: incomeTab === key ? '#357ABD' : 'transparent', color: incomeTab === key ? '#fff' : '#777', fontWeight: incomeTab === key ? 700 : 500, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>{label}</button>
            ))}
          </div>
          {incomeTab === 'sidehustle' && (
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ height: '200px', backgroundImage: `url(${vehicleImages['income-sidehustle']})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.75)' }} />
              <div style={{ padding: '40px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>The Side Hustler</h3>
                <p style={{ color: '#777', fontSize: '15px', marginBottom: '32px' }}>2 inspections per weekend at $149 each. Most inspectors do 4–6 on a good weekend.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  {[['$298', 'Per Week'], ['$1,192', 'Per Month'], ['$14,300', 'Per Year']].map(([val, label]) => (
                    <div key={label}><div style={{ fontSize: '32px', fontWeight: 900, color: '#357ABD', letterSpacing: '-1px' }}>{val}</div><div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{label}</div></div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {incomeTab === 'fulltime' && (
            <div style={{ background: '#0f1e30', border: '1px solid #357ABD', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 40px rgba(53,122,189,0.12)' }}>
              <div style={{ height: '200px', backgroundImage: `url(${vehicleImages['income-fulltime']})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.75)' }} />
              <div style={{ padding: '40px' }}>
                <div style={{ display: 'inline-block', background: 'rgba(53,122,189,0.15)', border: '1px solid rgba(53,122,189,0.4)', borderRadius: '100px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: '#5fa3e8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Most Popular</div>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>The Full-Time Inspector</h3>
                <p style={{ color: '#777', fontSize: '15px', marginBottom: '32px' }}>3 inspections per day, 5 days a week at $200 each. Commercial truck inspections bill at $250–$400.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  {[['$3,000', 'Per Week'], ['$12,000', 'Per Month'], ['$144,000', 'Per Year']].map(([val, label]) => (
                    <div key={label}><div style={{ fontSize: '32px', fontWeight: 900, color: '#357ABD', letterSpacing: '-1px' }}>{val}</div><div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{label}</div></div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {incomeTab === 'fleet' && (
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ height: '200px', backgroundImage: `url(${vehicleImages['income-fleet']})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.75)' }} />
              <div style={{ padding: '40px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>The Fleet Operator</h3>
                <p style={{ color: '#777', fontSize: '15px', marginBottom: '32px' }}>One fleet contract — 20 trucks per month at $250 each. One trucking company = recurring monthly revenue.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  {[['$1,250', 'Per Week'], ['$5,000', 'Per Month'], ['$60,000', 'Per Year']].map(([val, label]) => (
                    <div key={label}><div style={{ fontSize: '32px', fontWeight: 900, color: '#357ABD', letterSpacing: '-1px' }}>{val}</div><div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{label}</div></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section style={{ padding: '80px 24px', background: '#0d0d0d' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ ...sectionLabel, textAlign: 'center' }}>Why Inspectors Are Switching</p>
          <h2 style={{ ...h2Style, textAlign: 'center', marginBottom: '48px' }}>Lemon Squad and CarFax were built<br />for a world before AI.</h2>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 24px', background: '#161616', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ fontSize: '11px', color: '#444', fontWeight: 700, letterSpacing: '1px' }}>FEATURE</div>
              <div style={{ fontSize: '11px', color: '#357ABD', fontWeight: 700, textAlign: 'center', letterSpacing: '0.5px' }}>AI AUTO PRO</div>
              <div style={{ fontSize: '11px', color: '#444', fontWeight: 700, textAlign: 'center', letterSpacing: '0.5px' }}>LEMON SQUAD</div>
              <div style={{ fontSize: '11px', color: '#444', fontWeight: 700, textAlign: 'center', letterSpacing: '0.5px' }}>CARFAX</div>
            </div>
            {([
              ['AI-generated inspection report', true, false, false],
              ['Optical body damage detection', true, false, false],
              ['Odometer rollback AI', true, false, 'partial'],
              ['Flood damage AI analysis', true, false, false],
              ['VIN clone & title washing', true, false, 'partial'],
              ['J1939 heavy-duty diagnostics', true, false, false],
              ['EV battery health analysis', true, false, false],
              ['Classic / vintage authenticity', true, false, false],
              ['You own the business & revenue', true, false, false],
            ] as [string, boolean | string, boolean | string, boolean | string][]).map(([feature, ai, lemon, carfax], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: '1px solid #161616', background: i % 2 === 0 ? '#111' : '#0f0f0f' }}>
                <div style={{ fontSize: '14px', color: '#bbb' }}>{feature}</div>
                {[ai, lemon, carfax].map((val, j) => (
                  <div key={j} style={{ textAlign: 'center' }}>
                    {val === true ? <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>
                      : val === 'partial' ? <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 600 }}>Partial</span>
                      : <span style={{ color: '#2a2a2a' }}>—</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#333', marginTop: '16px', textAlign: 'center' }}>Based on publicly available feature lists as of 2025.</p>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ padding: '100px 24px', background: '#0a0a0a' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <p style={{ ...sectionLabel, textAlign: 'center' }}>Choose Your License</p>
          <h2 style={{ ...h2Style, textAlign: 'center', marginBottom: '16px' }}>Annual license. No monthly fees.<br />No per-report charges. You keep everything.</h2>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ display: 'inline-block', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '100px', padding: '8px 20px', fontSize: '13px', fontWeight: 700, color: '#f87171' }}>
              Territory-Limited — Once your market is claimed, it's gone.
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: '#1a1a1a', borderRadius: '20px', overflow: 'hidden' }}>
            {[
              { name: 'Pro Inspector', target: 'Mobile inspectors, independent shops, dealerships', price: '$997', badge: null as string | null, highlight: false, features: ['All 8 vehicle types — cars, trucks, EVs, RVs, commercial, classic, motorcycles, fleet', 'AI engine audio analysis on every vehicle — knocks, misfires, worn injectors, belt noise', 'Full AI fraud & damage detection suite', 'OBD-II Bluetooth live diagnostics (OBDLink MX+)', 'Unlimited inspections — no per-report fees', 'AI-generated branded PDF reports', 'Dealer tricks exposure module'], cta: 'Claim Pro License — $997', stripeUrl: 'https://buy.stripe.com/bJe3cw2cL3q1ckw1sa33W0H' },
              { name: 'Commercial & Fleet', target: 'Trucking companies, fleet managers, commercial buyers', price: '$1,997', badge: 'Highest ROI' as string | null, highlight: true, features: ['Everything in Pro Inspector', 'AI engine audio — turbo whine, injector wear, exhaust leaks, bearing noise', 'J1939 heavy-duty diagnostics via OBDLink MX+ Bluetooth', 'Full structural AI analysis for Class 7–8 trucks — frame, welds, mounts', '5 user seats for your team', 'Fleet contract reporting templates'], cta: 'Claim Commercial License — $1,997', stripeUrl: 'https://buy.stripe.com/5kQ00kg3B3q13O07Qy33W0G' },
              { name: 'Entrepreneur', target: 'Entrepreneurs building a scalable inspection company', price: '$3,997', badge: null as string | null, highlight: false, features: ['Everything in Commercial & Fleet', 'White-label branding — your name, your logo', 'Lead capture bot for your landing page', '10 user seats — hire inspectors under you', 'Territory management tools', 'Revenue share tracking dashboard', 'Done-for-you marketing templates'], cta: 'Claim Entrepreneur License — $3,997', stripeUrl: 'https://buy.stripe.com/eVqfZidVt9Op3O0gn433W0I' },
            ].map((plan, i) => (
              <div key={i} style={{ background: plan.highlight ? '#0f1e30' : '#111', padding: '40px 32px', display: 'flex', flexDirection: 'column', borderTop: plan.highlight ? '3px solid #357ABD' : '3px solid transparent' }}>
                {plan.badge && <div style={{ display: 'inline-block', background: 'rgba(53,122,189,0.2)', border: '1px solid rgba(53,122,189,0.4)', borderRadius: '100px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: '#5fa3e8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', alignSelf: 'flex-start' }}>{plan.badge}</div>}
                <div style={{ fontSize: '11px', color: '#444', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{plan.target}</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>{plan.name}</h3>
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '44px', fontWeight: 900, color: plan.highlight ? '#357ABD' : '#fff', letterSpacing: '-2px' }}>{plan.price}</span>
                  <span style={{ fontSize: '14px', color: '#555', marginLeft: '4px' }}>/year</span>
                </div>
                <div style={{ flex: 1, marginBottom: '32px' }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={(plan as any).stripeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: plan.highlight ? 'linear-gradient(135deg, #357ABD, #1a5fa0)' : 'rgba(255,255,255,0.06)', border: plan.highlight ? 'none' : '1px solid #2a2a2a', color: '#fff', borderRadius: '10px', padding: '14px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: '100%', boxShadow: plan.highlight ? '0 6px 24px rgba(53,122,189,0.35)' : 'none', textAlign: 'center', boxSizing: 'border-box' as const }}>{plan.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LEAD REFERRAL / ASEO OFFER ─── */}
      <section style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)', padding: '80px 24px', borderTop: '1px solid #1a2a45', borderBottom: '1px solid #1a2a45' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(53,122,189,0.15)', border: '1px solid rgba(53,122,189,0.3)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: '#4a9de8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>Not Ready to Find Clients Yet?</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-1px' }}>We'll Send You<br /><span style={{ color: '#4a9de8' }}>Your First Clients.</span></h2>
            <p style={{ fontSize: '16px', color: '#888', lineHeight: 1.7, marginBottom: '24px' }}>Some of our best inspectors started with zero clients. We have a marketing operation — SEO, paid ads, local outreach — already running. For a small monthly marketing fee, we route inspection requests directly to you while you build your own pipeline.</p>
            <p style={{ fontSize: '15px', color: '#aaa', lineHeight: 1.65, marginBottom: '32px' }}>You do the inspections. You keep the fees. We handle the marketing until you don't need us anymore.</p>
            <button onClick={() => scrollTo('pricing')} style={{ background: 'linear-gradient(135deg, #357ABD, #1a5fa0)', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px 28px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 24px rgba(53,122,189,0.35)' }}>Get Licensed + Add Client Referrals →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { num: '5', label: 'Guaranteed referrals in your first 30 days', icon: '📋' },
              { num: '$150–$350', label: 'Per inspection — you keep 100%', icon: '💰' },
              { num: 'Local SEO', label: 'We rank your territory on Google', icon: '🔍' },
              { num: 'Cancel anytime', label: 'No long-term marketing contract', icon: '✓' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px 16px' }}>
                <div style={{ fontSize: '22px', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>{item.num}</div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ position: 'relative', padding: '120px 24px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${vehicleImages['cta-pickup']})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.45)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.15), rgba(10,10,10,0.75))' }} />
        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '24px', color: '#fff', lineHeight: 1.05 }}>
            The inspection business is growing.<br /><span style={{ color: '#4a9de8' }}>Are you in it?</span>
          </h2>
          <p style={{ fontSize: '18px', color: '#888', lineHeight: 1.65, marginBottom: '48px' }}>
            Every used car sold. Every fleet truck bought at auction. Every classic car changing hands. Every one of them needs an inspection. Most of them don't get one. That's your market. The question is whether someone else in your city gets there first.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('pricing')} style={btnPrimary}>Get Your License Today →</button>
            {onNavigateToDemo && <button onClick={onNavigateToDemo} style={btnGhost}>See the Demo First</button>}
          </div>
          <p style={{ marginTop: '24px', fontSize: '13px', color: '#444' }}>Licenses are territory-limited. Once your area is taken, it's taken.</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#080808', borderTop: '1px solid #161616', padding: '40px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #357ABD, #1a4f8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px', color: '#fff' }}>AI</div>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#555' }}>AI Auto Pro</span>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <button onClick={onNavigateToLogin} style={{ background: 'none', border: 'none', color: '#444', fontSize: '13px', cursor: 'pointer' }}>Sign In</button>
            {onNavigateToDemo && <button onClick={onNavigateToDemo} style={{ background: 'none', border: 'none', color: '#444', fontSize: '13px', cursor: 'pointer' }}>Live Demo</button>}
            <button onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', color: '#444', fontSize: '13px', cursor: 'pointer' }}>Pricing</button>
            {onNavigateToAffiliate && <button onClick={onNavigateToAffiliate} style={{ background: 'none', border: 'none', color: '#444', fontSize: '13px', cursor: 'pointer' }}>Earn Commissions</button>}
          </div>
          <p style={{ fontSize: '12px', color: '#2a2a2a', margin: 0 }}>© 2025 AI Auto Pro. All rights reserved.</p>
        </div>
      </footer>

      {/* ─── AI SALES CHAT WIDGET ─── */}
      <SalesChatWidget />
      {/* ─── LIVE ACTIVITY TICKER ─── */}
      <LiveActivityTicker />
    </div>
  );
};

export default LandingPage;
