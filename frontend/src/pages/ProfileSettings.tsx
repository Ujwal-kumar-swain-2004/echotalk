import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMatchStore } from '../store/matchStore';
import { Settings, User, Heart, Hash, Check, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    gender, 
    preferredGender, 
    interests,
    setGender, 
    setPreferredGender, 
    setInterests 
  } = useMatchStore();

  const [tagInput, setTagInput] = useState('');
  const [localInterests, setLocalInterests] = useState<string[]>(interests);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !localInterests.includes(cleanTag)) {
      const updated = [...localInterests, cleanTag];
      setLocalInterests(updated);
      setInterests(updated);
      setTagInput('');
      triggerSaveFeedback();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = localInterests.filter(t => t !== tagToRemove);
    setLocalInterests(updated);
    setInterests(updated);
    triggerSaveFeedback();
  };

  const triggerSaveFeedback = () => {
    setSaveFeedback(true);
    setTimeout(() => {
      setSaveFeedback(false);
    }, 2000);
  };

  const handleGenderChange = (g: string) => {
    setGender(g);
    triggerSaveFeedback();
  };

  const handlePrefChange = (pref: string) => {
    setPreferredGender(pref);
    triggerSaveFeedback();
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full py-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-white">Profile Settings</h2>
          <p className="text-sm text-gray-400">Manage your matching tags and account preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Account Info Card */}
        <div className="p-6 rounded-3xl glass border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-white/5 pb-3">
            <User className="w-5 h-5 text-accent" />
            <span>Account Details</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block mb-0.5">Username</span>
              <span className="text-gray-200 font-semibold">{user?.username}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">Account Role</span>
              <span className="text-gray-200 font-semibold uppercase tracking-wider text-xs px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 inline-block">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Matching Preferences */}
        <div className="p-6 rounded-3xl glass border border-white/5 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Heart className="w-5 h-5 text-rose-400" />
              <span>Matching Preferences</span>
            </div>
            {saveFeedback && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium"
              >
                <Check className="w-4 h-4" />
                <span>Saved automatically</span>
              </motion.div>
            )}
          </div>

          {/* Your Gender */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Your Gender</span>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'unspecified'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenderChange(g)}
                  className={`py-3 rounded-2xl text-sm font-semibold capitalize border transition-all duration-200 cursor-pointer ${
                    gender === g
                      ? 'bg-accent border-accent text-white shadow-md shadow-accent/25'
                      : 'bg-white/5 border-white/5 hover:border-white/15 text-gray-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Target Preference */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Match With Preferred Gender</span>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'random'] as const).map((pref) => (
                <button
                  key={pref}
                  onClick={() => handlePrefChange(pref)}
                  className={`py-3 rounded-2xl text-sm font-semibold capitalize border transition-all duration-200 cursor-pointer ${
                    preferredGender === pref
                      ? 'bg-accent border-accent text-white shadow-md shadow-accent/25'
                      : 'bg-white/5 border-white/5 hover:border-white/15 text-gray-400 hover:text-white'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interests Tag Organizer */}
        <div className="p-6 rounded-3xl glass border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-white/5 pb-3">
            <Hash className="w-5 h-5 text-accent" />
            <span>Interest Tags Selector</span>
          </div>

          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add more interests (e.g. movies, fitness, gaming)"
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          {localInterests.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-3.5 bg-white/5 rounded-2xl border border-white/5">
              {localInterests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/25 text-xs font-semibold text-accent"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-accent/60 hover:text-accent hover:scale-105 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 px-1 py-2">
              No matching tag interests saved yet. Enter tag terms above to begin.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
