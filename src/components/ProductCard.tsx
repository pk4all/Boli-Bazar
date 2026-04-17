"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Timer, Zap, Users, Package, ShoppingBag, ArrowUpRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    images: string[];
    startPrice: number;
    currentPrice: number;
    moq: number;
    stock: number;
    totalStock: number;
    endTime: string;
    category: string;
    priceHikePercentage?: number;
    lastPriceUpdate?: string;
    buyerCount?: number;
  };
}

function useCountdown(endTime: string) {
  const [time, setTime] = useState('');
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTime('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 1000 * 60 * 30); // urgent if < 30 min
      setTime(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endTime]);
  return { time, urgent };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { time, urgent } = useCountdown(product.endTime);
  const [flashing, setFlashing] = useState(false);

  const isUpcoming = product.category === 'Upcoming Lots';
  const soldPct = Math.round(((product.totalStock - product.stock) / product.totalStock) * 100);

  // Trigger flash on recent price update
  useEffect(() => {
    if (!product.lastPriceUpdate) return;
    const diff = Date.now() - new Date(product.lastPriceUpdate).getTime();
    if (diff < 3000) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 1800);
      return () => clearTimeout(t);
    }
  }, [product.currentPrice, product.lastPriceUpdate]);

  return (
    <div className={`pc-root ${flashing ? 'pc-flash' : ''} ${isUpcoming ? 'pc-upcoming' : ''}`}>
      {/* ── IMAGE ── */}
      <Link href={isUpcoming ? '#' : `/product/${product._id}`} className="pc-img-wrap">
        <img src={product.images[0]} alt={product.title} className="pc-img" />

        {/* Badges */}
        <div className="pc-badges">
          {!isUpcoming && (
            <span className={`pc-badge-live ${urgent ? 'pc-badge-urgent' : ''}`}>
              <span className="pc-live-dot" /> {urgent ? 'Closing Soon!' : 'Live'}
            </span>
          )}
          {isUpcoming && (
            <span className="pc-badge-upcoming">
              <Clock size={10} /> Upcoming
            </span>
          )}
        </div>

        {/* Timer (only for live) */}
        {!isUpcoming && (
          <div className={`pc-timer ${urgent ? 'pc-timer-urgent' : ''}`}>
            <Timer size={13} />
            <span>{time}</span>
          </div>
        )}
      </Link>

      {/* ── BODY ── */}
      <div className="pc-body">
        {/* Title */}
        <h3 className="pc-title">{product.title}</h3>
        <p className="pc-sub">Start Price: ₹{product.startPrice.toLocaleString()} / pc</p>

        {/* Price display */}
        <div className={`pc-price-box ${flashing ? 'pc-price-box-flash' : ''}`}>
          <div className="pc-price-label">Current Live Price</div>
          <div className="pc-price-row">
            <span className="pc-price">₹{product.currentPrice.toLocaleString()}</span>
            <AnimatePresence>
              {flashing && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="pc-hike-badge"
                >
                  <ArrowUpRight size={11} /> +1%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MOQ + Buyers row */}
        <div className="pc-stats">
          <div className="pc-stat-chip bg-orange-50 border-orange-100">
            <ShoppingBag size={12} className="text-orange-500" />
            <span className="pc-stat-label text-orange-800">MOQ: {product.moq}</span>
          </div>
          <div className="pc-stat-chip bg-blue-50 border-blue-100">
            <Users size={12} className="text-blue-500" />
            <span className="pc-stat-label text-blue-800">{product.buyerCount ?? 100}+ bidders</span>
          </div>
          <div className="pc-stat-chip bg-green-50 border-green-100">
            <Package size={12} className="text-green-500" />
            <span className="pc-stat-label text-green-800">{product.stock} left</span>
          </div>
        </div>

        {/* Stock Progress Bar */}
        <div className="pc-progress-wrap">
          <div className="pc-progress-labels">
            <span className="pc-progress-muted">Stock Sold</span>
            <span className="pc-progress-pct">{soldPct}%</span>
          </div>
          <div className="pc-progress-bg">
            <div
              className="pc-progress-fill"
              style={{ width: `${soldPct}%`, background: soldPct >= 80 ? '#991b1b' : soldPct >= 50 ? '#dc2626' : '#ef4444' }}
            />
          </div>
        </div>

        {/* CTA */}
        {!isUpcoming ? (
          <Link href={`/product/${product._id}`}>
            <button className="pc-cta">
              <Zap size={18} className="fill-current" />
              BID NOW
            </button>
          </Link>
        ) : (
          <button disabled className="pc-cta-disabled">
            <Clock size={16} />
            Bidding Opens Soon
          </button>
        )}
      </div>

      <style jsx>{`
        /* Card shell */
        .pc-root {
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }
        .pc-root:hover { border-color: #dc2626; }
        .pc-flash {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.15);
        }
        .pc-upcoming {
          border-style: dashed;
          border-color: #d1d5db;
        }

        /* Image */
        .pc-img-wrap {
          position: relative;
          display: block;
          aspect-ratio: 4/3;
          background: #f3f4f6;
          overflow: hidden;
        }
        .pc-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.35s;
        }
        .pc-root:hover .pc-img { transform: scale(1.04); }


        /* Live badge */
        .pc-badges {
          position: absolute; top: 10px; left: 10px;
          display: flex; flex-direction: column; gap: 5px;
        }
        .pc-badge-live {
          background: #dc2626;
          color: white;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .pc-badge-urgent {
          background: #7f1d1d;
          animation: urgentPulse 1s infinite;
        }
        @keyframes urgentPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(127,29,29,0.6); }
          50% { box-shadow: 0 0 0 6px rgba(127,29,29,0); }
        }
        .pc-live-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #fca5a5;
          animation: pulse 1.4s infinite;
          flex-shrink: 0;
        }
        @keyframes pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        .pc-badge-upcoming {
          background: #1e293b;
          color: #94a3b8;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 6px;
          display: flex; align-items: center; gap: 4px;
          text-transform: uppercase;
        }

        /* Timer */
        .pc-timer {
          position: absolute; bottom: 10px; right: 10px;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(6px);
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
          display: flex; align-items: center; gap: 5px;
        }
        .pc-timer-urgent {
          background: #dc2626;
          animation: urgentPulse 1s infinite;
        }

        /* Body */
        .pc-body { padding: 1.125rem; display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
        .pc-title {
          font-size: 0.9375rem;
          font-weight: 900;
          line-height: 1.35;
          color: #111827;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.6rem;
        }
        .pc-sub { font-size: 0.72rem; font-weight: 700; color: #6b7280; }

        /* Price */
        .pc-price-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 0.6rem 0.875rem;
          transition: background 0.3s;
        }
        .pc-price-box-flash { background: #fef2f2; border-color: #fecaca; }
        .pc-price-label { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; }
        .pc-price-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 2px; }
        .pc-price { font-size: 1.5rem; font-weight: 900; color: #111827; }
        .pc-hike-badge {
          display: inline-flex; align-items: center; gap: 2px;
          background: #dc2626; color: white;
          font-size: 0.65rem; font-weight: 900;
          padding: 2px 7px; border-radius: 6px;
        }

        /* Stats chips */
        .pc-stats { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .pc-stat-chip {
          display: flex; align-items: center; gap: 4px;
          border: 1px solid;
          border-radius: 7px;
          padding: 3px 8px;
          flex-shrink: 0;
        }
        .pc-stat-label { font-size: 0.68rem; font-weight: 800; }

        /* Progress */
        .pc-progress-wrap {}
        .pc-progress-labels {
          display: flex; justify-content: space-between;
          margin-bottom: 4px;
        }
        .pc-progress-muted { font-size: 0.68rem; font-weight: 700; color: #9ca3af; }
        .pc-progress-pct { font-size: 0.68rem; font-weight: 900; color: #dc2626; }
        .pc-progress-bg {
          height: 7px; background: #f3f4f6; border-radius: 10px; overflow: hidden;
        }
        .pc-progress-fill { height: 100%; border-radius: 10px; transition: width 0.8s ease; }

        /* CTA */
        .pc-cta {
          width: 100%;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.85rem;
          font-size: 0.9375rem;
          font-weight: 900;
          letter-spacing: -0.3px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
          box-shadow: 0 6px 20px rgba(220,38,38,0.3);
        }
        .pc-cta:hover { background: #b91c1c; }
        .pc-cta-disabled {
          width: 100%;
          background: #f3f4f6;
          color: #9ca3af;
          border: 1px dashed #d1d5db;
          border-radius: 10px;
          padding: 0.85rem;
          font-size: 0.9rem;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
