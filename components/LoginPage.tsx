import React, { useState, useRef } from 'react';

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
  onNavigateToSignup: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  background: '#0a0a0a', border: '1px solid #2a2a2a',
  borderRadius: '10px', color: '#f0f0f0', fontSize: '15px',
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: '#aaa', marginBottom: '8px',
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Forgot password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Read directly from DOM refs to capture browser autofill values.
    // React state does not update when the browser autofills fields silently.
    const emailValue = emailRef.current?.value || email || (document.getElementById('email') as HTMLInputElement)?.value || '';
    const passwordValue = passwordRef.current?.value || password || (document.getElementById('password') as HTMLInputElement)?.value || '';

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      setSuccess('Reset code sent. Check your email.');
      setResetStep('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, resetCode, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reset failed');
      setSuccess('Password reset. You can now sign in.');
      setShowForgotPassword(false);
      setResetStep('email');
      setResetCode('');
      setNewPassword('');
      setEmail(resetEmail);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pageWrapper = (children: React.ReactNode) => (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 60% 0%, rgba(53,122,189,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
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
        {children}
      </div>
    </div>
  );

  const errorBanner = error ? (
    <div style={{
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
    }}>
      <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>
    </div>
  ) : null;

  const successBanner = success ? (
    <div style={{
      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
      borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
    }}>
      <p style={{ color: '#22c55e', fontSize: '13px', margin: 0 }}>{success}</p>
    </div>
  ) : null;

  if (showForgotPassword) {
    return pageWrapper(
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '20px', padding: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '6px', letterSpacing: '-0.5px' }}>
          Reset Password
        </h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '28px' }}>
          {resetStep === 'email' ? 'Enter your email to receive a reset code.' : 'Enter the code from your email and your new password.'}
        </p>
        {errorBanner}
        {successBanner}

        {resetStep === 'email' ? (
          <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" required />
            </div>
            <button type="submit" disabled={loading} style={{
              background: 'linear-gradient(135deg, #357ABD, #1a5fa0)', border: 'none', color: '#fff',
              borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            }}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Reset Code</label>
              <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} style={{ ...inputStyle, textAlign: 'center', fontSize: '22px', letterSpacing: '8px' }} placeholder="000000" maxLength={6} required />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="Minimum 8 characters" minLength={8} required />
            </div>
            <button type="submit" disabled={loading} style={{
              background: 'linear-gradient(135deg, #357ABD, #1a5fa0)', border: 'none', color: '#fff',
              borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }}
            style={{ background: 'none', border: 'none', color: '#357ABD', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return pageWrapper(
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '20px', padding: '40px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '6px', letterSpacing: '-0.5px' }}>
        Welcome back
      </h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        Sign in to your AI Auto Pro account
      </p>

      {errorBanner}
      {successBanner}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>Email Address</label>
          <input ref={emailRef} id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} autoComplete="username" style={inputStyle} placeholder="you@example.com" required />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <button type="button" onClick={() => { setShowForgotPassword(true); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: '#357ABD', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              Forgot password?
            </button>
          </div>
          <input ref={passwordRef} id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} autoComplete="current-password" style={inputStyle} placeholder="••••••••" required />
        </div>

        <button type="submit" disabled={loading} style={{
          background: loading ? '#1a3a5c' : 'linear-gradient(135deg, #357ABD, #1a5fa0)',
          border: 'none', color: '#fff', borderRadius: '12px',
          padding: '15px', fontSize: '16px', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 8px 32px rgba(53,122,189,0.4)',
          marginTop: '4px',
        }}>
          {loading ? 'Signing in...' : 'Sign In →'}
        </button>
      </form>

      <div style={{ marginTop: '28px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#555' }}>
          Don't have an account?{' '}
          <button onClick={onNavigateToSignup}
            style={{ background: 'none', border: 'none', color: '#357ABD', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            Get licensed
          </button>
        </p>
      </div>
    </div>
  );
};
