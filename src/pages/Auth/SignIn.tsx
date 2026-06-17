import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { Flame, Mail, Lock, ArrowRight, Check, UserPlus, LogIn } from 'lucide-react';

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      if (isSignUp) {
        const res = await signUp(email, password);
        if (res.error) {
          setError(res.error.message || 'Sign up failed. Please try again.');
        } else {
          setSuccess('Account created! You can now sign in.');
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error.message || 'Sign in failed. Check your credentials.');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (e: any) {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const res = await signInWithGoogle();
    if (res.error) {
      setError(res.error.message || 'Google sign-in failed.');
    }
    // If successful, Supabase redirects to Google and back — no manual navigate needed
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '24px 0'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
          marginBottom: '20px'
        }}>
          <Flame size={24} color="#ffffff" />
        </div>

        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '8px',
          fontFamily: 'var(--font-heading)'
        }}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          textAlign: 'center',
          marginBottom: '28px'
        }}>
          {isSignUp
            ? 'Start forging your days, one goal at a time.'
            : 'Sign in to continue your journey.'}
        </p>

        {/* ── Google Sign In Button ── */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            marginBottom: '20px'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-color)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
          }}
        >
          <GoogleIcon size={20} />
          <span>Continue with Google</span>
        </button>

        {/* ── Divider ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid var(--success-color)',
            borderRadius: '10px',
            width: '100%',
            marginBottom: '16px',
            animation: 'slideUp 0.3s ease'
          }}>
            <Check size={18} color="var(--success-color)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--success-color)' }}>{success}</span>
          </div>
        )}

        <form onSubmit={handleAuth} style={{ width: '100%' }}>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--error-color)',
              borderRadius: '8px',
              color: 'var(--error-color)',
              fontSize: '0.85rem',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                id="email" 
                className="input" 
                placeholder="name@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
              <Mail size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
            </div>
          </div>

          <div className="input-group">
            <label className="label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                id="password" 
                className="input" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                minLength={6}
                required
              />
              <Lock size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (
              <>
                {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: '6px',
                textDecoration: 'underline',
                fontSize: '0.88rem'
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
