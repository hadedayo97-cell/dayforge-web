import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Target, Sparkles, TrendingUp } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      textAlign: 'center',
      padding: '40px 0'
    }}>
      {/* Decorative Glow Circles */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        top: '10%',
        left: '15%',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        bottom: '10%',
        right: '10%',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>

      {/* Hero section */}
      <div style={{ maxWidth: '800px', margin: '0 auto 60px auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '50px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          marginBottom: '24px',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          <Sparkles size={14} color="var(--accent-color)" />
          <span>Supercharge your day-to-day lifecycle</span>
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          letterSpacing: '-1.5px',
          lineHeight: '1.15',
          marginBottom: '24px'
        }}>
          Forge your days.<br />
          <span className="gradient-text">Command your future.</span>
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px auto',
          lineHeight: '1.6'
        }}>
          DayForge empowers you to translate high-level aspirations into daily habit loops. 
          No clutter, just absolute execution.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/auth')} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
            Get Started Free
          </button>
          <a href="#features" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
            Learn More
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px',
        width: '100%',
        maxWidth: '1100px',
        margin: '40px 0 80px 0'
      }}>
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'left' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-glow)',
            color: 'var(--primary-color)',
            marginBottom: '20px'
          }}>
            <Target size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>High-Level Goals</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Define high-impact milestones, allocate priorities, and map out clear deadlines to keep your long-term focus locked in.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px', textAlign: 'left' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--success-color)',
            marginBottom: '20px'
          }}>
            <CheckCircle size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Daily Action Plans</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Break complex goals down into bite-sized, actionable tasks. Focus strictly on today's agenda with clean checklists.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px', textAlign: 'left' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent-glow)',
            color: 'var(--accent-color)',
            marginBottom: '20px'
          }}>
            <TrendingUp size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Streak & Insights</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Keep your momentum alive with visual tracking stats, consistency indicators, and real-time progress updates.
          </p>
        </div>
      </section>

      {/* Newsletter signup */}
      <div className="glass-panel" style={{
        padding: '40px',
        maxWidth: '650px',
        width: '100%',
        margin: '0 auto'
      }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Stay in the Flow</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Get curated updates on personal optimization frameworks and new productivity features.
        </p>

        {subscribed ? (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--success-color)',
            borderRadius: '8px',
            color: 'var(--success-color)',
            fontWeight: '600'
          }}>
            Welcome aboard! We'll keep you updated.
          </div>
        ) : (
          <form onSubmit={handleSubscribe} style={{
            display: 'flex',
            gap: '12px',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <input 
              type="email" 
              className="input" 
              placeholder="Enter your email address" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">Join</button>
          </form>
        )}
      </div>
    </div>
  );
}
