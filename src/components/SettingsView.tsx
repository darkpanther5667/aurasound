import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Headphones,
  EyeOff,
  Bell,
  LogOut,
  Save,
  Check,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  Trash2,
  Loader2
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import {
  fetchProfileApi,
  updateProfileApi,
  fetchSettingsApi,
  updateSettingsApi,
  updateContactApi,
  changePasswordApi,
  deleteAccountApi,
  logoutApi,
  getAuthToken
} from '../services/api';
import { UserProfile, UserSettings, AudioQuality, EqPreset } from '../types';
import { AuthModal } from './AuthModal';

type SettingsSubTab = 'profile' | 'account' | 'playback' | 'privacy' | 'notifications';

const AUDIO_QUALITIES: { id: AudioQuality; title: string; desc: string; badge?: string }[] = [
  { id: 'lossless-flac', title: 'Lossless FLAC', desc: '24-bit / 96kHz bit-perfect uncompressed stream', badge: 'Hi-Res Master' },
  { id: 'high-320', title: 'High 320 kbps', desc: 'High-fidelity dynamic range encoding' },
  { id: 'standard-192', title: 'Standard 192 kbps', desc: 'Balanced compression for steady playback' },
  { id: 'data-saver', title: 'Data Saver 96 kbps', desc: 'Low-bandwidth consumption for metered plans' }
];

const EQ_PRESETS: { id: EqPreset; label: string; desc: string }[] = [
  { id: 'reference', label: 'Studio Reference', desc: 'Neutral, flat mastering frequency curve' },
  { id: 'warm-analog', label: 'Warm Vinyl', desc: '+3.5dB Bass harmonic warmth with smooth highs' },
  { id: 'club-sub', label: 'Club Subwoofer', desc: '+5.8dB Sub punch tuned for heavy 808s' },
  { id: 'vocal-air', label: 'Vocal Presence', desc: '+4.2dB Presence clarity boost' }
];

export const SettingsView: React.FC = () => {
  const { showToast, setEqPreset } = useMusicStore();

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    phone: '',
    displayName: 'Aura Resident',
    avatarUrl: '',
    bio: 'Music lover & sonic explorer'
  });

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    playback: {
      audioQuality: 'lossless-flac',
      autoplay: true,
      defaultEqPreset: 'reference'
    },
    privacy: {
      showActivityToFriends: true,
      friendRequestScope: 'everyone'
    },
    notifications: {
      friendActivity: true,
      newFollowers: true,
      newReleases: true
    }
  });

  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profData, settData] = await Promise.all([
        fetchProfileApi().catch(() => null),
        fetchSettingsApi().catch(() => null)
      ]);

      if (profData) {
        setProfile(profData);
        setEmailInput(profData.email || '');
        setPhoneInput(profData.phone || '');
      }
      if (settData) {
        setSettings(settData);
        if (settData.playback?.defaultEqPreset) {
          setEqPreset(settData.playback.defaultEqPreset);
        }
      }
    } catch (err) {
      console.error('Error loading settings/profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfileApi({
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio
      });
      setProfile(updated);
      showToast('Profile updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateContactApi({
        email: emailInput,
        phone: phoneInput
      });
      setProfile((prev) => ({ ...prev, email: res.email, phone: res.phone }));
      showToast('Contact info saved');
    } catch (err: any) {
      showToast(err.message || 'Failed to update contact info');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await changePasswordApi({
        currentPassword,
        newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      await deleteAccountApi();
      setIsDeleteModalOpen(false);
      showToast('Account deleted');
      setIsAuthModalOpen(true);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveSettings = async (patch: Partial<UserSettings>) => {
    const updated = {
      playback: { ...settings.playback, ...(patch.playback || {}) },
      privacy: { ...settings.privacy, ...(patch.privacy || {}) },
      notifications: { ...settings.notifications, ...(patch.notifications || {}) }
    };
    setSettings(updated);

    if (patch.playback?.defaultEqPreset) {
      setEqPreset(patch.playback.defaultEqPreset);
    }

    try {
      await updateSettingsApi(updated);
      showToast('Settings saved');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings');
    }
  };

  const handleLogout = () => {
    logoutApi();
    showToast('Logged out');
    setIsAuthModalOpen(true);
    loadData();
  };

  const navItems: { id: SettingsSubTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account & Security', icon: ShieldCheck },
    { id: 'playback', label: 'Audio Quality', icon: Headphones },
    { id: 'privacy', label: 'Privacy', icon: EyeOff },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
            Preferences
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Settings
          </h1>
        </div>

        <div>
          {getAuthToken() ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{profile.email}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-full bg-white hover:bg-zinc-100 text-black text-xs font-semibold shadow-sm transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar Sub-Nav */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 p-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-all duration-150 shrink-0 md:shrink ${
                    isActive
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="hidden md:block my-2 border-t border-white/[0.06]" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0 md:shrink"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          {loading ? (
            <div className="p-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center gap-2.5 text-zinc-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Loading preferences...</span>
            </div>
          ) : (
            <>
              {/* 1. PROFILE */}
              {activeSubTab === 'profile' && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-white">Public Profile</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Your display name and avatar seen by other listeners.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-white/[0.04]">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-zinc-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-zinc-300 font-medium">Avatar Image URL</label>
                        <input
                          type="url"
                          value={profile.avatarUrl || ''}
                          onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-300 font-medium">Display Name</label>
                      <input
                        type="text"
                        required
                        value={profile.displayName}
                        onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-300 font-medium">Bio</label>
                      <textarea
                        rows={3}
                        value={profile.bio || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/20 transition-all resize-none"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-black text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                      >
                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
                        <span>Save Profile</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 2. ACCOUNT */}
              {activeSubTab === 'account' && (
                <div className="space-y-6">
                  <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-5">
                    <div>
                      <h2 className="text-base font-semibold text-white">Contact Info</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">Manage your login credentials.</p>
                    </div>

                    <form onSubmit={handleSaveContact} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-zinc-300 font-medium">Email</label>
                          <input
                            type="email"
                            required
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-zinc-300 font-medium">Phone Number</label>
                          <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-black text-xs font-semibold shadow-sm transition-all"
                        >
                          Save Contact
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Password Card */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-5">
                    <div>
                      <h2 className="text-base font-semibold text-white">Change Password</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">Update your password to keep your account secure.</p>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300 font-medium">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Leave blank if guest account"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-zinc-300 font-medium">New Password</label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-zinc-300 font-medium">Confirm Password</label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-black text-xs font-semibold shadow-sm transition-all"
                        >
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-6 rounded-3xl bg-red-950/15 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-red-400">Delete Account</h3>
                      <p className="text-xs text-red-300/70 mt-0.5">Permanently remove your account and all saved favorites.</p>
                    </div>
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all self-start sm:self-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* 3. PLAYBACK */}
              {activeSubTab === 'playback' && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-white">Audio Quality & Engine</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Configure streaming fidelity and playback behavior.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-zinc-300 font-medium">Bitrate & Codec</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AUDIO_QUALITIES.map((q) => {
                        const isSelected = settings.playback.audioQuality === q.id;
                        return (
                          <div
                            key={q.id}
                            onClick={() => handleSaveSettings({ playback: { ...settings.playback, audioQuality: q.id } })}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? 'bg-white/[0.08] border-white/30 text-white'
                                : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04] text-zinc-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                                {q.title}
                                {q.badge && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                    {q.badge}
                                  </span>
                                )}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <p className="text-[11px] text-zinc-400">{q.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <div>
                      <h4 className="text-xs font-medium text-white">Autoplay Next</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Keep streaming similar tracks when your queue ends.</p>
                    </div>
                    <button
                      onClick={() => handleSaveSettings({ playback: { ...settings.playback, autoplay: !settings.playback.autoplay } })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        settings.playback.autoplay ? 'bg-white' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ${
                          settings.playback.autoplay ? 'translate-x-4' : 'translate-x-0 bg-zinc-400'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300 font-medium">Default Equalizer Curve</label>
                    <select
                      value={settings.playback.defaultEqPreset}
                      onChange={(e) => handleSaveSettings({ playback: { ...settings.playback, defaultEqPreset: e.target.value as EqPreset } })}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/20 transition-all cursor-pointer"
                    >
                      {EQ_PRESETS.map((eq) => (
                        <option key={eq.id} value={eq.id} className="bg-[#12141D] text-white">
                          {eq.label} ({eq.desc})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 4. PRIVACY */}
              {activeSubTab === 'privacy' && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-white">Social & Privacy</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Control your broadcast visibility.</p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <div>
                      <h4 className="text-xs font-medium text-white">Show My Activity</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Share what you're playing in the Friends Listening Bar.</p>
                    </div>
                    <button
                      onClick={() => handleSaveSettings({ privacy: { ...settings.privacy, showActivityToFriends: !settings.privacy.showActivityToFriends } })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        settings.privacy.showActivityToFriends ? 'bg-white' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ${
                          settings.privacy.showActivityToFriends ? 'translate-x-4' : 'translate-x-0 bg-zinc-400'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-zinc-300 font-medium">Friend Requests</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'everyone', label: 'Everyone', desc: 'Anyone can add you as a listening buddy' },
                        { id: 'nobody', label: 'Nobody (Private)', desc: 'Block incoming collaborator requests' }
                      ].map((s) => {
                        const isSelected = settings.privacy.friendRequestScope === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleSaveSettings({ privacy: { ...settings.privacy, friendRequestScope: s.id as any } })}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-white/[0.08] border-white/30 text-white'
                                : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04] text-zinc-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-white">{s.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <p className="text-[11px] text-zinc-400">{s.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. NOTIFICATIONS */}
              {activeSubTab === 'notifications' && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Notifications</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Choose which updates you receive.</p>
                  </div>

                  {[
                    { key: 'friendActivity', label: 'Friend Activity', desc: 'When friends start listening to new music' },
                    { key: 'newFollowers', label: 'New Followers', desc: 'When someone follows your curated collections' },
                    { key: 'newReleases', label: 'New Releases', desc: 'Drops from your favorited artists' }
                  ].map((item) => {
                    const isChecked = (settings.notifications as any)[item.key];
                    return (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <div>
                          <h4 className="text-xs font-medium text-white">{item.label}</h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => handleSaveSettings({ notifications: { ...settings.notifications, [item.key]: !isChecked } })}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                            isChecked ? 'bg-white' : 'bg-white/10'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ${
                              isChecked ? 'translate-x-4' : 'translate-x-0 bg-zinc-400'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0F1015] border border-white/10 p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">Confirm Account Deletion</h3>
            <p className="text-xs text-zinc-400">Type <strong className="text-white font-mono">DELETE</strong> to confirm.</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-red-500/40 text-xs font-mono text-center text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                onClick={handleDeleteAccount}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={loadData} />
    </div>
  );
};
