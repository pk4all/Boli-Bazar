"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Timer, ArrowLeft, ShieldCheck, ShoppingCart, TrendingUp, Info, Zap, Truck, CreditCard, Users, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [paymentMode, setPaymentMode] = useState('Full'); // Default to Full for Free Delivery
  const [bidding, setBidding] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    fetchProduct();
    const interval = setInterval(fetchProduct, 3000); // Fast polling for real-time feel
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (product) {
       const updateTime = new Date(product.lastPriceUpdate).getTime();
       if (Date.now() - updateTime < 2500) {
         setIsFlashing(true);
         setTimeout(() => setIsFlashing(false), 2000);
       }
    }
  }, [product?.currentPrice]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      setProduct(data);
      if (data.moq && quantity < data.moq) setQuantity(data.moq);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    setBidding(true);
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          quantity,
          paymentMode
        })
      });
      if (res.ok) {
        // play sound for urgency?
        alert('Congratulations! Bid Placed Successfully!');
        fetchProduct();
      } else {
        alert('Quantity not available or connection error.');
      }
    } catch (error) {
      console.error('Bid error:', error);
    } finally {
      setBidding(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <TrendingUp size={64} className="text-[#DC2626] animate-bounce" />
        <span className="font-black text-xl animate-pulse">LOADING BOLI BAZAR...</span>
      </div>
    </div>
  );

  if (!product) return <div>Product not found</div>;

  const baseAmount = product.currentPrice * quantity;
  const advanceToken = Math.round(baseAmount * 0.1);
  const deliveryFee = paymentMode === 'COD' ? Math.round(baseAmount * 0.1) : 0;
  const finalBalance = baseAmount - advanceToken + deliveryFee;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#4b5563] hover:text-[#DC2626] transition-colors mb-6 font-black uppercase text-xs tracking-widest">
          <ArrowLeft size={20} /> Back to Live Auction
        </button>

        <div className="product-layout">
          {/* Left: Images & Info */}
          <div className="product-visuals flex flex-col gap-6">
            <div className={`main-image-card card relative ${isFlashing ? 'ring-4 ring-[#DC2626]' : ''}`}>
              <img src={product.images[0]} alt={product.title} />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                 <span className="bg-[#DC2626] text-white px-4 py-2 rounded-lg font-black text-sm tracking-tighter animate-pulse">LIVE NOW</span>
                 <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2">
                    <Users size={16} className="text-[#DC2626]" /> 
                    <span className="font-black text-sm">{product.buyerCount || 100}+ Retailers Bidding</span>
                 </div>
              </div>
            </div>

            <div className="info-grid grid grid-cols-2 gap-4">
              <div className="info-stat card p-4 flex flex-col items-center">
                 <span className="text-[10px] font-black uppercase text-muted">Starting Price</span>
                 <span className="text-xl font-black">₹{product.startPrice}</span>
              </div>
              <div className="info-stat card p-4 flex flex-col items-center">
                 <span className="text-[10px] font-black uppercase text-muted">Remaining Stock</span>
                 <span className="text-xl font-black text-red-600">{product.stock} Lots</span>
              </div>
            </div>

            <div className="description card p-6">
               <h3 className="font-black text-lg mb-3 uppercase tracking-tighter">Lot Details</h3>
               <p className="text-[#4b5563] font-medium leading-relaxed">{product.description}</p>
            </div>
          </div>

          {/* Right: Bidding Panel */}
          <div className="bidding-panel sticky top-28 h-fit">
            <div className={`bidding-widget card ${isFlashing ? 'flashing shadow-2xl' : 'shadow-xl'} border-none`}>
              <div className="widget-header bg-[#DC2626] p-6 text-white text-center">
                 <div className="flex items-center justify-center gap-2 mb-2">
                    <Timer size={20} className="animate-pulse" />
                    <span className="font-black text-lg uppercase tracking-tight">Auction Ends In: 04h 22m 11s</span>
                 </div>
                 <div className="bg-white/10 rounded-full py-1 px-4 inline-block text-[10px] font-bold">Price increases by 1% after every purchase</div>
              </div>

              <div className="p-8">
                <div className="price-display text-center mb-8">
                   <span className="text-muted font-black uppercase text-xs tracking-widest block mb-2">Current Market Rate</span>
                   <div className="flex items-center justify-center gap-3">
                      <span className={`text-5xl font-black ${isFlashing ? 'text-[#DC2626]' : 'text-[#111827]'} transition-colors duration-200`}>
                        ₹{product.currentPrice.toLocaleString()}
                      </span>
                      <AnimatePresence>
                        {isFlashing && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} exit={{ scale: 0 }} className="bg-[#DC2626] text-white rounded-lg px-2 py-1 text-xs font-black">
                            HIKE!
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                   <p className="text-xs font-bold text-muted mt-2 mt-2">Prices change instantly. Book before next hike!</p>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Quantity Selector */}
                  <div className="input-field">
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-sm font-black uppercase">Quantity (MOQ: {product.moq})</label>
                       <span className="text-xs font-bold text-muted">Available: {product.stock} items</span>
                    </div>
                    <div className="qty-picker">
                      <button onClick={() => setQuantity(Math.max(product.moq, quantity - 1))} className="qty-btn">-</button>
                      <input type="number" readOnly value={quantity} className="qty-num" />
                      <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="qty-btn">+</button>
                    </div>
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="payment-modes">
                    <label className="text-xs font-black uppercase text-muted mb-3 block">Payment & Delivery Options</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                        onClick={() => setPaymentMode('Full')}
                        className={`mode-card ${paymentMode === 'Full' ? 'active' : ''}`}
                       >
                          <CreditCard size={20} />
                          <div>
                            <div className="text-sm font-black">Full Payment</div>
                            <div className="text-[10px] text-green-600 font-bold uppercase">Free Delivery</div>
                          </div>
                       </button>
                       <button 
                        onClick={() => setPaymentMode('COD')}
                        className={`mode-card ${paymentMode === 'COD' ? 'active' : ''}`}
                       >
                          <Truck size={20} />
                          <div>
                            <div className="text-sm font-black">COD (90%)</div>
                            <div className="text-[10px] text-red-600 font-bold uppercase">+10% Del. Fee</div>
                          </div>
                       </button>
                    </div>
                  </div>

                  {/* Detailed Calculation Summary */}
                  <div className="calc-summary bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6">
                     <div className="flex justify-between mb-2 text-sm">
                        <span className="font-bold text-muted">Total Order Value</span>
                        <span className="font-black">₹{baseAmount.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between mb-2 text-sm text-red-600">
                        <span className="font-bold">Mandatory Advance (10%)</span>
                        <span className="font-black">₹{advanceToken.toLocaleString()}</span>
                     </div>
                     {paymentMode === 'COD' && (
                        <div className="flex justify-between mb-2 text-sm text-red-600">
                          <span className="font-bold">COD Logistics Surcharge (10%)</span>
                          <span className="font-black">+₹{deliveryFee.toLocaleString()}</span>
                        </div>
                     )}
                     <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between items-center">
                        <span className="font-black text-gray-900 uppercase text-xs">Final Balance Payable</span>
                        <span className="text-2xl font-black text-[#DC2626]">₹{finalBalance.toLocaleString()}</span>
                     </div>
                  </div>

                  <button 
                    onClick={handleBid}
                    disabled={bidding}
                    className="btn btn-primary w-full py-5 text-xl font-black tracking-tighter shadow-2xl shadow-red-200 animate-pulse"
                  >
                    {bidding ? 'PROCESSING...' : 'CONFIRM BID & PAY TOKEN'}
                  </button>

                  <p className="text-center text-[10px] text-muted font-bold flex items-center justify-center gap-1 uppercase tracking-widest">
                    <ShieldCheck size={14} className="text-green-600" /> Boli Bazar Verified Transaction
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3rem;
        }
        @media (max-width: 1024px) {
          .product-layout { grid-template-columns: 1fr; }
          .bidding-panel { position: static; }
        }
        .main-image-card img { width: 100%; height: auto; border-radius: inherit; }
        
        .qty-picker {
          display: flex;
          background: #F1F5F9;
          border-radius: 12px;
          padding: 0.25rem;
          width: fit-content;
        }
        .qty-btn { width: 44px; height: 44px; display: flex; items-center; justify-content: center; font-size: 1.5rem; font-weight: 300; }
        .qty-num { width: 80px; text-align: center; background: white; border-radius: 8px; font-weight: 900; font-size: 1.125rem; border: none; }
        
        .mode-card {
           flex: 1;
           display: flex;
           align-items: center;
           gap: 0.75rem;
           padding: 1rem;
           border-radius: 12px;
           border: 2px solid #E5E7EB;
           text-align: left;
           transition: all 0.2s;
        }
        .mode-card.active { border-color: #DC2626; background: #FEF2F2; }
        
        .bidding-widget.flashing { transform: scale(1.01); border: 2px solid #dc2626; }
      `}</style>
    </div>
  );
}
