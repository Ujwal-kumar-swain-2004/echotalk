import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Video, Shield, Heart, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleStartChatting = () => {
    if (isAuthenticated) {
      navigate('/chat');
    } else {
      navigate('/guest-join');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 md:py-16 text-center max-w-4xl mx-auto">
      {/* Premium Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-accent border border-accent/25 text-xs font-semibold text-accent tracking-wider uppercase mb-8"
      >
        <Sparkles className="w-4 h-4 animate-spin duration-[4000ms]" />
        Next-Gen Anonymous Chat Experience
      </motion.div>

      {/* Main Hero Header */}
      <motion.h1 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-6"
      >
        Meet Strangers <br className="hidden sm:block" />
        <span className="bg-gradient-to-r from-accent via-[#d946ef] to-[#f43f5e] bg-clip-text text-transparent">
          Without Limits.
        </span>
      </motion.h1>

      {/* Description */}
      <motion.p 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-gray-400 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10"
      >
        Instantly match with friendly people worldwide. Peer-to-peer WebRTC video, completely secure real-time messaging, smart interest matching, and zero configuration.
      </motion.p>

      {/* CTAs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 mb-16 justify-center w-full max-w-md sm:max-w-none"
      >
        <button
          onClick={handleStartChatting}
          className="px-8 py-4 rounded-2xl bg-accent hover:bg-accent-hover text-white text-base font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 flex items-center justify-center gap-2.5 transition-all duration-300 group cursor-pointer hover:scale-[1.02]"
        >
          <span>Start Chatting Instantly</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </button>

        {!isAuthenticated && (
          <Link
            to="/register"
            className="px-8 py-4 rounded-2xl glass hover:bg-white/5 border border-white/10 hover:border-white/20 text-white text-base font-bold flex items-center justify-center gap-2 transition-all duration-300"
          >
            Create Permanent Account
          </Link>
        )}
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full text-left"
      >
        {/* Card 1 */}
        <div className="p-6 rounded-2xl glass-card hover:border-white/10 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-5">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">P2P HD Quality</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Direct peer-to-peer WebRTC connections guarantee ultra-low latency audio and crystal clear video.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-6 rounded-2xl glass-card hover:border-white/10 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-[#d946ef]/10 border border-[#d946ef]/20 flex items-center justify-center text-[#d946ef] mb-5">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">100% Anonymous</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            No registration required. We don't save video streams, IP logs, or personal tracking details.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-6 rounded-2xl glass-card hover:border-white/10 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-[#f43f5e]/10 border border-[#f43f5e]/20 flex items-center justify-center text-[#f43f5e] mb-5">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Smart Matching</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Filter by interests or preferred gender to find the most compatible conversation partners.
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-6 rounded-2xl glass-card hover:border-white/10 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Safe Community</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Our one-click report and instant AI-supported ban systems keep the space welcoming and clean.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
