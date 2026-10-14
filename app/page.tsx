'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  QrCode,
  Store,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  Share2,
  MessageCircle,
  Search,
  MapPin,
  Zap,
} from 'lucide-react';

interface Baker {
  id: string;
  business_name: string;
  slug: string;
  bio: string;
}

export default function SaaSLandingPage() {
  const [bakers, setBakers] = useState<Baker[]>([]);

  useEffect(() => {
    async function fetchBakers() {
      const { data } = await supabase.from('bakers').select('*');
      if (data) setBakers(data);
    }
    fetchBakers();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-neutral-100 antialiased selection:bg-rose-500 selection:text-white">
      {/* 1. Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0B]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center font-black text-black text-sm">
              B
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              BakerBridge
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 font-semibold">
              Bakery OS
            </span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
            <a href="#demo" className="hover:text-white transition-colors">Digital Showroom</a>
            <a href="#live-studios" className="hover:text-white transition-colors">Live Studios</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/crumb-and-crust"
              className="text-xs font-semibold text-neutral-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Live Demo
            </Link>
            <a
              href="#live-studios"
              className="bg-white hover:bg-neutral-200 text-black text-xs font-bold px-4 py-2 rounded-lg transition-all"
            >
              Explore Showrooms
            </a>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-rose-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Modern Custom Cake Studios & Home Bakers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
            Run Your Bakery.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400">
              Grow Your Business.
            </span>
          </h1>

          <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            BakerBridge helps you create professional <strong className="text-neutral-200">Cake Passports</strong>, generate instant <strong className="text-neutral-200">Box QR Codes</strong>, and showcase your entire catalog through a premium <strong className="text-neutral-200">Digital Showroom</strong> — all from a single cake entry.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/crumb-and-crust"
              className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-black font-bold text-sm px-7 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <span>View Live Demo Showroom</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#workflow"
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-sm px-7 py-3.5 rounded-xl transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* 3 Core Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 text-left">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <Layers className="w-5 h-5 text-rose-400 mb-3" />
              <h3 className="font-bold text-sm text-white">Cake Passports</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Complete digital specification sheet for every cake design, weight, and dietary tag.
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <QrCode className="w-5 h-5 text-amber-400 mb-3" />
              <h3 className="font-bold text-sm text-white">Instant QR Codes</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Print on cake boxes or counter stands so party guests can scan and reorder in one tap.
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <Store className="w-5 h-5 text-emerald-400 mb-3" />
              <h3 className="font-bold text-sm text-white">Digital Showroom</h3>
              <p className="text-xs text-neutral-400 mt-1">
                A searchable, video-first online storefront that updates automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Showroom Preview (DealerBridge Style Mockup) */}
      <section id="demo" className="py-24 border-b border-white/10 bg-[#0E0E11]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
              Baker Digital Showroom
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              Your Entire Catalog. One Professional Link.
            </h2>
            <p className="text-neutral-400 text-sm mt-3">
              Stop sending 30 unorganized photos on WhatsApp. Share one link with smart search, category filters, 5-second video loops, and instant WhatsApp booking.
            </p>
          </div>

          {/* Browser Window Mockup */}
          <div className="rounded-2xl border border-white/15 bg-[#141418] shadow-2xl overflow-hidden max-w-4xl mx-auto">
            {/* Browser Top Bar */}
            <div className="bg-[#1C1C22] px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="bg-[#0A0A0B] border border-white/10 rounded-md px-4 py-1 text-[11px] text-neutral-400 font-mono">
                bakerbridge.in/crumb-and-crust
              </div>
              <Link
                href="/crumb-and-crust"
                className="text-[11px] font-bold text-rose-400 hover:underline flex items-center gap-1"
              >
                Open Full Screen &rarr;
              </Link>
            </div>

            {/* Mockup Inner Content */}
            <div className="p-6 bg-[#FAF8F5] text-[#2C1E16]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAE3D9]">
                <div>
                  <h3 className="text-xl font-black">Crumb & Crust Studio</h3>
                  <p className="text-xs text-[#8C7A6B] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> Dwarka, New Delhi • <strong className="text-[#2C1E16]">24 Designs</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs text-[#8C7A6B] w-full sm:w-64">
                  <Search className="w-3.5 h-3.5" />
                  <span>Search cakes, themes...</span>
                </div>
              </div>

              {/* Sample Mini Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                {[
                  {
                    title: '3D Jungle Safari Tier',
                    specs: '1.5 kg • Eggless • Fondant',
                    price: '₹1,600',
                    img: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    title: 'Vintage Lambeth Piping',
                    specs: '1.0 kg • Eggless • Buttercream',
                    price: '₹1,400',
                    img: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    title: 'Korean Pastel Bento',
                    specs: '350 gm • Eggless • Minimalist',
                    price: '₹550',
                    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-[#EAE3D9] overflow-hidden shadow-sm">
                    <img src={item.img} alt={item.title} className="h-36 w-full object-cover" />
                    <div className="p-3.5">
                      <h4 className="font-bold text-sm">{item.title}</h4>
                      <p className="text-[11px] text-[#8C7A6B] mt-0.5">{item.specs}</p>
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#F3EFEA]">
                        <span className="font-black text-sm">{item.price}</span>
                        <Link
                          href="/crumb-and-crust"
                          className="text-[11px] font-bold text-rose-700 hover:underline"
                        >
                          View Passport &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works (4-Step DealerBridge Workflow) */}
      <section id="workflow" className="py-24 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Automation Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              One Cake Entry. Everything Else Happens Automatically.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            {[
              {
                step: 'Step 01',
                title: 'Studio Login',
                desc: 'Access your BakerBridge dashboard from your phone or laptop.',
              },
              {
                step: 'Step 02',
                title: 'Create Cake Record',
                desc: 'Enter weight, starting price, occasion tags, and eggless status once.',
              },
              {
                step: 'Step 03',
                title: 'Upload Video Loop',
                desc: 'Add a 5-second spinning cake reel or high-res gallery photo.',
              },
              {
                step: 'Step 04',
                title: 'Automated Output',
                desc: 'Your Cake Passport, Printable QR Code, and Digital Showroom update immediately.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 relative">
                <span className="text-[11px] font-black uppercase tracking-widest text-rose-400">
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-white mt-2 mb-2">{item.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Live Partner Studios (Dynamic from Supabase) */}
      <section id="live-studios" className="py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Live Directories
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                Active Baker Showrooms
              </h2>
            </div>
            <p className="text-xs text-neutral-400">
              Click any studio below to test their live Digital Showroom & Cake Passports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bakers.map((baker) => (
              <Link
                key={baker.id}
                href={`/${baker.slug}`}
                className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-rose-500/40 rounded-2xl p-6 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-black text-lg">
                    {baker.business_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-rose-400 transition-colors">
                      {baker.business_name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{baker.bio}</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-white bg-white/10 group-hover:bg-rose-500 group-hover:text-white px-4 py-2 rounded-lg transition-all flex items-center gap-1.5">
                  <span>Open Showroom</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center text-xs text-neutral-500">
        <p>© 2026 BakerBridge Operating System • Built in New Delhi, India</p>
      </footer>
    </div>
  );
}