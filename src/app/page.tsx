"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import Leaderboard from '@/components/Leaderboard';
import LiveToaster from '@/components/LiveToaster';
import { LayoutGrid, Flame, Clock, Filter, ArrowRight, Bell } from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All Lots', icon: LayoutGrid },
  { id: 'Live Auction', label: 'Live Now', icon: Flame },
  { id: 'Upcoming Lots', label: 'Upcoming', icon: Clock },
];

const CATEGORIES = [
  'All', 'Mobile Phones', 'Accessories', 'Electronics', 'Fashion', 'Home Appliances',
];

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [activeCat, setActiveCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    fetchProducts();
    // Poll every 10 seconds — only update if data actually changed (prevents blinking)
    const iv = setInterval(fetchProducts, 10000);
    return () => clearInterval(iv);
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const query = activeTab !== 'all' ? `?category=${encodeURIComponent(activeTab)}` : '';
      const res = await fetch(`/api/products${query}`);
      const data = await res.json();
      // Only update state if data has actually changed — prevents unnecessary re-renders
      setProducts(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
        return prev;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeCat === 'All' ? products : products; // extend filtering here

  return (
    <main className="main-root">
      <Header />
      <LiveToaster />

      {/* ── URGENCY FLASH BANNER ── */}
      {showBanner && (
        <div className="urgency-banner">
          <div className="container ub-inner">
            <div className="ub-left">
              <Bell size={18} className="ub-bell" />
              <span className="ub-text">
                🔥 <strong>Basmati Rice lot closing in just 4 minutes! Bid now</strong>
                &nbsp;— the longer you wait, the higher the price.
              </span>
            </div>
            <div className="ub-right">
              <a href="/" className="ub-cta">Bid Now</a>
              <button onClick={() => setShowBanner(false)} className="ub-close" aria-label="Close">✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      <Leaderboard />

      {/* ── STICKY TABS ── */}
      <div className="tabs-bar">
        <div className="container tabs-inner">
          <div className="tab-list">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : ''}`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.id === 'Live Auction' && (
                  <span className="tab-live-count">{products.filter(p => p.category === 'Live Auction').length}</span>
                )}
              </button>
            ))}
          </div>
          <button className="filter-btn">
            <Filter size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="container content-wrap">
        {/* Category Scroll Pills */}
        <div className="cat-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`cat-pill ${activeCat === cat ? 'cat-pill-active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Section Header */}
        <div className="sec-header">
          <div className="sec-header-left">
            <div className="sec-accent" />
            <div>
              <h1 className="sec-title">Live Auction Lots</h1>
              <p className="sec-sub">Price increases by 1% after every purchase — act fast!</p>
            </div>
          </div>
          <button className="view-all-btn">
            View All <ArrowRight size={15} />
          </button>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="product-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} className="text-gray-300" />
            <p className="text-gray-500 font-bold mt-4">No lots are currently available. Check back soon!</p>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .main-root { min-height: 100vh; background: #f9fafb; }

        /* Urgency Banner */
        .urgency-banner {
          background: #dc2626;
          color: white;
          padding: 0.7rem 0;
        }
        .ub-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .ub-left { display: flex; align-items: center; gap: 0.75rem; }
        .ub-bell { color: white; flex-shrink: 0; }
        .ub-text { font-size: 0.85rem; font-weight: 600; color: white; }
        .ub-right { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
        .ub-cta {
          background: white;
          color: #dc2626;
          padding: 0.375rem 1.25rem;
          border-radius: 8px;
          font-weight: 900;
          font-size: 0.8rem;
          white-space: nowrap;
        }
        .ub-close { color: rgba(255,255,255,0.75); font-size: 1.1rem; font-weight: 700; }
        .ub-close:hover { color: white; }

        /* Tab bar */
        .tabs-bar {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 64px; /* header nav height only */
          z-index: 100;
        }
        .tabs-inner {
          display: flex; align-items: center; justify-content: space-between;
          height: 52px; overflow: hidden;
        }
        .tab-list { display: flex; gap: 0; overflow-x: auto; }
        .tab-list::-webkit-scrollbar { display: none; }
        .tab-btn {
          display: flex; align-items: center; gap: 6px;
          height: 52px;
          padding: 0 1.25rem;
          font-weight: 700;
          font-size: 0.875rem;
          color: #6b7280;
          border-bottom: 2.5px solid transparent;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .tab-btn:hover { color: #dc2626; }
        .tab-btn-active { color: #dc2626; border-bottom-color: #dc2626; }
        .tab-live-count {
          background: #dc2626;
          color: white;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 1px 6px;
          border-radius: 10px;
        }
        .filter-btn {
          display: flex; align-items: center; gap: 6px;
          font-weight: 700; font-size: 0.875rem; color: #6b7280;
          padding: 0.4rem 0.875rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Content */
        .content-wrap { padding: 2rem 0 4rem; }

        /* Category pills */
        .cat-scroll {
          display: flex; gap: 0.625rem;
          overflow-x: auto; padding-bottom: 0.5rem;
          margin-bottom: 2rem;
        }
        .cat-scroll::-webkit-scrollbar { display: none; }
        .cat-pill {
          padding: 0.5rem 1.125rem;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 800;
          border: 1.5px solid #e5e7eb;
          background: white;
          color: #374151;
          white-space: nowrap;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .cat-pill:hover { border-color: #dc2626; color: #dc2626; }
        .cat-pill-active {
          background: #dc2626; border-color: #dc2626;
          color: white;
          box-shadow: 0 4px 14px rgba(220,38,38,0.25);
        }

        /* Section header */
        .sec-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
        }
        .sec-header-left { display: flex; align-items: center; gap: 1rem; }
        .sec-accent {
          width: 5px; height: 44px;
          background: #dc2626; border-radius: 4px; flex-shrink: 0;
        }
        .sec-title { font-size: 1.375rem; font-weight: 900; color: #111827; line-height: 1.2; }
        .sec-sub { font-size: 0.78rem; font-weight: 600; color: #6b7280; margin-top: 3px; }
        .view-all-btn {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.875rem; font-weight: 900; color: #dc2626;
        }
        .view-all-btn:hover { gap: 8px; }

        /* Product grid */
        .product-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1100px) { .product-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 640px) { .product-grid { grid-template-columns: 1fr; gap: 1rem; } }

        /* Skeleton */
        .skeleton-card {
          height: 420px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 16px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* Empty */
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          padding: 5rem 0;
        }
        .hidden { display: none; }
        @media (min-width: 640px) { .hidden.sm\\:inline { display: inline; } }
      `}</style>
    </main>
  );
}
