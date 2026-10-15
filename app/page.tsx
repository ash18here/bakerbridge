'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Trash2,
  ExternalLink,
  Store,
  Cake as CakeIcon,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  Upload,
  Video,
  Loader2,
} from 'lucide-react';

interface Baker {
  id: string;
  business_name: string;
  slug: string;
  whatsapp_number: string;
  bio: string;
}

interface Cake {
  id: string;
  baker_id: string;
  title: string;
  starting_price: number;
  min_weight: string;
  image_url: string;
  video_url: string | null;
  occasion: string[];
  is_eggless: boolean;
  is_active: boolean;
}

export default function BakerAdminDashboard() {
  const [bakers, setBakers] = useState<Baker[]>([]);
  const [selectedBaker, setSelectedBaker] = useState<Baker | null>(null);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // New Cake Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('1200');
  const [minWeight, setMinWeight] = useState('1.0 kg');
  const [category, setCategory] = useState('kids');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  // New Baker Studio Form State
  const [showNewBakerForm, setShowNewBakerForm] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('91');
  const [newBio, setNewBio] = useState('Custom Cakes • New Delhi');

  useEffect(() => {
    loadBakers();
  }, []);

  useEffect(() => {
    if (selectedBaker) {
      loadCakes(selectedBaker.id);
    }
  }, [selectedBaker]);

  async function loadBakers() {
    const { data } = await supabase.from('bakers').select('*').order('business_name');
    if (data && data.length > 0) {
      setBakers(data);
      if (!selectedBaker) setSelectedBaker(data[0]);
    }
  }

  async function loadCakes(bakerId: string) {
    const { data } = await supabase
      .from('cakes')
      .select('*')
      .eq('baker_id', bakerId)
      .order('created_at', { ascending: false });
    if (data) setCakes(data);
  }

  function flashStatus(msg: string) {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3500);
  }

  // Automatically compress any 5MB phone photo into a ~140KB WebP image before upload
  async function compressImage(file: File): Promise<File> {
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

  // Upload a file to Supabase Storage (with auto-compression for images & size guard for video)
  async function uploadMediaFile(file: File, folder: string): Promise<string> {
    let fileToUpload = file;

    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file);
    } else if (file.type.startsWith('video/')) {
      const maxVideoMB = 3;
      if (file.size > maxVideoMB * 1024 * 1024) {
        throw new Error(
          `Video is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Keep loops under ${maxVideoMB}MB so your storage doesn't fill up.`
        );
      }
    }

    const fileExt = fileToUpload.name.split('.').pop() || 'webp';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('showcase-media')
      .upload(fileName, fileToUpload, { cacheControl: '31536000', upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from('showcase-media').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleCreateBaker(e: React.FormEvent) {
    e.preventDefault();
    if (!newBizName || !newSlug) return;

    const cleanSlug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const { data, error } = await supabase
      .from('bakers')
      .insert([
        {
          business_name: newBizName,
          slug: cleanSlug,
          whatsapp_number: newWhatsapp.replace(/\D/g, ''),
          bio: newBio,
        },
      ])
      .select()
      .single();

    if (error) {
      alert('Error creating studio: ' + error.message);
      return;
    }

    if (data) {
      setBakers((prev) => [...prev, data]);
      setSelectedBaker(data);
      setShowNewBakerForm(false);
      setNewBizName('');
      setNewSlug('');
      flashStatus(`Created showroom: /${data.slug}`);
    }
  }

  async function handleAddCake(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBaker || !title) return;
    if (!imageFile && !imageUrl.trim()) {
      alert('Please select a cake photo from your device or paste an image URL.');
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = imageUrl.trim();
      let finalVideoUrl: string | null = null;

      if (imageFile) {
        finalImageUrl = await uploadMediaFile(imageFile, selectedBaker.slug);
      }

      if (videoFile) {
        finalVideoUrl = await uploadMediaFile(videoFile, `${selectedBaker.slug}-videos`);
      }

      const { data, error } = await supabase
        .from('cakes')
        .insert([
          {
            baker_id: selectedBaker.id,
            title,
            starting_price: Number(price),
            min_weight: minWeight,
            occasion: [category],
            is_eggless: true,
            is_active: true,
            image_url: finalImageUrl,
            video_url: finalVideoUrl,
          },
        ])
        .select()
        .single();

      if (error) throw new Error(error.message);

      if (data) {
        setCakes((prev) => [data, ...prev]);
        setTitle('');
        setImageFile(null);
        setVideoFile(null);
        setImageUrl('');
        flashStatus('Cake compressed, uploaded & published!');
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function toggleCakeVisibility(cake: Cake) {
    const updatedStatus = !cake.is_active;
    const { error } = await supabase
      .from('cakes')
      .update({ is_active: updatedStatus })
      .eq('id', cake.id);

    if (!error) {
      setCakes((prev) =>
        prev.map((c) => (c.id === cake.id ? { ...c, is_active: updatedStatus } : c))
      );
      flashStatus(updatedStatus ? 'Cake visible in catalog' : 'Cake hidden from catalog');
    }
  }

  async function deleteCake(cakeId: string) {
    const { error } = await supabase.from('cakes').delete().eq('id', cakeId);
    if (!error) {
      setCakes((prev) => prev.filter((c) => c.id !== cakeId));
      flashStatus('Cake deleted');
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-neutral-100 pb-20 antialiased">
      <header className="border-b border-white/10 bg-[#121216] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <span className="text-white/20">|</span>
            <span className="font-bold text-sm text-white">BakerBridge Studio Manager</span>
          </div>

          {selectedBaker && (
            <Link
              href={`/${selectedBaker.slug}`}
              target="_blank"
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>View Live Showroom</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 mt-8">
        {statusMsg && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="bg-[#141418] border border-white/10 rounded-2xl p-5 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Active Bakery Studio
              </label>
              <select
                value={selectedBaker?.id || ''}
                onChange={(e) => {
                  const found = bakers.find((b) => b.id === e.target.value);
                  if (found) setSelectedBaker(found);
                }}
                className="bg-[#0A0A0B] border border-white/15 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none w-full sm:w-80"
              >
                {bakers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.business_name} (/{b.slug})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowNewBakerForm(!showNewBakerForm)}
              className="bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 self-start sm:self-end cursor-pointer"
            >
              <Store className="w-4 h-4 text-rose-400" />
              <span>{showNewBakerForm ? 'Cancel' : '+ Onboard New Baker'}</span>
            </button>
          </div>

          {showNewBakerForm && (
            <form
              onSubmit={handleCreateBaker}
              className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Bakery Name</label>
                <input
                  required
                  value={newBizName}
                  onChange={(e) => {
                    setNewBizName(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  placeholder="e.g. Batter & Whisk Studio"
                  className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Custom URL Slug</label>
                <input
                  required
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="batter-and-whisk"
                  className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-rose-400 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  WhatsApp Number (with 91)
                </label>
                <input
                  required
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  placeholder="919876543210"
                  className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Location & Tagline</label>
                <input
                  required
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Artisan Cakes • Janakpuri, Delhi"
                  className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Create Live Showroom Instantly
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-5 h-fit">
            <h2 className="font-bold text-base text-white flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-rose-400" />
              <span>Upload Cake to Showroom</span>
            </h2>

            <form onSubmit={handleAddCake} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Cake Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Belgian Chocolate Pinata Cake"
                  className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Base Price (₹)</label>
                  <input
                    required
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Minimum Weight</label>
                  <select
                    value={minWeight}
                    onChange={(e) => setMinWeight(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="350 gm">350 gm (Bento)</option>
                    <option value="0.5 kg">0.5 kg</option>
                    <option value="1.0 kg">1.0 kg</option>
                    <option value="1.5 kg">1.5 kg</option>
                    <option value="2.0 kg">2.0 kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Collection Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="kids">Kids Birthday</option>
                  <option value="anniversary">Anniversary & Luxury</option>
                  <option value="minimalist">Bento & Same-Day Express ⚡</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1.5">
                  Cake Photo (Auto-compressed to ~140KB WebP)
                </label>
                <label className="flex flex-col items-center justify-center border border-dashed border-white/20 hover:border-rose-400 rounded-xl p-4 cursor-pointer bg-[#0A0A0B] transition-colors">
                  <Upload className="w-5 h-5 text-rose-400 mb-1.5" />
                  <span className="text-xs font-semibold text-neutral-200 text-center line-clamp-1">
                    {imageFile ? imageFile.name : 'Tap to choose cake photo'}
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">JPG, PNG, WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>

                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste external image URL..."
                  className="mt-2 w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2 text-[11px] text-neutral-400"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1.5">
                  5-Sec Video Loop (Optional • Max 3MB)
                </label>
                <label className="flex items-center justify-center gap-2 border border-dashed border-white/15 hover:border-amber-400 rounded-xl p-3 cursor-pointer bg-[#0A0A0B] transition-colors">
                  <Video className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-medium text-neutral-300 line-clamp-1">
                    {videoFile ? videoFile.name : 'Attach MP4 Video Reel'}
                  </span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing & Uploading...</span>
                  </>
                ) : (
                  <span>Publish Cake to Catalog</span>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <CakeIcon className="w-4 h-4 text-amber-400" />
                <span>
                  {selectedBaker?.business_name} Inventory ({cakes.length})
                </span>
              </h2>
            </div>

            {cakes.length === 0 ? (
              <div className="bg-[#141418] border border-white/10 rounded-2xl p-12 text-center text-xs text-neutral-400">
                No cakes in this showroom yet. Upload your first design on the left!
              </div>
            ) : (
              <div className="space-y-3">
                {cakes.map((cake) => (
                  <div
                    key={cake.id}
                    className={`bg-[#141418] border rounded-2xl p-3.5 flex items-center justify-between gap-4 transition-all ${
                      cake.is_active ? 'border-white/10' : 'border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={cake.image_url}
                        alt={cake.title}
                        className="w-14 h-14 rounded-xl object-cover bg-neutral-800 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">{cake.title}</h3>
                          {cake.video_url && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                              Video
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          ₹{cake.starting_price} • Min {cake.min_weight} •{' '}
                          <span className="uppercase text-[10px] text-amber-400 font-bold">
                            {Array.isArray(cake.occasion) ? cake.occasion[0] : cake.occasion}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCakeVisibility(cake)}
                        title={cake.is_active ? 'Hide from showroom' : 'Show in showroom'}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 cursor-pointer"
                      >
                        {cake.is_active ? (
                          <Eye className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-neutral-500" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteCake(cake.id)}
                        title="Delete cake"
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}