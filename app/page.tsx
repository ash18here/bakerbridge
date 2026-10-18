'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  Store,
  ArrowRight,
  CheckCircle2,
  Lock,
  Users,
  Upload,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  Loader2,
  Cake,
  KeyRound,
  QrCode,
  XCircle,
  Check,
  SlidersHorizontal,
  Star,
  MapPin,
} from 'lucide-react';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });

interface Baker {
  id: string;
  business_name: string;
  slug: string;
  whatsapp_number: string;
  bio: string;
}

export default function SaaSLandingPage() {
  const router = useRouter();
  const [bakers, setBakers] = useState<Baker[]>([]);
  const [loadingBakers, setLoadingBakers] = useState(true);

  // Self-Serve Baker Signup State
  const [bizName, setBizName] = useState('');
  const [slug, setSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('91');
  const [bio, setBio] = useState('100% Eggless Custom Cakes • New Delhi');
  const [pin, setPin] = useState('');
  const [seedSampleCakes, setSeedSampleCakes] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdBaker, setCreatedBaker] = useState<{
    slug: string;
    pin: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    async function fetchBakers() {
      const { data } = await supabase
        .from('bakers')
        .select('*')
        .order('business_name')
        .limit(12);
      if (data) setBakers(data);
      setLoadingBakers(false);
    }
    fetchBakers();
  }, []);

  function handleNameChange(val: string) {
    setBizName(val);
    const clean = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(clean);
  }

  function scrollToSignup() {
    const el = document.getElementById('baker-signup-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async function handleSelfServeSignup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-');
    const cleanPhone = whatsapp.replace(/\D/g, '');
    const cleanPin = pin.trim() || '1234';

    if (!bizName.trim() || !cleanSlug) {
      setErrorMsg('Please enter your bakery or cake studio name.');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp number (with 91).');
      return;
    }
    if (cleanSlug === 'admin') {
      setErrorMsg('That URL slug is reserved. Please pick another store link.');
      return;
    }

    setIsCreating(true);
    try {
      // 1. Check if slug is already taken
      const { data: existing } = await supabase
        .from('bakers')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (existing) {
        setErrorMsg(
          `The link "/${cleanSlug}" is already taken. Try adding your locality or city!`
        );
        setIsCreating(false);
        return;
      }

      // 2. Insert new Baker into Supabase
      let newBakerData: any = null;
      const { data, error } = await supabase
        .from('bakers')
        .insert([
          {
            business_name: bizName.trim(),
            slug: cleanSlug,
            whatsapp_number: cleanPhone,
            bio: bio.trim() || 'Custom Cake Studio',
            access_pin: cleanPin,
          },
        ])
        .select()
        .single();

      if (error) {
        const fallback = await supabase
          .from('bakers')
          .insert([
            {
              business_name: bizName.trim(),
              slug: cleanSlug,
              whatsapp_number: cleanPhone,
              bio: bio.trim() || 'Custom Cake Studio',
            },
          ])
          .select()
          .single();

        if (fallback.error) throw new Error(fallback.error.message);
        newBakerData = fallback.data;
      } else {
        newBakerData = data;
      }

      // 3. Optionally seed 2 starter cakes so their new showroom works immediately
      if (seedSampleCakes && newBakerData?.id) {
        await supabase.from('cakes').insert([
          {
            baker_id: newBakerData.id,
            title: 'Belgian Chocolate Truffle Drip Cake (Sample)',
            starting_price: 1200,
            min_weight: '1.0 kg',
            occasion: ['anniversary'],
            is_eggless: true,
            is_active: true,
            image_url:
              'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
          },
          {
            baker_id: newBakerData.id,
            title: 'Pastel Butterfly Birthday Tier (Sample)',
            starting_price: 1800,
            min_weight: '1.5 kg',
            occasion: ['kids'],
            is_eggless: true,
            is_active: true,
            image_url:
              'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80',
          },
        ]);
      }

      // 4. Auto-authenticate the baker in sessionStorage so /admin opens unlocked
      sessionStorage.setItem(
        'bakerbridge_session',
        JSON.stringify({ role: 'baker', bakerSlug: cleanSlug })
      );

      setBakers((prev) => [newBakerData, ...prev]);
      setCreatedBaker({
        slug: cleanSlug,
        pin: cleanPin,
        name: newBakerData.business_name,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not create store. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#231710] antialiased selection:bg-rose-900 selection:text-white">
      {/* Top Announcement Ribbon */}
      <div className="bg-[#231710] text-[#FAF7F2] text-[11px] py-2 px-4 text-center font-medium tracking-wide">
        <span className="text-amber-300 font-bold">0% COMMISSION FOREVER</span> • Built
        exclusively for Indian Custom Home Bakers & Patisserie Studios
      </div>

      {/* Sticky Editorial Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-xl border-b border-[#E8DFD3]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#231710] text-[#FAF7F2] flex items-center justify-center font-black text-base shadow-sm">
              B
            </div>
            <div>
              <span
                className={`${playfair.className} font-black text-xl text-[#231710] tracking-tight`}
              >
                BakerBridge
              </span>
              <span className="hidden md:inline-block ml-2.5 text-[10px] font-bold uppercase tracking-widest bg-[#EFE8DEC0] border border-[#DFD3C3] text-[#6E5A4B] px-2.5 py-0.5 rounded-full">
                Patisserie OS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-[#6E5A4B]">
            <a href="#how-it-works" className="hover:text-[#231710] transition-colors">
              Why Bakers Switch
            </a>
            <a href="#features" className="hover:text-[#231710] transition-colors">
              Studio Features
            </a>
            <Link
              href="/crumb-and-crust"
              className="hover:text-rose-800 transition-colors flex items-center gap-1"
            >
              <span>Live Demo Store</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <a href="#partner-studios" className="hover:text-[#231710] transition-colors">
              Partner Bakeries
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin"
              className="text-xs font-bold text-[#231710] hover:bg-[#EFE8DE] border border-[#D8CBB8] px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-[#8C7360]" />
              <span>Login</span>
            </Link>
            <button
              onClick={scrollToSignup}
              className="bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <span>Sign Up Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: CLASSICAL EDITORIAL HERO SHOWCASE */}
      <section className="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-24 border-b border-[#E8DFD3]">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: High-Impact Patisserie Pitch */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white border border-[#E2D6C5] text-[#5C4738] text-xs font-bold px-3.5 py-1.5 rounded-full shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-rose-700" />
              <span>The Instagram Bio Storefront for Custom Cake Artists</span>
            </div>

            <h1
              className={`${playfair.className} text-4xl sm:text-5xl lg:text-[56px] font-black text-[#231710] leading-[1.06] tracking-tight`}
            >
              Where Artisan Cakes Meet{' '}
              <span className="text-rose-800 italic font-normal">Effortless</span>{' '}
              WhatsApp Ordering.
            </h1>

            <p className="text-sm sm:text-base text-[#635042] leading-relaxed">
              Replace messy Instagram DM negotiations with a luxury digital cake menu.
              Your customers visually compare serving sizes, choose sponge flavours,
              upload Pinterest reference photos, and send you a ready-to-bake WhatsApp
              order with a <strong className="text-[#231710]">50% advance deposit</strong>{' '}
              breakdown.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={scrollToSignup}
                className="bg-[#231710] hover:bg-rose-950 text-[#FAF7F2] font-bold text-xs sm:text-sm px-6 py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
              >
                <Store className="w-4 h-4 text-amber-300" />
                <span>Create Your Bakery Storefront</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/crumb-and-crust"
                className="bg-white hover:bg-[#F3ECE2] text-[#231710] border border-[#D8CBB8] font-bold text-xs sm:text-sm px-5 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <Cake className="w-4 h-4 text-rose-800" />
                <span>Try Live Demo (/crumb-and-crust)</span>
              </Link>
            </div>

            {/* Trust Metrics */}
            <div className="pt-4 border-t border-[#E8DFD3] grid grid-cols-3 gap-4">
              <div>
                <p className={`${playfair.className} text-2xl font-black text-[#231710]`}>
                  0%
                </p>
                <p className="text-[11px] font-semibold text-[#7A6657]">
                  Aggregator Commission
                </p>
              </div>
              <div>
                <p className={`${playfair.className} text-2xl font-black text-[#231710]`}>
                  50%
                </p>
                <p className="text-[11px] font-semibold text-[#7A6657]">
                  Advance Slot Lock
                </p>
              </div>
              <div>
                <p className={`${playfair.className} text-2xl font-black text-[#231710]`}>
                  30 Sec
                </p>
                <p className="text-[11px] font-semibold text-[#7A6657]">
                  Instant Bio Setup
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Classical Bakery Photo Composition + Floating Interactive Badges */}
          <div className="lg:col-span-6 relative">
            {/* Decorative Warm Halo */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-rose-200/40 via-amber-100/40 to-transparent rounded-[36px] blur-2xl -z-10" />

            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Classical Cake Showcase Frame */}
              <div className="relative rounded-[28px] overflow-hidden border-4 border-white shadow-2xl bg-[#E8DFD3] aspect-[4/5]">
                <img
                  src="https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=1200&q=85"
                  alt="Classical Artisan Tiered Wedding & Celebration Cake"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A110B]/85 via-[#1A110B]/20 to-transparent" />

                {/* Top Overlay Pill */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="bg-white/95 backdrop-blur-md text-[#231710] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                    ✨ Live Customer Preview
                  </span>
                  <span className="bg-emerald-950/90 backdrop-blur-md text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-3 py-1 rounded-full">
                    100% Eggless Studio
                  </span>
                </div>

                {/* Bottom Overlay Mock Customizer inside the Classical Photo */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-[#E8DFD3]">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                        Vintage Floral Tier Cake
                      </p>
                      <h3
                        className={`${playfair.className} font-bold text-base text-[#231710]`}
                      >
                        Belgian Truffle & Berry Compote
                      </h3>
                    </div>
                    <span className="text-base font-black text-[#231710]">₹2,400</span>
                  </div>

                  {/* Simulated Weight Pills */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                    {['0.5 kg', '1.0 kg', '1.5 kg', '2.0 kg'].map((w, idx) => (
                      <div
                        key={w}
                        className={`text-center py-1.5 rounded-lg text-[10px] font-bold border ${
                          idx === 2
                            ? 'bg-[#231710] text-white border-[#231710]'
                            : 'bg-[#FAF7F2] text-[#6E5A4B] border-[#E8DFD3]'
                        }`}
                      >
                        {w}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between bg-rose-50/80 border border-rose-200/70 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-rose-800" />
                      <span className="text-[11px] font-bold text-[#231710]">
                        1.5 kg • Serves 12–15 Guests
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      50% Adv: ₹1,200
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Card 1: Top-Left Pinterest Reference Pill */}
              <div className="hidden sm:flex absolute -left-8 top-16 bg-white rounded-2xl p-3.5 shadow-xl border border-[#E8DFD3] items-center gap-3 max-w-[235px]">
                <img
                  src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80"
                  alt="Customer Reference"
                  className="w-11 h-11 rounded-xl object-cover shrink-0"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                    Pinterest Upload
                  </p>
                  <p className="text-xs font-bold text-[#231710] leading-tight">
                    Client attached reference photo
                  </p>
                </div>
              </div>

              {/* Floating Card 2: Right-Side WhatsApp Ticket Pill */}
              <div className="hidden sm:flex absolute -right-6 top-1/3 bg-[#231710] text-white rounded-2xl p-3.5 shadow-xl border border-white/10 items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#25D366] text-black flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                    WhatsApp Order Ready
                  </p>
                  <p className="text-xs font-bold text-white">
                    Weight + Message + Date Locked
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE CHAOS VS. CLARITY COMPARISON */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-white border-b border-[#E8DFD3]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-rose-800">
              Why Home Bakers Switch
            </span>
            <h2
              className={`${playfair.className} text-3xl sm:text-4xl font-black text-[#231710] mt-2`}
            >
              Stop Answering &ldquo;PP / Price Please?&rdquo; All Day
            </h2>
            <p className="text-xs sm:text-sm text-[#6E5A4B] mt-2">
              Food delivery apps take 30% commission and ruin tall cakes on bikes.
              Instagram DMs waste hours on window shoppers. BakerBridge gives you the best
              of both worlds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Way Card */}
            <div className="bg-[#FAF5F5] border border-rose-200/80 rounded-3xl p-6 sm:p-8">
              <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-900 text-[11px] font-bold px-3 py-1 rounded-full mb-4">
                <XCircle className="w-3.5 h-3.5" />
                <span>The Old Instagram DM Nightmare</span>
              </div>
              <h3 className={`${playfair.className} text-xl font-bold text-[#231710] mb-4`}>
                45 Messages Just to Quote One Cake
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-[#5C4738]">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-700 font-bold">✕</span>
                  <span>
                    Customers ask <strong>&ldquo;How much for this cake?&rdquo;</strong>{' '}
                    without telling you the weight, flavour, or date needed.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-700 font-bold">✕</span>
                  <span>
                    Everyone demands a 2-tier fondant design in a tiny{' '}
                    <strong>0.5 kg size</strong> because they don&apos;t understand cake
                    proportions.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-700 font-bold">✕</span>
                  <span>
                    Scrolling through 200 WhatsApp messages on Friday night trying to find
                    what spelling goes on the cake board.
                  </span>
                </li>
              </ul>
            </div>

            {/* BakerBridge Way Card */}
            <div className="bg-[#F4FAF6] border border-emerald-200/90 rounded-3xl p-6 sm:p-8">
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-[11px] font-bold px-3 py-1 rounded-full mb-4">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>The BakerBridge Showroom Flow</span>
              </div>
              <h3 className={`${playfair.className} text-xl font-bold text-[#231710] mb-4`}>
                Complete Order Specs Sent in 1 Tap
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-[#231710]">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Live Price & Flavour Calculator:</strong> Buyers see exact
                    rates for Truffle, Biscoff, or Fresh Fruit as they tap each weight.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Minimum Weight Protection:</strong> If a 3D theme cake needs a
                    1.5 kg minimum, the 0.5 kg button is automatically locked.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>50% Advance Upfront:</strong> Every WhatsApp ticket clearly
                    states the 50% deposit required to book your oven slot.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: BENTO GRID OF PATISSERIE FEATURES */}
      <section id="features" className="py-16 lg:py-24 bg-[#FAF7F2]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-800">
                Crafted for Custom Bakeries
              </span>
              <h2
                className={`${playfair.className} text-3xl sm:text-4xl font-black text-[#231710] mt-1`}
              >
                Everything Your Cake Studio Needs
              </h2>
            </div>
            <Link
              href="/crumb-and-crust"
              className="text-xs font-bold text-rose-900 hover:underline flex items-center gap-1.5"
            >
              <span>Interact with all features on our Demo Store</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-[#E8DFD3] rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center mb-5">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                  Automatic Upselling
                </span>
                <h3
                  className={`${playfair.className} text-xl font-bold text-[#231710] mt-1 mb-2`}
                >
                  Visual Guest Serving Guide
                </h3>
                <p className="text-xs text-[#6E5A4B] leading-relaxed">
                  Customers never know how much cake to order for 15 people. Our weight
                  buttons dynamically display guest counts and cake dimensions, naturally
                  upselling buyers from 0.5 kg to 1.5 kg.
                </p>
              </div>
              <div className="mt-6 bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-3 text-[11px] flex items-center justify-between">
                <span className="font-bold text-[#231710]">1.5 kg Selected</span>
                <span className="text-rose-800 font-bold">
                  Serves 12–15 • 7&quot; Tall
                </span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-[#E8DFD3] rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mb-5">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Custom Theme Orders
                </span>
                <h3
                  className={`${playfair.className} text-xl font-bold text-[#231710] mt-1 mb-2`}
                >
                  Pinterest & IG Photo Uploader
                </h3>
                <p className="text-xs text-[#6E5A4B] leading-relaxed">
                  When a client has a screenshot from Pinterest, they upload it right on
                  your website, pick their guest count & flavour, and send you a hosted
                  image link with an instant base estimate.
                </p>
              </div>
              <div className="mt-6 bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-3 text-[11px] flex items-center justify-between">
                <span className="font-bold text-[#231710]">Auto-Compressed WebP</span>
                <span className="text-emerald-800 font-bold">✓ Attached to WhatsApp</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-[#E8DFD3] rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mb-5">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Repeat Party Orders
                </span>
                <h3
                  className={`${playfair.className} text-xl font-bold text-[#231710] mt-1 mb-2`}
                >
                  Cake Box QR Code Generator
                </h3>
                <p className="text-xs text-[#6E5A4B] leading-relaxed">
                  Every showroom includes a 1-click printable QR sticker for your cake
                  boxes. When 15 guests eat your cake at a birthday party, they scan the
                  box and land straight on your menu.
                </p>
              </div>
              <div className="mt-6 bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-3 text-[11px] flex items-center justify-between">
                <span className="font-bold text-[#231710]">5-Sec Video Reels</span>
                <span className="text-rose-800 font-bold">Auto-Loops in Catalog</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CENTERED SELF-SERVE BAKER SIGNUP PORTAL (MIDDLE OF PAGE) */}
      <section
        id="baker-signup-section"
        className="py-20 lg:py-28 bg-gradient-to-b from-[#231710] to-[#140D09] text-white relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto px-5 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-300/30 text-amber-300 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Free Baker Onboarding
            </span>
            <h2
              className={`${playfair.className} text-3xl sm:text-5xl font-black text-white mt-3`}
            >
              Sign Up & Launch Your Bakery Link in 30 Seconds
            </h2>
            <p className="text-xs sm:text-sm text-[#D4C3B3] mt-2.5">
              No coding, no credit card, and zero commissions. Create your custom link
              below and start uploading your signature cakes from your phone.
            </p>
          </div>

          {/* Centered Signup Box */}
          <div className="max-w-2xl mx-auto bg-[#1C1410] border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl">
            {createdBaker ? (
              <div className="space-y-6 py-2 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      Showroom Live & Unlocked
                    </span>
                    <h3 className={`${playfair.className} text-2xl font-bold text-white`}>
                      Welcome to BakerBridge, {createdBaker.name}!
                    </h3>
                    <p className="text-xs text-[#D4C3B3] mt-0.5">
                      Screenshot your Studio Login ID and 4-Digit PIN below:
                    </p>
                  </div>
                </div>

                <div className="bg-[#110B08] border border-white/15 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">
                      Your Public Link
                    </span>
                    <span className="text-rose-400 font-bold text-sm">
                      /{createdBaker.slug}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">
                      Studio Login ID
                    </span>
                    <span className="text-white font-bold text-sm">
                      {createdBaker.slug}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">
                      4-Digit Admin PIN
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {createdBaker.pin}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => router.push('/admin')}
                    className="w-full bg-white hover:bg-neutral-200 text-black font-black text-xs py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Store className="w-4 h-4" />
                    <span>Open My Studio Manager</span>
                  </button>

                  <Link
                    href={`/${createdBaker.slug}`}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>View My Live Showroom</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSelfServeSignup} className="space-y-5">
                {errorMsg && (
                  <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 px-4 py-3 rounded-xl text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#E8DFD3] font-bold block mb-1.5">
                      1. Bakery / Studio Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={bizName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Le Sucre Patisserie"
                      className="w-full bg-[#110B08] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#E8DFD3] font-bold block mb-1.5">
                      2. Custom Instagram Bio Link *
                    </label>
                    <div className="flex items-center bg-[#110B08] border border-white/15 focus-within:border-amber-400 rounded-xl px-3.5 py-3">
                      <span className="text-xs text-neutral-500 font-mono select-none">
                        bakerbridge.in/
                      </span>
                      <input
                        required
                        type="text"
                        value={slug}
                        onChange={(e) =>
                          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                        }
                        placeholder="le-sucre"
                        className="bg-transparent text-xs text-amber-300 font-mono font-bold outline-none w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#E8DFD3] font-bold block mb-1.5">
                      3. WhatsApp Order Number (with 91) *
                    </label>
                    <input
                      required
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="919876543210"
                      className="w-full bg-[#110B08] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#E8DFD3] font-bold flex items-center gap-1.5 mb-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>4. Create 4-Digit Admin PIN *</span>
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="e.g. 4321 (For dashboard login)"
                      className="w-full bg-[#110B08] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-xs text-emerald-400 font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#E8DFD3] font-bold block mb-1.5">
                    5. Studio Location & Speciality Tagline *
                  </label>
                  <input
                    required
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="100% Eggless Custom Cakes • Janakpuri, New Delhi"
                    className="w-full bg-[#110B08] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-xs text-white outline-none"
                  />
                </div>

                <div className="bg-[#110B08] border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={seedSampleCakes}
                      onChange={(e) => setSeedSampleCakes(e.target.checked)}
                      className="rounded accent-rose-500 w-4 h-4"
                    />
                    <span className="text-xs text-[#D4C3B3]">
                      Pre-load 2 sample designer cakes so I can test my calculator
                      immediately
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 disabled:opacity-50 text-black font-black text-xs sm:text-sm py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Setting Up Your Bakery Showroom...</span>
                    </>
                  ) : (
                    <>
                      <span>Create My Free Bakery Storefront Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <Link
                    href="/admin"
                    className="text-xs text-[#D4C3B3] hover:text-white underline"
                  >
                    Already registered your bakery? Log in to your Studio Manager &rarr;
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5: LIVE PARTNER BAKERIES DIRECTORY */}
      <section id="partner-studios" className="py-16 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-800">
                Live Partner Network
              </span>
              <h2
                className={`${playfair.className} text-2xl sm:text-3xl font-black text-[#231710] mt-1`}
              >
                Explore Active BakerBridge Studios
              </h2>
            </div>
            <button
              onClick={scrollToSignup}
              className="text-xs font-bold text-rose-800 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-end"
            >
              <span>+ Add Your Bakery to the Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingBakers ? (
            <div className="text-xs text-[#8C7A6B] py-8">Loading partner bakeries...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bakers.map((b) => (
                <Link
                  key={b.id}
                  href={`/${b.slug}`}
                  className="group bg-[#FAF7F2] hover:bg-[#231710] hover:text-white border border-[#E8DFD3] rounded-2xl p-5 transition-all flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`${playfair.className} font-bold text-lg`}>
                        {b.business_name}
                      </h3>
                    </div>
                    <p className="text-xs text-[#7A6657] group-hover:text-[#D4C3B3] mt-1 flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3 h-3 shrink-0 text-rose-800 group-hover:text-amber-300" />
                      <span>{b.bio}</span>
                    </p>
                    <span className="inline-block mt-2.5 text-[11px] font-mono font-bold text-rose-800 group-hover:text-amber-300 bg-white group-hover:bg-white/10 px-2.5 py-0.5 rounded-md border border-[#E8DFD3] group-hover:border-white/10">
                      /{b.slug}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white group-hover:bg-white/10 border border-[#E8DFD3] group-hover:border-white/10 flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4 text-[#231710] group-hover:text-white" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAF7F2] border-t border-[#E8DFD3] py-8 text-center text-xs text-[#7A6657]">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-bold text-[#231710]">
            BakerBridge OS — Zero-Commission Storefronts for Custom Cake Studios
          </p>
          <div className="flex items-center gap-4 font-semibold">
            <Link href="/crumb-and-crust" className="hover:text-[#231710]">
              Demo Showroom
            </Link>
            <button onClick={scrollToSignup} className="hover:text-[#231710] cursor-pointer">
              Baker Sign Up
            </button>
            <Link href="/admin" className="hover:text-[#231710]">
              Studio Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}