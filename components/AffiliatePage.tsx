import React, { useState } from 'react';

interface AffiliatePageProps {
  onBack: () => void;
}

const SPECIALTIES = [
  { id: 'cars', label: 'Cars & SUVs', icon: '🚗', desc: 'Private buyers, used car shoppers' },
  { id: 'trucks', label: 'Pickup Trucks', icon: '🛻', desc: 'Truck buyers, towing enthusiasts' },
  { id: 'commercial', label: 'Commercial / 18-Wheeler', icon: '🚛', desc: 'Trucking companies, fleet buyers' },
  { id: 'ev', label: 'Electric Vehicles', icon: '⚡', desc: 'EV buyers, Tesla owners' },
  { id: 'rv', label: 'RV / Motorhome', icon: '🚐', desc: 'RV buyers, full-time travelers' },
  { id: 'vintage', label: 'Classic / Vintage', icon: '🏎️', desc: 'Collectors, restoration buyers' },
  { id: 'motorcycle', label: 'Motorcycles', icon: '🏍️', desc: 'Riders, collectors' },
  { id: 'fleet', label: 'Fleet Vehicles', icon: '🚌', desc: 'Fleet managers, businesses' },
];

export const AffiliatePage: React.FC<AffiliatePageProps> = ({ onBack }) => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: '',
    licenseType: 'pro', specialty: [] as string[]
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleSpecialty = (id: string) => {
    setForm(f => ({
      ...f,
      specialty: f.specialty.includes(id)
        ? f.specialty.filter(s => s !== id)
        : [...f.specialty, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.specialty.length === 0) {
      alert('Please select at least one vehicle specialty.');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitted(true);
    setSubmitting(false);
  };

  const commissions = [
    { tier: 'Pro Inspector', price: '$997', commission: '$200', pct: '20%' },
    { tier: 'Commercial & Fleet', price: '$1,997', commission: '$400', pct: '20%' },
    { tier: 'Entrepreneur', price: '$3,997', commission: '$800', pct: '20%' },
  ];

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: '520px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
          <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>You're In.</h1>
          <p style={{ color: '#aaa', fontSize: '18px', lineHeight: 1.6, marginBottom: '24px' }}>
            We'll text you your unique referral link within 24 hours — customized for your specialty. Every licensed inspector you refer earns you a commission, automatically.
          </p>
          <p style={{ color: '#e8c547', fontSize: '15px', marginBottom: '32px' }}>
            Remember: You must hold an active AI Auto Pro license to participate in the affiliate program.
          </p>
          <button onClick={onBack} style={{ background: '#1a6bff', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px 32px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
            ← Back to Main Site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <nav style={{ padding: '16px 32px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#1a6bff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>AI</div>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>AI Auto Pro</span>
          <span style={{ color: '#444', fontSize: '14px', marginLeft: '4px' }}>/ Affiliate Program</span>
        </div>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid #333', color: '#aaa', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
          ← Back
        </button>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: '#e8c547', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '24px' }}>
          Affiliate Program — Licensed Inspectors Only
        </div>
        <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px' }}>
          You Already Know People<br />
          <span style={{ color: '#1a6bff' }}>Who Need This.</span>
        </h1>
        <p style={{ fontSize: '19px', color: '#bbb', lineHeight: 1.6, marginBottom: '16px' }}>
          Every mechanic, trucker, vintage collector, and fleet manager you know is sitting on skills that could earn them $3,000–$12,000 a month. Share your link. They buy. You earn 20% — every time.
        </p>
        <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.5 }}>
          No selling. No convincing. Your referral link does the work. The platform closes the sale.
        </p>
      </div>

      {/* COMMISSION TABLE */}
      <div style={{ maxWidth: '680px', margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 800, marginBottom: '28px' }}>What You Earn Per Referral</h2>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '12px 24px', background: '#1a1a1a', borderBottom: '1px solid #222', fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
            <span>License</span><span style={{ textAlign: 'center' }}>Price</span><span style={{ textAlign: 'center' }}>Your Cut</span><span style={{ textAlign: 'center' }}>Rate</span>
          </div>
          {commissions.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '16px 24px', borderBottom: i < commissions.length - 1 ? '1px solid #1a1a1a' : 'none', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{c.tier}</span>
              <span style={{ textAlign: 'center', color: '#888', fontSize: '14px' }}>{c.price}</span>
              <span style={{ textAlign: 'center', color: '#4ade80', fontWeight: 800, fontSize: '20px' }}>{c.commission}</span>
              <span style={{ textAlign: 'center', color: '#e8c547', fontWeight: 700, fontSize: '13px' }}>{c.pct}</span>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#444', fontSize: '12px', marginTop: '12px' }}>
          Paid monthly. No cap. No expiration on your link.
        </p>
      </div>

      {/* SPECIALTY SECTION */}
      <div style={{ background: '#0d0d0d', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '26px', fontWeight: 800, marginBottom: '12px' }}>Your Referral Link Is Built for Your Niche</h2>
          <p style={{ textAlign: 'center', color: '#777', fontSize: '15px', marginBottom: '48px' }}>
            A vintage car collector gets a different pitch than a trucker. We customize your link so the landing page speaks directly to the people you're sending. Higher conversions. More commissions.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {SPECIALTIES.map(s => (
              <div key={s.id} style={{
                background: '#111', border: `1px solid #1e1e1e`, borderRadius: '12px', padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SIGNUP FORM */}
      <div style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '30px', fontWeight: 800, marginBottom: '12px' }}>Apply to the Affiliate Program</h2>
          <p style={{ textAlign: 'center', color: '#777', fontSize: '15px', marginBottom: '40px' }}>
            60 seconds. We'll text your custom referral link within 24 hours.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '7px' }}>Full Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Marcus Thompson"
                  style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '7px' }}>Cell Phone *</label>
                <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 000-0000"
                  style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '7px' }}>Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="marcus@example.com"
                style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '7px' }}>City & State *</label>
              <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Houston, TX"
                style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '7px' }}>Your License Tier *</label>
              <select required value={form.licenseType} onChange={e => setForm({ ...form, licenseType: e.target.value })}
                style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="pro">Pro Inspector ($997)</option>
                <option value="commercial">Commercial & Fleet ($1,997)</option>
                <option value="entrepreneur">Entrepreneur ($3,997)</option>
                <option value="pending">I'm about to purchase my license</option>
              </select>
            </div>

            {/* SPECIALTY SELECTOR */}
            <div>
              <label style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>Your Vehicle Specialty * (select all that apply)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {SPECIALTIES.map(s => {
                  const selected = form.specialty.includes(s.id);
                  return (
                    <div key={s.id} onClick={() => toggleSpecialty(s.id)}
                      style={{
                        background: selected ? '#0d2a6e' : '#111',
                        border: `1px solid ${selected ? '#1a6bff' : '#2a2a2a'}`,
                        borderRadius: '8px', padding: '10px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s'
                      }}>
                      <span style={{ fontSize: '18px' }}>{s.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: selected ? 700 : 400, color: selected ? '#fff' : '#888' }}>{s.label}</span>
                      {selected && <span style={{ marginLeft: 'auto', color: '#1a6bff', fontSize: '14px' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: '#0d1a0d', border: '1px solid #1e3a1e', borderRadius: '8px', padding: '12px 16px' }}>
              <p style={{ fontSize: '13px', color: '#4ade80', margin: 0, lineHeight: 1.5 }}>
                ✓ You must hold or purchase an active AI Auto Pro license to participate. This keeps our network credible.
              </p>
            </div>

            <button type="submit" disabled={submitting}
              style={{
                background: submitting ? '#333' : 'linear-gradient(135deg, #1a6bff, #0052cc)',
                color: '#fff', border: 'none', borderRadius: '10px', padding: '16px 32px',
                fontSize: '17px', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '8px'
              }}>
              {submitting ? 'Submitting...' : 'Apply to the Affiliate Program →'}
            </button>
            <p style={{ textAlign: 'center', color: '#333', fontSize: '12px', margin: 0 }}>
              No spam. We'll text your referral link within 24 hours.
            </p>
          </form>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid #1a1a1a', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ color: '#333', fontSize: '13px', margin: 0 }}>
          © 2025 AI Auto Pro. All rights reserved. ·{' '}
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>Back to Main Site</button>
        </p>
      </div>
    </div>
  );
};

export default AffiliatePage;
