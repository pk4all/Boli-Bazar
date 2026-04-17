"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Phone, Lock, MapPin, Building2, Hash,
  Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, ChevronDown
} from 'lucide-react';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

const BUSINESS_TYPES = ['Sole Proprietor', 'Partnership', 'Pvt Ltd', 'LLP', 'Other'];
const CATEGORIES = ['Electronics', 'Mobile & Accessories', 'Fashion & Apparel', 'FMCG / Grocery', 'Home Appliances', 'Furniture', 'Toys & Games', 'Other'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    shopName: '', businessType: 'Sole Proprietor', category: '',
    gstNumber: '', address: '', city: '', state: '', pinCode: '',
    agree: false,
  });

  const set = (key: string, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const validateStep1 = () => {
    if (!form.name || !form.email || !form.phone || !form.password) return 'Please fill all required fields';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!/^\d{10}$/.test(form.phone)) return 'Enter a valid 10-digit mobile number';
    return null;
  };

  const validateStep2 = () => {
    if (!form.shopName || !form.state || !form.city || !form.pinCode || !form.address)
      return 'Please fill all required shop details';
    if (!/^\d{6}$/.test(form.pinCode)) return 'Pin code must be 6 digits';
    return null;
  };

  const handleNext = () => {
    setError('');
    const err = step === 1 ? validateStep1() : validateStep2();
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agree) { setError('Please accept the terms to continue.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reg-root">
        <div className="success-screen">
          <div className="success-icon"><CheckCircle size={64} color="#16a34a" /></div>
          <h2 className="success-title">Registration Successful!</h2>
          <p className="success-sub">Aapka account create ho gaya hai. Admin verification ke baad aap login kar paenge.</p>
          <p className="success-redirect">3 seconds mein login page par redirect ho rahe hain...</p>
          <Link href="/login" className="success-btn">Login Page Par Jaao</Link>
        </div>
        <style jsx>{`
          .reg-root { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f9fafb; }
          .success-screen { text-align:center; background:white; padding:3rem; border-radius:24px; max-width:440px; box-shadow:0 20px 60px rgba(0,0,0,0.1); }
          .success-icon { display:flex; justify-content:center; margin-bottom:1.5rem; }
          .success-title { font-size:1.75rem; font-weight:900; color:#111827; margin-bottom:0.75rem; }
          .success-sub { color:#6b7280; font-size:0.9rem; line-height:1.6; margin-bottom:1rem; }
          .success-redirect { font-size:0.8rem; color:#94a3b8; margin-bottom:1.5rem; }
          .success-btn { display:inline-block; background:#dc2626; color:white; padding:0.75rem 2rem; border-radius:10px; font-weight:900; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="reg-root">
      {/* Left Panel */}
      <div className="reg-left">
        <Link href="/" className="reg-logo">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span><span style={{color:'#ff6b6b'}}>Boli</span>Bazar</span>
        </Link>

        <h1 className="reg-left-title">Join India's Fastest Growing Retailer Network</h1>
        <p className="reg-left-sub">Register and start buying factory-direct bulk lots at the best prices.</p>

        {/* Benefits */}
        <div className="benefits">
          {[
            { icon: '🔥', title: 'Live Auction Access', desc: 'Real-time bidding on exclusive factory lots' },
            { icon: '💰', title: '1% Dynamic Pricing', desc: 'Early bidders always get the best rates' },
            { icon: '🚚', title: 'Free Delivery Option', desc: 'Pay in full upfront and save on logistics' },
            { icon: '🏆', title: 'Leaderboard Rewards', desc: 'Monthly cashback & discounts for top buyers' },
          ].map(b => (
            <div key={b.title} className="benefit-item">
              <div className="benefit-icon">{b.icon}</div>
              <div>
                <div className="benefit-title">{b.title}</div>
                <div className="benefit-desc">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="reg-right">
        <div className="reg-card">
          {/* Mobile Logo */}
          <div className="mobile-logo">
            <div className="logo-icon-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="mobile-logo-text"><span style={{color:'#dc2626'}}>Boli</span>Bazar</span>
          </div>

          <div className="card-top">
            <h2 className="card-title">Create Account</h2>
            <p className="card-sub">Retailer registration — free & quick</p>
          </div>

          {/* Step Indicator */}
          <div className="steps">
            {['Personal Info', 'Shop Details', 'Confirm'].map((s, i) => (
              <div key={s} className={`step-item ${step === i + 1 ? 'step-active' : step > i + 1 ? 'step-done' : ''}`}>
                <div className="step-circle">{step > i + 1 ? '✓' : i + 1}</div>
                <span className="step-label">{s}</span>
                {i < 2 && <div className="step-line" />}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="error-box">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="form-section">
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Full Name <span className="req">*</span></label>
                  <div className="input-wrap">
                    <User size={16} className="input-icon" />
                    <input id="reg-name" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ramesh Gupta" className="field-input padded" required />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Mobile Number <span className="req">*</span></label>
                  <div className="input-wrap">
                    <Phone size={16} className="input-icon" />
                    <input id="reg-phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" maxLength={10} className="field-input padded" required />
                  </div>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Email Address <span className="req">*</span></label>
                <div className="input-wrap">
                  <Mail size={16} className="input-icon" />
                  <input id="reg-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="aapka@email.com" className="field-input padded" required />
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Password <span className="req">*</span></label>
                  <div className="input-wrap">
                    <Lock size={16} className="input-icon" />
                    <input id="reg-password" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" className="field-input padded" required />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="eye-btn">{showPass ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Confirm Password <span className="req">*</span></label>
                  <div className="input-wrap">
                    <Lock size={16} className="input-icon" />
                    <input id="reg-confirm-password" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter password" className="field-input padded" required />
                  </div>
                </div>
              </div>

              <button type="button" onClick={handleNext} className="next-btn">
                Aage Badho <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="form-section">
              <div className="field-row">
                <div className="field-group field-group-wide">
                  <label className="field-label">Shop / Business Name <span className="req">*</span></label>
                  <div className="input-wrap">
                    <Building2 size={16} className="input-icon" />
                    <input id="reg-shop-name" type="text" value={form.shopName} onChange={e => set('shopName', e.target.value)} placeholder="Gupta Electronics" className="field-input padded" required />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Business Type</label>
                  <div className="input-wrap">
                    <select id="reg-business-type" value={form.businessType} onChange={e => set('businessType', e.target.value)} className="field-input padded-select">
                      {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={15} className="select-chevron" />
                  </div>
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">GST Number <span className="opt">(Optional)</span></label>
                  <div className="input-wrap">
                    <Hash size={16} className="input-icon" />
                    <input id="reg-gst" type="text" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} className="field-input padded" />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Product Category</label>
                  <div className="input-wrap">
                    <select id="reg-category" value={form.category} onChange={e => set('category', e.target.value)} className="field-input padded-select">
                      <option value="">Select Category</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={15} className="select-chevron" />
                  </div>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Full Shop Address <span className="req">*</span></label>
                <div className="input-wrap">
                  <MapPin size={16} className="input-icon" style={{top:'14px'}} />
                  <textarea id="reg-address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Shop No., Street, Area" className="field-input padded textarea" rows={2} required />
                </div>
              </div>

              <div className="field-row three-col">
                <div className="field-group">
                  <label className="field-label">State <span className="req">*</span></label>
                  <div className="input-wrap">
                    <select id="reg-state" value={form.state} onChange={e => set('state', e.target.value)} className="field-input padded-select" required>
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={15} className="select-chevron" />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">City <span className="req">*</span></label>
                  <div className="input-wrap">
                    <input id="reg-city" type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Delhi" className="field-input padded" required />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Pin Code <span className="req">*</span></label>
                  <div className="input-wrap">
                    <input id="reg-pincode" type="text" value={form.pinCode} onChange={e => set('pinCode', e.target.value)} placeholder="110001" maxLength={6} className="field-input padded" required />
                  </div>
                </div>
              </div>

              <div className="btn-row">
                <button type="button" onClick={() => { setStep(1); setError(''); }} className="back-btn">← Back</button>
                <button type="button" onClick={handleNext} className="next-btn">Review & Submit <ArrowRight size={18} /></button>
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="form-section">
              <div className="review-card">
                <div className="review-section-title">Personal Information</div>
                <div className="review-grid">
                  <ReviewRow label="Name" value={form.name} />
                  <ReviewRow label="Email" value={form.email} />
                  <ReviewRow label="Phone" value={form.phone} />
                </div>
              </div>
              <div className="review-card">
                <div className="review-section-title">Shop Details</div>
                <div className="review-grid">
                  <ReviewRow label="Shop Name" value={form.shopName} />
                  <ReviewRow label="Business Type" value={form.businessType} />
                  <ReviewRow label="State" value={form.state} />
                  <ReviewRow label="City" value={form.city} />
                  <ReviewRow label="Pin Code" value={form.pinCode} />
                  {form.gstNumber && <ReviewRow label="GST" value={form.gstNumber} />}
                </div>
              </div>

              <label className="agree-row">
                <input
                  id="reg-agree"
                  type="checkbox"
                  checked={form.agree}
                  onChange={e => set('agree', e.target.checked)}
                  className="agree-checkbox"
                />
                <span className="agree-text">
                  I agree to Boli Bazar's <a href="#" className="agree-link">Terms of Use</a> and <a href="#" className="agree-link">Privacy Policy</a>.
                </span>
              </label>

              <div className="btn-row">
                <button type="button" onClick={() => { setStep(2); setError(''); }} className="back-btn">← Edit</button>
                <button id="reg-submit" type="submit" disabled={loading} className="next-btn submit-final">
                  {loading ? <span className="spinner" /> : <>Create My Account <ArrowRight size={18} /></>}
                </button>
              </div>
            </form>
          )}

          <p className="login-prompt">
            Already have an account?{' '}
            <Link href="/login" className="login-prompt-link">Sign in here</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .reg-root { min-height:100vh; display:flex; }

        /* Left */
        .reg-left {
          flex: 1;
          background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 3rem;
          color: white;
        }
        @media (max-width: 900px) { .reg-left { display: none; } }

        .reg-logo {
          display: flex; align-items: center; gap: 0.75rem;
          font-size: 1.75rem; font-weight: 900; letter-spacing: -1.5px;
          color: white; margin-bottom: 3rem;
        }
        .logo-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg,#dc2626,#7c3aed);
          display: flex; align-items: center; justify-content: center;
        }
        .reg-left-title { font-size: 1.875rem; font-weight: 900; line-height: 1.3; margin-bottom: 1rem; }
        .reg-left-sub { font-size: 0.95rem; color: #94a3b8; margin-bottom: 2.5rem; line-height: 1.6; }

        .benefits { display: flex; flex-direction: column; gap: 1.25rem; }
        .benefit-item { display: flex; gap: 1rem; align-items: flex-start; }
        .benefit-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
        .benefit-title { font-weight: 900; font-size: 0.9375rem; color: white; margin-bottom: 2px; }
        .benefit-desc { font-size: 0.8rem; color: #64748b; font-weight: 500; }

        /* Right */
        .reg-right {
          width: 560px;
          overflow-y: auto;
          background: #f9fafb;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 2rem;
        }
        @media (max-width: 900px) { .reg-right { width: 100%; } }

        .reg-card {
          width: 100%; max-width: 500px;
          background: white; border-radius: 24px;
          padding: 2.25rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          margin: auto;
        }

        .mobile-logo { display: none; align-items: center; gap: 8px; margin-bottom: 1.5rem; }
        @media (max-width: 900px) { .mobile-logo { display: flex; } }
        .logo-icon-sm {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg,#dc2626,#7c3aed);
          display: flex; align-items: center; justify-content: center;
        }
        .mobile-logo-text { font-size: 1.25rem; font-weight: 900; letter-spacing: -1px; }

        .card-top { margin-bottom: 1.5rem; }
        .card-title { font-size: 1.5rem; font-weight: 900; color: #111827; margin-bottom: 4px; }
        .card-sub { font-size: 0.8rem; font-weight: 600; color: #6b7280; }

        /* Steps */
        .steps {
          display: flex; align-items: center;
          margin-bottom: 1.75rem;
        }
        .step-item { display: flex; align-items: center; gap: 8px; }
        .step-circle {
          width: 28px; height: 28px; border-radius: 50%;
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 900; color: #9ca3af;
          flex-shrink: 0;
        }
        .step-active .step-circle { background: #dc2626; border-color: #dc2626; color: white; }
        .step-done .step-circle { background: #16a34a; border-color: #16a34a; color: white; }
        .step-label { font-size: 0.72rem; font-weight: 800; color: #9ca3af; white-space: nowrap; }
        .step-active .step-label { color: #dc2626; }
        .step-done .step-label { color: #16a34a; }
        .step-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 0.5rem; min-width: 24px; }

        /* Error */
        .error-box {
          display: flex; align-items: flex-start; gap: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; padding: 0.75rem;
          font-size: 0.8rem; font-weight: 700; color: #dc2626;
          margin-bottom: 1rem;
        }

        /* Form fields */
        .form-section { display: flex; flex-direction: column; gap: 1rem; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
        .field-row.three-col { grid-template-columns: 1fr 1fr 1fr; }
        @media (max-width: 500px) {
          .field-row, .field-row.three-col { grid-template-columns: 1fr; }
        }
        .field-group { display: flex; flex-direction: column; gap: 5px; }
        .field-group-wide { grid-column: span 2; }
        @media (max-width: 500px) { .field-group-wide { grid-column: span 1; } }

        .field-label { font-size: 0.72rem; font-weight: 900; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
        .req { color: #dc2626; }
        .opt { text-transform: none; font-weight: 600; color: #9ca3af; }

        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 11px; top: 50%;
          transform: translateY(-50%); color: #9ca3af; pointer-events: none;
        }
        .field-input {
          width: 100%; padding: 0.65rem 0.75rem;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 0.875rem; font-weight: 500; color: #111827;
          outline: none; transition: border-color 0.15s;
        }
        .field-input:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
        .field-input.padded { padding-left: 2.25rem; }
        .field-input.padded-select { padding-left: 0.75rem; padding-right: 2rem; appearance: none; cursor: pointer; }
        .field-input.textarea { resize: none; padding-left: 2.25rem; padding-top: 0.65rem; }
        .select-chevron {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%); color: #9ca3af; pointer-events: none;
        }
        .eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
        .eye-btn:hover { color: #374151; }

        /* Buttons */
        .btn-row { display: flex; gap: 0.75rem; align-items: center; }
        .back-btn {
          flex-shrink: 0;
          padding: 0.75rem 1.25rem;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 0.875rem; font-weight: 800; color: #6b7280;
          transition: all 0.15s;
        }
        .back-btn:hover { border-color: #dc2626; color: #dc2626; }
        .next-btn {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 0.825rem;
          background: #dc2626; color: white;
          border-radius: 10px;
          font-size: 0.9375rem; font-weight: 900;
          transition: background 0.2s;
          box-shadow: 0 4px 14px rgba(220,38,38,0.3);
        }
        .next-btn:hover { background: #b91c1c; }

        /* Review */
        .review-card {
          background: #f9fafb; border: 1px solid #f3f4f6;
          border-radius: 12px; padding: 1.25rem;
        }
        .review-section-title {
          font-size: 0.72rem; font-weight: 900; text-transform: uppercase;
          letter-spacing: 0.08em; color: #6b7280; margin-bottom: 0.875rem;
        }
        .review-grid { display: flex; flex-direction: column; gap: 0.5rem; }

        /* Agree */
        .agree-row { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
        .agree-checkbox { width: 16px; height: 16px; accent-color: #dc2626; flex-shrink: 0; margin-top: 2px; }
        .agree-text { font-size: 0.8rem; font-weight: 600; color: #4b5563; line-height: 1.5; }
        .agree-link { color: #dc2626; font-weight: 800; }

        .submit-final { width: 100%; }

        .spinner {
          width: 18px; height: 18px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-prompt {
          text-align: center; margin-top: 1.5rem;
          font-size: 0.85rem; font-weight: 600; color: #6b7280;
        }
        .login-prompt-link { color: #dc2626; font-weight: 900; }
      `}</style>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#111827' }}>{value}</span>
    </div>
  );
}
