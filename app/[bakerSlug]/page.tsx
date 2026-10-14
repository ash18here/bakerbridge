'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  MessageCircle,
  Sparkles,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Truck,
  Store,
  QrCode,
} from 'lucide-react';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });

interface Baker {
  id: string;
  business_name: string;
  whatsapp_number: string;
  bio: string;
  slug: string;
}

interface Cake {
  id: string;
  title: string;
  image_url: string;
  video_url: string | null;
  starting_price: number;
  min_weight: string;
  occasion: any;
  is_eggless: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All Designs' },
  { id: 'kids', label: 'Kids Birthday' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'minimalist', label: 'Bento & Express ⚡' },
];

const FLAVOURS = [
  { id: 'classic', name: 'Classic Vanilla / Fresh Pineapple', extraPerKg: 0 },
  { id: 'truffle', name: 'Belgian Dark Chocolate Truffle', extraPerKg: 200 },
  { id: 'redvelvet', name: 'Red Velvet & Cream Cheese', extraPerKg: 250 },
  { id: 'biscoff', name: 'Lotus Biscoff / Nutella Hazelnut', extraPerKg: 350 },
];

const WEIGHT_OPTIONS = [0.5, 1.0, 1.5, 2.0, 3.0];

// Helper to parse numeric kg from strings like "1.5 kg" or "350 gm"
function parseMinWeightKg(weightStr: string): number {
  if (!weightStr) return 1.0;
  const lower = weightStr.toLowerCase();
  const num = parseFloat(lower.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 1.0;
  if (lower.includes('gm') || lower.includes('g')) {
    return num < 10 ? num : num / 1000;
  }
  return num;
}

function LoopVideo({ src, poster }: { src: string; poster: string }) {
  return (
    <div className="relative w-full h-full">
      <video
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-sm flex items-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Real Video
      </div>
    </div>
  );
}

export default function DynamicBakerShowroom() {
  const params = useParams();
  const slug = params.bakerSlug as string;

  const [baker, setBaker] = useState<Baker | null>(null);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Customizer Modal State
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);
  const [chosenWeight, setChosenWeight] = useState<number>(1.0);
  const [chosenFlavour, setChosenFlavour] = useState(FLAVOURS[0]);
  const [cakeMessage, setCakeMessage] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [showStudioQR, setShowStudioQR] = useState<boolean>(false);

  useEffect(() => {
    async function loadBakerData() {
      if (!slug) return;
      try {
        const { data: bakerData } = await supabase
          .from('bakers')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!bakerData) {
          setLoading(false);
          return;
        }
        setBaker(bakerData);

        const { data: cakesData } = await supabase
          .from('cakes')
          .select('*')
          .eq('baker_id', bakerData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (cakesData) setCakes(cakesData);
      } catch (err) {
        console.error('Data loading error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBakerData();
  }, [slug]);

  // Open customizer and set default minimum weight for that specific cake
  const openCustomizer = (cake: Cake) => {
    const minKg = parseMinWeightKg(cake.min_weight);
    setSelectedCake(cake);
    setChosenWeight(minKg < 0.5 ? 0.5 : minKg);
    setChosenFlavour(FLAVOURS[0]);
    setCakeMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-[#8C7A6B] text-sm font-medium">
        Loading Bakery Menu...
      </div>
    );
  }

  if (!baker) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center text-[#2C1E16] gap-3">
        <p className="text-xl font-bold">Bakery not found.</p>
        <Link href="/" className="text-xs font-bold underline text-rose-700">
          &larr; Return to BakerBridge Home
        </Link>
      </div>
    );
  }

  const filteredCakes = cakes.filter((cake) => {
    const matchesSearch = cake.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    if (!cake.occasion) return false;
    try {
      if (Array.isArray(cake.occasion)) return cake.occasion.includes(selectedCategory);
      if (typeof cake.occasion === 'string')
        return cake.occasion.toLowerCase().includes(selectedCategory.toLowerCase());
    } catch {
      return false;
    }
    return false;
  });

  // Live Price Calculation inside Modal
  const baseMinKg = selectedCake ? parseMinWeightKg(selectedCake.min_weight) : 1;
  const pricePerKg = selectedCake ? selectedCake.starting_price / (baseMinKg || 1) : 0;
  const estimatedTotal = Math.round(
    (pricePerKg + chosenFlavour.extraPerKg) * chosenWeight
  );

  // Build Structured WhatsApp Order Ticket
  const buildCustomWhatsAppUrl = () => {
    if (!selectedCake) return '#';
    const lines = [
      `Hi *${baker.business_name}*! I'd like to book a cake from your catalog:`,
      ``,
      `🎂 *Design:* ${selectedCake.title}`,
      `⚖️ *Weight:* ${chosenWeight} kg`,
      `🍫 *Flavour:* ${chosenFlavour.name}`,
      `🌱 *Dietary:* 100% Eggless`,
      `✍️ *Message on Cake:* ${cakeMessage ? `"${cakeMessage}"` : 'None'}`,
      `📅 *Date Needed:* ${deliveryDate || 'To be confirmed'}`,
      `🚚 *Handover:* ${
        deliveryType === 'pickup'
          ? 'Self-Pickup from Studio'
          : 'Home Delivery (Cab/Porter at actuals)'
      }`,
      `💰 *Estimated Price:* ₹${estimatedTotal}`,
      ``,
      `Reference Photo: ${selectedCake.image_url}`,
      `Please confirm slot availability!`,
    ];
    const cleanPhone = baker.whatsapp_number.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C1E16] pb-28 antialiased">
      {/* Top Bar */}
      <div className="bg-[#2C1E16] text-[#FAF8F5] text-[11px] py-2 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-[#D4C3B3] hover:text-white font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BakerBridge OS</span>
          </Link>
          <button
            onClick={() => setShowStudioQR(true)}
            className="flex items-center gap-1.5 text-amber-300 hover:text-white font-bold cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Get Box Sticker QR</span>
          </button>
        </div>
      </div>

      {/* Baker Header + Search */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-[#EAE3D9] sticky top-0 z-30 pt-5">
        <div className="max-w-5xl mx-auto px-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className={`${playfair.className} text-2xl sm:text-3xl font-black text-[#2C1E16] tracking-tight`}>
                {baker.business_name}
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                100% Eggless Kitchen
              </span>
            </div>
            <p className="text-xs font-medium text-[#8C7A6B] flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-rose-700" />
              <span>{baker.bio}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Fresh Baked to Order</span>
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search themes (e.g. Jungle, Unicorn)..."
              className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#2C1E16] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#2C1E16] placeholder-[#8C7A6B] outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="border-t border-[#EAE3D9] px-5 py-2.5 bg-white">
          <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#2C1E16] text-[#FAF8F5] shadow-sm'
                    : 'bg-[#FAF8F5] text-[#8C7A6B] border border-[#EAE3D9] hover:text-[#2C1E16]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Catalog Grid */}
      <main className="max-w-5xl mx-auto px-5 mt-7">
        {filteredCakes.length === 0 ? (
          <div className="text-center py-20">
            <p className={`${playfair.className} text-2xl text-[#8C7A6B] italic`}>
              No cakes match your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {filteredCakes.map((cake) => {
              const isExpress =
                cake.min_weight.toLowerCase().includes('gm') ||
                (Array.isArray(cake.occasion) && cake.occasion.includes('minimalist'));

              return (
                <div
                  key={cake.id}
                  onClick={() => openCustomizer(cake)}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#EAE3D9] flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[4/5] w-full bg-[#F3EFEA] overflow-hidden">
                    {cake.video_url ? (
                      <LoopVideo src={cake.video_url} poster={cake.image_url} />
                    ) : (
                      <img
                        src={cake.image_url}
                        alt={cake.title}
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      />
                    )}

                    {/* Preparation Speed Badge */}
                    <div
                      className={`absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-sm shadow-sm z-10 ${
                        isExpress
                          ? 'bg-amber-400 text-black'
                          : 'bg-white/95 text-[#2C1E16]'
                      }`}
                    >
                      {isExpress ? '⚡ Same-Day Ready' : '🕒 24h Pre-Order'}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow justify-between bg-white">
                    <div>
                      <h2 className={`${playfair.className} font-bold text-base sm:text-lg text-[#2C1E16] leading-tight mb-1 line-clamp-1`}>
                        {cake.title}
                      </h2>
                      <p className="text-[11px] text-[#8C7A6B] font-medium mb-3">
                        Starts at {cake.min_weight} • Custom Flavour
                      </p>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-3 pt-2 border-t border-[#F3EFEA]">
                        <div>
                          <span className="text-[10px] text-[#8C7A6B] block uppercase">From</span>
                          <span className="text-base font-black text-[#2C1E16]">
                            ₹{cake.starting_price}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md">
                          {cake.min_weight}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCustomizer(cake);
                        }}
                        className="w-full bg-[#2C1E16] hover:bg-rose-900 text-white transition-colors text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Customize & Price</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom "Custom Photo Quote" Bar */}
      <div className="fixed bottom-5 inset-x-0 z-30 px-4 pointer-events-none">
        <div className="max-w-md mx-auto bg-[#2C1E16] text-white shadow-2xl rounded-2xl p-3 flex items-center justify-between pointer-events-auto border border-white/10">
          <div className="pl-2">
            <p className="text-xs font-bold text-white">Have a photo from Pinterest / IG?</p>
            <p className="text-[11px] text-[#D4C3B3]">Send us the picture for an instant quote</p>
          </div>
          <a
            href={`https://wa.me/${baker.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Hi ${baker.business_name}! I have a reference cake photo I want to get made:\n\n• Needed on Date: \n• Approx Weight (kg): \n• Flavour: \n\n(Sharing photo below)`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Send Photo</span>
          </a>
        </div>
      </div>

      {/* LIVE CAKE CUSTOMIZER MODAL (Replaces the useless Car Passport) */}
      {selectedCake && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#EAE3D9]">
            {/* Sticky Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#EAE3D9] px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCake.image_url}
                  alt={selectedCake.title}
                  className="w-12 h-12 rounded-lg object-cover border border-[#EAE3D9]"
                />
                <div>
                  <h3 className={`${playfair.className} font-bold text-base text-[#2C1E16]`}>
                    {selectedCake.title}
                  </h3>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    ✓ 100% Eggless • Freshly Baked
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCake(null)}
                className="p-1.5 rounded-full bg-[#FAF8F5] text-[#2C1E16] hover:bg-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Step 1: Select Weight */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-2">
                  1. Select Cake Weight (Min {selectedCake.min_weight})
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {WEIGHT_OPTIONS.map((w) => {
                    const isBelowMin = w < baseMinKg;
                    const active = chosenWeight === w;
                    return (
                      <button
                        key={w}
                        disabled={isBelowMin}
                        onClick={() => setChosenWeight(w)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          isBelowMin
                            ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed'
                            : active
                            ? 'bg-[#2C1E16] text-white border-[#2C1E16] shadow-sm'
                            : 'bg-[#FAF8F5] text-[#2C1E16] border-[#EAE3D9] hover:border-[#2C1E16] cursor-pointer'
                        }`}
                      >
                        {w} kg
                      </button>
                    );
                  })}
                </div>
                {baseMinKg > 0.5 && (
                  <p className="text-[11px] text-[#8C7A6B] mt-1.5">
                    *This custom design requires a minimum structure of {selectedCake.min_weight}.
                  </p>
                )}
              </div>

              {/* Step 2: Select Inside Flavour */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-2">
                  2. Choose Inside Sponge & Filling
                </label>
                <div className="space-y-2">
                  {FLAVOURS.map((flav) => {
                    const active = chosenFlavour.id === flav.id;
                    return (
                      <button
                        key={flav.id}
                        onClick={() => setChosenFlavour(flav)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                          active
                            ? 'bg-rose-50/70 border-rose-800 text-[#2C1E16] font-bold'
                            : 'bg-[#FAF8F5] border-[#EAE3D9] text-[#2C1E16]'
                        }`}
                      >
                        <span>{flav.name}</span>
                        <span className="text-[11px] font-bold text-rose-800">
                          {flav.extraPerKg === 0 ? 'Included' : `+₹${flav.extraPerKg}/kg`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Message on Cake & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-1.5">
                    3. Message on Cake
                  </label>
                  <input
                    type="text"
                    value={cakeMessage}
                    onChange={(e) => setCakeMessage(e.target.value)}
                    placeholder="e.g. Happy Birthday Kabir!"
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3.5 py-2.5 text-xs text-[#2C1E16] outline-none focus:border-[#2C1E16]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-1.5">
                    4. Date Needed
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3.5 py-2.5 text-xs text-[#2C1E16] outline-none focus:border-[#2C1E16]"
                  />
                </div>
              </div>

              {/* Step 4: Pickup vs Delivery */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-2">
                  5. Handover Preference
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      deliveryType === 'pickup'
                        ? 'bg-[#2C1E16] text-white border-[#2C1E16]'
                        : 'bg-[#FAF8F5] text-[#2C1E16] border-[#EAE3D9]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Store className="w-3.5 h-3.5" />
                      <span>Studio Pickup</span>
                    </div>
                    <p className="text-[10px] opacity-80 mt-0.5">Free • Safe for tiered cakes</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'bg-[#2C1E16] text-white border-[#2C1E16]'
                        : 'bg-[#FAF8F5] text-[#2C1E16] border-[#EAE3D9]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Home Delivery</span>
                    </div>
                    <p className="text-[10px] opacity-80 mt-0.5">Sent via Uber/Porter at actuals</p>
                  </button>
                </div>
              </div>

              {/* Final Price Summary & WhatsApp Send */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] block">
                    Estimated Total ({chosenWeight} kg)
                  </span>
                  <span className="text-2xl font-black text-[#2C1E16]">₹{estimatedTotal}</span>
                </div>
                <a
                  href={buildCustomWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs px-5 py-3.5 rounded-xl flex items-center gap-2 shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Order on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDIO BOX QR STICKER MODAL (1 QR for the whole bakery's packaging) */}
      {showStudioQR && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center border border-[#EAE3D9] shadow-2xl">
            <div className="flex justify-end">
              <button onClick={() => setShowStudioQR(false)} className="text-neutral-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 px-2.5 py-1 rounded">
              Packaging & Counter Sticker
            </span>
            <h3 className={`${playfair.className} text-xl font-bold text-[#2C1E16] mt-2`}>
              {baker.business_name}
            </h3>
            <p className="text-xs text-[#8C7A6B] mt-1 mb-4">
              Print this single QR code on your cake boxes so party guests can scan to view your live catalog and order.
            </p>
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] inline-block mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.href : 'https://localhost:3000'
                )}`}
                alt="Studio Menu QR"
                className="w-40 h-40 mx-auto rounded-lg"
              />
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Links directly to this live menu
            </p>
          </div>
        </div>
      )}
    </div>
  );
}