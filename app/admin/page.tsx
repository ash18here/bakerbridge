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
  Lock,
  LogOut,
  ShieldAlert,
  KeyRound,
  Image as ImageIcon,
} from 'lucide-react';

interface Baker {
  id: string;
  business_name: string;
  slug: string;
  whatsapp_number: string;
  bio: string;
  access_pin?: string;
  cover_url?: string | null;
  avatar_url?: string | null;
  is_accepting_orders?: boolean;
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

const FOUNDER_MASTER_ID = 'admin';
const FOUNDER_MASTER_PIN = '9999';

const CLOUDINARY_CLOUD_NAME: string = 'uk6p3prn';
const CLOUDINARY_UPLOAD_PRESET: string = 'vzbpfxs';

export default function BakerAdminDashboard() {
  const [authRole, setAuthRole] = useState<'none' | 'founder' | 'baker'>('none');
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [bakers, setBakers] = useState<Baker[]>([]);
  const [selectedBaker, setSelectedBaker] = useState<Baker | null>(null);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Studio Profile & Cover Editor State
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editAccepting, setEditAccepting] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // New Cake Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('1200');
  const [minWeight, setMinWeight] = useState('1.0 kg');
  const [category, setCategory] = useState('kids');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  // New Baker Studio Form State (Founder Only)
  const [showNewBakerForm, setShowNewBakerForm] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('91');
  const [newBio, setNewBio] = useState('Custom Cakes • New Delhi');
  const [newPin, setNewPin] = useState('1234');

  useEffect(() => {
    const savedSession = sessionStorage.getItem('bakerbridge_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.role === 'founder') {
          setAuthRole('founder');
          loadAllBakersForFounder();
        } else if (parsed.role === 'baker' && parsed.bakerSlug) {
          restoreBakerSession(parsed.bakerSlug);
        }
      } catch {
        sessionStorage.removeItem('bakerbridge_session');
      }
    }
  }, []);

  useEffect(() => {
    if (selectedBaker) {
      loadCakes(selectedBaker.id);
      setEditBio(selectedBaker.bio || '');
      setEditWhatsapp(selectedBaker.whatsapp_number || '');
      setEditAccepting(selectedBaker.is_accepting_orders !== false);
    }
  }, [selectedBaker]);

  async function loadAllBakersForFounder() {
    const { data } = await supabase.from('bakers').select('*').order('business_name');
    if (data && data.length > 0) {
      setBakers(data);
      setSelectedBaker(data[0]);
    }
  }

  async function restoreBakerSession(slug: string) {
    const { data } = await supabase
      .from('bakers')
      .select('*')
      .eq('slug', slug)
      .single();
    if (data) {
      setBakers([data]);
      setSelectedBaker(data);
      setAuthRole('baker');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const cleanId = loginId.trim().toLowerCase();
    const cleanPin = loginPin.trim();

    try {
      if (cleanId === FOUNDER_MASTER_ID && cleanPin === FOUNDER_MASTER_PIN) {
        setAuthRole('founder');
        sessionStorage.setItem(
          'bakerbridge_session',
          JSON.stringify({ role: 'founder' })
        );
        await loadAllBakersForFounder();
        setIsLoggingIn(false);
        return;
      }

      const { data: bakerData, error } = await supabase
        .from('bakers')
        .select('*')
        .eq('slug', cleanId)
        .single();

      if (error || !bakerData) {
        setLoginError('Studio ID not found. Use your shop slug (e.g. crumb-and-crust).');
        setIsLoggingIn(false);
        return;
      }

      const expectedPin = bakerData.access_pin || '1234';
      if (cleanPin !== expectedPin) {
        setLoginError('Incorrect 4-digit Studio PIN.');
        setIsLoggingIn(false);
        return;
      }

      setBakers([bakerData]);
      setSelectedBaker(bakerData);
      setAuthRole('baker');
      sessionStorage.setItem(
        'bakerbridge_session',
        JSON.stringify({ role: 'baker', bakerSlug: bakerData.slug })
      );
    } catch (err: any) {
      setLoginError('Login error: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('bakerbridge_session');
    setAuthRole('none');
    setSelectedBaker(null);
    setBakers([]);
    setCakes([]);
    setLoginId('');
    setLoginPin('');
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

  async function compressImage(file: File, maxWidth = 1200): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
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
          0.82
        );
      };
    });
  }

  async function uploadAndCompressVideoCloudinary(
    file: File,
    fallbackFolder: string
  ): Promise<string> {
    const isCloudinaryConfigured =
      CLOUDINARY_CLOUD_NAME !== 'YOUR_CLOUDINARY_CLOUD_NAME' &&
      CLOUDINARY_UPLOAD_PRESET !== 'YOUR_UNSIGNED_PRESET_NAME';

    if (isCloudinaryConfigured) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Cloudinary video upload failed');

      return data.secure_url.replace(
        '/upload/',
        '/upload/du_5,ac_none,w_480,q_auto:eco,f_mp4/'
      );
    }

    const fileExt = file.name.split('.').pop() || 'mp4';
    const fileName = `${fallbackFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('showcase-media')
      .upload(fileName, file, { cacheControl: '31536000', upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from('showcase-media').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function uploadMediaFile(
    file: File,
    folder: string,
    maxWidth = 900
  ): Promise<string> {
    if (file.type.startsWith('video/')) {
      return await uploadAndCompressVideoCloudinary(file, folder);
    }

    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file, maxWidth);
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

  // Save Baker Cover Photo, Avatar, Bio, WhatsApp & Oven Status
  async function handleSaveStudioProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBaker) return;

    setIsSavingProfile(true);
    try {
      let updatedCoverUrl = selectedBaker.cover_url || null;
      let updatedAvatarUrl = selectedBaker.avatar_url || null;

      if (coverFile) {
        updatedCoverUrl = await uploadMediaFile(
          coverFile,
          `${selectedBaker.slug}-branding`,
          1400
        );
      }

      if (avatarFile) {
        updatedAvatarUrl = await uploadMediaFile(
          avatarFile,
          `${selectedBaker.slug}-branding`,
          500
        );
      }

      const { data, error } = await supabase
        .from('bakers')
        .update({
          bio: editBio.trim(),
          whatsapp_number: editWhatsapp.replace(/\D/g, ''),
          cover_url: updatedCoverUrl,
          avatar_url: updatedAvatarUrl,
          is_accepting_orders: editAccepting,
        })
        .eq('id', selectedBaker.id)
        .select()
        .single();

      if (error) {
        throw new Error(
          error.message +
            ' (Make sure you ran the 1-line SQL command in Supabase to add cover_url & avatar_url!)'
        );
      }

      if (data) {
        setSelectedBaker(data);
        setBakers((prev) => prev.map((b) => (b.id === data.id ? data : b)));
        setCoverFile(null);
        setAvatarFile(null);
        setShowProfileEditor(false);
        flashStatus('Studio Cover, Logo & Profile updated!');
      }
    } catch (err: any) {
      alert('Could not update profile: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
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
          access_pin: newPin.trim() || '1234',
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
      setNewPin('1234');
      flashStatus(`Created /${data.slug} (Baker PIN: ${data.access_pin})`);
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

  if (authRole === 'none') {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-neutral-100 flex flex-col justify-center items-center px-4 antialiased">
        <div className="w-full max-w-sm bg-[#141418] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center font-black text-black text-sm">
                B
              </div>
              <div>
                <h1 className="font-bold text-base text-white leading-none">
                  BakerBridge
                </h1>
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                  Studio Portal Login
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
          </div>

          {loginError && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">
                Studio ID (Shop URL Slug)
              </label>
              <input
                required
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. crumb-and-crust"
                className="w-full bg-[#0A0A0B] border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">
                4-Digit Studio PIN
              </label>
              <input
                required
                type="password"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-[#0A0A0B] border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoggingIn ? 'Verifying...' : 'Unlock Studio Dashboard'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-neutral-100 pb-20 antialiased">
      <header className="border-b border-white/10 bg-[#121216] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-white">
              {authRole === 'founder'
                ? '👑 Founder Super-Admin'
                : `${selectedBaker?.business_name} Studio`}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {selectedBaker && (
              <Link
                href={`/${selectedBaker.slug}`}
                target="_blank"
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <span>Live Showroom</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 mt-8">
        {statusMsg && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* FOUNDER-ONLY PANEL */}
        {authRole === 'founder' && (
          <div className="bg-[#141418] border border-amber-500/30 rounded-2xl p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1.5">
                  Founder Mode: Switch Active Bakery ({bakers.length} Total)
                </label>
                <div className="flex flex-wrap items-center gap-3">
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

                  {selectedBaker && (
                    <span className="text-xs bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-neutral-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      ID: <strong className="text-white font-mono">{selectedBaker.slug}</strong> | PIN:{' '}
                      <strong className="text-emerald-400 font-mono">
                        {selectedBaker.access_pin || '1234'}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowNewBakerForm(!showNewBakerForm)}
                className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 self-start sm:self-end cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>{showNewBakerForm ? 'Cancel' : '+ Onboard New Baker'}</span>
              </button>
            </div>

            {showNewBakerForm && (
              <form
                onSubmit={handleCreateBaker}
                className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4"
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
                  <label className="text-xs text-neutral-400 block mb-1">
                    Custom Login Slug
                  </label>
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
                    Assign 4-Digit Baker PIN
                  </label>
                  <input
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-mono"
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
                <div className="sm:col-span-2">
                  <label className="text-xs text-neutral-400 block mb-1">
                    Location & Tagline
                  </label>
                  <input
                    required
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    placeholder="Artisan Cakes • Janakpuri, Delhi"
                    className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Create Live Showroom & Generate Baker Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* STUDIO BRANDING, COVER PHOTO & OVEN STATUS PANEL */}
        {selectedBaker && (
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#0A0A0B] border border-white/15 overflow-hidden flex items-center justify-center shrink-0">
                  {selectedBaker.avatar_url ? (
                    <img
                      src={selectedBaker.avatar_url}
                      alt={selectedBaker.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black text-amber-400">
                      {selectedBaker.business_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">
                      {selectedBaker.business_name}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedBaker.is_accepting_orders !== false
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {selectedBaker.is_accepting_orders !== false
                        ? '● Accepting Orders'
                        : '● Oven Full Today'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{selectedBaker.bio}</p>
                </div>
              </div>

              <button
                onClick={() => setShowProfileEditor(!showProfileEditor)}
                className="bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 self-start sm:self-center cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-rose-400" />
                <span>
                  {showProfileEditor
                    ? 'Close Profile Editor'
                    : 'Edit Cover Photo, Logo & Status'}
                </span>
              </button>
            </div>

            {showProfileEditor && (
              <form
                onSubmit={handleSaveStudioProfile}
                className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <label className="text-xs text-neutral-300 font-bold block mb-1.5">
                    1. Showroom Background Cover Photo
                  </label>
                  <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-rose-400 rounded-xl p-3.5 cursor-pointer bg-[#0A0A0B]">
                    <Upload className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-xs text-neutral-300 truncate">
                      {coverFile
                        ? coverFile.name
                        : 'Upload Wide Banner Image (Auto-WebP)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-bold block mb-1.5">
                    2. Studio Logo / Profile Avatar
                  </label>
                  <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-amber-400 rounded-xl p-3.5 cursor-pointer bg-[#0A0A0B]">
                    <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-neutral-300 truncate">
                      {avatarFile ? avatarFile.name : 'Upload Square Studio Logo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">
                    3. Location & Speciality Bio
                  </label>
                  <input
                    required
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">
                    4. WhatsApp Order Number (with 91)
                  </label>
                  <input
                    required
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editAccepting}
                      onChange={(e) => setEditAccepting(e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-emerald-300">
                      Kitchen Open & Accepting Orders for This Week (Uncheck if booked out today)
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Studio Branding...</span>
                      </>
                    ) : (
                      <span>Save Cover & Profile</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

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
                  5-Sec Video Loop (Optional)
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