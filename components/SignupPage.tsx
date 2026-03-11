import React, { useState, useEffect } from 'react';

interface SignupPageProps {
  onSignup: (token: string, user: any) => void;
  onNavigateToLogin: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

const PLAN_CONFIG: Record<string, { label: string; price: string; userType: 'diy' | 'pro'; color: string }> = {
  pro: {
    label: 'Pro Inspector',
    price: '$997/year',
    userType: 'pro',
    color: '#357ABD',
  },
  commercial: {
    label: 'Commercial & Fleet',
    price: '$1,997/year',
    userType: 'pro',
    color: '#357ABD',
  },
  entrepreneur: {
    label: 'Entrepreneur',
    price: '$3,997/year',
    userType: 'pro',
    color: '#357ABD',
  },
  diy: {
    label: 'DIY Inspector',
    price: 'Pay-per-inspection',
    userType: 'diy',
    color: '#555',
  },
};

export const SignupPage: React.FC<SignupPageProps> = ({ onSignup, onNavigateToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string>('pro');

  // Read plan from URL params (set by Stripe success redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam && PLAN_CONFIG[planParam]) {
      setPlan(planParam);
    }
    // Pre-fill email if passed from Stripe
    const emailParam = params.get('email');
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, []);

  const planInfo = PLAN_CONFIG[plan] || PLAN_CONFIG['pro'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          userType: planInfo.userType,
          companyName: companyName || fullName || undefined,
          plan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onSignup(data.token, data.user);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 60% 0%, rgba(53,122,189,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #357ABD, #1a4f8a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '17px', color: '#fff',
            }}>AI</div>
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#f0f0f0' }}>AI Auto Pro</span>
          </a>
        </div>

        {/* Payment confirmed banner */}
        <div style={{
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L5.5 10.5L12 3.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e', marginBottom: '2px' }}>
              {planInfo.label} — {planInfo.price}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Create your account to activate your license
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '20px',
          padding: '40px',
        }}>
          <h1 style={{
            fontSize: '26px', fontWeight: 800, color: '#fff',
            marginBottom: '6px', letterSpacing: '-0.5px',
          }}>
            Create your account
          </h1>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
            Your license activates immediately after signup.
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
            }}>
              <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#0a0a0a', border: '1px solid #2a2a2a',
                  borderRadius: '10px', color: '#f0f0f0', fontSize: '15px',
                  outline: 'none', boxSizing: 'border-box',
                }}
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#0a0a0a', border: '1px solid #2a2a2a',
                  borderRadius: '10px', color: '#f0f0f0', fontSize: '15px',
                  outline: 'none', boxSizing: 'border-box',
                }}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#0a0a0a', border: '1px solid #2a2a2a',
                  borderRadius: '10px', color: '#f0f0f0', fontSize: '15px',
                  outline: 'none', boxSizing: 'border-box',
                }}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px' }}>
                Company Name <span style={{ color: '#444', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#0a0a0a', border: '1px solid #2a2a2a',
                  borderRadius: '10px', color: '#f0f0f0', fontSize: '15px',
                  outline: 'none', boxSizing: 'border-box',
                }}
                placeholder="Your Inspection Co. LLC"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#1a3a5c' : 'linear-gradient(135deg, #357ABD, #1a5fa0)',
                border: 'none', color: '#fff', borderRadius: '12px',
                padding: '15px', fontSize: '16px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 8px 32px rgba(53,122,189,0.4)',
                transition: 'all 0.2s',
                marginTop: '4px',
              }}
            >
              {loading ? 'Creating your account...' : 'Activate My License →'}
            </button>
          </form>

          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#555' }}>
              Already have an account?{' '}
              <button
                onClick={onNavigateToLogin}
                style={{ background: 'none', border: 'none', color: '#357ABD', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Trust line */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '12px', color: '#333' }}>
            Secured by 256-bit SSL · Annual license · No per-report fees
          </p>
        </div>
      </div>
    </div>
  );
};
