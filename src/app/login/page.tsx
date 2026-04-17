"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck, Store, Layers, ArrowRight, AlertCircle } from 'lucide-react';

type Role = 'retailer' | 'admin';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('retailer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Save to localStorage
      localStorage.setItem('bb_user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Left Panel */}
      <div className="login-left">
        <div className="left-content">
          <div className="left-logo">
            <div className="logo-icon-big">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="left-logo-text"><span style={{color:'#ff6b6b'}}>Boli</span>Bazar</span>
          </div>

          <h1 className="left-headline">India's #1 Bulk Auction Platform for Retailers</h1>
          <p className="left-sub">Trusted by thousands of retailers across India. Bid on factory-direct bulk lots and maximize your margins.</p>

          <div className="left-stats">
            <div className="stat-box">
              <div className="stat-number">5,400+</div>
              <div className="stat-label">Active Retailers</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">₹12Cr+</div>
              <div className="stat-label">Total GMV</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">1,200+</div>
              <div className="stat-label">Lots Sold</div>
            </div>
          </div>

          <div className="trust-items">
            <div className="trust-item"><ShieldCheck size={16} /> Verified Manufacturers Only</div>
            <div className="trust-item"><Layers size={16} /> Real-time Price Tracking</div>
            <div className="trust-item"><Store size={16} /> 15+ Product Categories</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-card">
          {/* Logo small (mobile) */}
          <div className="mobile-logo">
            <div className="logo-icon-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="mobile-logo-text"><span style={{color:'#dc2626'}}>Boli</span>Bazar</span>
          </div>

          <h2 className="card-title">Welcome Back</h2>
          <p className="card-sub">Sign in to your retailer account</p>

          {/* Role Toggle */}
          <div className="role-toggle">
            <button
              onClick={() => { setRole('retailer'); setError(''); }}
              className={`role-btn ${role === 'retailer' ? 'role-btn-active' : ''}`}
            >
              <Store size={16} /> Retailer Login
            </button>
            <button
              onClick={() => { setRole('admin'); setError(''); }}
              className={`role-btn ${role === 'admin' ? 'role-btn-active-admin' : ''}`}
            >
              <ShieldCheck size={16} /> Admin Login
            </button>
          </div>

          {/* Admin hint */}
          {role === 'admin' && (
            <div className="admin-hint">
              <AlertCircle size={14} />
              <span>Demo credentials: admin@bolibazar.com / admin@123</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-box">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="field-group">
              <label className="field-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="aapka@email.com"
                className="field-input"
                required
                autoFocus
              />
            </div>

            <div className="field-group">
              <div className="label-row">
                <label className="field-label">Password</label>
                <a href="#" className="forgot-link">Bhul gaye?</a>
              </div>
              <div className="password-wrap">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field-input"
                  required
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="eye-btn">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className={`submit-btn ${role === 'admin' ? 'submit-btn-admin' : ''}`}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  {role === 'admin' ? 'Open Admin Dashboard' : 'Go to Live Auctions'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {role === 'retailer' && (
            <p className="register-link-text">
              Pehli baar aa rahe hain?{' '}
              <Link href="/register" className="register-link">
                Register karein — bilkul FREE!
              </Link>
            </p>
          )}

          <p className="terms-text">
            By logging in, you agree to our{' '}
            <a href="#" className="terms-link">Terms of Service</a>.
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-root {
          min-height: 100vh;
          display: flex;
        }

        /* Left */
        .login-left {
          flex: 1;
          background: linear-gradient(145deg, #dc2626 0%, #7c3aed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }
        @media (max-width: 768px) { .login-left { display: none; } }

        .left-content { max-width: 400px; color: white; }

        .left-logo {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 2.5rem;
        }
        .logo-icon-big {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .left-logo-text {
          font-size: 2rem; font-weight: 900;
          color: white; letter-spacing: -2px;
        }

        .left-headline {
          font-size: 2rem; font-weight: 900;
          line-height: 1.25; margin-bottom: 1rem;
          color: white;
        }
        .left-sub {
          font-size: 1rem; font-weight: 500;
          color: rgba(255,255,255,0.8);
          line-height: 1.6; margin-bottom: 2.5rem;
        }

        .left-stats {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem;
          margin-bottom: 2.5rem;
        }
        .stat-box {
          background: rgba(255,255,255,0.12);
          border-radius: 12px; padding: 1rem 0.75rem;
          text-align: center;
        }
        .stat-number { font-size: 1.375rem; font-weight: 900; color: white; }
        .stat-label { font-size: 0.7rem; font-weight: 600; color: rgba(255,255,255,0.7); margin-top: 3px; }

        .trust-items { display: flex; flex-direction: column; gap: 0.75rem; }
        .trust-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 0.875rem; font-weight: 700;
          color: rgba(255,255,255,0.9);
        }

        /* Right */
        .login-right {
          width: 480px;
          display: flex; align-items: center; justify-content: center;
          padding: 2rem;
          background: #f9fafb;
        }
        @media (max-width: 768px) { .login-right { width: 100%; } }

        .login-card {
          width: 100%; max-width: 400px;
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        }

        .mobile-logo {
          display: none; align-items: center; gap: 8px;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 768px) { .mobile-logo { display: flex; } }
        .logo-icon-sm {
          width: 34px; height: 34px; border-radius: 8px;
          background: linear-gradient(135deg,#dc2626,#7c3aed);
          display: flex; align-items: center; justify-content: center;
        }
        .mobile-logo-text { font-size: 1.375rem; font-weight: 900; letter-spacing: -1px; }

        .card-title { font-size: 1.625rem; font-weight: 900; color: #111827; margin-bottom: 4px; }
        .card-sub { font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 1.75rem; }

        /* Role Toggle */
        .role-toggle {
          display: grid; grid-template-columns: 1fr 1fr;
          background: #f3f4f6; border-radius: 12px;
          padding: 4px; gap: 4px; margin-bottom: 1.5rem;
        }
        .role-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 0.625rem;
          border-radius: 9px;
          font-size: 0.8rem; font-weight: 800;
          color: #6b7280;
          transition: all 0.2s;
        }
        .role-btn-active {
          background: white; color: #dc2626;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .role-btn-active-admin {
          background: #1e293b; color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .admin-hint {
          display: flex; align-items: center; gap: 6px;
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 8px; padding: 0.5rem 0.8rem;
          font-size: 0.75rem; font-weight: 700; color: #1d4ed8;
          margin-bottom: 1rem;
        }

        .error-box {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; padding: 0.75rem;
          font-size: 0.8rem; font-weight: 700; color: #dc2626;
          margin-bottom: 1rem;
        }

        .login-form { display: flex; flex-direction: column; gap: 1.25rem; }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .label-row { display: flex; justify-content: space-between; align-items: center; }
        .field-label { font-size: 0.8rem; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
        .forgot-link { font-size: 0.78rem; font-weight: 700; color: #dc2626; }

        .field-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.9375rem; font-weight: 500;
          color: #111827;
          transition: border-color 0.15s;
          outline: none;
        }
        .field-input:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }

        .password-wrap { position: relative; }
        .password-wrap .field-input { padding-right: 3rem; }
        .eye-btn {
          position: absolute; right: 12px;
          top: 50%; transform: translateY(-50%);
          color: #9ca3af;
        }
        .eye-btn:hover { color: #374151; }

        .submit-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 0.9rem;
          background: #dc2626; color: white;
          border-radius: 12px;
          font-size: 0.9375rem; font-weight: 900;
          transition: background 0.2s, transform 0.1s;
          margin-top: 0.5rem;
          box-shadow: 0 6px 20px rgba(220,38,38,0.35);
        }
        .submit-btn:hover { background: #b91c1c; transform: translateY(-1px); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn-admin { background: #1e293b; box-shadow: 0 6px 20px rgba(30,41,59,0.35); }
        .submit-btn-admin:hover { background: #0f172a; }

        .spinner {
          width: 20px; height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .register-link-text {
          text-align: center;
          margin-top: 1.25rem;
          font-size: 0.875rem; font-weight: 600; color: #6b7280;
        }
        .register-link { color: #dc2626; font-weight: 900; }
        .register-link:hover { text-decoration: underline; }

        .terms-text {
          text-align: center;
          margin-top: 1rem;
          font-size: 0.72rem; color: #9ca3af; font-weight: 500;
        }
        .terms-link { color: #dc2626; }
      `}</style>
    </div>
  );
}
