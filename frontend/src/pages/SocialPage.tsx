import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, DoorOpen, UserPlus, Users } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

export const SocialPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  const loadFriends = () => api.get<Friendship[]>('/social/friends').then(response => setFriends(response.data));

  useEffect(() => {
    loadFriends();
  }, []);

  const createRoom = async () => {
    const response = await api.post<{ code: string }>('/social/rooms');
    setCreatedCode(response.data.code);
  };

  const joinRoom = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    await api.post(`/social/rooms/${normalized}/join`);
    navigate(`/chat?room=${normalized}`);
  };

  const accept = async (id: string) => {
    await api.post(`/social/friends/requests/${id}?accept=true`);
    loadFriends();
  };

  return (
    <div className="flex-1 py-8 space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Friends and private rooms</h2>
        <p className="text-sm text-gray-400 mt-1">Reconnect by mutual consent or invite someone with a short room code.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 text-white font-bold mb-5"><DoorOpen className="text-accent" /> Private room</div>
          <button onClick={createRoom} className="w-full py-3 rounded-2xl bg-accent text-white font-bold">Create invite code</button>
          {createdCode && (
            <div className="mt-4 p-4 rounded-2xl bg-white/5 flex items-center justify-between">
              <span className="font-mono text-xl tracking-[0.25em] text-white">{createdCode}</span>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(createdCode)} title="Copy code"><Copy className="w-4 h-4" /></button>
                <button onClick={() => joinRoom(createdCode)} className="px-3 py-2 rounded-xl bg-white/10 text-sm">Enter</button>
              </div>
            </div>
          )}
          <form onSubmit={event => { event.preventDefault(); joinRoom(roomCode); }} className="flex gap-2 mt-5">
            <input value={roomCode} onChange={event => setRoomCode(event.target.value)} maxLength={6}
              placeholder="Enter code" className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white uppercase" />
            <button className="px-5 rounded-2xl bg-white/10 text-white font-semibold">Join</button>
          </form>
        </section>
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 text-white font-bold mb-5"><Users className="text-accent" /> Connections</div>
          <div className="space-y-3">
            {friends.length === 0 && <p className="text-sm text-gray-500">Friend requests you send during chats will appear here.</p>}
            {friends.map(friendship => {
              const incoming = friendship.addresseeId === user?.id && friendship.status === 'PENDING';
              const otherId = friendship.requesterId === user?.id ? friendship.addresseeId : friendship.requesterId;
              return (
                <div key={friendship.id} className="p-3 rounded-2xl bg-white/5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-mono truncate">{otherId}</p>
                    <p className="text-xs text-gray-500">{friendship.status}</p>
                  </div>
                  {incoming && (
                    <button onClick={() => accept(friendship.id)} className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400" title="Accept">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {!incoming && friendship.status === 'PENDING' && <UserPlus className="w-4 h-4 text-gray-600" />}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
