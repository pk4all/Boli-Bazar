"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';

const TOASTS = [
  "🧂 Salt Iodized 1kg x 50 packs — price updated to ₹847.13!",
  "🔥 18W Charger lot — price jumped to ₹42.50!",
  "📦 Retailer_55 just placed an order for 500 pcs!",
  "⚡ Samsung S24 lot — price updated to ₹9,29,200!",
  "🏆 Priya Sharma won a lot worth ₹1,72,678 today!",
  "🚨 Neckband lot closing in just 10 minutes — Bid now!",
];

interface Toast { id: number; msg: string; }

export default function LiveToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const add = () => {
      const msg = TOASTS[Math.floor(Math.random() * TOASTS.length)];
      const id = Date.now();
      setToasts(prev => [...prev.slice(-2), { id, msg }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };
    const t1 = setTimeout(add, 2000);
    const iv = setInterval(add, 7000);
    return () => { clearTimeout(t1); clearInterval(iv); };
  }, []);

  return (
    <div className="toaster-root">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="toast"
          >
            <Info size={16} className="toast-icon" />
            <span className="toast-msg">{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="toast-x">
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <style jsx>{`
        .toaster-root {
          position: fixed; bottom: 1.25rem; right: 1.25rem;
          z-index: 9999; display: flex; flex-direction: column; gap: 8px;
          max-width: 360px;
        }
        .toast {
          display: flex; align-items: flex-start; gap: 10px;
          background: #0d1b2e;
          border: 1px solid #1e3a5f;
          border-left: 4px solid #3b82f6;
          border-radius: 12px;
          padding: 0.875rem 1rem;
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
          color: white;
          font-size: 0.8rem;
          font-weight: 700;
          line-height: 1.4;
        }
        .toast-icon { color: #60a5fa; flex-shrink: 0; margin-top: 1px; }
        .toast-msg { flex: 1; }
        .toast-x { color: #64748b; display: flex; align-items: center; flex-shrink: 0; }
        .toast-x:hover { color: white; }
        @media (max-width: 500px) {
          .toaster-root { right: 0.5rem; left: 0.5rem; max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
