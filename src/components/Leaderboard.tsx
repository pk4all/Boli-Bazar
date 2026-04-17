"use client";

import React from 'react';
import { Trophy, Crown, Medal, Star, Gift, Truck, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const TOP3 = [
  { rank: 2, initials: 'SA', name: 'Suresh Agarwal', city: 'Kanpur', amount: '₹1,67,740', color: '#7c3aed', medalColor: '#94a3b8' },
  { rank: 1, initials: 'PS', name: 'Priya Sharma',   city: 'Jaipur',  amount: '₹1,72,678', color: '#d97706', medalColor: '#f59e0b' },
  { rank: 3, initials: 'MI', name: 'Mohammed Iqbal', city: 'Lucknow', amount: '₹1,88,427', color: '#ea580c', medalColor: '#92400e' },
];

const RUNNERS = [
  { rank: 4, initials: 'RG', name: 'Ramesh Gupta',  city: 'Delhi',  amount: '₹1,24,893', color: '#dc2626' },
  { rank: 5, initials: 'KP', name: 'Kavita Patel',  city: 'Surat',  amount: '₹98,540',   color: '#7c3aed' },
];

const REWARDS = [
  {
    rank: '1st Place', icon: Crown, iconColor: '#f59e0b',
    title: 'FREE Delivery for 1 Month',
    sub: 'Exclusive Gold Badge + 5% Extra Discount',
    bg: 'linear-gradient(135deg,#78350f 0%,#451a03 100%)',
    border: '#92400e',
  },
  {
    rank: '2nd Place', icon: Trophy, iconColor: '#94a3b8',
    title: '3% Extra Discount on All Orders',
    sub: 'Silver Badge + Priority Support',
    bg: 'linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)',
    border: '#334155',
  },
  {
    rank: '3rd Place', icon: Medal, iconColor: '#92400e',
    title: '₹500 Cashback Voucher',
    sub: 'Bronze Badge + Early Access to New Lots',
    bg: 'linear-gradient(135deg,#3b1111 0%,#1c0a0a 100%)',
    border: '#7f1d1d',
  },
];

export default function Leaderboard() {
  return (
    <section className="lb-section">
      <div className="container">
        <div className="lb-card">

          {/* ── HEADER ── */}
          <div className="lb-header">
            <div className="lb-header-left">
              <div className="lb-trophy-wrap">
                <Trophy size={28} className="lb-trophy-icon" />
              </div>
              <div>
                <h2 className="lb-title">This Month's Leaderboard</h2>
                <p className="lb-subtitle">April 2026 &bull; ₹1 Spend = 1 Coin 🪙</p>
              </div>
            </div>
            <div className="lb-live-badge">
              <span className="lb-live-dot" />
              Live
            </div>
          </div>

          {/* ── REWARDS RIBBON ── */}
          <div className="lb-ribbon">
            🎁 &nbsp;<strong>MONTHLY REWARDS SCHEME — TOP 3 KO MILEGA</strong>
          </div>

          {/* ── 3 REWARD CARDS ── */}
          <div className="reward-grid">
            {REWARDS.map(r => (
              <div key={r.rank} className="reward-card" style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                <div className="reward-header">
                  <r.icon size={18} color={r.iconColor} />
                  <span className="reward-rank" style={{ color: r.iconColor }}>{r.rank}</span>
                </div>
                <div className="reward-title">{r.title}</div>
                <div className="reward-sub">{r.sub}</div>
              </div>
            ))}
          </div>

          {/* ── COINS INFO ── */}
          <p className="lb-coins-info">
            💎 The more you buy, the more coins you earn — Top 3 at month-end win exclusive rewards!
          </p>

          {/* ── PODIUM ── */}
          <div className="podium-row">
            {TOP3.map((p) => (
              <motion.div
                key={p.rank}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: p.rank * 0.1 }}
                className={`podium-person ${p.rank === 1 ? 'podium-first' : ''}`}
              >
                {/* Crown for 1st */}
                {p.rank === 1 && (
                  <div className="podium-crown">
                    <Crown size={22} fill="#f59e0b" color="#f59e0b" />
                  </div>
                )}
                {/* Avatar */}
                <div className="podium-avatar" style={{ background: p.color }}>
                  {p.initials}
                </div>
                {/* Base card */}
                <div className={`podium-base ${p.rank === 1 ? 'podium-base-gold' : ''}`} style={{ borderColor: p.medalColor + '55' }}>
                  <div className="podium-medal">
                    {p.rank === 1 ? <Crown size={16} color="#f59e0b" /> : p.rank === 2 ? <Star size={16} color="#94a3b8" /> : <Medal size={16} color="#92400e" />}
                  </div>
                  <div className="podium-name">{p.name}</div>
                  <div className="podium-city">{p.city}</div>
                  <div className="podium-amount">↑ {p.amount}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── RUNNER-UPS ── */}
          <div className="runners-list">
            {RUNNERS.map(r => (
              <div key={r.rank} className="runner-row">
                <span className="runner-rank">#{r.rank}</span>
                <div className="runner-avatar" style={{ background: r.color }}>{r.initials}</div>
                <div className="runner-info">
                  <div className="runner-name">{r.name}</div>
                  <div className="runner-city">{r.city}</div>
                </div>
                <div className="runner-amount">{r.amount}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <style jsx>{`
        .lb-section { padding: 1.5rem 0; background: #f1f5f9; }

        .lb-card {
          background: #0d1b2e;
          border-radius: 20px;
          overflow: hidden;
        }

        /* Header */
        .lb-header {
          background: linear-gradient(135deg, #dc2626 0%, #7c3aed 100%);
          padding: 1.5rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lb-header-left { display: flex; align-items: center; gap: 1rem; }
        .lb-trophy-wrap {
          width: 48px; height: 48px; border-radius: 12px;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lb-trophy-icon { color: #fde68a; }
        .lb-title { font-size: 1.125rem; font-weight: 900; color: white; }
        .lb-subtitle { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.75); margin-top: 2px; }
        .lb-live-badge {
          display: flex; align-items: center; gap: 6px;
          background: #16a34a; color: white;
          font-size: 0.75rem; font-weight: 900;
          padding: 0.3rem 0.875rem; border-radius: 9999px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .lb-live-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #bbf7d0;
          animation: blink 1.2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.3} }

        /* Ribbon */
        .lb-ribbon {
          background: #1e293b;
          border-top: 1px solid #334155;
          padding: 0.625rem 2rem;
          font-size: 0.75rem;
          font-weight: 900;
          color: #fde68a;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Reward cards */
        .reward-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          padding: 1.25rem 2rem 0;
        }
        @media (max-width: 640px) { .reward-grid { grid-template-columns: 1fr; } }
        .reward-card {
          border-radius: 12px;
          padding: 1rem 1.1rem;
        }
        .reward-header { display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem; }
        .reward-rank { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
        .reward-title { font-size: 0.9375rem; font-weight: 900; color: white; margin-bottom: 0.4rem; line-height: 1.3; }
        .reward-sub { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

        /* Coins info */
        .lb-coins-info {
          text-align: center;
          padding: 0.875rem 2rem 0;
          font-size: 0.78rem;
          color: #94a3b8;
          font-weight: 600;
        }

        /* Podium */
        .podium-row {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 1.5rem;
          padding: 1.5rem 2rem 0;
        }
        .podium-person {
          display: flex; flex-direction: column; align-items: center;
          flex: 1; max-width: 160px;
        }
        .podium-first { transform: translateY(-16px); }
        .podium-crown { margin-bottom: 4px; }
        .podium-avatar {
          width: 58px; height: 58px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 1.1rem; color: white;
          margin-bottom: 0.75rem;
          box-shadow: 0 0 0 4px rgba(255,255,255,0.1);
        }
        .podium-base {
          width: 100%;
          background: #1e293b;
          border: 1.5px solid;
          border-radius: 12px;
          padding: 0.875rem 0.75rem;
          text-align: center;
        }
        .podium-base-gold { background: linear-gradient(135deg, #292211 0%, #1a1508 100%); }
        .podium-medal { display: flex; justify-content: center; margin-bottom: 6px; }
        .podium-name { font-size: 0.8125rem; font-weight: 900; color: white; line-height: 1.3; }
        .podium-city { font-size: 0.7rem; color: #64748b; font-weight: 600; margin: 2px 0; }
        .podium-amount { font-size: 0.875rem; font-weight: 900; color: #4ade80; margin-top: 4px; }

        /* Runners */
        .runners-list {
          padding: 1.25rem 2rem 1.75rem;
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .runner-row {
          display: flex; align-items: center; gap: 1rem;
          background: #1e293b; border-radius: 10px;
          padding: 0.75rem 1rem;
        }
        .runner-rank { font-size: 0.8rem; font-weight: 900; color: #64748b; width: 24px; flex-shrink: 0; }
        .runner-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          color: white; font-weight: 900; font-size: 0.8rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .runner-info { flex: 1; }
        .runner-name { font-size: 0.875rem; font-weight: 900; color: white; }
        .runner-city { font-size: 0.7rem; color: #64748b; font-weight: 600; }
        .runner-amount { font-size: 0.9rem; font-weight: 900; color: #fde68a; flex-shrink: 0; }
      `}</style>
    </section>
  );
}
