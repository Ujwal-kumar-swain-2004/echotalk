import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMatchStore } from '../store/matchStore';
import { Video, HelpCircle, X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const GuestJoinPage: React.FC = () => {
  const { loginGuest, isLoading, error, clearError } = useAuthStore();
  const { 
    gender, 
    preferredGender, 
    interests,
    setGender, 
    setPreferredGender, 
    setInterests 
  } = useMatchStore();

  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState('');
  const [localInterests, setLocalInterests] = useState<string[]>(interests);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !localInterests.includes(cleanTag)) {
      const updated = [...localInterests, cleanTag];
      setLocalInterests(updated);
      setInterests(updated);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = localInterests.filter(t => t !== tagToRemove);
    setLocalInterests(updated);
    setInterests(updated);
  };

  const handleJoin = async () => {
    try {
      await loginGuest(gender, localInterests);
      navigate('/chat');
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    clearError();
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full glass p-8 rounded-3xl relative border border-white/5"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent to-[#d946ef] flex items-center justify-center shadow-lg shadow-accent/25 mx-auto mb-4">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">Join Anonymously</h2>
          <p className="text-gray-400 text-sm">
            Quick one-click access. No password, no registration required.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Your Gender Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Your Gender
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'unspecified'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
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

          {/* Partner Gender Preference */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Match Me With
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'random'] as const).map((pref) => (
                <button
                  key={pref}
                  onClick={() => setPreferredGender(pref)}
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

          {/* Match Interests Tag Box */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Interest Tags (Optional)
            </label>
            <form onSubmit={handleAddTag} className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. music, coding, anime"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {localInterests.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                {localInterests.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-xs font-medium text-accent"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-accent/60 hover:text-accent hover:scale-105 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 flex items-center gap-1.5 px-1">
                <HelpCircle className="w-4 h-4" />
                No interest tags. You will match with anyone.
              </p>
            )}
          </div>

          <button
            onClick={handleJoin}
            disabled={isLoading}
            className="w-full py-4 mt-2 rounded-2xl bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-white font-bold shadow-lg shadow-accent/20 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer text-base"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Enter Chatroom</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
