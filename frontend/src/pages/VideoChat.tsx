import React, { useRef, useState, useEffect } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useChatStore } from '../store/chatStore';
import { useMatchStore } from '../store/matchStore';
import { useAuthStore } from '../store/authStore';
import {
  Mic, MicOff, Video, VideoOff, SkipForward, Power, AlertTriangle,
  Send, Loader2, Sparkles, MessageSquare, AlertCircle, CheckCircle, ShieldAlert, PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const VideoChat: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuthStore();
  const { messages, isPeerTyping } = useChatStore();
  const { interests, error, setError } = useMatchStore();

  const {
    isMuted, isVideoOff, connectionStatus, isSearching, isMatched,
    startMatchmaking, skipToNext, endChat, toggleMute, toggleCamera,
    sendMessage, sendTyping, reportUser
  } = useWebRTC(localVideoRef, remoteVideoRef);

  const [messageInput, setMessageInput] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    sendMessage(messageInput.trim());
    setMessageInput('');
  };

  const handleKeyPress = () => sendTyping();

  const handleReportSubmit = () => {
    reportUser(reportReason);
    setReportSuccess(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSuccess(false);
      skipToNext();
    }, 1500);
  };

  const isConnected = connectionStatus === 'connected';

  const renderVideoOverlay = () => {
    switch (connectionStatus) {
      case 'searching':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: 'linear-gradient(160deg, rgba(7,7,16,0.95) 0%, rgba(15,10,32,0.95) 100%)' }}>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#fff 0,transparent 1px,transparent 48px)' }} />
            <div className="relative mb-7 flex items-center justify-center">
              <div className="absolute w-28 h-28 rounded-full border border-violet-500/15 animate-ping" style={{ animationDuration: '2.4s' }} />
              <div className="absolute w-20 h-20 rounded-full border border-violet-400/20 animate-ping" style={{ animationDuration: '1.8s' }} />
              <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-violet-500 border-r-violet-400/40 animate-spin relative flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400/60 font-semibold mb-2">Finding your match</p>
            <h3 className="text-2xl font-bold text-white mb-3">Scanning the network...</h3>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center max-w-xs px-4 mt-1">
                {interests.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-medium text-violet-300 border border-violet-500/30"
                    style={{ background: 'rgba(139,92,246,0.12)' }}>#{t}</span>
                ))}
              </div>
            )}
          </div>
        );

      case 'connecting':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: 'linear-gradient(160deg, rgba(7,7,16,0.93) 0%, rgba(8,18,28,0.93) 100%)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-30" style={{ background: 'rgba(34,197,94,0.3)' }} />
              <Loader2 className="w-7 h-7 text-emerald-400 animate-spin relative z-10" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70 font-semibold mb-2">Match found!</p>
            <h3 className="text-2xl font-bold text-white mb-2">Connecting...</h3>
            <p className="text-xs text-gray-500">Establishing encrypted peer connection</p>
          </div>
        );

      case 'disconnected':
      case 'idle':
        if (!isSearching && !isMatched) {
          return (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6"
              style={{ background: 'linear-gradient(160deg, rgba(7,7,14,0.97) 0%, rgba(13,8,26,0.97) 100%)' }}>
              <div className="absolute inset-0 opacity-[0.035]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#fff 0,transparent 1px,transparent 48px)' }} />
              {/* Ambient glow */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(40px)' }} />

              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="relative mb-6 z-10">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center relative"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)' }}>
                  <Video className="w-9 h-9 text-violet-400" />
                </div>
              </motion.div>

              <p className="text-[10px] uppercase tracking-[0.32em] text-violet-400/60 font-semibold mb-3 z-10">EchoTalk Live</p>
              <h3 className="text-3xl font-extrabold text-white mb-2 text-center leading-tight z-10">
                Meet strangers.<br />
                <span style={{ color: '#a78bfa' }}>Anonymously.</span>
              </h3>
              <p className="text-sm text-gray-500 max-w-[260px] text-center mb-8 leading-relaxed z-10">
                HD video, clear audio, live chat — fully peer-to-peer and encrypted.
              </p>

              {/* THE MAIN CTA — large and prominent */}
              <button onClick={startMatchmaking}
                className="relative z-10 flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white cursor-pointer transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                  boxShadow: '0 0 40px rgba(124,58,237,0.4), 0 12px 24px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(167,139,250,0.3)'
                }}>
                <PhoneCall className="w-5 h-5" />
                Start Matchmaking
              </button>

              <p className="text-[11px] text-gray-700 mt-4 z-10">No account needed · instant connection</p>
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] min-h-[520px]">

      {/* ── LEFT: VIDEO AREA ── */}
      <div className="flex-1 flex flex-col gap-3 h-full min-h-0">

        {/* REMOTE VIDEO — takes all remaining space */}
        <div className="flex-1 relative overflow-hidden rounded-3xl min-h-0"
          style={{ background: '#07070f', border: '1px solid rgba(255,255,255,0.05)' }}>
          <video ref={remoteVideoRef} autoPlay playsInline
            className="w-full h-full object-cover rounded-3xl"
            style={{ transform: 'scaleX(-1)' }} />
          {renderVideoOverlay()}

          {/* Live badge */}
          {isConnected && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', color: '#d1d5db' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Stranger · Live
            </div>
          )}

          {/* PiP: Local video overlay — bottom-right corner */}
          <div className="absolute bottom-4 right-4 z-20 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: '160px', height: '120px',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
            }}>
            <video ref={localVideoRef} autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} />
            {isVideoOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                style={{ background: '#0a0a14' }}>
                <VideoOff className="w-5 h-5 text-gray-600" />
                <span className="text-[10px] text-gray-700 font-medium">Camera off</span>
              </div>
            )}
            {/* You label */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold text-gray-300"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
              You{user?.gender ? ` · ${user.gender}` : ''}
            </div>
          </div>
        </div>

        {/* ── BOTTOM TOOLBAR — always visible ── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>

          {/* Left: mic + camera — ALWAYS VISIBLE */}
          <div className="flex items-center gap-2">
            <ToolbarBtn active={isMuted} onClick={toggleMute} danger title={isMuted ? 'Unmute' : 'Mute mic'}>
              {isMuted ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
              <span className="text-xs font-medium">{isMuted ? 'Unmute' : 'Mic'}</span>
            </ToolbarBtn>
            <ToolbarBtn active={isVideoOff} onClick={toggleCamera} danger title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}>
              {isVideoOff ? <VideoOff className="w-4.5 h-4.5" /> : <Video className="w-4.5 h-4.5" />}
              <span className="text-xs font-medium">{isVideoOff ? 'Start Video' : 'Camera'}</span>
            </ToolbarBtn>
          </div>

          {/* Center: status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : isSearching ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-gray-500 font-medium">
              {isConnected ? 'Connected' : isSearching ? 'Searching...' : 'Idle'}
            </span>
          </div>

          {/* Right: next + stop */}
          <div className="flex items-center gap-2">
            <ToolbarBtn active={false} onClick={skipToNext} disabled={!isSearching && !isMatched} title="Next stranger">
              <SkipForward className="w-4.5 h-4.5 text-violet-400" />
              <span className="text-xs font-medium">Next</span>
            </ToolbarBtn>
            <ToolbarBtn active={false} onClick={endChat} disabled={!isMatched} danger={false} stopBtn title="End chat">
              <Power className="w-4.5 h-4.5" />
              <span className="text-xs font-medium">Stop</span>
            </ToolbarBtn>
          </div>
        </div>
      </div>

      {/* ── RIGHT: CHAT PANEL ── */}
      <div className="w-full lg:w-[380px] flex flex-col h-full overflow-hidden rounded-3xl relative"
        style={{ background: 'rgba(9,9,18,0.9)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)' }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <MessageSquare className="w-4.5 h-4.5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-none">Live Chat</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isMatched ? 'bg-emerald-400 animate-pulse' : 'bg-gray-700'}`} />
                <p className="text-[11px] font-medium" style={{ color: isMatched ? '#6ee7b7' : '#4b5563' }}>
                  {isMatched ? 'Connected · end-to-end encrypted' : 'Waiting for match...'}
                </p>
              </div>
            </div>
          </div>
          {isMatched && (
            <button onClick={() => setReportOpen(true)} title="Report stranger"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-600 hover:text-rose-400 transition-all duration-200 cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <AlertTriangle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <MessageSquare className="w-6 h-6 text-violet-600/50" />
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1.5">No messages yet</p>
                <p className="text-xs leading-relaxed max-w-[190px]" style={{ color: '#374151' }}>
                  Messages vanish on disconnect — no logs, no traces.
                </p>
                {!isMatched && (
                  <button onClick={startMatchmaking}
                    className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                      boxShadow: '0 0 24px rgba(124,58,237,0.3)',
                      border: '1px solid rgba(167,139,250,0.25)'
                    }}>
                    <PhoneCall className="w-4 h-4" />
                    Find a stranger
                  </button>
                )}
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isSelf = msg.senderId === user?.id || msg.senderId === 'self';
                return (
                  <motion.div key={idx}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed font-medium ${isSelf ? 'text-white rounded-2xl rounded-br-sm' : 'text-gray-200 rounded-2xl rounded-bl-sm'
                      }`} style={isSelf
                        ? { background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 16px rgba(124,58,237,0.25)' }
                        : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {msg.content}
                    </div>
                  </motion.div>
                );
              })
            )}

            {isPeerTyping && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex justify-start">
                <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
                      style={{ animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatBottomRef} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs shrink-0"
            style={{ background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.18)' }}>
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-300 font-bold transition-colors cursor-pointer">✕</button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <form onSubmit={handleSend} className="flex gap-2.5 items-center">
            <input type="text" value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!isMatched}
              placeholder={isMatched ? 'Say something...' : 'Start a match to chat'}
              className="flex-1 px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-700 disabled:opacity-40 disabled:cursor-not-allowed outline-none transition-all duration-200 font-medium"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                e.currentTarget.style.background = 'rgba(139,92,246,0.06)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
            <button type="submit" disabled={!isMatched || !messageInput.trim()}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* REPORT MODAL */}
        <AnimatePresence>
          {reportOpen && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-6"
              style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-sm p-6 rounded-3xl text-center"
                style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.85)' }}>
                {reportSuccess ? (
                  <div className="py-4 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1">Report sent</h4>
                    <p className="text-sm text-gray-500">Moving to the next match...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)' }}>
                      <ShieldAlert className="w-7 h-7 text-rose-400" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1.5">Report session</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mb-5 max-w-[210px] mx-auto">
                      Help keep EchoTalk safe — select a reason to flag this session.
                    </p>
                    <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-sm text-white mb-5 outline-none appearance-none cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {['Inappropriate Content', 'Harassment / Hate Speech', 'Spam / Scam / Advertising', 'Underage User', 'Other Violations'].map(r => (
                        <option key={r} value={r} style={{ background: '#0e0e1a' }}>{r}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => setReportOpen(false)}
                        className="py-3 rounded-2xl text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        Cancel
                      </button>
                      <button onClick={handleReportSubmit}
                        className="py-3 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.97] cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}>
                        Submit
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

/* ── Toolbar button ── */
const ToolbarBtn: React.FC<{
  active: boolean; onClick: () => void; title: string;
  children: React.ReactNode; danger?: boolean; disabled?: boolean; stopBtn?: boolean;
}> = ({ active, onClick, title, children, danger = false, disabled = false, stopBtn = false }) => {
  const base = 'flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-[0.97]';
  const style = stopBtn
    ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }
    : active && danger
      ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }
      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' };

  return (
    <button onClick={onClick} title={title} disabled={disabled} className={base} style={style}>
      {children}
    </button>
  );
};
