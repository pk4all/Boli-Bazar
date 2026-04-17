"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Menu, X, ChevronDown, Zap, Clock, ShoppingBag, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const TICKER_ITEMS = [
  "🔥 18W Chargers — Price jumped to ₹42.50! Bid before it rises further.",
  "🏆 Retailer_88 just won a 1000 pcs Charger Lot!",
  "⚡ New Lot Live: Samsung S24 Ultra — 10 Units @ ₹9,20,000",
  "🔥 Only 5 lots remaining in Neckband Stock — Act fast!",
  "💰 Retailer_01 saved extra ₹2,400 margin today!",
  "🚨 Sugar lot closing in 3 minutes — Bid NOW!",
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const iv = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_ITEMS.length), 3500);
    return () => clearInterval(iv);
  }, []);

  const navLinks = [
    { name: 'Live Auctions', href: '/', icon: Zap },
    { name: 'Upcoming Lots', href: '/upcoming', icon: Clock },
    { name: 'My Bids', href: '/my-bids', icon: ShoppingBag },
  ];

  return (
    <header className="header-root">
      {/* ── MAIN NAV ── */}
      <div className="main-nav">
        <div className="container nav-inner">

          {/* Logo */}
          <Link href="/" className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text"><span className="logo-bid">Boli</span><span className="logo-bazar">Bazar</span></span>
          </Link>

          {/* Center Nav */}
          <nav className="center-nav">
            {navLinks.map(({ name, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                className={`nav-link ${pathname === href ? 'nav-link-active' : ''}`}
              >
                <Icon size={15} />
                {name}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="nav-right">
            {/* Token balance */}
            <div className="token-box">
              <div className="token-box-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="#dc2626" strokeWidth="2"/><path d="M2 10h20" stroke="#dc2626" strokeWidth="2"/></svg>
              </div>
              <span className="token-text">₹2,458 <span className="token-label">Tokens</span></span>
            </div>

            {/* Bell */}
            <div className="bell-wrap">
              <Bell size={20} className="bell-icon" />
              <span className="bell-badge">3</span>
            </div>

            {/* User */}
            <div className="user-btn">
              <div className="user-avatar-circle">R</div>
              <span className="user-name-text">Ramesh Gupta</span>
              <ChevronDown size={14} strokeWidth={2.5} className="text-gray-400" />
            </div>

            {/* Auth Buttons */}
            <div className="auth-btns">
              <Link href="/login" className="login-nav-btn"><LogIn size={15}/> Login</Link>
              <Link href="/register" className="register-nav-btn">Register Free</Link>
            </div>

            {/* Hamburger */}
            <button className="hamburger" onClick={() => setIsMenuOpen(v => !v)} aria-label="Toggle menu">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mobile-menu">
            {navLinks.map(({ name, href }) => (
              <Link key={name} href={href} onClick={() => setIsMenuOpen(false)} className={`mobile-link ${pathname === href ? 'text-red-600' : ''}`}>
                {name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .header-root {
          position: sticky; top: 0; z-index: 1000;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .main-nav { height: 64px; }
        .nav-inner {
          height: 100%;
          display: flex; align-items: center; justify-content: space-between;
          gap: 1rem;
        }

        /* Logo */
        .logo { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .logo-icon {
          width: 34px; height: 34px; border-radius: 8px;
          background: linear-gradient(135deg, #dc2626, #7c3aed);
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text { font-size: 1.375rem; font-weight: 900; letter-spacing: -1.5px; }
        .logo-bid { color: #dc2626; }
        .logo-bazar { color: #111827; }

        /* Center Nav */
        .center-nav { display: flex; gap: 4px; }
        .nav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 0.45rem 0.875rem; border-radius: 8px;
          font-weight: 700; font-size: 0.875rem; color: #4b5563;
          transition: all 0.15s; white-space: nowrap;
        }
        .nav-link:hover { background: #fef2f2; color: #dc2626; }
        .nav-link-active { background: #fef2f2; color: #dc2626; }

        /* Right */
        .nav-right { display: flex; align-items: center; gap: 1rem; }
        .auth-btns { display: flex; align-items: center; gap: 0.5rem; }
        .login-nav-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 0.4rem 0.875rem; border-radius: 8px;
          border: 1.5px solid #e5e7eb;
          font-size: 0.8rem; font-weight: 800; color: #374151;
          transition: all 0.15s;
        }
        .login-nav-btn:hover { border-color: #dc2626; color: #dc2626; }
        .register-nav-btn {
          padding: 0.4rem 0.875rem; border-radius: 8px;
          background: #dc2626; color: white;
          font-size: 0.8rem; font-weight: 900;
          transition: background 0.15s;
        }
        .register-nav-btn:hover { background: #b91c1c; }
        .token-box {
          display: flex; align-items: center; gap: 6px;
          background: #fef2f2; border: 1.5px solid #fecaca;
          border-radius: 10px; padding: 0.375rem 0.75rem;
        }
        .token-box-icon { display: flex; align-items: center; }
        .token-text { font-size: 0.8125rem; font-weight: 900; color: #dc2626; }
        .token-label { font-weight: 700; color: #ef4444; }

        .bell-wrap { position: relative; display: flex; align-items: center; }
        .bell-icon { color: #6b7280; cursor: pointer; }
        .bell-badge {
          position: absolute; top: -5px; right: -5px;
          width: 17px; height: 17px; border-radius: 50%;
          background: #dc2626; border: 2px solid white;
          color: white; font-size: 0.6rem; font-weight: 900;
          display: flex; align-items: center; justify-content: center;
        }

        .user-btn { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .user-avatar-circle {
          width: 34px; height: 34px; border-radius: 50%;
          background: #dc2626; color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 0.9rem;
        }
        .user-name-text { font-weight: 800; font-size: 0.9rem; color: #111827; white-space: nowrap; }

        .hamburger { display: none; color: #4b5563; }

        @media (max-width: 960px) {
          .center-nav { display: none; }
          .user-name-text { display: none; }
          .token-box { display: none; }
          .hamburger { display: flex; }
        }

        .mobile-menu {
          background: white; border-top: 1px solid #f3f4f6;
          display: flex; flex-direction: column;
          padding: 1rem 1.5rem; gap: 1rem; overflow: hidden;
          border-bottom: 2px solid #dc2626;
        }
        .mobile-link { font-weight: 700; color: #374151; font-size: 1rem; }
      `}</style>
    </header>
  );
}
