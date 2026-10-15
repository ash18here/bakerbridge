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
  Users,
  Upload,
  Loader2,
  ShieldCheck,
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

// Bakesy-style Visual Serving Guide per Weight
const SERVING_GUIDE: Record<
  number,
  { guests: string; dimensions: string; badge: string }
> = {
  0.5: {
    guests: 'Serves 4–5 Guests',
    dimensions: '5" Round • Single Layer',
    badge: 'Small Intimate Cut',
  },
  1.0: {
    guests: 'Serves 8–10 Guests',
    dimensions: '6" Tall • 4 Layers',
    badge: 'Most Popular Party Size',
  },
  1.5: {
    guests: 'Serves 12–15 Guests',
    dimensions: '7" Tall or Mini 2-Tier',
    badge: 'Best for 3D Theme Cakes',
  },
  2.0: {
    guests: 'Serves 18–22 Guests',
    dimensions: 'Statement 2-Tier Structure',
    badge: 'Grand Celebration',
  },
  3.0: {
    guests: 'Serves 30–35 Guests',
    dimensions: 'Luxury 2/3-Tier Centerpiece',
    badge: 'Milestone Event Size',
  },
};

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

// Auto-compress customer reference photo to ~140KB WebP so Supabase storage stays tiny
async function compressCustomerImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 900;
      const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(
              new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
              })
            );
          } else {
            resolve(file);
          }
        },
        'image/webp',
        0.8
      );
    };
  });
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

  // Shared Customizer State
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);
  const [chosenWeight, setChosenWeight] = useState<number>(1.0);
  const [chosenFlavour, setChosenFlavour] = useState(FLAVOURS[0]);
  const [cakeMessage, setCakeMessage] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [showStudioQR, setShowStudioQR] = useState<boolean>(false);

  // Custom Reference Photo Modal State (Pinterest / IG Upload)
  const [showCustomPhotoModal, setShowCustomPhotoModal] = useState<boolean>(false);
  const [isUploadingRef, setIsUploadingRef] = useState<boolean>(false);
  const [uploadedRefUrl, setUploadedRefUrl] = useState<string>('');
  const [customThemeNote, setCustomThemeNote] = useState<string>('');

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

  const openCustomizer = (cake: Cake) => {
    const minKg = parseMinWeightKg(cake.min_weight);
    setSelectedCake(cake);
    setChosenWeight(minKg < 0.5 ? 0.5 : minKg);
    setChosenFlavour(FLAVOURS[0]);
    setCakeMessage('');
  };

  const openCustomPhotoBuilder = () => {
    setChosenWeight(1.0);
    setChosenFlavour(FLAVOURS[0]);
    setCakeMessage('');
    setCustomThemeNote('');
    setUploadedRefUrl('');
    setShowCustomPhotoModal(true);
  };

  // Upload customer's reference image immediately on selection
  async function handleReferencePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !baker) return;

    setIsUploadingRef(true);
    try {
      const compressed = await compressCustomerImage(file);
      const fileName = `custom-requests/${baker.slug}-${Date.now()}.webp`;

      const { error } = await supabase.storage
        .from('showcase-media')
        .upload(fileName, compressed, { cacheControl: '31536000', upsert: false });

      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from('showcase-media').getPublicUrl(fileName);
      setUploadedRefUrl(data.publicUrl);
    } catch (err: any) {
      alert('Could not upload photo: ' + err.message);
    } finally {
      setIsUploadingRef(false);
    }
  }

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

  // 1. Price & 50% Deposit Math for Catalog Cake
  const baseMinKg = selectedCake ? parseMinWeightKg(selectedCake.min_weight) : 1;
  const pricePerKg = selectedCake ? selectedCake.starting_price / (baseMinKg || 1) : 1100;
  const estimatedTotal = Math.round((pricePerKg + chosenFlavour.extraPerKg) * chosenWeight);
  const advanceDeposit = Math.ceil(estimatedTotal * 0.5);

  // 2. Price & 50% Deposit Math for Custom Photo Request (Base ₹1,100/kg)
  const customPhotoEstimatedTotal = Math.round((1100 + chosenFlavour.extraPerKg) * chosenWeight);
  const customPhotoAdvance = Math.ceil(customPhotoEstimatedTotal * 0.5);

  const currentServingInfo = SERVING_GUIDE[chosenWeight] || SERVING_GUIDE[1.0];

  // Build WhatsApp Ticket for Catalog Cake
  const buildCatalogWhatsAppUrl = () => {
    if (!selectedCake) return '#';
    const lines = [
      `Hi *${baker.business_name}*! I'd like to book this cake from your showroom:`,
      ``,
      `🎂 *Design:* ${selectedCake.title}`,
      `⚖️ *Size:* ${chosenWeight} kg (${currentServingInfo.guests})`,
      `🍫 *Inside Flavour:* ${chosenFlavour.name}`,
      `🌱 *Dietary:* 100% Eggless`,
      `✍️ *Message on Cake:* ${cakeMessage ? `"${cakeMessage}"` : 'None'}`,
      `📅 *Date Needed:* ${deliveryDate || 'To be confirmed'}`,
      `🚚 *Handover:* ${
        deliveryType === 'pickup'
          ? 'Self-Pickup from Studio'
          : 'Home Delivery (Cab/Porter at actuals)'
      }`,
      ``,
      `💰 *Estimated Total:* ₹${estimatedTotal}`,
      `🔒 *50% Advance to Lock Slot:* ₹${advanceDeposit}`,
      `💵 *Balance on Pickup/Delivery:* ₹${estimatedTotal - advanceDeposit}`,
      ``,
      `Design Photo: ${selectedCake.image_url}`,
      `Please share your UPI ID / QR to pay the ₹${advanceDeposit} advance!`,
    ];
    const cleanPhone = baker.whatsapp_number.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  // Build WhatsApp Ticket for Custom Reference Photo Request
  const buildCustomPhotoWhatsAppUrl = () => {
    const lines = [
      `Hi *${baker.business_name}*! I uploaded a custom cake reference photo for a quote:`,
      ``,
      `📸 *My Reference Photo:* ${uploadedRefUrl || 'Sharing in chat below'}`,
      `🎨 *Theme / Changes Needed:* ${customThemeNote || 'Same as reference photo'}`,
      `⚖️ *Target Size:* ${chosenWeight} kg (${currentServingInfo.guests})`,
      `🍫 *Inside Flavour:* ${chosenFlavour.name}`,
      `✍️ *Message on Cake:* ${cakeMessage ? `"${cakeMessage}"` : 'None'}`,
      `📅 *Date Needed:* ${deliveryDate || 'To be confirmed'}`,
      `🚚 *Handover:* ${
        deliveryType === 'pickup' ? 'Self-Pickup from Studio' : 'Home Delivery'
      }`,
      ``,
      `💰 *Base Estimate:* ~₹${customPhotoEstimatedTotal} (50% Advance: ₹${customPhotoAdvance})`,
      `Please confirm final price & slot availability!`,
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
              <span>50% Advance Locks Your Slot</span>
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
              const minKg = parseMinWeightKg(cake.min_weight);
              const guestLabel =
                SERVING_GUIDE[minKg]?.guests || 'Serves 8–10 Guests';

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
                      <p className="text-[11px] text-[#8C7A6B] font-medium mb-3 flex items-center gap-1">
                        <Users className="w-3 h-3 text-rose-700" />
                        <span>{guestLabel}</span>
                      </p>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-3 pt-2 border-t border-[#F3EFEA]">
                        <div>
                          <span className="text-[10px] text-[#8C7A6B] block uppercase">
                            Starts From
                          </span>
                          <span className="text-base font-black text-[#2C1E16]">
                            ₹{cake.starting_price}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md">
                          Min {cake.min_weight}
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
                        <span>Customize Weight & Flavour</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Bar -> Opens In-App Reference Photo Uploader */}
      <div className="fixed bottom-5 inset-x-0 z-30 px-4 pointer-events-none">
        <div className="max-w-md mx-auto bg-[#2C1E16] text-white shadow-2xl rounded-2xl p-3 flex items-center justify-between pointer-events-auto border border-white/10">
          <div className="pl-2">
            <p className="text-xs font-bold text-white">Have a design from Pinterest / IG?</p>
            <p className="text-[11px] text-[#D4C3B3]">
              Upload photo + get an instant price estimate
            </p>
          </div>
          <button
            type="button"
            onClick={openCustomPhotoBuilder}
            className="bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-black font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: CATALOG CAKE CUSTOMIZER (With Guest Visualizer + 50% UPI Deposit) */}
      {selectedCake && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#EAE3D9]">
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
                    ✓ 100% Eggless • Freshly Baked to Order
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
              {/* Step 1: Select Weight + LIVE SERVING VISUALIZER */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-2">
                  1. Select Cake Size & Guest Count
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

                {/* Serving Visualizer Card */}
                <div className="mt-2.5 bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-800 text-white flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#2C1E16]">
                        {currentServingInfo.guests}
                      </p>
                      <p className="text-[11px] text-[#8C7A6B]">
                        {currentServingInfo.dimensions}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-rose-800 px-2.5 py-1 rounded-md border border-rose-100">
                    {currentServingInfo.badge}
                  </span>
                </div>
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
                    <p className="text-[10px] opacity-80 mt-0.5">Free • Recommended for tiers</p>
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
                    <p className="text-[10px] opacity-80 mt-0.5">Uber/Porter cab at actuals</p>
                  </button>
                </div>
              </div>

              {/* Step 5: 50% Advance UPI Deposit Breakdown */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-[#EAE3D9] pb-2.5">
                  <span className="text-[#8C7A6B] font-medium">
                    Total Cake Price ({chosenWeight} kg)
                  </span>
                  <span className="font-bold text-[#2C1E16]">₹{estimatedTotal}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 50% Advance to Confirm Slot
                    </span>
                    <span className="text-2xl font-black text-[#2C1E16]">
                      ₹{advanceDeposit}
                    </span>
                    <span className="text-[11px] text-[#8C7A6B] block">
                      Balance ₹{estimatedTotal - advanceDeposit} due at handover
                    </span>
                  </div>

                  <a
                    href={buildCatalogWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs px-5 py-3.5 rounded-xl flex items-center gap-2 shadow-md transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Lock Slot on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD PINTEREST / IG PHOTO QUOTE BUILDER */}
      {showCustomPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#EAE3D9]">
            <div className="sticky top-0 bg-[#2C1E16] text-white px-5 py-4 flex items-center justify-between z-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  Custom Design Quote
                </span>
                <h3 className={`${playfair.className} font-bold text-lg text-white`}>
                  Upload Reference Cake Photo
                </h3>
              </div>
              <button
                onClick={() => setShowCustomPhotoModal(false)}
                className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Photo Upload Box */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-2">
                  1. Attach Screenshot from Pinterest / Instagram
                </label>

                {uploadedRefUrl ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-[#FAF8F5] p-2 flex items-center gap-3">
                    <img
                      src={uploadedRefUrl}
                      alt="Uploaded reference"
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Reference Photo Attached!
                      </p>
                      <p className="text-[11px] text-[#8C7A6B]">
                        Link will be sent directly to the baker
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedRefUrl('')}
                      className="text-xs font-bold text-rose-700 underline pr-2 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#D4C3B3] hover:border-[#2C1E16] rounded-2xl p-5 cursor-pointer bg-[#FAF8F5] transition-all">
                    {isUploadingRef ? (
                      <>
                        <Loader2 className="w-6 h-6 text-rose-700 animate-spin mb-1.5" />
                        <span className="text-xs font-bold text-[#2C1E16]">
                          Compressing & Attaching Photo...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-rose-700 mb-1.5" />
                        <span className="text-xs font-bold text-[#2C1E16]">
                          Tap to Select Cake Photo from Phone
                        </span>
                        <span className="text-[11px] text-[#8C7A6B] mt-0.5">
                          Auto-attaches to your WhatsApp inquiry
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReferencePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Weight + Guest Visualizer */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-2">
                  2. How Many Guests Are You Feeding?
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {WEIGHT_OPTIONS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setChosenWeight(w)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        chosenWeight === w
                          ? 'bg-[#2C1E16] text-white border-[#2C1E16]'
                          : 'bg-[#FAF8F5] text-[#2C1E16] border-[#EAE3D9]'
                      }`}
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
                <div className="mt-2 bg-rose-50/70 border border-rose-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2C1E16]">
                    {currentServingInfo.guests}
                  </span>
                  <span className="text-[11px] text-rose-800 font-semibold">
                    {currentServingInfo.dimensions}
                  </span>
                </div>
              </div>

              {/* Flavour Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-1.5">
                  3. Preferred Inside Flavour
                </label>
                <select
                  value={chosenFlavour.id}
                  onChange={(e) => {
                    const found = FLAVOURS.find((f) => f.id === e.target.value);
                    if (found) setChosenFlavour(found);
                  }}
                  className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2C1E16] outline-none"
                >
                  {FLAVOURS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.extraPerKg === 0 ? 'Base Rate' : `+₹${f.extraPerKg}/kg`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Changes & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-1">
                    4. Colour / Theme Changes
                  </label>
                  <input
                    type="text"
                    value={customThemeNote}
                    onChange={(e) => setCustomThemeNote(e.target.value)}
                    placeholder="e.g. Make it pastel pink with gold butterfly"
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3 py-2 text-xs text-[#2C1E16]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] block mb-1">
                    5. Date Needed
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3 py-2 text-xs text-[#2C1E16]"
                  />
                </div>
              </div>

              {/* Estimated Budget + Send Button */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] block">
                    Estimated Starting Quote
                  </span>
                  <span className="text-xl font-black text-[#2C1E16]">
                    ~₹{customPhotoEstimatedTotal}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    50% Advance: ₹{customPhotoAdvance}
                  </span>
                </div>

                <a
                  href={buildCustomPhotoWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs px-5 py-3.5 rounded-xl flex items-center gap-2 shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Photo & Specs</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: STUDIO BOX QR STICKER */}
      {showStudioQR && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center border border-[#EAE3D9] shadow-2xl">
            <div className="flex justify-end">
              <button
                onClick={() => setShowStudioQR(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
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