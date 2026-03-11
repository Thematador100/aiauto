import React, { useState, useEffect } from 'react';

interface UpsellPageProps {
  onDecline?: () => void;
}

const UpsellPage: React.FC<UpsellPageProps> = ({ onDecline }) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  const features = [
    { icon: '🔍', title: 'Scrapes Your Local Auction Daily', desc: "Every morning, the AI pulls upcoming inventory at your nearest Copart and Manheim. It knows exactly what's running that week before most dealers do." },
    { icon: '🎯', title: 'Finds Out-of-State Dealers Who Want Those Cars', desc: "The AI cross-references inventory with dealer databases to find buyers 500+ miles away who specialize in those exact vehicles — dealers who can't come check the car themselves." },
    { icon: '✉️', title: 'Sends 50 Personalized Emails Per Day', desc: '"Hey Mike, I see you sell F-150s in Columbus. There are 12 clean-title F-150s at the Dallas auction this Thursday. I\'m 10 minutes away. Want me to check them before you bid?" — sent automatically.' },
    { icon: '💰', title: 'Replies to Dealer Inquiries and Books You', desc: 'When a dealer responds, the AI handles the back-and-forth, sends your pricing, and books the inspection. You wake up with confirmed jobs and payment in your inbox.' },
  ];

  const includes = [
    'Dealership Hunter AI — fully set up and configured for your city',
    'Automated Copart + Manheim inventory scraping (daily)',
    'AI dealer targeting engine (finds out-of-state buyers)',
    '50 personalized outreach emails per day on autopilot',
    'AI closer handles dealer replies and books inspections',
    'Booking page + payment link sent automatically',
    'Weekly performance report (emails sent, replies, bookings)',
    'Priority support — dedicated onboarding call',
  ];

  const testimonials = [
    { name: 'Marcus T.', city: 'Houston, TX', text: "Got my first dealer client in 4 days. The AI sent 200 emails while I was at my day job. Came home to 3 booked inspections.", earned: '$850 first week' },
    { name: 'Jennifer R.', city: 'Atlanta, GA', text: "I was terrified about finding clients. The AI handled everything. I just showed up and did the inspections.", earned: '$2,100 first month' },
    { name: 'Carlos M.', city: 'Dallas, TX', text: "Dealers started calling me directly after the first month. Now I have 6 regular accounts.", earned: '$4,400/month recurring' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Countdown Banner */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: '#dc2626', padding: '12px', textAlign: 'center' }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: '18px' }}>
          ⏰ THIS OFFER EXPIRES IN {mins}:{secs} — ONE TIME ONLY
        </span>
      </div>

      <main style={{ paddingTop: '80px', paddingBottom: '120px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px', borderRadius: '999px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#34d399', fontSize: '13px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '32px'
            }}>
              ⚡ Special One-Time Upgrade Offer
            </div>

            <div style={{
              marginBottom: '24px', padding: '16px 24px', borderRadius: '12px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'inline-block'
            }}>
              <p style={{ color: '#34d399', fontWeight: 700, fontSize: '18px', margin: 0 }}>
                ✓ Your Auction Proxy License is confirmed. Check your email.
              </p>
            </div>

            <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: '32px' }}>
              Wait — Before You Go.<br />
              <span style={{ background: 'linear-gradient(to right, #34d399, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Do You Want the AI to Find<br />Your First 50 Clients?
              </span>
            </h1>

            <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '700px', margin: '0 auto', lineHeight: 1.7 }}>
              You just bought the inspection app. You know how to do the work.
              But the #1 reason new inspectors don't make money in month one is simple:
              <strong style={{ color: 'white' }}> they don't have clients yet.</strong>
            </p>
          </div>

          {/* The Problem */}
          <div style={{
            padding: '32px', borderRadius: '16px',
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)',
            marginBottom: '48px'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '32px', flexShrink: 0 }}>⚠️</span>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '12px' }}>The #1 Killer of New Inspection Businesses</h3>
                <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '16px' }}>
                  Most people who buy an inspection license do exactly what you'd expect: they download the app, they practice on their own car, they get excited — and then they spend 3 weeks trying to figure out how to find dealers who need them.
                </p>
                <p style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
                  They write emails that don't get opened. They call dealerships that hang up. They post on Facebook and get zero responses. And then they quietly give up — not because the business doesn't work, but because <strong style={{ color: 'white' }}>nobody showed them how to get their first client.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* The Solution */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: 'white', marginBottom: '24px' }}>
              The Dealership Hunter AI Does It For You.<br />
              <span style={{ color: '#34d399' }}>Automatically. Every Day.</span>
            </h2>
            <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
              This is the upgrade that turns your license into a business that runs itself.
            </p>
          </div>

          {/* What It Does */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '64px' }}>
            {features.map((item, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{item.icon}</div>
                <h4 style={{ fontWeight: 900, color: 'white', fontSize: '17px', marginBottom: '12px' }}>{item.title}</h4>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* The Math */}
          <div style={{
            padding: '32px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '48px'
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '24px', textAlign: 'center' }}>The Math on 50 Emails Per Day</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Emails sent per day', value: '50', color: 'white' },
                { label: 'Average reply rate', value: '4–8%', color: 'white' },
                { label: 'Replies per day', value: '2–4', color: '#34d399' },
                { label: 'Inspections booked/week', value: '5–10', color: '#34d399' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.4)' }}>
                  <div style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{
              textAlign: 'center', padding: '24px', borderRadius: '12px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>At $85 per inspection, 7 inspections per week =</p>
              <div style={{ fontSize: '40px', fontWeight: 900, color: '#34d399' }}>$2,380 / week</div>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '8px' }}>Without you sending a single email yourself</p>
            </div>
          </div>

          {/* What's Included */}
          <div style={{
            padding: '32px', borderRadius: '16px',
            background: 'linear-gradient(to bottom, rgba(16,185,129,0.08), transparent)',
            border: '1px solid rgba(16,185,129,0.3)', marginBottom: '48px'
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '24px' }}>What You Get With the Upgrade</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px' }}>
              {includes.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: '#34d399', fontSize: '18px', flexShrink: 0 }}>✓</span>
                  <span style={{ color: '#cbd5e1', fontSize: '14px' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '48px' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ color: '#f59e0b', fontSize: '16px', marginBottom: '12px' }}>★★★★★</div>
                <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.7, marginBottom: '16px' }}>"{t.text}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{t.city}</div>
                  </div>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '14px' }}>{t.earned}</div>
                </div>
              </div>
            ))}
          </div>

          {/* The Offer */}
          <div style={{
            padding: '48px', borderRadius: '24px',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(16,185,129,0.4)',
            marginBottom: '32px', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, #10b981, #22d3ee)' }} />

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: 900, color: 'white', marginBottom: '8px' }}>Add the Dealership Hunter AI</h3>
              <p style={{ color: '#94a3b8' }}>One-time upgrade — available only on this page</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', marginBottom: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', textDecoration: 'line-through', fontSize: '24px' }}>$3,997</div>
                <div style={{ fontSize: '12px', color: '#475569' }}>Regular Price</div>
              </div>
              <div style={{ color: '#475569', fontSize: '24px' }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '64px', fontWeight: 900, color: '#34d399', lineHeight: 1 }}>$997</div>
                <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 700 }}>Today Only</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 20px', borderRadius: '999px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', fontSize: '14px', fontWeight: 700
              }}>
                ⏰ This price disappears when the timer hits zero: {mins}:{secs}
              </div>
            </div>

            <button
              onClick={() => window.open('https://buy.stripe.com/3cIbJ24kTbWxfwI7Qy33W0L', '_blank')}
              style={{
                width: '100%', padding: '24px',
                background: '#10b981', color: 'black',
                borderRadius: '16px', fontSize: '22px', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '1px',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 0 40px rgba(16,185,129,0.4)',
                transition: 'all 0.2s', marginBottom: '16px'
              }}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.background = '#34d399';
                (e.target as HTMLButtonElement).style.boxShadow = '0 0 60px rgba(16,185,129,0.6)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.background = '#10b981';
                (e.target as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(16,185,129,0.4)';
              }}
            >
              YES — Add the Dealership Hunter AI for $997
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '12px', color: '#475569' }}>
              <span>🔒 Secure Checkout</span>
              <span>✓ 30-Day Guarantee</span>
              <span>⚡ Instant Access</span>
            </div>
          </div>

          {/* Decline */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={onDecline || (() => window.location.href = '/')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#475569', fontSize: '14px', textDecoration: 'underline'
              }}
            >
              No thanks — I'll find clients manually and don't need the AI outreach system
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default UpsellPage;
